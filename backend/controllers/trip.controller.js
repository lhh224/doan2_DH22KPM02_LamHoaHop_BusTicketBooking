/**
 * File: trip.controller.js
 * Controller xử lý các request liên quan đến chuyến xe
 */

const tripService = require("../services/trip.service");
const {
  successResponse,
  errorResponse,
  notFoundResponse,
  serverErrorResponse,
} = require("../utils/response");

/**
 * Tìm kiếm chuyến xe
 * GET /api/v1/trips/search?from=...&to=...&date=...
 */
const searchTrips = async (req, res) => {
  try {
    const { from, to, date } = req.query;

    // Validate
    if (!from || !to || !date) {
      return errorResponse(
        res,
        "Vui lòng cung cấp đầy đủ thông tin: from, to, date",
        400,
      );
    }

    const trips = await tripService.searchTrips(from, to, date);

    return successResponse(res, { trips }, 200);
  } catch (error) {
    return serverErrorResponse(res, error);
  }
};

/**
 * Lấy danh sách chuyến xe đang hoạt động (cho trang tracking)
 * GET /api/v1/trips/active
 */
const getActiveTrips = async (req, res) => {
  try {
    const trips = await tripService.getActiveTrips();
    return successResponse(res, trips);
  } catch (error) {
    return serverErrorResponse(res, error);
  }
};

/**
 * Lấy thông tin chi tiết chuyến xe
 * GET /api/v1/trips/:tripId
 */
const getTripDetail = async (req, res) => {
  try {
    const { tripId } = req.params;

    const trip = await tripService.getTripDetail(tripId);

    if (!trip) {
      return notFoundResponse(res, "Không tìm thấy chuyến xe");
    }

    // Lấy danh sách điểm dừng
    const stops = await tripService.getTripStops(tripId);

    return successResponse(res, { trip, stops }, 200);
  } catch (error) {
    return serverErrorResponse(res, error);
  }
};

/**
 * Lấy danh sách điểm đi/điểm đến
 * GET /api/v1/trips/cities
 */
const getCityOptions = async (req, res) => {
  try {
    const options = await tripService.getCityOptions();
    return successResponse(res, options, 200);
  } catch (error) {
    return serverErrorResponse(res, error);
  }
};

/**
 * Lấy danh sách tuyến đường phổ biến
 * GET /api/v1/trips/routes
 */
const getPopularRoutes = async (req, res) => {
  try {
    const routes = await tripService.getPopularRoutes();
    return successResponse(res, { routes }, 200);
  } catch (error) {
    return serverErrorResponse(res, error);
  }
};

/**
 * [ADMIN] Lấy tất cả chuyến xe
 * GET /api/v1/admin/trips
 */
const getAllTrips = async (req, res) => {
  try {
    const trips = await tripService.getAllTrips();
    return successResponse(res, { trips, total: trips.length }, 200);
  } catch (error) {
    return serverErrorResponse(res, error);
  }
};

/**
 * [ADMIN] Tạo chuyến xe mới
 * POST /api/v1/admin/trips
 */
const createTrip = async (req, res) => {
  try {
    console.log("📥 Received trip data:", req.body);

    const {
      routeId,
      companyId,
      busTypeId,
      departureTime,
      arrivalTime,
      departureDate,
      price,
      isActive,
    } = req.body;

    console.log(
      "⏰ Times - Departure:",
      departureTime,
      "Arrival:",
      arrivalTime,
    );

    // Validate
    if (
      !routeId ||
      !companyId ||
      !busTypeId ||
      !departureTime ||
      !arrivalTime ||
      !departureDate ||
      !price
    ) {
      return errorResponse(
        res,
        "Vui lòng cung cấp đầy đủ thông tin chuyến xe",
        400,
      );
    }

    const tripId = await tripService.createTrip(req.body);

    return successResponse(
      res,
      { tripId, message: "Tạo chuyến xe thành công" },
      201,
    );
  } catch (error) {
    return serverErrorResponse(res, error);
  }
};

