/**
 * File: payment.controller.js
 * Controller xử lý các request liên quan đến thanh toán
 */

const paymentService = require("../services/payment.service");
const bookingService = require("../services/booking.service");
const {
  successResponse,
  errorResponse,
  notFoundResponse,
  serverErrorResponse,
} = require("../utils/response");

/**
 * Tạo mã QR thanh toán
 * POST /api/v1/payments/qr
 */
const generateQR = async (req, res) => {
  try {
    const { bookingId } = req.body;

    // Validate
    if (!bookingId) {
      return errorResponse(res, "Vui lòng cung cấp bookingId", 400);
    }

    // Lấy thông tin booking
    const booking = await bookingService.getBookingById(bookingId);

    if (!booking) {
      return notFoundResponse(res, "Không tìm thấy booking");
    }

    /* Tháo gỡ giới hạn: Cho phép lấy QR ngay cả khi đã thanh toán để hiển thị vé */
    if (booking.Status === "PAID") {
      // Tiếp tục xử lý để lấy QR cho vé điện tử
    }

    if (booking.Status === "CANCELLED") {
      return errorResponse(res, "Booking này đã bị hủy", 400);
    }

    // Tạo QR
    const qrData = await paymentService.generatePaymentQR({
      bookingId: booking.BookingId,
      amount: booking.TotalAmount,
      customerName: booking.CustomerName,
      ticketCode: booking.TicketCode,
    });

    return successResponse(res, qrData, 200);
  } catch (error) {
    return serverErrorResponse(res, error);
  }
};

module.exports = {
  generateQR,
};
