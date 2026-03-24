/**
 * File: booking.service.js
 * Mục đích: Xử lý nghiệp vụ đặt vé, thanh toán và truy xuất booking
 */

const { sql, getPool } = require("../config/db");

/**
 * Chuẩn hóa danh sách ghế về chuỗi CSV để gọi stored procedure
 */
const normalizeSeatCodes = (seatCodes) => {
  if (Array.isArray(seatCodes)) {
    return seatCodes
      .map((s) =>
        String(s || "")
          .trim()
          .toUpperCase(),
      )
      .filter(Boolean)
      .join(",");
  }

  return String(seatCodes || "")
    .split(",")
    .map((s) => s.trim().toUpperCase())
    .filter(Boolean)
    .join(",");
};

/**
 * Khóa ghế tạm thời (tạo booking PENDING)
 */
const lockSeats = async (payload) => {
  const {
    tripId,
    userId,
    seatCodes,
    fromStopOrder,
    toStopOrder,
    customerName,
    customerPhone,
    customerEmail,
    amount,
  } = payload;

  const normalizedSeatCodes = normalizeSeatCodes(seatCodes);
  if (!normalizedSeatCodes) {
    throw new Error("Danh sách ghế không hợp lệ");
  }

  const pool = await getPool();
  const result = await pool
    .request()
    .input("TripId", sql.Int, parseInt(tripId, 10))
    .input(
      "UserId",
      sql.Int,
      userId == null || userId === "" ? null : parseInt(userId, 10),
    )
    .input("SeatCodes", sql.NVarChar(500), normalizedSeatCodes)
    .input("FromStopOrder", sql.Int, parseInt(fromStopOrder, 10))
    .input("ToStopOrder", sql.Int, parseInt(toStopOrder, 10))
    .input("CustomerName", sql.NVarChar(100), customerName)
    .input("CustomerPhone", sql.NVarChar(20), customerPhone)
    .input("CustomerEmail", sql.NVarChar(100), customerEmail || null)
    .input("Amount", sql.Decimal(10, 2), Number(amount))
    .output("BookingId", sql.Int)
    .execute("sp_LockSeats");

  const bookingId = result.output?.BookingId;
  if (!bookingId) {
    throw new Error("Không thể tạo booking");
  }

  // Luôn trả về dữ liệu booking đầy đủ để các màn hình downstream dùng trực tiếp.
  const booking = await getBookingById(bookingId);
  return booking || { BookingId: bookingId };
};

/**
 * Xác nhận thanh toán cho booking
 */
const confirmPayment = async (
  bookingId,
  paymentMethod = "QR",
  transactionId = null,
) => {
  const pool = await getPool();
  const result = await pool
    .request()
    .input("BookingId", sql.Int, parseInt(bookingId, 10))
    .input("PaymentMethod", sql.NVarChar(50), paymentMethod || "QR")
    .input("TransactionId", sql.NVarChar(100), transactionId)
    .execute("sp_ConfirmPayment");

  if (result.recordset && result.recordset.length > 0) {
    return result.recordset[0];
  }

  return getBookingById(bookingId);
};

/**
 * Lấy booking theo id với đầy đủ thông tin phục vụ checkout/ticket
 */
