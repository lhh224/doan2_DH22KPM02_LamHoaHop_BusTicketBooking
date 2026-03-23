/**
 * File: booking.service.js
 * Mục đích: Xử lý logic đặt vé và quản lý booking
 * Gọi stored procedure sp_LockSeats và sp_ConfirmPayment
 */

const { getPool, sql } = require("../config/db");

/**
 * Khóa ghế tạm thời (tạo booking với trạng thái PENDING)
 * @param {object} bookingData - Thông tin đặt vé
 * @returns {Promise<object>} - Thông tin booking vừa tạo
 */
const lockSeats = async (bookingData) => {
  try {
    const {
      tripId,
      userId,
      seatCodes, // Array: ['A01', 'A02']
      fromStopOrder,
      toStopOrder,
      customerName,
      customerPhone,
      customerEmail,
      amount,
    } = bookingData;

    const pool = await getPool();

    // Convert array to comma-separated string
    const seatCodesStr = seatCodes.join(",");

    // Gọi stored procedure sp_LockSeats
    const result = await pool
      .request()
      .input("TripId", sql.Int, tripId)
      .input("UserId", sql.Int, userId || null)
      .input("SeatCodes", sql.NVarChar, seatCodesStr)
      .input("FromStopOrder", sql.Int, fromStopOrder)
      .input("ToStopOrder", sql.Int, toStopOrder)
      .input("CustomerName", sql.NVarChar, customerName)
      .input("CustomerPhone", sql.NVarChar, customerPhone)
      .input("CustomerEmail", sql.NVarChar, customerEmail || null)
      .input("Amount", sql.Decimal(10, 2), amount)
      .output("BookingId", sql.Int)
      .execute("sp_LockSeats");

    // Lấy BookingId từ output parameter
    const bookingId = result.output.BookingId;

    // Lấy thông tin booking vừa tạo
    const bookingInfo = await getBookingById(bookingId);

    return bookingInfo;
  } catch (error) {
    console.error("❌ Lỗi khóa ghế:", error);
    throw error;
  }
};

/**
 * Xác nhận thanh toán (chuyển trạng thái PENDING -> PAID)
 * @param {number} bookingId - ID booking
 * @param {string} paymentMethod - Phương thức thanh toán
 * @param {string} transactionId - Mã giao dịch
 * @returns {Promise<object>} - Thông tin thanh toán
 */
const confirmPayment = async (
  bookingId,
  paymentMethod = "QR",
  transactionId = null,
) => {
  try {
    const pool = await getPool();

    // Gọi stored procedure sp_ConfirmPayment
    const result = await pool
      .request()
      .input("BookingId", sql.Int, bookingId)
      .input("PaymentMethod", sql.NVarChar, paymentMethod)
      .input("TransactionId", sql.NVarChar, transactionId)
      .execute("sp_ConfirmPayment");

    return result.recordset[0];
  } catch (error) {
    console.error("❌ Lỗi xác nhận thanh toán:", error);
    throw error;
  }
};

/**
 * Lấy thông tin booking theo ID
 * @param {number} bookingId - ID booking
 * @returns {Promise<object>} - Thông tin booking
 */
