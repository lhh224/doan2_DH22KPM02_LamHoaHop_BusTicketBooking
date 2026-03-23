/**
 * File: routes/user.routes.js
 * Mục đích: User routes - Profile, Bookings, Notifications, Reviews
 */

const express = require("express");
const router = express.Router();
const userController = require("../controllers/user.controller");
const { authenticate } = require("../middleware/auth");

// Tất cả routes đều yêu cầu authentication
router.use(authenticate);

// Booking management
router.get("/bookings", userController.getMyBookings);
router.get("/bookings/:id", userController.getBookingDetail);
router.post("/bookings/:id/cancel", userController.cancelBooking);

// Profile management
router.put("/profile", userController.updateProfile);

// Notifications
router.get("/notifications", userController.getNotifications);
router.put("/notifications/:id/read", userController.markNotificationAsRead);

// Reviews
router.get("/reviews", userController.getMyReviews);
router.post("/reviews", userController.createReview);

module.exports = router;
