/**
 * File: ticket.js
 * Mục đích: Hiển thị thông tin vé xe
 */

const API_BASE_URL = "http://localhost:3000/api/v1";

let bookingId = null;
let ticketData = null;

/**
 * Khởi tạo trang
 */
document.addEventListener("DOMContentLoaded", async () => {
  // Lấy bookingId từ URL
  const urlParams = new URLSearchParams(window.location.search);
  bookingId = urlParams.get("bookingId");

  if (!bookingId) {
    // Nếu không có bookingId, thử lấy vé mới nhất của user đang đăng nhập
    const userStr = localStorage.getItem("user");
    if (userStr) {
      try {
        const user = JSON.parse(userStr);
        const userId = user.id;
        const response = await fetch(
          `${API_BASE_URL}/bookings/latest/${userId}`,
        );
        const data = await response.json();

        if (data.success && data.data.booking) {
          bookingId = data.data.booking.BookingId;
          // Cập nhật URL mà không reload trang (optional, but cleaner)
          window.history.replaceState(null, "", `?bookingId=${bookingId}`);
        } else {
          showError("Bạn chưa có vé nào. Vui lòng đặt vé!");
          return;
        }
      } catch (err) {
        showError("Không thể tải thông tin vé. Vui lòng quay lại trang chủ.");
        return;
      }
    } else {
      // Show search UI
      document.getElementById("loadingMessage").style.display = "none";
      document.getElementById("searchTicketSection").style.display = "block";
      setupSearchForm();
      return;
    }
  }

  // Kiểm tra nếu là trang thành công vừa mới đặt
  const isSuccess = urlParams.get("success") === "true";
  const successHeader = document.querySelector(".ticket-success-header");
  if (successHeader) {
    successHeader.style.display = isSuccess ? "block" : "none";
  }

  await loadTicketInfo();
});

/**
 * Load thông tin vé
 */
async function loadTicketInfo() {
  try {
    const response = await fetch(`${API_BASE_URL}/bookings/${bookingId}`);
    const data = await response.json();

    if (!data.success) {
      throw new Error(data.message || "Không thể tải thông tin vé");
    }

    ticketData = data.data.booking;

    // Kiểm tra trạng thái
    if (ticketData.Status !== "PAID") {
      showError(
        "Vé này chưa được thanh toán. Vui lòng hoàn tất thanh toán trước.",
      );
      return;
    }

    displayTicketInfo();
  } catch (error) {
    console.error("Lỗi:", error);
    showError("Không thể tải thông tin vé: " + error.message);
  }
}

/**
 * Hiển thị thông tin vé
 */
