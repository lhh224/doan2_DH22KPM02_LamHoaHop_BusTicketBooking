/**
 * File: seat.service.js
 * Mục đích: Xử lý logic liên quan đến ghế ngồi và sơ đồ ghế theo chặng
 */

const { getPool, sql } = require("../config/db");

/**
 * Lấy sơ đồ ghế theo chặng (kiểm tra trạng thái available cho chặng cụ thể)
 * @param {number} tripId - ID chuyến xe
 * @param {number} fromStopOrder - Điểm đón (thứ tự)
 * @param {number} toStopOrder - Điểm trả (thứ tự)
 * @returns {Promise<Array>} - Danh sách ghế với trạng thái
 */
const getSeatsBySegment = async (tripId, fromStopOrder, toStopOrder) => {
  try {
    const pool = await getPool();

    // Query 1: Lấy thông tin loại xe
    const busTypeResult = await pool.request().input("tripId", sql.Int, tripId)
      .query(`
        SELECT bt.BusTypeName, bt.TotalSeats
        FROM Trips t
        INNER JOIN BusTypes bt ON t.BusTypeId = bt.BusTypeId
        WHERE t.TripId = @tripId
      `);

    // Query 2: Lấy danh sách ghế với trạng thái
    const result = await pool
      .request()
      .input("tripId", sql.Int, tripId)
      .input("fromStopOrder", sql.Int, fromStopOrder)
      .input("toStopOrder", sql.Int, toStopOrder).query(`
        SELECT 
          s.SeatId,
          s.SeatCode,
          s.SeatType,
          s.Status,
          -- Kiểm tra ghế có bị đặt trong chặng này không
          CASE 
            WHEN EXISTS (
              SELECT 1 
              FROM BookingDetails bd
              INNER JOIN Bookings b ON bd.BookingId = b.BookingId
              WHERE bd.SeatCode = s.SeatCode
                AND b.TripId = @tripId
                AND b.Status IN ('PENDING', 'PAID')
                -- Kiểm tra xung đột chặng:
                -- Booking cũ: [PickupStopOrder, DropoffStopOrder]
                -- Booking mới: [fromStopOrder, toStopOrder]
                -- Xung đột khi: NOT (toStopOrder <= PickupStopOrder OR fromStopOrder >= DropoffStopOrder)
                AND NOT (
                  @toStopOrder <= b.PickupStopOrder 
                  OR @fromStopOrder >= b.DropoffStopOrder
                )
            ) THEN 0
            ELSE 1
          END as IsAvailableForSegment
        FROM Seats s
        WHERE s.TripId = @tripId
        ORDER BY s.SeatCode ASC
      `);

    // Trả về cả thông tin loại xe và danh sách ghế
    return {
      busType: busTypeResult.recordset[0]?.BusTypeName || "Unknown",
      totalSeats: busTypeResult.recordset[0]?.TotalSeats || 0,
      seats: result.recordset,
    };
  } catch (error) {
    console.error("❌ Lỗi lấy sơ đồ ghế:", error);
    throw error;
  }
};

/**
 * Kiểm tra ghế có available cho chặng cụ thể không
 * @param {number} tripId - ID chuyến xe
 * @param {array} seatCodes - Danh sách mã ghế cần kiểm tra
 * @param {number} fromStopOrder - Điểm đón
 * @param {number} toStopOrder - Điểm trả
 * @returns {Promise<object>} - { available: boolean, unavailableSeats: [] }
 */
const checkSeatsAvailability = async (
  tripId,
  seatCodes,
  fromStopOrder,
  toStopOrder,
) => {
  try {
    const pool = await getPool();

    // Convert array to comma-separated string
    const seatCodesStr = seatCodes.join(",");

    const result = await pool
      .request()
      .input("tripId", sql.Int, tripId)
      .input("seatCodes", sql.NVarChar, seatCodesStr)
      .input("fromStopOrder", sql.Int, fromStopOrder)
      .input("toStopOrder", sql.Int, toStopOrder).query(`
        SELECT 
          s.SeatCode,
          CASE 
            WHEN EXISTS (
              SELECT 1 
              FROM BookingDetails bd
              INNER JOIN Bookings b ON bd.BookingId = b.BookingId
              WHERE bd.SeatCode = s.SeatCode
                AND b.TripId = @tripId
                AND b.Status IN ('PENDING', 'PAID')
                AND NOT (
                  @toStopOrder <= b.PickupStopOrder 
                  OR @fromStopOrder >= b.DropoffStopOrder
                )
            ) THEN 0
            ELSE 1
          END as IsAvailable
        FROM Seats s
        INNER JOIN STRING_SPLIT(@seatCodes, ',') ss ON s.SeatCode = LTRIM(RTRIM(ss.value))
        WHERE s.TripId = @tripId
      `);

    const unavailableSeats = result.recordset
      .filter((seat) => seat.IsAvailable === 0)
      .map((seat) => seat.SeatCode);

    return {
      available: unavailableSeats.length === 0,
      unavailableSeats: unavailableSeats,
    };
  } catch (error) {
    console.error("❌ Lỗi kiểm tra ghế:", error);
    throw error;
  }
};

module.exports = {
  getSeatsBySegment,
  checkSeatsAvailability,
};
