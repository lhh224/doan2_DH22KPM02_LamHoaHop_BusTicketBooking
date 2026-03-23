/**
 * File: chat.controller.js
 * Controller xử lý các request chatbot AI
 * Nâng cấp: Hỗ trợ lịch sử hội thoại (chatHistory)
 */

const chatService = require("../services/chat.service");
const {
  successResponse,
  errorResponse,
  serverErrorResponse,
} = require("../utils/response");

/**
 * Gửi câu hỏi đến chatbot (có hỗ trợ lịch sử hội thoại)
 * POST /api/v1/chat/ask
 * Body: { message: string, chatHistory?: [{role: "user"|"assistant", content: string}] }
 */
const askChatbot = async (req, res) => {
  try {
    const { message, chatHistory } = req.body;

    // Validate
    if (!message || message.trim() === "") {
      return errorResponse(res, "Vui lòng nhập câu hỏi", 400);
    }

    // Giới hạn chatHistory tối đa 20 tin nhắn để tránh quá tải
    const limitedHistory = Array.isArray(chatHistory)
      ? chatHistory.slice(-20)
      : [];

    const reply = await chatService.getChatResponse(message, limitedHistory);

    return successResponse(res, { reply }, 200);
  } catch (error) {
    return serverErrorResponse(res, error);
  }
};

module.exports = {
  askChatbot,
};
