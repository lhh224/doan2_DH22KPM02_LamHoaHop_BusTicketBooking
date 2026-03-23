/**
 * File: controllers/user.controller.js
 * Mục đích: User controller - Quản lý profile, bookings, notifications
 */

const userService = require("../services/user.service");
const { successResponse, errorResponse } = require("../utils/response");

/**
 * GET /api/v1/users/bookings
 * Lấy danh sách booking của user
 */
const getMyBookings = async (req, res) => {
  try {
    const { status, fromDate, toDate } = req.query;

    const bookings = await userService.getUserBookings(req.user.id, {
      status,
      fromDate,
      toDate,
    });

    return successResponse(res, bookings, 200);
  } catch (error) {
    console.error("Get bookings error:", error);
    return errorResponse(res, "Lỗi khi lấy danh sách booking", 500);
  }
};

/**
 * GET /api/v1/users/bookings/:id
 * Lấy chi tiết booking
 */
const getBookingDetail = async (req, res) => {
  try {
    const bookingId = parseInt(req.params.id);

    if (isNaN(bookingId)) {
      return res.status(400).json(errorResponse("ID booking không hợp lệ"));
    }

    const booking = await userService.getBookingDetail(req.user.id, bookingId);

    return successResponse(res, booking, 200);
  } catch (error) {
    console.error("Get booking detail error:", error);
    return errorResponse(res, error.message || "Không tìm thấy booking", 404);
  }
};

/**
 * POST /api/v1/users/bookings/:id/cancel
 * Hủy booking
 */
const cancelBooking = async (req, res) => {
  try {
    const bookingId = parseInt(req.params.id);
    const { reason } = req.body;

    if (isNaN(bookingId)) {
      return res.status(400).json(errorResponse("ID booking không hợp lệ"));
    }

    await userService.cancelBooking(req.user.id, bookingId, reason);

    return successResponse(res, null, 200);
  } catch (error) {
    console.error("Cancel booking error:", error);
    return errorResponse(res, error.message || "Hủy booking thất bại", 400);
  }
};

/**
 * PUT /api/v1/users/profile
 * Cập nhật profile
 */
const updateProfile = async (req, res) => {
  try {
    const { hoTen, soDienThoai, diaChi } = req.body;

    if (!hoTen) {
      return errorResponse(res, "Họ tên không được để trống", 400);
    }

    await userService.updateProfile(req.user.id, {
      hoTen,
      soDienThoai,
      diaChi,
    });

    return successResponse(res, null, 200);
  } catch (error) {
    console.error("Update profile error:", error);
    return errorResponse(res, "Cập nhật profile thất bại", 500);
  }
};

/**
 * GET /api/v1/users/notifications
 * Lấy danh sách thông báo
 */
const getNotifications = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 20;

    const notifications = await userService.getNotifications(
      req.user.id,
      limit
    );

    return successResponse(res, notifications, 200);
  } catch (error) {
    console.error("Get notifications error:", error);
    return errorResponse(res, "Lỗi khi lấy thông báo", 500);
  }
};

/**
 * PUT /api/v1/users/notifications/:id/read
 * Đánh dấu thông báo đã đọc
 */
const markNotificationAsRead = async (req, res) => {
  try {
    const notificationId = parseInt(req.params.id);

    if (isNaN(notificationId)) {
      return errorResponse(res, "ID thông báo không hợp lệ", 400);
    }

    await userService.markNotificationAsRead(req.user.id, notificationId);

    return successResponse(res, null, 200);
  } catch (error) {
    console.error("Mark notification error:", error);
    return errorResponse(res, "Lỗi khi cập nhật thông báo", 500);
  }
};

/**
 * GET /api/v1/users/reviews
 * Lấy danh sách đánh giá của user
 */
const getMyReviews = async (req, res) => {
  try {
    const reviews = await userService.getUserReviews(req.user.id);

    return successResponse(res, reviews, 200);
  } catch (error) {
    console.error("Get reviews error:", error);
    return errorResponse(res, "Lỗi khi lấy danh sách đánh giá", 500);
  }
};

/**
 * POST /api/v1/users/reviews
 * Tạo đánh giá
 */
const createReview = async (req, res) => {
  try {
    const { bookingId, rating, title, content } = req.body;

    if (!bookingId || !rating) {
      return errorResponse(res, "Booking ID và rating là bắt buộc", 400);
    }

    if (rating < 1 || rating > 5) {
      return errorResponse(res, "Rating phải từ 1 đến 5", 400);
    }

    const result = await userService.createReview(req.user.id, {
      bookingId,
      rating,
      title,
      content,
    });

    return successResponse(res, result, 201);
  } catch (error) {
    console.error("Create review error:", error);
    return errorResponse(res, error.message || "Tạo đánh giá thất bại", 400);
  }
};

module.exports = {
  getMyBookings,
  getBookingDetail,
  cancelBooking,
  updateProfile,
  getNotifications,
  markNotificationAsRead,
  getMyReviews,
  createReview,
};
