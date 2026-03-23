/**
 * File: tracking.routes.js
 * Định nghĩa các route liên quan đến theo dõi hành trình xe khách
 */

const express = require("express");
const router = express.Router();
const trackingController = require("../controllers/tracking.controller");

// GET /api/v1/tracking/trip/:tripId - Lấy thông tin tracking của chuyến xe
router.get("/trip/:tripId", trackingController.getTripTracking);

// GET /api/v1/tracking/trip/:tripId/stops - Lấy danh sách điểm dừng với trạng thái
router.get("/trip/:tripId/stops", trackingController.getTripStopsWithStatus);

// GET /api/v1/tracking/trip/:tripId/position - Lấy vị trí hiện tại (giả lập)
router.get("/trip/:tripId/position", trackingController.getBusPosition);

// GET /api/v1/tracking/routes - Lấy danh sách tất cả routes với tọa độ (cho tracking demo)
router.get("/routes", trackingController.getAllRoutesWithCoordinates);

// GET /api/v1/tracking/trips/active - Lấy danh sách chuyến xe đang hoạt động
router.get("/trips/active", trackingController.getActiveTrips);

module.exports = router;
