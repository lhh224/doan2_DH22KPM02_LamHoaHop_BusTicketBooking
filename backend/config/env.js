/**
 * File: env.js
 * Mục đích: Quản lý biến môi trường từ file .env
 * Đọc và xuất các biến cấu hình để sử dụng trong toàn bộ ứng dụng
 */

require("dotenv").config();

module.exports = {
  // Cấu hình server
  PORT: process.env.PORT || 3000,

  // Cấu hình SQL Server
  SQL_SERVER: process.env.SQL_SERVER || "localhost",
  SQL_DATABASE: process.env.SQL_DATABASE || "BusBookingDemo",
  SQL_USER: process.env.SQL_USER || "sa",
  SQL_PASSWORD: process.env.SQL_PASSWORD || "",
  SQL_ENCRYPT: process.env.SQL_ENCRYPT === "true",
  SQL_TRUST_SERVER_CERTIFICATE:
    process.env.SQL_TRUST_SERVER_CERTIFICATE === "true",

  // Cấu hình Gemini AI (Chatbot)
  GEMINI_API_KEY: process.env.GEMINI_API_KEY || "",
  GEMINI_MODEL: process.env.GEMINI_MODEL || "gemini-1.5-flash",
};
