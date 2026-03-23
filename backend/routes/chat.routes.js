/**
 * File: chat.routes.js
 * Định nghĩa các route liên quan đến chatbot AI
 */

const express = require("express");
const router = express.Router();
const chatController = require("../controllers/chat.controller");

// POST /api/v1/chat/ask - Gửi câu hỏi đến chatbot
router.post("/ask", chatController.askChatbot);

module.exports = router;
