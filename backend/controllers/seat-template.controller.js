/**
 * File: seat-template.controller.js
 * Mục đích: Xử lý request/response liên quan đến template sơ đồ ghế
 */

const seatTemplateService = require("../services/seat-template.service");
const { successResponse, errorResponse } = require("../utils/response");

/**
 * Lấy danh sách tất cả template
 */
const getAllTemplates = async (req, res) => {
  try {
    const templates = await seatTemplateService.getAllTemplates();
    return successResponse(res, { templates });
  } catch (error) {
    console.error("❌ Lỗi lấy danh sách template:", error);
    return errorResponse(res, "Không thể lấy danh sách template", 500);
  }
};

/**
 * Lấy template theo ID
 */
const getTemplateById = async (req, res) => {
  try {
    const { templateId } = req.params;
    const template = await seatTemplateService.getTemplateById(templateId);
    return successResponse(res, { template });
  } catch (error) {
    console.error("❌ Lỗi lấy template:", error);
    return errorResponse(res, "Không thể lấy template", 500);
  }
};

/**
 * Lấy template theo loại xe
 */
const getTemplateByBusType = async (req, res) => {
  try {
    const { busType } = req.params;
    const template = await seatTemplateService.getTemplateByBusType(busType);
    return successResponse(res, { template });
  } catch (error) {
    console.error("❌ Lỗi lấy template theo loại xe:", error);
    return errorResponse(res, "Không thể lấy template", 500);
  }
};

module.exports = {
  getAllTemplates,
  getTemplateById,
  getTemplateByBusType,
};
