/**
 * File: services/user.service.js
 * Mục đích: User management service
 */

const sql = require("mssql");
const { getPool } = require("../config/db");

/**
 * Lấy danh sách booking của user
 */
const getUserBookings = async (userId, filters = {}) => {
  const pool = await getPool();

  let query = `
    SELECT 
      b.BookingId,
      b.TripId,
      b.CustomerName,
      b.CustomerPhone,
      b.CustomerEmail,
      b.TotalAmount,
      b.Status,
      b.BookingDate,
      t.DepartureDate,
      t.DepartureTime,
      r.RouteName,
      r.DepartureCity,
      r.ArrivalCity,
      bt.BusTypeName,
      c.CompanyName,
      c.CustomerHotline,
      (
        SELECT STRING_AGG(bd.SeatCode, ', ')
        FROM BookingDetails bd
        WHERE bd.BookingId = b.BookingId
      ) as SeatList
    FROM Bookings b
    INNER JOIN Trips t ON b.TripId = t.TripId
    INNER JOIN Routes r ON t.RouteId = r.RouteId
    INNER JOIN BusTypes bt ON t.BusTypeId = bt.BusTypeId
    INNER JOIN Companies c ON t.CompanyId = c.CompanyId
    WHERE b.UserId = @UserId
  `;

  const request = pool.request().input("UserId", sql.Int, userId);

  // Filter by status
  if (filters.status) {
    query += " AND b.Status = @Status";
    request.input("Status", sql.NVarChar, filters.status);
  }

  // Filter by date range
  if (filters.fromDate) {
    query += " AND t.DepartureDate >= @FromDate";
    request.input("FromDate", sql.Date, filters.fromDate);
  }

  if (filters.toDate) {
    query += " AND t.DepartureDate <= @ToDate";
    request.input("ToDate", sql.Date, filters.toDate);
  }

  query += " ORDER BY b.BookingDate DESC";

  const result = await request.query(query);

  return result.recordset;
};

/**
 * Lấy chi tiết booking
 */
const getBookingDetail = async (userId, bookingId) => {
  const pool = await getPool();

  const result = await pool
    .request()
    .input("BookingId", sql.Int, bookingId)
    .input("UserId", sql.Int, userId).query(`
      SELECT 
        b.BookingId,
        b.TripId,
        b.CustomerName,
        b.CustomerPhone,
        b.CustomerEmail,
        b.TotalAmount,
        b.Status,
        b.BookingDate,
        t.DepartureDate,
        t.DepartureTime,
        r.RouteName,
        r.DepartureCity,
        r.ArrivalCity,
        bt.BusTypeName,
        bt.TotalSeats,
        bt.Amenities,
        c.CompanyName,
        c.CustomerHotline,
        c.Email as CompanyEmail,
        (
          SELECT bd.SeatCode, bd.Price
          FROM BookingDetails bd
          WHERE bd.BookingId = b.BookingId
          FOR JSON PATH
        ) as SeatDetails,
        (
          SELECT TOP 1 PaymentMethod, Status, CreatedAt, ExternalTransactionId
          FROM Transactions
          WHERE BookingId = b.BookingId
          ORDER BY CreatedAt DESC
          FOR JSON PATH
        ) as PaymentHistory
      FROM Bookings b
      INNER JOIN Trips t ON b.TripId = t.TripId
      INNER JOIN Routes r ON t.RouteId = r.RouteId
      INNER JOIN BusTypes bt ON t.BusTypeId = bt.BusTypeId
      INNER JOIN Companies c ON t.CompanyId = c.CompanyId
      WHERE b.BookingId = @BookingId AND b.UserId = @UserId
    `);

  if (result.recordset.length === 0) {
    throw new Error("Không tìm thấy booking");
  }

  const booking = result.recordset[0];

  // Parse JSON fields
  if (booking.SeatDetails) {
    booking.SeatDetails = JSON.parse(booking.SeatDetails);
  }
  if (booking.PaymentHistory) {
    booking.PaymentHistory = JSON.parse(booking.PaymentHistory);
  }

  return booking;
};

/**
 * Hủy booking (chỉ với trạng thái PENDING)
 */
const cancelBooking = async (userId, bookingId, reason) => {
  const pool = await getPool();

  // Kiểm tra quyền sở hữu và trạng thái
  const checkResult = await pool
    .request()
    .input("BookingId", sql.Int, bookingId)
    .input("UserId", sql.Int, userId).query(`
      SELECT Status, BookingDate
      FROM Bookings
      WHERE BookingId = @BookingId AND UserId = @UserId
    `);

  if (checkResult.recordset.length === 0) {
    throw new Error("Không tìm thấy booking");
  }

  const booking = checkResult.recordset[0];

  if (!["PENDING"].includes(booking.Status)) {
    throw new Error("Không thể hủy booking với trạng thái " + booking.Status);
  }

  // Update booking status
  await pool.request().input("BookingId", sql.Int, bookingId).query(`
      UPDATE Bookings
      SET Status = 'CANCELLED', UpdatedAt = GETDATE()
      WHERE BookingId = @BookingId
    `);

  // Tạo notification
  await pool
    .request()
    .input("UserId", sql.Int, userId)
    .input("Title", sql.NVarChar, "Đơn đặt vé đã bị hủy")
    .input(
      "Content",
      sql.NVarChar,
      `Đơn đặt vé #${bookingId} đã được hủy. Lý do: ${reason || "Không có"}`,
    )
    .input("Type", sql.NVarChar, "BOOKING").query(`
      INSERT INTO Notifications (UserId, Title, Content, Type)
      VALUES (@UserId, @Title, @Content, @Type)
    `);

  return true;
};

