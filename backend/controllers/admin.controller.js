/**
 * File: controllers/admin.controller.js
 * Mục đích: Admin controller
 */

const adminService = require("../services/admin.service");
const { successResponse, errorResponse } = require("../utils/response");

/**
 * GET /api/v1/admin/dashboard/stats
 * Lấy thống kê tổng quan
 */
const getDashboardStats = async (req, res) => {
  try {
    const stats = await adminService.getDashboardStats();
    return successResponse(res, stats, 200);
  } catch (error) {
    console.error("Get dashboard stats error:", error);
    return errorResponse(res, "Lỗi khi lấy thống kê", 500);
  }
};

/**
 * GET /api/v1/admin/dashboard/revenue-chart
 * Lấy biểu đồ doanh thu
 */
const getRevenueChart = async (req, res) => {
  try {
    const year = parseInt(req.query.year) || new Date().getFullYear();
    const data = await adminService.getRevenueChart(year);
    return successResponse(res, data, 200);
  } catch (error) {
    console.error("Get revenue chart error:", error);
    return errorResponse(res, "Lỗi khi lấy biểu đồ doanh thu", 500);
  }
};

/**
 * GET /api/v1/admin/dashboard/top-routes
 * Lấy top tuyến xe
 */
const getTopRoutes = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;
    const data = await adminService.getTopRoutes(limit);
    return successResponse(res, data, 200);
  } catch (error) {
    console.error("Get top routes error:", error);
    return errorResponse(res, "Lỗi khi lấy top tuyến xe", 500);
  }
};

/**
 * GET /api/v1/admin/companies
 * Lấy danh sách nhà xe
 */
const getAllCompanies = async (req, res) => {
  try {
    const companies = await adminService.getAllCompanies();
    return successResponse(res, { companies, total: companies.length }, 200);
  } catch (error) {
    console.error("Get companies error:", error);
    return errorResponse(res, "Lỗi khi lấy danh sách nhà xe", 500);
  }
};

/**
 * GET /api/v1/admin/routes
 * Lấy danh sách tuyến đường
 */
const getAllRoutes = async (req, res) => {
  try {
    const routes = await adminService.getAllRoutes();
    return successResponse(res, { routes, total: routes.length }, 200);
  } catch (error) {
    console.error("Get routes error:", error);
    return errorResponse(res, "Lỗi khi lấy danh sách tuyến đường", 500);
  }
};

/**
 * GET /api/v1/admin/trips
 * Lấy danh sách chuyến xe
 */
const getTripsAdmin = async (req, res) => {
  try {
    const { fromDate, toDate, companyId, routeId } = req.query;

    const trips = await adminService.getTripsAdmin({
      fromDate,
      toDate,
      companyId: companyId ? parseInt(companyId) : null,
      routeId: routeId ? parseInt(routeId) : null,
    });

    // Trả về đúng cấu trúc {trips, total} để frontend dễ xử lý
    return successResponse(res, { trips, total: trips.length }, 200);
  } catch (error) {
    console.error("Get trips admin error:", error);
    return errorResponse(res, "Lỗi khi lấy danh sách chuyến xe", 500);
  }
};

/**
 * GET /api/v1/admin/bookings
 * Lấy danh sách bookings
 */
const getAllBookings = async (req, res) => {
  try {
    const { status, fromDate, toDate, search } = req.query;

    const bookings = await adminService.getAllBookings({
      status,
      fromDate,
      toDate,
      search,
    });

    return successResponse(res, bookings, 200);
  } catch (error) {
    console.error("Get bookings error:", error);
    return errorResponse(res, "Lỗi khi lấy danh sách booking", 500);
  }
};

/**
 * GET /api/v1/admin/users
 * Lấy danh sách users
 */
const getAllUsers = async (req, res) => {
  try {
    const { role, status, search } = req.query;

    const users = await adminService.getAllUsers({
      role,
      status,
      search,
    });

    return successResponse(res, users, 200);
  } catch (error) {
    console.error("Get users error:", error);
    return errorResponse(res, "Lỗi khi lấy danh sách người dùng", 500);
  }
};

/**
 * PUT /api/v1/admin/users/:id/status
 * Cập nhật trạng thái user
 */
const updateUserStatus = async (req, res) => {
  try {
    const userId = parseInt(req.params.id);
    const { status } = req.body;

    if (typeof status !== "boolean" && status !== 0 && status !== 1) {
      return errorResponse(
        res,
        "Trạng thái không hợp lệ (phải là boolean)",
        400,
      );
    }

    await adminService.updateUserStatus(userId, status);

    return successResponse(res, null, 200);
  } catch (error) {
    console.error("Update user status error:", error);
    return errorResponse(res, "Lỗi khi cập nhật trạng thái", 500);
  }
};

