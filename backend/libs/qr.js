/**
 * File: qr.js
 * Mục đích: Tạo mã QR code từ chuỗi text
 * Sử dụng thư viện qrcode để sinh QR ở dạng base64
 */

const QRCode = require("qrcode");

/**
 * Sinh mã QR từ text và trả về base64 image
 * @param {string} text - Nội dung cần mã hóa thành QR
 * @returns {Promise<string>} - Data URL (base64) của QR code
 */
const generateQRCode = async (text) => {
  try {
    // Sinh QR code dạng data URL (base64)
    const qrDataURL = await QRCode.toDataURL(text, {
      errorCorrectionLevel: "M",
      type: "image/png",
      width: 300,
      margin: 1,
    });

    return qrDataURL;
  } catch (error) {
    console.error("❌ Lỗi sinh QR code:", error);
    throw new Error("Không thể tạo mã QR");
  }
};

/**
 * Sinh mã QR và trả về buffer (dùng để nhúng vào PDF)
 * @param {string} text - Nội dung cần mã hóa thành QR
 * @returns {Promise<Buffer>} - Buffer của QR code image
 */
const generateQRBuffer = async (text) => {
  try {
    const qrBuffer = await QRCode.toBuffer(text, {
      errorCorrectionLevel: "M",
      type: "png",
      width: 300,
      margin: 1,
    });

    return qrBuffer;
  } catch (error) {
    console.error("❌ Lỗi sinh QR buffer:", error);
    throw new Error("Không thể tạo mã QR");
  }
};

module.exports = {
  generateQRCode,
  generateQRBuffer,
};
