/**
 * File: tracking.controller.js
 * Mục đích: Xử lý các request liên quan đến theo dõi hành trình xe khách
 */

const trackingService = require("../services/tracking.service");
const {
  successResponse,
  errorResponse,
  serverErrorResponse,
} = require("../utils/response");

/**
 * Lấy thông tin tracking của chuyến xe
 * GET /api/v1/tracking/trip/:tripId
 * @param {number} tripId - Mã chuyến xe
 * @returns {Object} - Thông tin chuyến xe bao gồm vị trí giả lập
 */
const getTripTracking = async (req, res) => {
  try {
    const { tripId } = req.params;

    if (!tripId || isNaN(tripId)) {
      return errorResponse(res, "Mã chuyến xe không hợp lệ", 400);
    }

    const trackingData = await trackingService.getTripTrackingData(
      parseInt(tripId),
    );

    if (!trackingData) {
      return errorResponse(res, "Không tìm thấy chuyến xe", 404);
    }

    return successResponse(res, trackingData);
  } catch (error) {
    console.error("❌ Lỗi lấy tracking data:", error);
    return serverErrorResponse(res, error);
  }
};

/**
 * Lấy danh sách điểm dừng kèm trạng thái
 * GET /api/v1/tracking/trip/:tripId/stops
 * @param {number} tripId - Mã chuyến xe
 * @returns {Array} - Danh sách điểm dừng với trạng thái passed/current/upcoming
 */
const getTripStopsWithStatus = async (req, res) => {
  try {
    const { tripId } = req.params;

    if (!tripId || isNaN(tripId)) {
      return errorResponse(res, "Mã chuyến xe không hợp lệ", 400);
    }

    const stops = await trackingService.getTripStopsWithStatus(
      parseInt(tripId),
    );
    return successResponse(res, stops);
  } catch (error) {
    console.error("❌ Lỗi lấy điểm dừng:", error);
    return serverErrorResponse(res, error);
  }
};

/**
 * Lấy vị trí hiện tại của xe bus (giả lập cho demo)
 * GET /api/v1/tracking/trip/:tripId/position
 * @param {number} tripId - Mã chuyến xe
 * @returns {Object} - Vị trí {lat, lng, speed, progress}
 */
const getBusPosition = async (req, res) => {
  try {
    const { tripId } = req.params;

    if (!tripId || isNaN(tripId)) {
      return errorResponse(res, "Mã chuyến xe không hợp lệ", 400);
    }

    const position = await trackingService.getSimulatedPosition(
      parseInt(tripId),
    );
    return successResponse(res, position);
  } catch (error) {
    console.error("❌ Lỗi lấy vị trí xe:", error);
    return serverErrorResponse(res, error);
  }
};

/**
 * Lấy danh sách tất cả routes với tọa độ (cho tracking demo)
 * GET /api/v1/tracking/routes
 * @returns {Array} - Danh sách routes với điểm đi/đến và tọa độ
 */
const getAllRoutesWithCoordinates = async (req, res) => {
  try {
    const routes = await trackingService.getAllRoutesWithCoordinates();
    return successResponse(res, routes);
  } catch (error) {
    console.error("❌ Lỗi lấy danh sách routes:", error);
    return serverErrorResponse(res, error);
  }
};

/**
 * Lấy danh sách chuyến xe đang hoạt động (có thể tracking)
 * GET /api/v1/tracking/trips/active
 * @returns {Array} - Danh sách trips đang hoạt động
 */
const getActiveTrips = async (req, res) => {
  try {
    const trips = await trackingService.getActiveTrips();
    return successResponse(res, trips);
  } catch (error) {
    console.error("❌ Lỗi lấy danh sách trips:", error);
    return serverErrorResponse(res, error);
  }
};

module.exports = {
  getTripTracking,
  getTripStopsWithStatus,
  getBusPosition,
  getAllRoutesWithCoordinates,
  getActiveTrips,
};
