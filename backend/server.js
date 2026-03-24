/**
 * File: server.js
 * Mục đích: Server chính của ứng dụng
 * Khởi động Express server và kết nối các routes
 */

const express = require("express");
const cors = require("cors");
const path = require("path");
const config = require("./config/env");
const { getPool, closePool } = require("./config/db");

// Import routes
const tripRoutes = require("./routes/trip.routes");
const seatRoutes = require("./routes/seat.routes");
const seatTemplateRoutes = require("./routes/seat-template.routes");
const bookingRoutes = require("./routes/booking.routes");
const paymentRoutes = require("./routes/payment.routes");
const chatRoutes = require("./routes/chat.routes");
const trackingRoutes = require("./routes/tracking.routes");
const authRoutes = require("./routes/auth.routes");
const userRoutes = require("./routes/user.routes");
const adminRoutes = require("./routes/admin.routes");

// Khởi tạo Express app
const app = express();

// Middleware
app.use(cors()); // Cho phép CORS từ frontend
app.use(express.json()); // Parse JSON request body
app.use(express.urlencoded({ extended: true })); // Parse URL-encoded request body

// Serve static files từ thư mục frontend
app.use(express.static(path.join(__dirname, "../frontend")));

// Health check endpoint
app.get("/health", (req, res) => {
  res.json({
    success: true,
    message: "Server đang hoạt động",
    timestamp: new Date().toISOString(),
  });
});

// API Routes
app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/users", userRoutes);
app.use("/api/v1/admin", adminRoutes);
app.use("/api/v1/trips", tripRoutes);
app.use("/api/v1/seats", seatRoutes);
app.use("/api/v1/seat-templates", seatTemplateRoutes);
app.use("/api/v1/bookings", bookingRoutes);
app.use("/api/v1/payments", paymentRoutes);
app.use("/api/v1/chat", chatRoutes);
app.use("/api/v1/tracking", trackingRoutes);

// Serve frontend HTML pages (phải đặt sau API routes)
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "../frontend/index.html"));
});

app.get("/seat-map", (req, res) => {
  res.sendFile(path.join(__dirname, "../frontend/seat-map.html"));
});

app.get("/checkout", (req, res) => {
  res.sendFile(path.join(__dirname, "../frontend/checkout.html"));
});

app.get("/ticket", (req, res) => {
  res.sendFile(path.join(__dirname, "../frontend/ticket.html"));
});

app.get("/trip-tracking", (req, res) => {
  res.sendFile(path.join(__dirname, "../frontend/trip-tracking.html"));
});

app.get("/admin", (req, res) => {
  res.sendFile(path.join(__dirname, "../frontend/admin.html"));
});

app.get("/login", (req, res) => {
  res.sendFile(path.join(__dirname, "../frontend/login.html"));
});

app.get("/register", (req, res) => {
  res.sendFile(path.join(__dirname, "../frontend/register.html"));
});

// 404 handler cho API endpoints
app.use("/api", (req, res) => {
  res.status(404).json({
    success: false,
    message: "Không tìm thấy API endpoint này",
  });
});

// 404 handler cho các route khác
app.use((req, res) => {
  res.status(404).sendFile(path.join(__dirname, "../frontend/index.html"));
});

// Error handler
app.use((err, req, res, next) => {
  console.error("Server Error:", err);
  res.status(500).json({
    success: false,
    message: "Lỗi hệ thống",
    error: process.env.NODE_ENV === "development" ? err.message : undefined,
  });
});

// Khởi động server
const startServer = async () => {
  try {
    // Kiểm tra kết nối database
    await getPool();
    console.log("Kết nối database thành công");

    // Lắng nghe port
    const PORT = config.PORT || 3000;
    app.listen(PORT, () => {
      console.log(`Server đang chạy tại http://localhost:${PORT}`);
      console.log(`Frontend: http://localhost:${PORT}`);
      console.log(`Thời gian khởi động: ${new Date().toLocaleString("vi-VN")}`);
    });
  } catch (error) {
    console.error("Lỗi khởi động server:", error);
    process.exit(1);
  }
};

// Xử lý shutdown gracefully
process.on("SIGINT", async () => {
  console.log("\nĐang tắt server...");
  await closePool();
  process.exit(0);
});

process.on("SIGTERM", async () => {
  console.log("\nĐang tắt server...");
  await closePool();
  process.exit(0);
});

// Khởi động
startServer();
