/**
 * File: checkout.js
 * Xử lý thanh toán QR và xác nhận booking
 */

const API_BASE_URL = "http://localhost:3000/api/v1";

let bookingId = null;
let bookingData = null;
let transactionId = null;

document.addEventListener("DOMContentLoaded", async () => {
  // Lấy bookingId từ URL
  const urlParams = new URLSearchParams(window.location.search);
  bookingId = urlParams.get("bookingId");

  if (!bookingId) {
    showError("Không tìm thấy thông tin đặt vé. Vui lòng quay lại trang chủ.");
    return;
  }

  await loadBookingInfo();
  await generateQRCode();
  startCountdown(10 * 60); // 10 minutes
});

/**
 * Đếm ngược thời gian thanh toán
 */
function startCountdown(duration) {
  let timer = duration;
  const countdownElement = document.getElementById("countdown");

  const interval = setInterval(() => {
    const minutes = Math.floor(timer / 60);
    const seconds = timer % 60;

    countdownElement.textContent = `${minutes < 10 ? "0" + minutes : minutes}:${seconds < 10 ? "0" + seconds : seconds}`;

    if (--timer < 0) {
      clearInterval(interval);
      showError("Thời gian giữ chỗ đã hết. Vui lòng thực hiện đặt vé lại.");
      document.getElementById("btnConfirmPayment").disabled = true;
    }
  }, 1000);
}

/**
 * Sao chép nội dung chuyển khoản
 */
function copyContent() {
  const content = document.getElementById("qrContent").textContent;
  navigator.clipboard.writeText(content).then(() => {
    const btnCopy = document.querySelector(".btn-copy");
    const originalIcon = btnCopy.innerHTML;
    btnCopy.innerHTML = '<i class="fas fa-check"></i>';
    btnCopy.style.background = "var(--success-color)";
    btnCopy.style.color = "white";

    setTimeout(() => {
      btnCopy.innerHTML = originalIcon;
      btnCopy.style.background = "";
      btnCopy.style.color = "";
    }, 2000);
  });
}

/**
 * Load thông tin booking
 */
async function loadBookingInfo() {
  try {
    const response = await fetch(`${API_BASE_URL}/bookings/${bookingId}`);
    const data = await response.json();

    if (!data.success) {
      throw new Error(data.message || "Không thể tải thông tin đặt vé");
    }

    bookingData = data.data.booking;
    displayBookingInfo();
  } catch (error) {
    console.error("Lỗi:", error);
    showError("Không thể tải thông tin đặt vé: " + error.message);
  }
}

/**
 * Hiển thị thông tin booking
 */
function displayBookingInfo() {
  document.getElementById("routeName").textContent =
    bookingData.RouteName || "-";
  document.getElementById("companyName").textContent =
    bookingData.CompanyName || "-";
  document.getElementById("busType").textContent = bookingData.BusType || "-";

  // Handle DepartureTime string (likely "HH:mm" or "HH:mm:ss")
  let departureTime = bookingData.DepartureTime || "-";
  if (departureTime.length > 5) {
    departureTime = departureTime.substring(0, 5);
  }
  const departureDate = new Date(bookingData.DepartureDate).toLocaleDateString(
    "vi-VN",
  );
  document.getElementById("departureInfo").textContent =
    `${departureTime} - ${departureDate}`;

  document.getElementById("fromStop").textContent =
    bookingData.FromStopName || "-";
  document.getElementById("toStop").textContent = bookingData.ToStopName || "-";
  document.getElementById("seatCodes").textContent =
    bookingData.SeatCodes || "-";
  document.getElementById("customerName").textContent =
    bookingData.CustomerName || "-";
  document.getElementById("customerPhone").textContent =
    bookingData.CustomerPhone || "-";
  document.getElementById("totalAmount").textContent =
    bookingData.TotalAmount.toLocaleString("vi-VN") + " VNĐ";

  document.getElementById("loadingMessage").style.display = "none";
  document.getElementById("checkoutContent").style.display = "grid";
  document.getElementById("checkoutActions").style.display = "flex";
}

/**
 * Tạo mã QR thanh toán
 */
