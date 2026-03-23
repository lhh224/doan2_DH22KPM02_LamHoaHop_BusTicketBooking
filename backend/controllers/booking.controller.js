/**
 * File: booking.controller.js
 * Controller xử lý các request liên quan đến booking
 */

const bookingService = require("../services/booking.service");
const {
  successResponse,
  errorResponse,
  notFoundResponse,
  serverErrorResponse,
} = require("../utils/response");

/**
 * Khóa ghế (tạo booking)
 * POST /api/v1/bookings/lock
 */
const lockSeats = async (req, res) => {
  try {
    const {
      tripId,
      seatCodes,
      fromStopOrder,
      toStopOrder,
      customerName,
      customerPhone,
      customerEmail,
      amount,
    } = req.body;

    // Validate
    if (
      !tripId ||
      !seatCodes ||
      !fromStopOrder ||
      !toStopOrder ||
      !customerName ||
      !customerPhone ||
      !amount
    ) {
      return errorResponse(res, "Vui lòng cung cấp đầy đủ thông tin", 400);
    }

    if (!Array.isArray(seatCodes) || seatCodes.length === 0) {
      return errorResponse(res, "Danh sách ghế không hợp lệ", 400);
    }

    const booking = await bookingService.lockSeats(req.body);

    return successResponse(res, { booking }, 201);
  } catch (error) {
    if (error.message && error.message.includes("đã được đặt")) {
      return errorResponse(res, error.message, 409);
    }
    return serverErrorResponse(res, error);
  }
};

/**
 * Xác nhận thanh toán
 * POST /api/v1/bookings/confirm
 */
const confirmPayment = async (req, res) => {
  try {
    const { bookingId, paymentMethod, transactionId } = req.body;

    // Validate
    if (!bookingId) {
      return errorResponse(res, "Vui lòng cung cấp bookingId", 400);
    }

    const payment = await bookingService.confirmPayment(
      bookingId,
      paymentMethod,
      transactionId,
    );

    return successResponse(res, { payment }, 200);
  } catch (error) {
    return serverErrorResponse(res, error);
  }
};

/**
 * Lấy thông tin booking
 * GET /api/v1/bookings/:bookingId
 */
const getBooking = async (req, res) => {
  try {
    const { bookingId } = req.params;

    const booking = await bookingService.getBookingById(bookingId);

    if (!booking) {
      return notFoundResponse(res, "Không tìm thấy booking");
    }

    return successResponse(res, { booking }, 200);
  } catch (error) {
    return serverErrorResponse(res, error);
  }
};

/**
 * Lấy booking mới nhất của người dùng
 * GET /api/v1/bookings/latest/:userId
 */
const getLatestBooking = async (req, res) => {
  try {
    const { userId } = req.params;

    const booking = await bookingService.getLatestBookingByUser(userId);

    if (!booking) {
      return notFoundResponse(res, "Người dùng chưa có vé nào");
    }

    return successResponse(res, { booking }, 200);
  } catch (error) {
    return serverErrorResponse(res, error);
  }
};

/**
 * Lấy booking mới nhất theo số điện thoại (Guest lookup)
 * GET /api/v1/bookings/phone/:phone
 */
const getBookingByPhone = async (req, res) => {
  try {
    const { phone } = req.params;

    if (!phone) {
      return errorResponse(res, "Vui lòng cung cấp số điện thoại", 400);
    }

    const booking = await bookingService.getLatestBookingByPhone(phone);

    if (!booking) {
      return res.status(200).json({
        success: false,
        message: "Không tìm thấy vé nào cho số điện thoại này",
      });
    }

    return successResponse(res, { booking }, 200);
  } catch (error) {
    return serverErrorResponse(res, error);
  }
};

/**
 * Hủy booking
 * POST /api/v1/bookings/:bookingId/cancel
 */
const cancelBooking = async (req, res) => {
  try {
    const { bookingId } = req.params;

    await bookingService.cancelBooking(bookingId);

    return successResponse(res, { message: "Đã hủy booking thành công" }, 200);
  } catch (error) {
    return serverErrorResponse(res, error);
  }
};

module.exports = {
  lockSeats,
  confirmPayment,
  getBooking,
  getLatestBooking,
  getBookingByPhone,
  cancelBooking,
};
