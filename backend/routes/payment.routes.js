/**
 * File: payment.routes.js
 * Định nghĩa các route liên quan đến thanh toán
 */

const express = require("express");
const router = express.Router();
const paymentController = require("../controllers/payment.controller");

// POST /api/v1/payments/qr - Tạo mã QR thanh toán
router.post("/qr", paymentController.generateQR);

module.exports = router;
