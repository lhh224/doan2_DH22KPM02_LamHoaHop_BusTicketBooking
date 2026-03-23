/**
 * File: response.js
 * Mục đích: Chuẩn hóa response trả về cho client
 * Tất cả API đều sử dụng format { success: boolean, data: object }
 */

/**
 * Trả về response thành công
 * @param {object} res - Express response object
 * @param {object} data - Dữ liệu trả về
 * @param {number} statusCode - HTTP status code (mặc định 200)
 */
const successResponse = (res, data = {}, statusCode = 200) => {
  return res.status(statusCode).json({
    success: true,
    data: data,
  });
};

/**
 * Trả về response lỗi
 * @param {object} res - Express response object
 * @param {string} message - Thông báo lỗi
 * @param {number} statusCode - HTTP status code (mặc định 400)
 * @param {object} errors - Chi tiết lỗi (tuỳ chọn)
 */
const errorResponse = (
  res,
  message = "Có lỗi xảy ra",
  statusCode = 400,
  errors = null
) => {
  const response = {
    success: false,
    message: message,
  };

  if (errors) {
    response.errors = errors;
  }

  return res.status(statusCode).json(response);
};

/**
 * Trả về response validation error
 * @param {object} res - Express response object
 * @param {object} errors - Chi tiết lỗi validation
 */
const validationErrorResponse = (res, errors) => {
  return errorResponse(res, "Dữ liệu không hợp lệ", 422, errors);
};

/**
 * Trả về response không tìm thấy
 * @param {object} res - Express response object
 * @param {string} message - Thông báo (mặc định "Không tìm thấy")
 */
const notFoundResponse = (res, message = "Không tìm thấy dữ liệu") => {
  return errorResponse(res, message, 404);
};

/**
 * Trả về response lỗi server
 * @param {object} res - Express response object
 * @param {Error} error - Error object
 */
const serverErrorResponse = (res, error) => {
  console.error("❌ Server Error:", error);
  return errorResponse(res, "Lỗi hệ thống, vui lòng thử lại sau", 500);
};

module.exports = {
  successResponse,
  errorResponse,
  validationErrorResponse,
  notFoundResponse,
  serverErrorResponse,
};