async function generateQRCode() {
  try {
    const response = await fetch(`${API_BASE_URL}/payments/qr`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        bookingId: bookingId,
        amount: bookingData.TotalAmount,
        customerName: bookingData.CustomerName,
      }),
    });

    const data = await response.json();

    if (!data.success) {
      throw new Error(data.message || "Không thể tạo mã QR");
    }

    // Hiển thị QR code
    const qrImage = document.getElementById("qrImage");
    qrImage.src = data.data.qrImage;
    qrImage.style.display = "block";

    // Hiển thị nội dung QR
    document.getElementById("qrContent").textContent = data.data.qrContent;
    transactionId = data.data.transactionId || null;
    document.getElementById("qrInfo").style.display = "block";

    // Ẩn loading
    document.getElementById("qrLoading").style.display = "none";
  } catch (error) {
    console.error("Lỗi tạo QR:", error);
    document.getElementById("qrLoading").textContent = "Không thể tạo mã QR";
  }
}

/**
 * Xác nhận thanh toán
 */
async function confirmPayment() {
  const btnConfirm = document.getElementById("btnConfirmPayment");

  btnConfirm.disabled = true;
  btnConfirm.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Đang xử lý...';

  try {
    if (!transactionId) {
      throw new Error(
        "Không tìm thấy mã giao dịch từ QR. Vui lòng tải lại mã QR.",
      );
    }

    const response = await fetch(`${API_BASE_URL}/bookings/confirm`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        bookingId: bookingId,
        paymentMethod: "QR",
        transactionId: transactionId,
      }),
    });

    const data = await response.json();

    if (!data.success) {
      throw new Error(data.message || "Không thể xác nhận thanh toán");
    }

    // Hiển thị thông báo thành công
    showSuccess("Xác nhận thanh toán thành công! Đang chuyển sang trang vé...");

    // Chuyển sang trang vé sau 2 giây
    setTimeout(() => {
      window.location.href = `/pages/ticket.html?bookingId=${bookingId}&success=true`;
    }, 2000);
  } catch (error) {
    console.error("Lỗi xác nhận thanh toán:", error);
    showError("Không thể xác nhận thanh toán: " + error.message);
    btnConfirm.disabled = false;
    btnConfirm.innerHTML =
      '<i class="fas fa-check-circle"></i> Xác Nhận Đã Thanh Toán';
  }
}

/**
 * Hủy booking
 */
async function cancelBooking() {
  if (!confirm("Bạn có chắc chắn muốn hủy đặt vé này?")) {
    return;
  }

  const btnCancel = document.getElementById("btnCancel");
  btnCancel.disabled = true;
  btnCancel.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Đang hủy...';

  try {
    const response = await fetch(`${API_BASE_URL}/bookings/${bookingId}`, {
      method: "DELETE",
    });

    const data = await response.json();

    if (!data.success) {
      throw new Error(data.message || "Không thể hủy đặt vé");
    }

    showToast("✅ Đã hủy đặt vé thành công!", "success");
    setTimeout(() => {
      window.location.href = "/pages/index.html";
    }, 1500);
  } catch (error) {
    console.error("Lỗi hủy booking:", error);
    showToast("Không thể hủy đặt vé: " + error.message, "error");
    btnCancel.disabled = false;
    btnCancel.innerHTML = '<i class="fas fa-times-circle"></i> Hủy Đặt Vé';
  }
}

/**
 * Hiển thị thông báo Toast
 */
function showToast(message, type = "success") {
  const toast = document.createElement("div");
  toast.style.position = "fixed";
  toast.style.top = "20px";
  toast.style.right = "20px";
  toast.style.padding = "15px 25px";
  toast.style.background = type === "success" ? "#10b981" : "#ef4444";
  toast.style.color = "white";
  toast.style.borderRadius = "8px";
  toast.style.boxShadow = "0 4px 12px rgba(0,0,0,0.15)";
  toast.style.zIndex = "9999";
  toast.style.fontSize = "15px";
  toast.style.fontWeight = "500";
  toast.style.transform = "translateX(100%)";
  toast.style.transition = "transform 0.3s ease-out";
  toast.textContent = message;

  document.body.appendChild(toast);

  requestAnimationFrame(() => {
    toast.style.transform = "translateX(0)";
  });

  setTimeout(() => {
    toast.style.transform = "translateX(100%)";
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

/**
 * Hiển thị lỗi
 */
function showError(message) {
  showToast(message, "error");
}

/**
 * Hiển thị thành công
 */
function showSuccess(message) {
  showToast(message, "success");
}