/**
 * GET /api/v1/admin/reviews
 * Lấy danh sách đánh giá
 */
const getAllReviews = async (req, res) => {
  try {
    const { status } = req.query;

    const reviews = await adminService.getAllReviews({ status });

    return successResponse(res, reviews, 200);
  } catch (error) {
    console.error("Get reviews error:", error);
    return errorResponse(res, "Lỗi khi lấy danh sách đánh giá", 500);
  }
};

/**
 * PUT /api/v1/admin/reviews/:id/status
 * Duyệt/Từ chối đánh giá
 */
const updateReviewStatus = async (req, res) => {
  try {
    const reviewId = parseInt(req.params.id);
    const { status } = req.body;

    if (!["APPROVED", "REJECTED"].includes(status)) {
      return errorResponse(res, "Trạng thái không hợp lệ", 400);
    }

    await adminService.updateReviewStatus(reviewId, status);

    return successResponse(res, null, 200);
  } catch (error) {
    console.error("Update review status error:", error);
    return errorResponse(res, "Lỗi khi cập nhật trạng thái", 500);
  }
};

/**
 * DELETE /api/v1/admin/companies/:id
 * Xóa nhà xe (soft delete)
 */
const deleteCompany = async (req, res) => {
  try {
    const companyId = parseInt(req.params.id);

    if (!companyId) {
      return errorResponse(res, "ID nhà xe không hợp lệ", 400);
    }

    await adminService.deleteCompany(companyId);

    return successResponse(res, { message: "Đã ẩn nhà xe thành công" }, 200);
  } catch (error) {
    console.error("Delete company error:", error);
    return errorResponse(res, "Lỗi khi xóa nhà xe", 500);
  }
};

/**
 * POST /api/v1/admin/companies
 * Tạo nhà xe mới
 */
const createCompany = async (req, res) => {
  try {
    const companyData = req.body;

    if (!companyData.tenNhaXe) {
      return errorResponse(res, "Thiếu tên nhà xe", 400);
    }

    const companyId = await adminService.createCompany(companyData);

    return successResponse(
      res,
      { message: "Tạo nhà xe thành công", companyId },
      201,
    );
  } catch (error) {
    console.error("Create company error:", error);
    return errorResponse(res, "Lỗi khi tạo nhà xe", 500);
  }
};

/**
 * PUT /api/v1/admin/companies/:id
 * Cập nhật nhà xe
 */
const updateCompany = async (req, res) => {
  try {
    const companyId = parseInt(req.params.id);
    const companyData = req.body;

    if (!companyId) {
      return errorResponse(res, "ID nhà xe không hợp lệ", 400);
    }

    if (
      !companyData.tenNhaXe ||
      !companyData.soDienThoai ||
      !companyData.email
    ) {
      return errorResponse(res, "Thiếu thông tin bắt buộc", 400);
    }

    await adminService.updateCompany(companyId, companyData);

    return successResponse(res, { message: "Cập nhật nhà xe thành công" }, 200);
  } catch (error) {
    console.error("Update company error:", error);
    return errorResponse(res, "Lỗi khi cập nhật nhà xe", 500);
  }
};

/**
 * DELETE /api/v1/admin/routes/:id
 * Xóa tuyến đường (soft delete)
 */
const deleteRoute = async (req, res) => {
  try {
    const routeId = parseInt(req.params.id);

    if (!routeId) {
      return errorResponse(res, "ID tuyến đường không hợp lệ", 400);
    }

    await adminService.deleteRoute(routeId);

    return successResponse(
      res,
      { message: "Đã ẩn tuyến đường thành công" },
      200,
    );
  } catch (error) {
    console.error("Delete route error:", error);
    return errorResponse(res, "Lỗi khi xóa tuyến đường", 500);
  }
};

/**
 * POST /api/v1/admin/routes
 * Tạo tuyến đường mới
 */
const createRoute = async (req, res) => {
  try {
    const routeData = req.body;

    if (!routeData.tenTuyen || !routeData.diemDi || !routeData.diemDen) {
      return errorResponse(res, "Thiếu thông tin bắt buộc", 400);
    }

    const routeId = await adminService.createRoute(routeData);

    return successResponse(
      res,
      { message: "Tạo tuyến đường thành công", routeId },
      201,
    );
  } catch (error) {
    console.error("Create route error:", error);
    return errorResponse(res, "Lỗi khi tạo tuyến đường", 500);
  }
};