/**
 * [ADMIN] Cập nhật chuyến xe
 * PUT /api/v1/admin/trips/:tripId
 */
const updateTrip = async (req, res) => {
  try {
    const { tripId } = req.params;
    const {
      routeId,
      companyId,
      busTypeId,
      departureTime,
      arrivalTime,
      departureDate,
      price,
      isActive,
    } = req.body;

    // Validate
    if (
      !routeId ||
      !companyId ||
      !busTypeId ||
      !departureTime ||
      !arrivalTime ||
      !departureDate ||
      !price
    ) {
      return errorResponse(
        res,
        "Vui lòng cung cấp đầy đủ thông tin chuyến xe",
        400,
      );
    }

    await tripService.updateTrip(tripId, req.body);

    return successResponse(
      res,
      { message: "Cập nhật chuyến xe thành công" },
      200,
    );
  } catch (error) {
    return serverErrorResponse(res, error);
  }
};

/**
 * [ADMIN] Xóa chuyến xe (ẩn chuyến xe bằng cách set IsActive = 0)
 * DELETE /api/v1/admin/trips/:tripId
 */
const deleteTrip = async (req, res) => {
  try {
    const { tripId } = req.params;

    await tripService.deleteTrip(tripId);

    return successResponse(
      res,
      {
        message: "Đã ẩn chuyến xe thành công",
      },
      200,
    );
  } catch (error) {
    return serverErrorResponse(res, error);
  }
};

/**
 * [ADMIN] Lấy danh sách nhà xe
 * GET /api/v1/admin/companies
 */
const getCompanies = async (req, res) => {
  try {
    const companies = await tripService.getCompanies();
    return successResponse(res, { companies }, 200);
  } catch (error) {
    return serverErrorResponse(res, error);
  }
};

/**
 * [ADMIN] Lấy danh sách loại xe
 * GET /api/v1/admin/bus-types
 */
const getBusTypes = async (req, res) => {
  try {
    const busTypes = await tripService.getBusTypes();
    return successResponse(res, { busTypes }, 200);
  } catch (error) {
    return serverErrorResponse(res, error);
  }
};

/**
 * [ADMIN] Lấy danh sách tuyến đường
 * GET /api/v1/admin/routes
 */
const getRoutes = async (req, res) => {
  try {
    const routes = await tripService.getRoutes();
    return successResponse(res, { routes }, 200);
  } catch (error) {
    return serverErrorResponse(res, error);
  }
};

/**
 * [ADMIN] Tạo nhà xe mới
 * POST /api/v1/admin/companies
 */
const createCompany = async (req, res) => {
  try {
    const { tenNhaXe, soDienThoai, email, diaChi, moTa } = req.body;

    if (!tenNhaXe) {
      return errorResponse(res, "Tên nhà xe là bắt buộc", 400);
    }

    const company = await tripService.createCompany({
      tenNhaXe,
      soDienThoai,
      email,
      diaChi,
      moTa,
    });

    return successResponse(res, { company }, 201);
  } catch (error) {
    return serverErrorResponse(res, error);
  }
};

/**
 * [ADMIN] Cập nhật nhà xe
 * PUT /api/v1/admin/companies/:id
 */
const updateCompany = async (req, res) => {
  try {
    const { id } = req.params;
    const { tenNhaXe, soDienThoai, email, diaChi, moTa, trangThai } = req.body;

    const company = await tripService.updateCompany(id, {
      tenNhaXe,
      soDienThoai,
      email,
      diaChi,
      moTa,
      trangThai,
    });

    return successResponse(res, { company }, 200);
  } catch (error) {
    return serverErrorResponse(res, error);
  }
};

/**
 * [ADMIN] Xóa nhà xe
 * DELETE /api/v1/admin/companies/:id
 */
const deleteCompany = async (req, res) => {
  try {
    const { id } = req.params;

    await tripService.deleteCompany(id);

    return successResponse(res, { message: "Đã xóa nhà xe thành công" }, 200);
  } catch (error) {
    return serverErrorResponse(res, error);
  }
};

