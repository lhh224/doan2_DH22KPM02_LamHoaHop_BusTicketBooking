/**
 * File: routes/auth.routes.js
 * Mục đích: Authentication routes
 */

const express = require("express");
const router = express.Router();
const authController = require("../controllers/auth.controller");
const { authenticate } = require("../middleware/auth");

// Public routes
router.post("/register", authController.register);
router.post("/login", authController.login);

// Protected routes (cần đăng nhập)
router.post("/logout", authenticate, authController.logout);
router.get("/me", authenticate, authController.getMe);
router.put("/change-password", authenticate, authController.changePassword);

module.exports = router;