/**
 * PUT /api/v1/admin/routes/:id
 * Cập nhật tuyến đường
 */
const updateRoute = async (req, res) => {
  try {
    const routeId = parseInt(req.params.id);
    const routeData = req.body;

    if (!routeId) {
      return errorResponse(res, "ID tuyến đường không hợp lệ", 400);
    }

    if (!routeData.tenTuyen || !routeData.diemDi || !routeData.diemDen) {
      return errorResponse(res, "Thiếu thông tin bắt buộc", 400);
    }

    await adminService.updateRoute(routeId, routeData);

    return successResponse(
      res,
      { message: "Cập nhật tuyến đường thành công" },
      200,
    );
  } catch (error) {
    console.error("Update route error:", error);
    return errorResponse(res, "Lỗi khi cập nhật tuyến đường", 500);
  }
};

// ========================================
// QUẢN LÝ ĐIỂM DỪNG (STOPS)
// ========================================

/**
 * GET /api/v1/admin/stops?routeId=...
 * Lấy danh sách điểm dừng theo tuyến
 */
const getStopsByRoute = async (req, res) => {
  try {
    const routeId = parseInt(req.query.routeId);

    if (!routeId) {
      return errorResponse(res, "Vui lòng cung cấp routeId", 400);
    }

    const stops = await adminService.getStopsByRoute(routeId);

    return successResponse(res, { stops, total: stops.length }, 200);
  } catch (error) {
    console.error("Get stops error:", error);
    return errorResponse(res, "Lỗi khi lấy danh sách điểm dừng", 500);
  }
};

/**
 * POST /api/v1/admin/stops
 * Tạo điểm dừng mới
 */
const createStop = async (req, res) => {
  try {
    const stopData = req.body;

    if (!stopData.maTuyen || !stopData.thuTu || !stopData.tenDiemDung) {
      return errorResponse(
        res,
        "Thiếu thông tin bắt buộc (maTuyen, thuTu, tenDiemDung)",
        400,
      );
    }

    const stopId = await adminService.createStop(stopData);

    return successResponse(
      res,
      { message: "Tạo điểm dừng thành công", stopId },
      201,
    );
  } catch (error) {
    console.error("Create stop error:", error);
    // Kiểm tra lỗi trùng thứ tự
    if (error.message && error.message.includes("UNIQUE")) {
      return errorResponse(
        res,
        "Thứ tự điểm dừng đã tồn tại trong tuyến này",
        400,
      );
    }
    return errorResponse(res, "Lỗi khi tạo điểm dừng", 500);
  }
};

/**
 * PUT /api/v1/admin/stops/:id
 * Cập nhật điểm dừng
 */
const updateStop = async (req, res) => {
  try {
    const stopId = parseInt(req.params.id);
    const stopData = req.body;

    if (!stopId) {
      return errorResponse(res, "ID điểm dừng không hợp lệ", 400);
    }

    if (!stopData.thuTu || !stopData.tenDiemDung) {
      return errorResponse(res, "Thiếu thông tin bắt buộc", 400);
    }

    await adminService.updateStop(stopId, stopData);

    return successResponse(
      res,
      { message: "Cập nhật điểm dừng thành công" },
      200,
    );
  } catch (error) {
    console.error("Update stop error:", error);
    if (error.message && error.message.includes("UNIQUE")) {
      return errorResponse(
        res,
        "Thứ tự điểm dừng đã tồn tại trong tuyến này",
        400,
      );
    }
    return errorResponse(res, "Lỗi khi cập nhật điểm dừng", 500);
  }
};

/**
 * DELETE /api/v1/admin/stops/:id
 * Xóa điểm dừng (Soft Delete - chuyển IsActive = 0)
 */
const deleteStop = async (req, res) => {
  try {
    const stopId = parseInt(req.params.id);

    if (!stopId) {
      return errorResponse(res, "ID điểm dừng không hợp lệ", 400);
    }

    await adminService.deleteStop(stopId);

    return successResponse(
      res,
      { message: "Đã xóa điểm dừng thành công" },
      200,
    );
  } catch (error) {
    console.error("Delete stop error:", error);
    return errorResponse(res, "Lỗi khi xóa điểm dừng", 500);
  }
};

// ========================================
// DASHBOARD NÂNG CAO
// ========================================

/**
 * GET /api/v1/admin/dashboard/upcoming-trips
 */
