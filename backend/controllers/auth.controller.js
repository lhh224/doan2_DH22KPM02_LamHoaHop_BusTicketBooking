/**
 * File: controllers/auth.controller.js
 * Mục đích: Authentication controller
 */

const authService = require("../services/auth.service");
const { successResponse, errorResponse } = require("../utils/response");

/**
 * POST /api/v1/auth/register
 * Đăng ký tài khoản mới
 */
const register = async (req, res) => {
  try {
    const { username, email, password, hoTen, soDienThoai } = req.body;

    // Validation
    if (!username || !email || !password || !hoTen) {
      return errorResponse(
        res,
        "Tên đăng nhập, email, mật khẩu và họ tên là bắt buộc",
        400,
      );
    }

    // Username validation - chỉ chữ, số, dấu gạch dưới
    const usernameRegex = /^[a-zA-Z0-9_]{3,50}$/;
    if (!usernameRegex.test(username)) {
      return errorResponse(
        res,
        "Tên đăng nhập chỉ gồm chữ, số, dấu _ và từ 3-50 ký tự",
        400,
      );
    }

    // Email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return errorResponse(res, "Email không hợp lệ", 400);
    }

    // Password strength validation
    if (password.length < 6) {
      return errorResponse(res, "Mật khẩu phải có ít nhất 6 ký tự", 400);
    }

    const result = await authService.register({
      username,
      email,
      password,
      hoTen,
      soDienThoai,
    });

    return successResponse(res, result, 201);
  } catch (error) {
    console.error("Register error:", error);
    return errorResponse(res, error.message || "Đăng ký thất bại", 400);
  }
};

/**
 * POST /api/v1/auth/login
 * Đăng nhập
 */
const login = async (req, res) => {
  try {
    const { username, password } = req.body;

    // Validation
    if (!username || !password) {
      return errorResponse(res, "Tên đăng nhập và mật khẩu là bắt buộc", 400);
    }

    const result = await authService.login(username, password);

    return successResponse(res, result, 200);
  } catch (error) {
    console.error("Login error:", error);
    return errorResponse(res, error.message || "Đăng nhập thất bại", 401);
  }
};

/**
 * POST /api/v1/auth/logout
 * Đăng xuất
 */
const logout = async (req, res) => {
  try {
    const token = req.headers.authorization?.substring(7);

    if (token) {
      await authService.logout(token);
    }

    return successResponse(res, null, 200);
  } catch (error) {
    console.error("Logout error:", error);
    return errorResponse(res, "Đăng xuất thất bại", 500);
  }
};

/**
 * GET /api/v1/auth/me
 * Lấy thông tin user hiện tại
 */
const getMe = async (req, res) => {
  try {
    const user = await authService.getUserByToken(req.user.id);

    return successResponse(res, user, 200);
  } catch (error) {
    console.error("Get me error:", error);
    return errorResponse(res, "Không tìm thấy thông tin người dùng", 404);
  }
};

/**
 * PUT /api/v1/auth/change-password
 * Đổi mật khẩu
 */
const changePassword = async (req, res) => {
  try {
    const { oldPassword, newPassword } = req.body;

    if (!oldPassword || !newPassword) {
      return errorResponse(res, "Vui lòng nhập đầy đủ thông tin", 400);
    }

    if (newPassword.length < 6) {
      return res
        .status(400)
        .json(errorResponse("Mật khẩu mới phải có ít nhất 6 ký tự"));
    }

    await authService.changePassword(req.user.id, oldPassword, newPassword);

    return successResponse(res, null, 200);
  } catch (error) {
    console.error("Change password error:", error);
    return errorResponse(res, error.message || "Đổi mật khẩu thất bại", 400);
  }
};

module.exports = {
  register,
  login,
  logout,
  getMe,
  changePassword,
};
