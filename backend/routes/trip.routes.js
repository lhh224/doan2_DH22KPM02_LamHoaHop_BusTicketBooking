/**
 * File: trip.routes.js
 * Định nghĩa các route liên quan đến chuyến xe
 */

const express = require("express");
const router = express.Router();
const tripController = require("../controllers/trip.controller");

// GET /api/v1/trips/cities - Lấy danh sách điểm đi/đến
router.get("/cities", tripController.getCityOptions);

// GET /api/v1/trips/routes - Lấy danh sách tuyến đường phổ biến
router.get("/routes", tripController.getPopularRoutes);

// GET /api/v1/trips/active - Lấy chuyến xe đang hoạt động (cho tracking)
router.get("/active", tripController.getActiveTrips);

// GET /api/v1/trips/search - Tìm kiếm chuyến xe
router.get("/search", tripController.searchTrips);

// GET /api/v1/trips/:tripId - Lấy thông tin chi tiết chuyến xe
router.get("/:tripId", tripController.getTripDetail);

module.exports = router;
