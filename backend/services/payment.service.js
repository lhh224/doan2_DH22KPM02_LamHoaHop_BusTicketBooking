/**
 * File: payment.service.js
 * Mục đích: Tạo mã QR thanh toán giả lập
 */

const { generateQRCode } = require("../libs/qr");

/**
 * Tạo mã QR thanh toán cho booking
 * @param {object} paymentData - Thông tin thanh toán
 * @returns {Promise<object>} - QR content và QR image (base64)
 */
const generatePaymentQR = async (paymentData) => {
  try {
    const { bookingId, amount, customerName, ticketCode } = paymentData;

    // Hàm loại bỏ dấu tiếng Việt và khoảng trắng
    const formatName = (str) => {
      return str
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/đ/g, "d")
        .replace(/Đ/g, "D")
        .replace(/\s+/g, "");
    };

    const cleanName = formatName(customerName || "Khach");

    // Tạo nội dung QR (Tên viết liền + Mã vé)
    const qrContent = `${cleanName} ${ticketCode || "VE" + bookingId}`;

    // Sinh mã QR
    const qrImage = await generateQRCode(qrContent);

    return {
      qrContent: qrContent,
      qrImage: qrImage, // Data URL (base64)
      bookingId: bookingId,
      amount: amount,
    };
  } catch (error) {
    console.error("❌ Lỗi tạo QR thanh toán:", error);
    throw error;
  }
};

module.exports = {
  generatePaymentQR,
};
