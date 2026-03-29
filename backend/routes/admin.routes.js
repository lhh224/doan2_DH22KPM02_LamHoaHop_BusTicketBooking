/**
 * File: routes/admin.routes.js
 * Mục đích: Admin routes
 */

const express = require("express");
const router = express.Router();
const adminController = require("../controllers/admin.controller");
const tripController = require("../controllers/trip.controller");
const {
  authenticate,
  requireAdmin,
  requireStaff,
} = require("../middleware/auth");

// Tất cả routes đều cần đăng nhập
router.use(authenticate);

// Booking routes cho ADMIN/STAFF (nhà xe)
router.get("/bookings", requireStaff, adminController.getAllBookings);
router.put(
  "/bookings/:id/status",
  requireStaff,
  adminController.updateBookingStatus,
);
router.post(
  "/bookings/manual",
  requireStaff,
  adminController.createManualBooking,
);

// Mặc định khu admin cho cả ADMIN/STAFF
router.use(requireStaff);

// Dashboard
router.get("/dashboard/stats", adminController.getDashboardStats);
router.get("/dashboard/revenue-chart", adminController.getRevenueChart);
router.get("/dashboard/top-routes", adminController.getTopRoutes);
router.get("/dashboard/upcoming-trips", adminController.getUpcomingTrips);
router.get("/dashboard/fill-rate", adminController.getFillRate);
router.get(
  "/dashboard/revenue-payments",
  adminController.getRevenueFromPayments,
);
router.get("/dashboard/paid-bookings", adminController.getPaidBookingsCount);

// Companies management (CRUD)
router.get("/companies", adminController.getAllCompanies);
router.post("/companies", adminController.createCompany);
router.put("/companies/:id", adminController.updateCompany);
router.delete("/companies/:id", adminController.deleteCompany);

// Routes management (CRUD)
router.get("/routes", adminController.getAllRoutes);
router.post("/routes", adminController.createRoute);
router.put("/routes/:id", adminController.updateRoute);
router.delete("/routes/:id", adminController.deleteRoute);

// Stops management (CRUD) - Quản lý điểm dừng
router.get("/stops", adminController.getStopsByRoute);
router.post("/stops", adminController.createStop);
router.put("/stops/:id", adminController.updateStop);
router.delete("/stops/:id", adminController.deleteStop);

// Trips management (CRUD)
router.get("/trips", tripController.getAllTrips);
router.post("/trips", tripController.createTrip);
router.put("/trips/:tripId", tripController.updateTrip);
router.delete("/trips/:tripId", tripController.deleteTrip);

// Bus Types (read-only, dùng cho dropdown)
router.get("/bus-types", tripController.getBusTypes);

// Users management
router.get("/users", requireAdmin, adminController.getAllUsers);
router.put("/users/:id/status", requireAdmin, adminController.updateUserStatus);

// Reviews management
router.get("/reviews", adminController.getAllReviews);
router.put("/reviews/:id/status", adminController.updateReviewStatus);

// Thống kê nâng cao
router.get("/stats/revenue-by-time", adminController.getRevenueByTime);
router.get("/stats/revenue-by-company", adminController.getRevenueByCompany);
router.get("/stats/revenue-by-route", adminController.getRevenueByRoute);
router.get("/stats/payment-methods", adminController.getPaymentMethodStats);

// Quản lý tài khoản
router.post(
  "/accounts/create-staff",
  requireAdmin,
  adminController.createStaffAccount,
);
router.put(
  "/accounts/:id/toggle-lock",
  requireAdmin,
  adminController.toggleUserLock,
);

// Log
router.get(
  "/logs/transactions",
  requireAdmin,
  adminController.getTransactionLogs,
);
router.get("/logs/logins", requireAdmin, adminController.getLoginLogs);

module.exports = router;
