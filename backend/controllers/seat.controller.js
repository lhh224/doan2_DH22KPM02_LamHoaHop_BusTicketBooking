/**
 * File: seat.controller.js
 * Controller xử lý các request liên quan đến ghế
 */

const seatService = require("../services/seat.service");
const {
  successResponse,
  errorResponse,
  serverErrorResponse,
} = require("../utils/response");

/**
 * Lấy sơ đồ ghế theo chặng
 * GET /api/v1/seats?tripId=...&fromStopOrder=...&toStopOrder=...
 */
const getSeats = async (req, res) => {
  try {
    const { tripId, fromStopOrder, toStopOrder } = req.query;

    // Validate
    if (!tripId || !fromStopOrder || !toStopOrder) {
      return errorResponse(
        res,
        "Vui lòng cung cấp đầy đủ: tripId, fromStopOrder, toStopOrder",
        400,
      );
    }

    const result = await seatService.getSeatsBySegment(
      parseInt(tripId),
      parseInt(fromStopOrder),
      parseInt(toStopOrder),
    );

    return successResponse(res, result, 200);
  } catch (error) {
    return serverErrorResponse(res, error);
  }
};

module.exports = {
  getSeats,
};