const getBookingById = async (bookingId) => {
  try {
    const pool = await getPool();
    const result = await pool.request().input("bookingId", sql.Int, bookingId)
      .query(`
        SELECT 
          b.BookingId,
          b.TicketCode,
          b.CustomerName,
          b.CustomerPhone,
          b.CustomerEmail,
          b.TotalAmount,
          b.Status,
          b.PickupStopOrder as FromStopOrder,
          b.DropoffStopOrder as ToStopOrder,
          b.BookingDate as CreatedAt,
          t.TripId,
          t.DepartureTime,
          t.ArrivalTime,
          t.DepartureDate,
          r.RouteName,
          r.DepartureCity as FromCity,
          r.ArrivalCity as ToCity,
          r.EstimatedDuration,
          c.CompanyName,
          bt.BusTypeName as BusType,
          -- Lấy danh sách ghế
          (SELECT STRING_AGG(bd.SeatCode, ', ')
           FROM BookingDetails bd
           WHERE bd.BookingId = b.BookingId
          ) as SeatCodes,
          -- Lấy tên điểm đi
          (SELECT StopName FROM Stops 
           WHERE RouteId = r.RouteId AND StopOrder = b.PickupStopOrder
          ) as FromStopName,
          -- Lấy tên điểm đến
          (SELECT StopName FROM Stops 
           WHERE RouteId = r.RouteId AND StopOrder = b.DropoffStopOrder
          ) as ToStopName
        FROM Bookings b
        INNER JOIN Trips t ON b.TripId = t.TripId
        INNER JOIN Routes r ON t.RouteId = r.RouteId
        INNER JOIN Companies c ON t.CompanyId = c.CompanyId
        INNER JOIN BusTypes bt ON t.BusTypeId = bt.BusTypeId
        WHERE b.BookingId = @bookingId
      `);

    if (result.recordset.length === 0) {
      return null;
    }

    return result.recordset[0];
  } catch (error) {
    console.error("❌ Lỗi lấy thông tin booking:", error);
    throw error;
  }
};

/**
 * Hủy booking
 * @param {number} bookingId - ID booking
 * @returns {Promise<boolean>} - True nếu hủy thành công
 */
const cancelBooking = async (bookingId) => {
  try {
    const pool = await getPool();

    // Kiểm tra booking tồn tại và chưa thanh toán
    const checkResult = await pool
      .request()
      .input("bookingId", sql.Int, bookingId)
      .query("SELECT Status FROM Bookings WHERE BookingId = @bookingId");

    if (checkResult.recordset.length === 0) {
      throw new Error("Không tìm thấy booking");
    }

    const status = checkResult.recordset[0].Status;
    if (status === "PAID") {
      throw new Error("Không thể hủy booking đã thanh toán");
    }

    if (status === "CANCELLED") {
      throw new Error("Booking đã bị hủy trước đó");
    }

    // Cập nhật trạng thái
    await pool.request().input("bookingId", sql.Int, bookingId).query(`
        UPDATE Bookings 
        SET Status = 'CANCELLED', UpdatedAt = GETDATE()
        WHERE BookingId = @bookingId
      `);

    return true;
  } catch (error) {
    console.error("❌ Lỗi hủy booking:", error);
    throw error;
  }
};

/**
 * Lấy booking mới nhất của người dùng
 * @param {number} userId - ID người dùng
 * @returns {Promise<object>} - Thông tin booking
 */
const getLatestBookingByUser = async (userId) => {
  try {
    const pool = await getPool();
    const result = await pool.request().input("userId", sql.Int, userId).query(`
        SELECT TOP 1 BookingId FROM Bookings 
        WHERE UserId = @userId AND Status = 'PAID'
        ORDER BY BookingDate DESC
      `);

    if (result.recordset.length === 0) {
      return null;
    }

    return getBookingById(result.recordset[0].BookingId);
  } catch (error) {
    console.error("❌ Lỗi lấy booking mới nhất của user:", error);
    throw error;
  }
};

/**
 * Lấy booking mới nhất của người dùng qua số điện thoại
 * @param {string} phone - Số điện thoại
 * @returns {Promise<object>} - Thông tin booking
 */
const getLatestBookingByPhone = async (phone) => {
  try {
    const pool = await getPool();
    const result = await pool.request().input("phone", sql.NVarChar, phone)
      .query(`
        SELECT TOP 1 BookingId FROM Bookings 
        WHERE CustomerPhone = @phone AND Status != 'CANCELLED'
        ORDER BY BookingDate DESC
      `);

    if (result.recordset.length === 0) {
      return null;
    }

    return getBookingById(result.recordset[0].BookingId);
  } catch (error) {
    console.error("❌ Lỗi lấy booking mới nhất qua SĐT:", error);
    throw error;
  }
};

module.exports = {
  lockSeats,
  confirmPayment,
  getBookingById,
  getLatestBookingByUser,
  getLatestBookingByPhone,
  cancelBooking,
};
