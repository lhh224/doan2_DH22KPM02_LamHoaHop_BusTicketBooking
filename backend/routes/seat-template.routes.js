/**
 * File: seat-template.routes.js
 * Mục đích: Định nghĩa các route liên quan đến template sơ đồ ghế
 */

const express = require("express");
const router = express.Router();
const seatTemplateController = require("../controllers/seat-template.controller");

/**
 * @route GET /api/v1/seat-templates
 * @desc Lấy danh sách tất cả template
 * @access Public
 */
router.get("/", seatTemplateController.getAllTemplates);

/**
 * @route GET /api/v1/seat-templates/by-bus-type/:busType
 * @desc Lấy template theo loại xe
 * @access Public
 * QUAN TRỌNG: Route cụ thể này PHẢI đứng TRƯỚC /:templateId
 * để Express không bắt nhầm 'by-bus-type' như một templateId
 */
router.get(
  "/by-bus-type/:busType",
  seatTemplateController.getTemplateByBusType,
);

/**
 * @route GET /api/v1/seat-templates/:templateId
 * @desc Lấy chi tiết template theo ID
 * @access Public
 */
router.get("/:templateId", seatTemplateController.getTemplateById);

module.exports = router;