const getUpcomingTrips = async (req, res) => {
  try {
    const trips = await adminService.getUpcomingTrips();
    return successResponse(res, trips, 200);
  } catch (error) {
    console.error("Get upcoming trips error:", error);
    return errorResponse(res, "Lỗi khi lấy chuyến xe sắp chạy", 500);
  }
};

/**
 * GET /api/v1/admin/dashboard/fill-rate
 */
const getFillRate = async (req, res) => {
  try {
    const data = await adminService.getFillRate();
    return successResponse(res, data, 200);
  } catch (error) {
    console.error("Get fill rate error:", error);
    return errorResponse(res, "Lỗi khi tính tỉ lệ lấp đầy", 500);
  }
};

/**
 * GET /api/v1/admin/dashboard/revenue-payments
 */
const getRevenueFromPayments = async (req, res) => {
  try {
    const data = await adminService.getRevenueFromPayments();
    return successResponse(res, data, 200);
  } catch (error) {
    console.error("Get revenue payments error:", error);
    return errorResponse(res, "Lỗi khi lấy doanh thu từ payments", 500);
  }
};

/**
 * GET /api/v1/admin/dashboard/paid-bookings
 */
const getPaidBookingsCount = async (req, res) => {
  try {
    const data = await adminService.getPaidBookingsCount();
    return successResponse(res, data, 200);
  } catch (error) {
    console.error("Get paid bookings count error:", error);
    return errorResponse(res, "Lỗi khi đếm vé bán ra", 500);
  }
};

// ========================================
// THỐNG KÊ NÂNG CAO
// ========================================

/**
 * GET /api/v1/admin/stats/revenue-by-time?period=month&year=2026
 */
const getRevenueByTime = async (req, res) => {
  try {
    const period = req.query.period || "month";
    const year = parseInt(req.query.year) || new Date().getFullYear();
    const data = await adminService.getRevenueByTime(period, year);
    return successResponse(res, data, 200);
  } catch (error) {
    console.error("Get revenue by time error:", error);
    return errorResponse(res, "Lỗi khi lấy doanh thu theo thời gian", 500);
  }
};

/**
 * GET /api/v1/admin/stats/revenue-by-company?year=2026
 */
const getRevenueByCompany = async (req, res) => {
  try {
    const year = parseInt(req.query.year) || new Date().getFullYear();
    const data = await adminService.getRevenueByCompany(year);
    return successResponse(res, data, 200);
  } catch (error) {
    console.error("Get revenue by company error:", error);
    return errorResponse(res, "Lỗi khi lấy doanh thu theo nhà xe", 500);
  }
};

/**
 * GET /api/v1/admin/stats/revenue-by-route?year=2026
 */
const getRevenueByRoute = async (req, res) => {
  try {
    const year = parseInt(req.query.year) || new Date().getFullYear();
    const data = await adminService.getRevenueByRoute(year);
    return successResponse(res, data, 200);
  } catch (error) {
    console.error("Get revenue by route error:", error);
    return errorResponse(res, "Lỗi khi lấy doanh thu theo tuyến", 500);
  }
};

/**
 * GET /api/v1/admin/stats/payment-methods?year=2026
 */
const getPaymentMethodStats = async (req, res) => {
  try {
    const year = parseInt(req.query.year) || new Date().getFullYear();
    const data = await adminService.getPaymentMethodStats(year);
    return successResponse(res, data, 200);
  } catch (error) {
    console.error("Get payment method stats error:", error);
    return errorResponse(
      res,
      "Lỗi khi lấy thống kê phương thức thanh toán",
      500,
    );
  }
};

// ========================================
// QUẢN LÝ TÀI KHOẢN
// ========================================

/**
 * POST /api/v1/admin/accounts/create-staff
 */
const createStaffAccount = async (req, res) => {
  try {
    const { email, password, fullName, phone, address, role } = req.body;

    if (!email || !password || !fullName) {
      return errorResponse(
        res,
        "Thiếu thông tin bắt buộc (email, password, fullName)",
        400,
      );
    }

    if (role && !["STAFF", "ADMIN"].includes(role)) {
      return errorResponse(res, "Vai trò không hợp lệ", 400);
    }

    const user = await adminService.createStaffAccount({
      email,
      password,
      fullName,
      phone,
      address,
      role,
    });
    return successResponse(
      res,
      { message: "Tạo tài khoản thành công", user },
      201,
    );
  } catch (error) {
    console.error("Create staff account error:", error);
    if (error.message === "Email đã được sử dụng") {
      return errorResponse(res, error.message, 400);
    }
    return errorResponse(res, "Lỗi khi tạo tài khoản", 500);
  }
};

