/**
 * File: seat.routes.js
 * Định nghĩa các route liên quan đến ghế
 */

const express = require("express");
const router = express.Router();
const seatController = require("../controllers/seat.controller");

// GET /api/v1/seats - Lấy sơ đồ ghế theo chặng
router.get("/", seatController.getSeats);

module.exports = router;