function displayTicketInfo() {
  // Mã vé
  document.getElementById("ticketCode").textContent =
    ticketData.TicketCode || "-";

  // Trạng thái
  const statusBadge = document.getElementById("statusBadge");
  if (ticketData.Status === "PAID") {
    statusBadge.textContent = "ĐÃ THANH TOÁN";
    statusBadge.style.background = "var(--success-color)";
    statusBadge.style.color = "#FFFFFF";
  }

  // Thông tin tuyến
  // Fix "Invalid Date" by properly handling time strings (e.g., "07:00")
  const formatTime = (timeStr) => {
    if (!timeStr) return "--:--";
    // If it's already a time string like "HH:mm:ss" or "HH:mm"
    if (typeof timeStr === "string" && timeStr.includes(":")) {
      const parts = timeStr.split(":");
      return `${parts[0].padStart(2, "0")}:${parts[1].padStart(2, "0")}`;
    }
    // If it's a date object
    try {
      const date = new Date(timeStr);
      if (isNaN(date.getTime())) return "--:--";
      return date.toLocaleTimeString("vi-VN", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      });
    } catch (e) {
      return "--:--";
    }
  };

  const departureTimeFormatted = formatTime(ticketData.DepartureTime);
  const arrivalTimeFormatted = formatTime(
    ticketData.ArrivalTime || ticketData.DepartureTime,
  );

  const departureDate = new Date(ticketData.DepartureDate).toLocaleDateString(
    "vi-VN",
    {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    },
  );

  document.getElementById("departureTime").textContent = departureTimeFormatted;
  document.getElementById("arrivalTime").textContent = arrivalTimeFormatted;
  document.getElementById("fromCity").textContent =
    ticketData.FromCity || ticketData.FromStopName;
  document.getElementById("toCity").textContent =
    ticketData.ToCity || ticketData.ToStopName;
  document.getElementById("duration").textContent = ticketData.EstimatedDuration
    ? `~${ticketData.EstimatedDuration}h`
    : "-";
  document.getElementById("departureDate").textContent =
    departureDate !== "Invalid Date" ? departureDate : ticketData.DepartureDate;
  document.getElementById("companyName").textContent =
    ticketData.CompanyName || "-";
  document.getElementById("busType").textContent = ticketData.BusType || "-";

  // Điểm đón trả
  document.getElementById("fromStop").textContent =
    ticketData.FromStopName || "-";
  document.getElementById("toStop").textContent = ticketData.ToStopName || "-";

  // Ghế ngồi
  const seatsDisplay = document.getElementById("seatsDisplay");
  seatsDisplay.innerHTML = "";
  if (ticketData.SeatCodes) {
    const seats = ticketData.SeatCodes.split(", ");
    seats.forEach((seat) => {
      const seatBadge = document.createElement("div");
      seatBadge.className = "seat-badge";
      seatBadge.textContent = seat;
      seatsDisplay.appendChild(seatBadge);
    });
  }

  // Thông tin khách hàng
  document.getElementById("customerName").textContent =
    ticketData.CustomerName || "-";
  document.getElementById("customerPhone").textContent =
    ticketData.CustomerPhone || "-";
  document.getElementById("customerEmail").textContent =
    ticketData.CustomerEmail || "Không có";

  const bookingDate = new Date(ticketData.CreatedAt).toLocaleString("vi-VN");
  document.getElementById("bookingDate").textContent = bookingDate;

  // Tổng tiền
  document.getElementById("totalAmount").textContent =
    ticketData.TotalAmount.toLocaleString("vi-VN") + " VNĐ";

  // Hiển thị mã vạch thay vì QR
  try {
    JsBarcode("#barcode", ticketData.TicketCode, {
      format: "CODE128",
      displayValue: false,
      height: 60,
      width: 2,
      margin: 10,
      background: "#FFFFFF",
      lineColor: "#000000",
    });
    document.getElementById("barcode").style.display = "block";
  } catch (err) {
    console.error("Lỗi tạo mã vạch:", err);
  }

  // Hiển thị vé
  document.getElementById("loadingMessage").style.display = "none";
  document.getElementById("ticketContent").style.display = "block";
}

/**
 * Hiển thị lỗi
 */
function showError(message) {
  const errorDiv = document.getElementById("errorMessage");
  errorDiv.textContent = message;
  errorDiv.style.display = "block";
  document.getElementById("loadingMessage").style.display = "none";
  window.scrollTo(0, 0);
}
/**
 * Cài đặt sự kiện tìm kiếm vé bằng SĐT
 */
function setupSearchForm() {
  const searchBtn = document.getElementById("btnSearchTicket");
  const phoneInput = document.getElementById("searchPhone");
  const searchError = document.getElementById("searchError");

  searchBtn.addEventListener("click", async () => {
    const phone = phoneInput.value.trim();
    if (!phone) {
      searchError.textContent = "Vui lòng nhập số điện thoại.";
      searchError.style.display = "block";
      return;
    }

    try {
      searchError.style.display = "none";
      searchBtn.disabled = true;
      searchBtn.innerHTML =
        '<i class="fas fa-spinner fa-spin"></i> Đang tìm...';

      const response = await fetch(`${API_BASE_URL}/bookings/phone/${phone}`);
      const data = await response.json();

      if (data.success && data.data.booking) {
        bookingId = data.data.booking.BookingId;
        window.history.replaceState(null, "", `?bookingId=${bookingId}`);

        document.getElementById("searchTicketSection").style.display = "none";
        document.getElementById("loadingMessage").style.display = "block";

        await loadTicketInfo();
      } else {
        searchError.textContent =
          data.message || "Không tìm thấy vé thanh toán nào.";
        searchError.style.display = "block";
      }
    } catch (err) {
      searchError.textContent = "Lỗi kết nối khi tra cứu vé.";
      searchError.style.display = "block";
    } finally {
      searchBtn.disabled = false;
      searchBtn.innerHTML = "Tìm Vé Của Tôi";
    }
  });

  // Support pressing Enter
  phoneInput.addEventListener("keypress", (e) => {
    if (e.key === "Enter") {
      searchBtn.click();
    }
  });
}