/**
 * PUT /api/v1/admin/accounts/:id/toggle-lock
 */
const toggleUserLock = async (req, res) => {
  try {
    const userId = parseInt(req.params.id);
    const { action } = req.body; // 'lock' hoặc 'unlock'

    if (!userId) {
      return errorResponse(res, "ID người dùng không hợp lệ", 400);
    }

    if (!["lock", "unlock"].includes(action)) {
      return errorResponse(res, "Hành động không hợp lệ (lock/unlock)", 400);
    }

    const result = await adminService.toggleUserLock(userId, action);
    return successResponse(
      res,
      {
        message:
          action === "lock" ? "Đã khóa tài khoản" : "Đã mở khóa tài khoản",
        ...result,
      },
      200,
    );
  } catch (error) {
    console.error("Toggle user lock error:", error);
    return errorResponse(res, "Lỗi khi thay đổi trạng thái tài khoản", 500);
  }
};

// ========================================
// LOG
// ========================================

/**
 * GET /api/v1/admin/logs/transactions
 */
const getTransactionLogs = async (req, res) => {
  try {
    const { fromDate, toDate, status } = req.query;
    const logs = await adminService.getTransactionLogs({
      fromDate,
      toDate,
      status,
    });
    return successResponse(res, logs, 200);
  } catch (error) {
    console.error("Get transaction logs error:", error);
    return errorResponse(res, "Lỗi khi lấy lịch sử giao dịch", 500);
  }
};

/**
 * GET /api/v1/admin/logs/logins
 */
const getLoginLogs = async (req, res) => {
  try {
    const { fromDate, toDate, userId } = req.query;
    const logs = await adminService.getLoginLogs({
      fromDate,
      toDate,
      userId: userId ? parseInt(userId) : null,
    });
    return successResponse(res, logs, 200);
  } catch (error) {
    console.error("Get login logs error:", error);
    return errorResponse(res, "Lỗi khi lấy lịch sử đăng nhập", 500);
  }
};

// ========================================
// BOOKINGS & BUS TYPES MANAGEMENT
// ========================================

/**
 * PUT /api/v1/admin/bookings/:id/status
 * Xác nhận hoặc hủy đặt vé
 */
const updateBookingStatus = async (req, res) => {
  try {
    const bookingId = parseInt(req.params.id);
    const { status } = req.body;
    if (!["PAID", "CANCELLED", "PENDING"].includes(status)) {
      return errorResponse(res, "Trạng thái không hợp lệ", 400);
    }
    await adminService.updateBookingStatus(bookingId, status);
    return successResponse(res, { message: "Cập nhật trạng thái thành công" });
  } catch (error) {
    console.error("Update booking status error:", error);
    return errorResponse(
      res,
      error.message || "Lỗi khi cập nhật trạng thái",
      500,
    );
  }
};

/**
 * POST /api/v1/admin/bookings/manual
 * Tạo vé mới thủ công (admin/staff đặt hộ khách)
 */
const createManualBooking = async (req, res) => {
  try {
    const booking = await adminService.createManualBooking(req.body, req.user);
    return successResponse(
      res,
      { booking, message: "Tạo vé mới thành công" },
      201,
    );
  } catch (error) {
    console.error("Create manual booking error:", error);
    return errorResponse(res, error.message || "Lỗi khi tạo vé mới", 400);
  }
};

module.exports = {
  getDashboardStats,
  getRevenueChart,
  getTopRoutes,
  getAllCompanies,
  getAllRoutes,
  getTripsAdmin,
  getAllBookings,
  getAllUsers,
  updateUserStatus,
  getAllReviews,
  updateReviewStatus,
  deleteCompany,
  createCompany,
  updateCompany,
  deleteRoute,
  createRoute,
  updateRoute,
  // Điểm dừng
  getStopsByRoute,
  createStop,
  updateStop,
  deleteStop,
  // Dashboard nâng cao
  getUpcomingTrips,
  getFillRate,
  getRevenueFromPayments,
  getPaidBookingsCount,
  // Thống kê
  getRevenueByTime,
  getRevenueByCompany,
  getRevenueByRoute,
  getPaymentMethodStats,
  // Tài khoản
  createStaffAccount,
  toggleUserLock,
  // Log
  getTransactionLogs,
  getLoginLogs,
  // Booking status
  updateBookingStatus,
  createManualBooking,
};
