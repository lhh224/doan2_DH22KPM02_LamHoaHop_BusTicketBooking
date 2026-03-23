/**
 * File: booking.routes.js
 * Định nghĩa các route liên quan đến booking
 */

const express = require("express");
const router = express.Router();
const bookingController = require("../controllers/booking.controller");

// POST /api/v1/bookings/lock - Khóa ghế (tạo booking)
router.post("/lock", bookingController.lockSeats);

// POST /api/v1/bookings/confirm - Xác nhận thanh toán
router.post("/confirm", bookingController.confirmPayment);

// GET /api/v1/bookings/latest/:userId - Lấy booking mới nhất của user
router.get("/latest/:userId", bookingController.getLatestBooking);

// GET /api/v1/bookings/phone/:phone - Lấy booking mới nhất bằng số điện thoại
router.get("/phone/:phone", bookingController.getBookingByPhone);

// GET /api/v1/bookings/:bookingId - Lấy thông tin booking
router.get("/:bookingId", bookingController.getBooking);

// POST /api/v1/bookings/:bookingId/cancel - Hủy booking
router.post("/:bookingId/cancel", bookingController.cancelBooking);

module.exports = router;
