/**
 * File: middleware/auth.js
 * Mục đích: Authentication & Authorization Middleware
 */

const jwt = require("jsonwebtoken");
const { successResponse, errorResponse } = require("../utils/response");

// Secret key cho JWT (nên lưu trong .env)
const JWT_SECRET =
  process.env.JWT_SECRET || "your-secret-key-change-this-in-production";
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "7d";

/**
 * Tạo JWT token
 */
const generateToken = (user) => {
  const payload = {
    id: user.UserId,
    email: user.Email,
    role: user.Role,
    name: user.FullName,
  };

  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
};

/**
 * Tạo refresh token
 */
const generateRefreshToken = (user) => {
  const payload = {
    id: user.UserId,
    type: "refresh",
  };

  return jwt.sign(payload, JWT_SECRET, { expiresIn: "30d" });
};

/**
 * Verify JWT token
 */
const verifyToken = (token) => {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    return null;
  }
};

/**
 * Middleware: Kiểm tra authentication
 */
const authenticate = async (req, res, next) => {
  try {
    // Lấy token từ header
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return errorResponse(
        res,
        "Chưa đăng nhập. Vui lòng đăng nhập để tiếp tục.",
        401,
      );
    }

    const token = authHeader.substring(7); // Bỏ "Bearer "

    // Verify token
    const decoded = verifyToken(token);

    if (!decoded) {
      return errorResponse(res, "Token không hợp lệ hoặc đã hết hạn.", 401);
    }

    // Gắn thông tin user vào request
    req.user = decoded;
    next();
  } catch (error) {
    console.error("Authentication error:", error);
    return errorResponse(res, "Lỗi xác thực. Vui lòng đăng nhập lại.", 401);
  }
};

/**
 * Middleware: Kiểm tra quyền ADMIN
 */
const requireAdmin = (req, res, next) => {
  if (!req.user || req.user.role !== "ADMIN") {
    return errorResponse(
      res,
      "Bạn không có quyền truy cập chức năng này.",
      403,
    );
  }
  next();
};

/**
 * Middleware: Kiểm tra quyền STAFF hoặc ADMIN
 */
const requireStaff = (req, res, next) => {
  if (!req.user || !["ADMIN", "STAFF"].includes(req.user.role)) {
    return errorResponse(
      res,
      "Bạn không có quyền truy cập chức năng này.",
      403,
    );
  }
  next();
};

/**
 * Middleware: Optional authentication (không bắt buộc đăng nhập)
 */
const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (authHeader && authHeader.startsWith("Bearer ")) {
      const token = authHeader.substring(7);
      const decoded = verifyToken(token);

      if (decoded) {
        req.user = decoded;
      }
    }

    next();
  } catch (error) {
    next(); // Tiếp tục dù có lỗi
  }
};

module.exports = {
  generateToken,
  generateRefreshToken,
  verifyToken,
  authenticate,
  requireAdmin,
  requireStaff,
  optionalAuth,
  JWT_SECRET,
};
