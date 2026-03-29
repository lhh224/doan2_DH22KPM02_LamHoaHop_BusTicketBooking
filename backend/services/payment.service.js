/**
 * File: payment.service.js
 * Mục đích: Tạo mã QR thanh toán giả lập
 */

const { generateQRCode } = require("../libs/qr");

const createTransactionId = () => {
  const timestamp = Date.now().toString().slice(-8);
  const randomPart = Math.floor(100000 + Math.random() * 900000);
  return `TXN${timestamp}${randomPart}`;
};

/**
 * Tạo mã QR thanh toán cho booking
 * @param {object} paymentData - Thông tin thanh toán
 * @returns {Promise<object>} - QR content và QR image (base64)
 */
const generatePaymentQR = async (paymentData) => {
  try {
    const { bookingId, amount, customerName, ticketCode } = paymentData;
    const transactionId = createTransactionId();

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

    // Tạo nội dung QR có kèm mã giao dịch để đối soát demo
    const qrContent = `${cleanName} ${ticketCode || "VE" + bookingId} ${transactionId}`;

    // Sinh mã QR
    const qrImage = await generateQRCode(qrContent);

    return {
      qrContent: qrContent,
      qrImage: qrImage, // Data URL (base64)
      transactionId: transactionId,
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