const getBookingById = async (bookingId) => {
  const pool = await getPool();
  const result = await pool
    .request()
    .input("BookingId", sql.Int, parseInt(bookingId, 10)).query(`
			SELECT
				b.BookingId,
				b.TripId,
				b.UserId,
				b.TicketCode,
				b.CustomerName,
				b.CustomerPhone,
				b.CustomerEmail,
				b.PickupStopOrder,
				b.DropoffStopOrder,
				b.SeatCount,
				b.TotalAmount,
				b.Status,
				b.BookingDate,
				b.BookingDate AS CreatedAt,
				b.UpdatedAt,
				t.DepartureDate,
				CONVERT(VARCHAR(8), t.DepartureTime, 108) AS DepartureTime,
				CONVERT(VARCHAR(8), t.ArrivalTime, 108) AS ArrivalTime,
				t.Price,
				r.RouteName,
				r.DepartureCity AS FromCity,
				r.ArrivalCity AS ToCity,
				r.EstimatedDuration,
				c.CompanyName,
				bt.BusTypeName AS BusType,
				fs.StopName AS FromStopName,
				ts.StopName AS ToStopName,
				STRING_AGG(bd.SeatCode, ', ') WITHIN GROUP (ORDER BY bd.SeatCode) AS SeatCodes,
				MAX(p.PaymentMethod) AS PaymentMethod,
				MAX(p.PaymentDate) AS PaymentDate
			FROM Bookings b
			INNER JOIN Trips t ON b.TripId = t.TripId
			INNER JOIN Routes r ON t.RouteId = r.RouteId
			INNER JOIN Companies c ON t.CompanyId = c.CompanyId
			INNER JOIN BusTypes bt ON t.BusTypeId = bt.BusTypeId
			LEFT JOIN Stops fs ON fs.RouteId = r.RouteId AND fs.StopOrder = b.PickupStopOrder
			LEFT JOIN Stops ts ON ts.RouteId = r.RouteId AND ts.StopOrder = b.DropoffStopOrder
			LEFT JOIN BookingDetails bd ON bd.BookingId = b.BookingId
			LEFT JOIN Payments p ON p.BookingId = b.BookingId
			WHERE b.BookingId = @BookingId
			GROUP BY
				b.BookingId,
				b.TripId,
				b.UserId,
				b.TicketCode,
				b.CustomerName,
				b.CustomerPhone,
				b.CustomerEmail,
				b.PickupStopOrder,
				b.DropoffStopOrder,
				b.SeatCount,
				b.TotalAmount,
				b.Status,
				b.BookingDate,
				b.UpdatedAt,
				t.DepartureDate,
				t.DepartureTime,
				t.ArrivalTime,
				t.Price,
				r.RouteName,
				r.DepartureCity,
				r.ArrivalCity,
				r.EstimatedDuration,
				c.CompanyName,
				bt.BusTypeName,
				fs.StopName,
				ts.StopName
		`);

  if (result.recordset.length === 0) {
    return null;
  }

  return result.recordset[0];
};

/**
 * Lấy booking mới nhất của user
 */
const getLatestBookingByUser = async (userId) => {
  const pool = await getPool();
  const result = await pool
    .request()
    .input("UserId", sql.Int, parseInt(userId, 10)).query(`
			SELECT TOP 1 BookingId
			FROM Bookings
			WHERE UserId = @UserId
			ORDER BY BookingDate DESC
		`);

  if (result.recordset.length === 0) {
    return null;
  }

  return getBookingById(result.recordset[0].BookingId);
};

/**
 * Lấy booking PAID mới nhất theo số điện thoại
 */
const getLatestBookingByPhone = async (phone) => {
  const pool = await getPool();
  const result = await pool
    .request()
    .input("Phone", sql.NVarChar(20), String(phone || "").trim()).query(`
			SELECT TOP 1 BookingId
			FROM Bookings
			WHERE CustomerPhone = @Phone
				AND Status = 'PAID'
			ORDER BY BookingDate DESC
		`);

  if (result.recordset.length === 0) {
    return null;
  }

  return getBookingById(result.recordset[0].BookingId);
};

/**
 * Hủy booking (chỉ cho phép khi đang PENDING)
 */
const cancelBooking = async (bookingId) => {
  const pool = await getPool();

  const checkResult = await pool
    .request()
    .input("BookingId", sql.Int, parseInt(bookingId, 10)).query(`
			SELECT BookingId, Status
			FROM Bookings
			WHERE BookingId = @BookingId
		`);

  if (checkResult.recordset.length === 0) {
    throw new Error("Không tìm thấy booking");
  }

  const booking = checkResult.recordset[0];
  if (booking.Status !== "PENDING") {
    throw new Error("Chỉ có thể hủy booking đang chờ thanh toán");
  }

  await pool.request().input("BookingId", sql.Int, parseInt(bookingId, 10))
    .query(`
			UPDATE Bookings
			SET Status = 'CANCELLED', UpdatedAt = GETDATE()
			WHERE BookingId = @BookingId
		`);

  return true;
};

module.exports = {
  lockSeats,
  confirmPayment,
  getBookingById,
  getLatestBookingByUser,
  getLatestBookingByPhone,
  cancelBooking,
};