/**
 * Cập nhật thông tin profile
 */
const updateProfile = async (userId, updateData) => {
  const pool = await getPool();

  const { hoTen, soDienThoai, diaChi } = updateData;

  await pool
    .request()
    .input("UserId", sql.Int, userId)
    .input("FullName", sql.NVarChar, hoTen)
    .input("Phone", sql.NVarChar, soDienThoai)
    .input("Address", sql.NVarChar, diaChi).query(`
      UPDATE Users
      SET FullName = @FullName,
          Phone = @Phone,
          Address = @Address,
          UpdatedAt = GETDATE()
      WHERE UserId = @UserId
    `);

  return true;
};

/**
 * Lấy thông báo của user
 */
const getNotifications = async (userId, limit = 20) => {
  const pool = await getPool();

  const result = await pool
    .request()
    .input("UserId", sql.Int, userId)
    .input("Limit", sql.Int, limit).query(`
      SELECT TOP (@Limit)
        NotificationId,
        Title,
        Content,
        Type,
        IsRead,
        CreatedAt,
        ReadAt
      FROM Notifications
      WHERE UserId = @UserId
      ORDER BY CreatedAt DESC
    `);

  return result.recordset;
};

/**
 * Đánh dấu thông báo đã đọc
 */
const markNotificationAsRead = async (userId, notificationId) => {
  const pool = await getPool();

  await pool
    .request()
    .input("NotificationId", sql.Int, notificationId)
    .input("UserId", sql.Int, userId).query(`
      UPDATE Notifications
      SET IsRead = 1, ReadAt = GETDATE()
      WHERE NotificationId = @NotificationId AND UserId = @UserId
    `);

  return true;
};

/**
 * Lấy đánh giá của user
 */
const getUserReviews = async (userId) => {
  const pool = await getPool();

  const result = await pool.request().input("UserId", sql.Int, userId).query(`
      SELECT 
        rv.ReviewId,
        rv.BookingId,
        rv.Rating,
        rv.Title,
        rv.Content,
        rv.Status,
        rv.CreatedAt,
        t.DepartureDate,
        r.RouteName,
        c.CompanyName
      FROM Reviews rv
      INNER JOIN Trips t ON rv.TripId = t.TripId
      INNER JOIN Routes r ON t.RouteId = r.RouteId
      INNER JOIN Companies c ON rv.CompanyId = c.CompanyId
      WHERE rv.UserId = @UserId
      ORDER BY rv.CreatedAt DESC
    `);

  return result.recordset;
};

/**
 * Tạo đánh giá
 */
const createReview = async (userId, reviewData) => {
  const pool = await getPool();

  const { bookingId, rating, title, content } = reviewData;

  // Kiểm tra booking thuộc về user và đã hoàn thành
  const checkResult = await pool
    .request()
    .input("BookingId", sql.Int, bookingId)
    .input("UserId", sql.Int, userId).query(`
      SELECT b.TripId, t.CompanyId, b.Status
      FROM Bookings b
      INNER JOIN Trips t ON b.TripId = t.TripId
      WHERE b.BookingId = @BookingId AND b.UserId = @UserId
    `);

  if (checkResult.recordset.length === 0) {
    throw new Error("Không tìm thấy booking");
  }

  const booking = checkResult.recordset[0];

  if (booking.Status !== "PAID") {
    throw new Error("Chỉ có thể đánh giá sau khi hoàn thành chuyến đi");
  }

  // Kiểm tra đã đánh giá chưa
  const existingReview = await pool
    .request()
    .input("BookingId", sql.Int, bookingId)
    .query("SELECT ReviewId FROM Reviews WHERE BookingId = @BookingId");

  if (existingReview.recordset.length > 0) {
    throw new Error("Bạn đã đánh giá chuyến đi này rồi");
  }

  // Insert review
  const result = await pool
    .request()
    .input("BookingId", sql.Int, bookingId)
    .input("UserId", sql.Int, userId)
    .input("TripId", sql.Int, booking.TripId)
    .input("CompanyId", sql.Int, booking.CompanyId)
    .input("Rating", sql.Int, rating)
    .input("Title", sql.NVarChar, title)
    .input("Content", sql.NVarChar, content).query(`
      INSERT INTO Reviews (BookingId, UserId, TripId, CompanyId, Rating, Title, Content)
      OUTPUT INSERTED.ReviewId
      VALUES (@BookingId, @UserId, @TripId, @CompanyId, @Rating, @Title, @Content)
    `);

  return result.recordset[0];
};

module.exports = {
  getUserBookings,
  getBookingDetail,
  cancelBooking,
  updateProfile,
  getNotifications,
  markNotificationAsRead,
  getUserReviews,
  createReview,
};