/**
 * [ADMIN] Tạo tuyến đường mới
 * POST /api/v1/admin/routes
 */
const createRoute = async (req, res) => {
  try {
    const { tenTuyen, diemDi, diemDen, khoangCach, thoiGianUocTinh } = req.body;

    if (!tenTuyen || !diemDi || !diemDen) {
      return errorResponse(
        res,
        "Tên tuyến, điểm đi và điểm đến là bắt buộc",
        400,
      );
    }

    const route = await tripService.createRoute({
      tenTuyen,
      diemDi,
      diemDen,
      khoangCach,
      thoiGianUocTinh,
    });

    return successResponse(res, { route }, 201);
  } catch (error) {
    return serverErrorResponse(res, error);
  }
};

/**
 * [ADMIN] Cập nhật tuyến đường
 * PUT /api/v1/admin/routes/:id
 */
const updateRoute = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      tenTuyen,
      diemDi,
      diemDen,
      khoangCach,
      thoiGianUocTinh,
      trangThai,
    } = req.body;

    const route = await tripService.updateRoute(id, {
      tenTuyen,
      diemDi,
      diemDen,
      khoangCach,
      thoiGianUocTinh,
      trangThai,
    });

    return successResponse(res, { route }, 200);
  } catch (error) {
    return serverErrorResponse(res, error);
  }
};

/**
 * [ADMIN] Xóa tuyến đường
 * DELETE /api/v1/admin/routes/:id
 */
const deleteRoute = async (req, res) => {
  try {
    const { id } = req.params;

    await tripService.deleteRoute(id);

    return successResponse(
      res,
      { message: "Đã xóa tuyến đường thành công" },
      200,
    );
  } catch (error) {
    return serverErrorResponse(res, error);
  }
};

/**
 * [ADMIN] Lấy danh sách điểm dừng của tuyến
 * GET /api/v1/admin/routes/:id/stops
 */
const getRouteStops = async (req, res) => {
  try {
    const { id } = req.params;

    const stops = await tripService.getRouteStops(id);

    return successResponse(res, { stops }, 200);
  } catch (error) {
    return serverErrorResponse(res, error);
  }
};

/**
 * [ADMIN] Thêm điểm dừng vào tuyến
 * POST /api/v1/admin/routes/:id/stops
 */
const addRouteStop = async (req, res) => {
  try {
    const { id } = req.params;
    const { tenDiemDung, diaChi, kinhDo, viDo, thuTu } = req.body;

    if (!tenDiemDung || !thuTu) {
      return errorResponse(res, "Tên điểm dừng và thứ tự là bắt buộc", 400);
    }

    const stop = await tripService.addRouteStop(id, {
      tenDiemDung,
      diaChi,
      kinhDo,
      viDo,
      thuTu,
    });

    return successResponse(res, { stop }, 201);
  } catch (error) {
    return serverErrorResponse(res, error);
  }
};

/**
 * [ADMIN] Xóa điểm dừng khỏi tuyến
 * DELETE /api/v1/admin/routes/:routeId/stops/:stopId
 */
const deleteRouteStop = async (req, res) => {
  try {
    const { stopId } = req.params;

    await tripService.deleteRouteStop(stopId);

    return successResponse(
      res,
      { message: "Đã xóa điểm dừng thành công" },
      200,
    );
  } catch (error) {
    return serverErrorResponse(res, error);
  }
};

module.exports = {
  searchTrips,
  getTripDetail,
  getCityOptions,
  getPopularRoutes,
  getActiveTrips,
  getAllTrips,
  createTrip,
  updateTrip,
  deleteTrip,
  getCompanies,
  getBusTypes,
  getRoutes,
  createCompany,
  updateCompany,
  deleteCompany,
  createRoute,
  updateRoute,
  deleteRoute,
  getRouteStops,
  addRouteStop,
  deleteRouteStop,
};
