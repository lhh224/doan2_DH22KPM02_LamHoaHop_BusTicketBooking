/**
 * File: tracking.js
 * Mục đích: Xử lý bản đồ Leaflet + OSRM Routing API, hiển thị tuyến đường thực tế
 * và theo dõi hành trình xe khách. AI Chatbox chi tiết với lịch sử hội thoại.
 * API sử dụng:
 *   - OSRM (Open Source Routing Machine) - miễn phí, không cần API key
 *   - Google Gemini AI (chatbot) - qua backend
 */

// ===== CONSTANTS =====
const API_BASE_URL = "http://localhost:3000/api/v1";

// OSRM API (miễn phí, không cần key) - dùng cho routing thực tế trên bản đồ
const OSRM_API_URL = "https://router.project-osrm.org/route/v1/driving";

// Tọa độ thành phố VN - CÓ CẢ tên có dấu, không dấu, và tên bến xe thực tế
const CITY_COORDINATES = {
  // ========== BẾN XE THỰC TẾ ==========
  // TP.HCM
  "Bến xe Miền Đông": [10.8148, 106.711],
  "Ben xe Mien Dong": [10.8148, 106.711],
  "Bến xe Miền Đông mới": [10.8797, 106.8249],
  "Ben xe Mien Dong moi": [10.8797, 106.8249],
  "Bến xe Miền Tây": [10.738, 106.6198],
  "Ben xe Mien Tay": [10.738, 106.6198],
  "Bến xe An Sương": [10.8585, 106.6058],
  "Ben xe An Suong": [10.8585, 106.6058],
  // Nha Trang
  "Bến xe Nha Trang": [12.2628, 109.178],
  "Ben xe Nha Trang": [12.2628, 109.178],
  // Đà Lạt
  "Bến xe Đà Lạt": [11.935, 108.4414],
  "Ben xe Da Lat": [11.935, 108.4414],
  // Vũng Tàu
  "Bến xe Vũng Tàu": [10.3469, 107.0872],
  "Ben xe Vung Tau": [10.3469, 107.0872],
  // Cần Thơ
  "Bến xe Cần Thơ": [10.038, 105.7483],
  "Ben xe Can Tho": [10.038, 105.7483],
  "Bến xe 91B Cần Thơ": [10.038, 105.7483],
  // Phan Thiết
  "Bến xe Phan Thiết": [10.9329, 108.0988],
  "Ben xe Phan Thiet": [10.9329, 108.0988],
  // Đà Nẵng
  "Bến xe Đà Nẵng": [16.0599, 108.2122],
  "Ben xe Da Nang": [16.0599, 108.2122],
  // Huế
  "Bến xe phía Bắc Huế": [16.4754, 107.5786],
  // Hà Nội
  "Bến xe Mỹ Đình": [21.028, 105.7826],
  "Ben xe My Dinh": [21.028, 105.7826],
  "Bến xe Giáp Bát": [20.981, 105.8415],
  "Ben xe Giap Bat": [20.981, 105.8415],
  "Bến xe Nước Ngầm": [20.968, 105.839],
  "Ben xe Nuoc Ngam": [20.968, 105.839],
  // Trạm dừng quan trọng
  "Trạm dừng Bảo Lộc": [11.5477, 107.807],
  "Tram dung Bao Loc": [11.5477, 107.807],
  "Trạm dừng Long Thành": [10.7907, 106.8524],
  "Tram dung Long Thanh": [10.7907, 106.8524],
  "Trạm dừng Phan Rang": [11.5758, 108.9881],
  "Tram dung Phan Rang": [11.5758, 108.9881],
  "Trạm dừng Mỹ Tho": [10.36, 106.355],
  "Tram dung My Tho": [10.36, 106.355],
  "Trạm dừng Hàm Tân": [10.6971, 107.7494],
  "Tram dung Ham Tan": [10.6971, 107.7494],
  "Trạm dừng Ninh Hoà": [12.4747, 109.1176],
  "Tram dung Ninh Hoa": [12.4747, 109.1176],
  "Trạm dừng Cam Ranh": [11.9214, 109.1591],
  "Tram dung Cam Ranh": [11.9214, 109.1591],

  // ========== THÀNH PHỐ - CÓ DẤU ==========
  "TP.HCM": [10.7769, 106.7009],
  "Hồ Chí Minh": [10.7769, 106.7009],
  "TP. Hồ Chí Minh": [10.7769, 106.7009],
  "Vũng Tàu": [10.346, 107.0843],
  "Bà Rịa - Vũng Tàu": [10.346, 107.0843],
  "Cần Thơ": [10.0452, 105.7469],
  "Bình Dương": [11.0254, 106.6534],
  "Đồng Nai": [10.9454, 106.8243],
  "Long An": [10.5362, 106.4113],
  "Tiền Giang": [10.3494, 106.3415],
  "Bến Tre": [10.2434, 106.3756],
  "An Giang": [10.3889, 105.4352],
  "Kiên Giang": [10.0125, 105.0809],
  "Phú Quốc": [10.2268, 103.9689],
  "Cà Mau": [9.1528, 105.1961],
  "Đà Lạt": [11.9404, 108.4583],
  "Lâm Đồng": [11.9404, 108.4583],
  "Buôn Ma Thuột": [12.6814, 108.0378],
  "Đắk Lắk": [12.6814, 108.0378],
  "Gia Lai": [13.9832, 108.0026],
  Pleiku: [13.9833, 108.0025],
  "Kon Tum": [14.3546, 108.0075],
  "Nha Trang": [12.2388, 109.1967],
  "Khánh Hòa": [12.2388, 109.1967],
  "Phan Thiết": [10.9289, 108.1002],
  "Bình Thuận": [10.9289, 108.1002],
  "Phan Rang": [11.5758, 108.9881],
  "Ninh Thuận": [11.5758, 108.9881],
  "Quy Nhon": [13.776, 109.2237],
  "Quy Nhơn": [13.776, 109.2237],
  "Bình Định": [13.776, 109.2237],
  "Đà Nẵng": [16.0471, 108.2068],
  Huế: [16.4637, 107.5909],
  "Thừa Thiên Huế": [16.4637, 107.5909],
  "Quảng Nam": [15.5394, 108.019],
  "Hội An": [15.8801, 108.338],
  "Quảng Ngãi": [15.1215, 108.8044],
  "Quảng Bình": [17.4656, 106.6225],
  Vinh: [18.6733, 105.6922],
  "Nghệ An": [18.6733, 105.6922],
  "Thanh Hóa": [19.8064, 105.7852],
  "Hà Tĩnh": [18.3427, 105.9057],
  "Hà Nội": [21.0285, 105.8542],
  "Hải Phòng": [20.8449, 106.6881],
  "Quảng Ninh": [21.0064, 107.2925],
  "Hạ Long": [20.9515, 107.0805],
  "Ninh Bình": [20.2506, 105.9745],
  "Nam Định": [20.4389, 106.1621],
  "Lào Cai": [22.3381, 104.1476],
  "Sa Pa": [22.3363, 103.8438],
  "Sơn La": [21.328, 103.9141],
  "Điện Biên": [21.3867, 103.0168],
  "Lạng Sơn": [21.853, 106.761],
  "Thái Nguyên": [21.592, 105.8442],
  "Bắc Ninh": [21.186, 106.076],
  "Bắc Giang": [21.2731, 106.1946],
  "Hòa Bình": [20.8178, 105.3383],
  "Vĩnh Phúc": [21.3089, 105.6047],
  "Mỹ Tho": [10.36, 106.355],
  "Bảo Lộc": [11.5477, 107.807],
  "Cam Ranh": [11.9214, 109.1591],
  "Ninh Hoà": [12.4747, 109.1176],

  // ========== THÀNH PHỐ - KHÔNG DẤU (dữ liệu từ DB) ==========
  "TP. Ho Chi Minh": [10.7769, 106.7009],
  "Ho Chi Minh": [10.7769, 106.7009],
  "Vung Tau": [10.346, 107.0843],
  "Can Tho": [10.0452, 105.7469],
  "Binh Duong": [11.0254, 106.6534],
  "Dong Nai": [10.9454, 106.8243],
  "Long Thanh": [10.7907, 106.8524],
  "Da Lat": [11.9404, 108.4583],
  "Lam Dong": [11.9404, 108.4583],
  "Bao Loc": [11.5477, 107.807],
  "Buon Ma Thuot": [12.6814, 108.0378],
  "Dak Lak": [12.6814, 108.0378],
  "Gia Lai": [13.9832, 108.0026],
  Pleiku: [13.9833, 108.0025],
  "Kon Tum": [14.3546, 108.0075],
  "Nha Trang": [12.2388, 109.1967],
  "Khanh Hoa": [12.2388, 109.1967],
  "Phan Thiet": [10.9289, 108.1002],
  "Binh Thuan": [10.9289, 108.1002],
  "Phan Rang": [11.5758, 108.9881],
  "Ninh Thuan": [11.5758, 108.9881],
  "Quy Nhon": [13.776, 109.2237],
  "Binh Dinh": [13.776, 109.2237],
  "Da Nang": [16.0471, 108.2068],
  Hue: [16.4637, 107.5909],
  "Quang Nam": [15.5394, 108.019],
  "Hoi An": [15.8801, 108.338],
  "Quang Ngai": [15.1215, 108.8044],
  "Quang Binh": [17.4656, 106.6225],
  Vinh: [18.6733, 105.6922],
  "Nghe An": [18.6733, 105.6922],
  "Thanh Hoa": [19.8064, 105.7852],
  "Ha Tinh": [18.3427, 105.9057],
  "Ha Noi": [21.0285, 105.8542],
  "Hai Phong": [20.8449, 106.6881],
  "Quang Ninh": [21.0064, 107.2925],
  "Ha Long": [20.9515, 107.0805],
  "Ninh Binh": [20.2506, 105.9745],
  "Nam Dinh": [20.4389, 106.1621],
  "Lao Cai": [22.3381, 104.1476],
  "Sa Pa": [22.3363, 103.8438],
  "Son La": [21.328, 103.9141],
  "Dien Bien": [21.3867, 103.0168],
  "Lang Son": [21.853, 106.761],
  "Thai Nguyen": [21.592, 105.8442],
  "Bac Ninh": [21.186, 106.076],
  "Bac Giang": [21.2731, 106.1946],
  "Hoa Binh": [20.8178, 105.3383],
  "Vinh Phuc": [21.3089, 105.6047],
  "My Tho": [10.36, 106.355],
  "Ham Tan": [10.6971, 107.7494],
  "Cam Ranh": [11.9214, 109.1591],
  "Ninh Hoa": [12.4747, 109.1176],
};

// ===== DỮ LIỆU DEMO CHUYẾN XE THỰC TẾ =====
// Khi API không trả về dữ liệu, dùng data mẫu với tên bến xe thực tế
const DEMO_TRIPS = [
  {
    TripId: 1001,
    FromCity: "TP. Ho Chi Minh",
    ToCity: "Nha Trang",
    CompanyName: "Phương Trang (FUTA)",
    BusType: "Giường nằm 40 chỗ",
    DepartureTime: "21:00",
    ArrivalTime: "05:00",
    Distance: 435,
    EstimatedDuration: 480,
    BasePrice: 280000,
    _demoStops: [
      {
        StopName: "Bến xe Miền Đông TPHCM",
        StopOrder: 1,
        DistanceFromStart: 0,
      },
      { StopName: "Trạm dừng Long Thành", StopOrder: 2, DistanceFromStart: 60 },
      { StopName: "Trạm dừng Phan Rang", StopOrder: 3, DistanceFromStart: 320 },
      { StopName: "Trạm dừng Ninh Hoà", StopOrder: 4, DistanceFromStart: 390 },
      { StopName: "Bến xe Nha Trang", StopOrder: 5, DistanceFromStart: 435 },
    ],
  },
  {
    TripId: 1002,
    FromCity: "TP. Ho Chi Minh",
    ToCity: "Da Lat",
    CompanyName: "Thành Bưởi",
    BusType: "Limousine 34 chỗ",
    DepartureTime: "22:30",
    ArrivalTime: "05:30",
    Distance: 310,
    EstimatedDuration: 420,
    BasePrice: 350000,
    _demoStops: [
      {
        StopName: "Bến xe Miền Đông TPHCM",
        StopOrder: 1,
        DistanceFromStart: 0,
      },
      { StopName: "Trạm dừng Bảo Lộc", StopOrder: 2, DistanceFromStart: 190 },
      { StopName: "Bến xe Đà Lạt", StopOrder: 3, DistanceFromStart: 310 },
    ],
  },
  {
    TripId: 1003,
    FromCity: "TP. Ho Chi Minh",
    ToCity: "Vung Tau",
    CompanyName: "Mai Linh Express",
    BusType: "VIP Cabin 22 chỗ",
    DepartureTime: "08:00",
    ArrivalTime: "10:30",
    Distance: 125,
    EstimatedDuration: 150,
    BasePrice: 160000,
    _demoStops: [
      {
        StopName: "Bến xe Miền Đông TPHCM",
        StopOrder: 1,
        DistanceFromStart: 0,
      },
      { StopName: "Trạm dừng Long Thành", StopOrder: 2, DistanceFromStart: 60 },
      { StopName: "Bến xe Vũng Tàu", StopOrder: 3, DistanceFromStart: 125 },
    ],
  },
  {
    TripId: 1004,
    FromCity: "TP. Ho Chi Minh",
    ToCity: "Can Tho",
    CompanyName: "Phương Trang (FUTA)",
    BusType: "Giường nằm 40 chỗ",
    DepartureTime: "06:30",
    ArrivalTime: "10:00",
    Distance: 170,
    EstimatedDuration: 210,
    BasePrice: 180000,
    _demoStops: [
      { StopName: "Bến xe Miền Tây TPHCM", StopOrder: 1, DistanceFromStart: 0 },
      { StopName: "Trạm dừng Mỹ Tho", StopOrder: 2, DistanceFromStart: 70 },
      { StopName: "Bến xe Cần Thơ", StopOrder: 3, DistanceFromStart: 170 },
    ],
  },
  {
    TripId: 1005,
    FromCity: "TP. Ho Chi Minh",
    ToCity: "Phan Thiet",
    CompanyName: "Limousine Sài Gòn",
    BusType: "Limousine 34 chỗ",
    DepartureTime: "07:30",
    ArrivalTime: "11:30",
    Distance: 200,
    EstimatedDuration: 240,
    BasePrice: 200000,
    _demoStops: [
      {
        StopName: "Bến xe Miền Đông TPHCM",
        StopOrder: 1,
        DistanceFromStart: 0,
      },
      { StopName: "Trạm dừng Hàm Tân", StopOrder: 2, DistanceFromStart: 110 },
      { StopName: "Bến xe Phan Thiết", StopOrder: 3, DistanceFromStart: 200 },
    ],
  },
  {
    TripId: 1006,
    FromCity: "TP. Ho Chi Minh",
    ToCity: "Nha Trang",
    CompanyName: "Thành Bưởi",
    BusType: "Ghế ngồi 45 chỗ",
    DepartureTime: "07:00",
    ArrivalTime: "15:00",
    Distance: 435,
    EstimatedDuration: 480,
    BasePrice: 230000,
    _demoStops: [
      {
        StopName: "Bến xe Miền Đông TPHCM",
        StopOrder: 1,
        DistanceFromStart: 0,
      },
      { StopName: "Trạm dừng Phan Rang", StopOrder: 2, DistanceFromStart: 320 },
      { StopName: "Bến xe Nha Trang", StopOrder: 3, DistanceFromStart: 435 },
    ],
  },
];

// ===== DOM ELEMENTS =====
const trackingSearchForm = document.getElementById("trackingSearchForm");
const trackingCode = document.getElementById("trackingCode");
const activeTripsGrid = document.getElementById("activeTripsGrid");
const trackingSection = document.getElementById("trackingSection");

// Chatbot elements
const chatbotBtn = document.getElementById("chatbotToggle");
const chatbotWidget = document.getElementById("chatbotWidget");
const chatbotClose = document.getElementById("chatbotClose");
const chatMessages = document.getElementById("chatMessages");
const chatForm = document.getElementById("chatForm");
const chatInput = document.getElementById("chatInput");
const chatQuickActions = document.getElementById("chatQuickActions");

// Map elements
let map = null;
let busMarker = null;
let routePolyline = null;
let stopMarkers = [];
let busAnimationInterval = null;
let currentTripData = null;
let currentProgress = 0; // 0 → 1

// ===== INITIALIZATION =====
document.addEventListener("DOMContentLoaded", () => {
  initEventListeners();
  loadActiveTrips();
  console.log("✅ Hệ thống theo dõi hành trình đã khởi tạo");
});

/**
 * Khởi tạo các event listeners
 */
function initEventListeners() {
  // Search form
  if (trackingSearchForm) {
    trackingSearchForm.addEventListener("submit", handleTrackingSearch);
  }

  // Chatbot
  if (chatbotBtn) chatbotBtn.addEventListener("click", toggleChatbot);
  if (chatbotClose) chatbotClose.addEventListener("click", toggleChatbot);
  if (chatForm) chatForm.addEventListener("submit", handleChatSubmit);

  // Textarea auto-resize và Enter key handling
  if (chatInput) {
    chatInput.addEventListener("input", () => {
      chatInput.style.height = "auto";
      chatInput.style.height = Math.min(chatInput.scrollHeight, 100) + "px";
    });
    chatInput.addEventListener("keydown", (e) => {
      // Enter gửi tin nhắn, Shift+Enter xuống dòng
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        handleChatSubmit(new Event("submit"));
      }
    });
  }

  // Quick action buttons
  if (chatQuickActions) {
    chatQuickActions.addEventListener("click", (e) => {
      const btn = e.target.closest(".quick-action-btn");
      if (btn) {
        const msg = btn.dataset.msg;
        if (chatInput) chatInput.value = msg;
        handleChatSubmit(new Event("submit"));
      }
    });
  }

  // Map controls
  document
    .getElementById("btnCenterBus")
    ?.addEventListener("click", centerOnBus);
  document
    .getElementById("btnFitRoute")
    ?.addEventListener("click", fitRouteView);
}

/**
 * Xóa toàn bộ lịch sử chat
 */
function clearChatHistory() {
  chatHistory = [];
  if (chatMessages) chatMessages.innerHTML = "";
  addChatMessage("bot", getWelcomeMessage());
}

/**
 * Tải danh sách chuyến xe đang hoạt động từ API
 */
async function loadActiveTrips() {
  try {
    // Lấy ngày hôm nay
    const today = new Date().toISOString().split("T")[0];

    // Gọi API lấy tất cả chuyến xe
    const response = await fetch(`${API_BASE_URL}/trips/active`);

    let trips = [];

    if (response.ok) {
      const data = await response.json();
      if (data.success && data.data) {
        trips = data.data;
      }
    }

    // Nếu API không có, lấy từ search với ngày hôm nay
    if (trips.length === 0) {
      const searchResponse = await fetch(
        `${API_BASE_URL}/trips/search?date=${today}`,
      );
      if (searchResponse.ok) {
        const data = await searchResponse.json();
        if (data.success && data.data && data.data.trips) {
          trips = data.data.trips.slice(0, 8); // Lấy tối đa 8 chuyến
        }
      }
    }

    // Nếu vẫn không có dữ liệu, dùng demo trips thực tế
    if (trips.length === 0) {
      console.log("📌 Dùng dữ liệu demo chuyến xe thực tế");
      trips = DEMO_TRIPS;
    }

    renderActiveTrips(trips);
  } catch (error) {
    console.error("❌ Lỗi tải chuyến xe:", error);
    // Fallback: hiển thị demo trips
    renderActiveTrips(DEMO_TRIPS);
  }
}

/**
 * Render danh sách chuyến xe đang hoạt động
 */
function renderActiveTrips(trips) {
  if (!activeTripsGrid) return;

  if (trips.length === 0) {
    activeTripsGrid.innerHTML = `
      <div class="loading-spinner">
        <i class="fas fa-info-circle"></i>
        <span>Hiện chưa có chuyến xe nào đang hoạt động. Hãy thử tìm kiếm chuyến xe cụ thể.</span>
      </div>
    `;
    return;
  }

  activeTripsGrid.innerHTML = trips
    .map((trip, index) => {
      // Giả lập tiến trình cho demo (mỗi chuyến khác nhau)
      const progress = Math.floor(Math.random() * 80) + 10;

      // Lấy tên bến xe đầu/cuối nếu có (từ _demoStops hoặc tên thành phố)
      const demoStops = trip._demoStops || [];
      const fromStation = demoStops.length > 0 ? demoStops[0].StopName : null;
      const toStation =
        demoStops.length > 0 ? demoStops[demoStops.length - 1].StopName : null;
      const fromDisplay = fromStation || trip.FromCity || trip.DiemDi || "N/A";
      const toDisplay = toStation || trip.ToCity || trip.DiemDen || "N/A";

      return `
      <div class="active-trip-card" onclick="trackTrip(${trip.TripId || trip.MaChuyenXe})">
        <div class="trip-card-header">
          <span class="trip-company">
            <i class="fas fa-building"></i> ${trip.CompanyName || trip.TenNhaXe || "Nhà xe"}
          </span>
          <span class="live-badge">
            <i class="fas fa-circle"></i> LIVE
          </span>
        </div>
        <div class="trip-route">
          <span class="trip-city">${fromDisplay}</span>
          <span class="trip-arrow"><i class="fas fa-long-arrow-alt-right"></i></span>
          <span class="trip-city">${toDisplay}</span>
        </div>
        <div class="trip-meta">
          <span><i class="fas fa-clock"></i> ${formatTime(trip.DepartureTime || trip.GioKhoiHanh)}</span>
          <span><i class="fas fa-bus"></i> ${trip.BusType || trip.TenLoaiXe || "Xe khách"}</span>
          <span><i class="fas fa-road"></i> ${trip.Distance || trip.KhoangCach || "N/A"} km</span>
        </div>
        <div class="trip-progress">
          <div class="trip-progress-bar" style="width: ${progress}%"></div>
        </div>
      </div>
    `;
    })
    .join("");
}

/**
 * Định dạng giờ
 */
function formatTime(time) {
  if (!time) return "--:--";
  if (typeof time === "string") {
    // Parse "HH:mm:ss" or "HH:mm"
    const parts = time.split(":");
    return `${parts[0]}:${parts[1]}`;
  }
  return "--:--";
}

/**
 * Xử lý tìm kiếm theo dõi
 */
async function handleTrackingSearch(e) {
  e.preventDefault();
  const code = trackingCode?.value.trim();

  if (!code) {
    showNotification("Vui lòng nhập mã đặt vé hoặc mã chuyến xe", "warning");
    return;
  }

  // Thử tìm booking trước
  try {
    const response = await fetch(`${API_BASE_URL}/tracking/trip/${code}`);
    if (response.ok) {
      const data = await response.json();
      if (data.success && data.data) {
        trackTrip(data.data.TripId);
        return;
      }
    }
  } catch (err) {
    // Fallback: thử tìm bằng Trip ID
  }

  // Thử dạng số trực tiếp
  const tripId = parseInt(code.replace(/\D/g, ""));
  if (tripId) {
    trackTrip(tripId);
  } else {
    showNotification("Không tìm thấy chuyến xe với mã này", "error");
  }
}

/**
 * Bắt đầu theo dõi một chuyến xe cụ thể
 */
async function trackTrip(tripId) {
  try {
    // Hiển thị section tracking
    if (trackingSection) trackingSection.style.display = "block";

    // Cuộn xuống bản đồ
    trackingSection.scrollIntoView({ behavior: "smooth" });

    // Gọi API lấy thông tin chuyến xe
    const [tripResponse, stopsResponse] = await Promise.all([
      fetch(`${API_BASE_URL}/trips/${tripId}`),
      fetch(`${API_BASE_URL}/tracking/trip/${tripId}/stops`).catch(() =>
        fetch(`${API_BASE_URL}/trips/${tripId}/stops`),
      ),
    ]);

    let tripData = null;
    let stopsData = [];

    if (tripResponse.ok) {
      const data = await tripResponse.json();
      if (data.success && data.data) {
        tripData = data.data;
      }
    }

    if (stopsResponse && stopsResponse.ok) {
      const data = await stopsResponse.json();
      if (data.success && data.data) {
        stopsData = data.data;
      }
    }

    // Nếu không tìm thấy qua API, thử tìm trong demo trips
    if (!tripData) {
      const demoTrip = DEMO_TRIPS.find((t) => t.TripId === tripId);
      if (demoTrip) {
        tripData = demoTrip;
        stopsData = demoTrip._demoStops || [];
        console.log(`📌 Dùng demo data cho chuyến #${tripId}`);
      } else {
        showNotification("Không tìm thấy thông tin chuyến xe", "error");
        return;
      }
    }

    // Lưu dữ liệu
    currentTripData = { trip: tripData, stops: stopsData };

    // Cập nhật giao diện
    updateTripInfoPanel(tripData, stopsData);

    // Khởi tạo bản đồ
    initMap(tripData, stopsData);

    // Bắt đầu giả lập di chuyển
    startBusSimulation(tripData, stopsData);
  } catch (error) {
    console.error("❌ Lỗi theo dõi chuyến xe:", error);
    showNotification("Có lỗi xảy ra, vui lòng thử lại", "error");
  }
}

/**
 * Cập nhật Info Panel với thông tin chuyến xe
 */
function updateTripInfoPanel(trip, stops) {
  // Trip header - hiển thị tên bến xe nếu có
  document.getElementById("tripIdDisplay").textContent =
    `Chuyến #${trip.TripId}`;

  // Ưu tiên hiển thị tên bến xe thay vì chỉ tên thành phố
  const fromDisplay = trip.FromCity || trip.DiemDi || "N/A";
  const toDisplay = trip.ToCity || trip.DiemDen || "N/A";
  document.getElementById("tripFromCity").textContent = fromDisplay;
  document.getElementById("tripToCity").textContent = toDisplay;

  // Statistics - giả lập cho demo
  const distance = trip.Distance || 300;
  const estimatedMinutes = trip.EstimatedDuration || 360;

  // Giả lập tiến trình ngẫu nhiên (30-70%)
  currentProgress = Math.random() * 0.4 + 0.3;
  const remainingDistance = Math.round(distance * (1 - currentProgress));
  const traveledDistance = Math.round(distance * currentProgress);
  const remainingMinutes = Math.round(estimatedMinutes * (1 - currentProgress));

  // ETA
  const now = new Date();
  const eta = new Date(now.getTime() + remainingMinutes * 60000);
  document.getElementById("etaValue").textContent =
    `${eta.getHours().toString().padStart(2, "0")}:${eta.getMinutes().toString().padStart(2, "0")}`;
  document.getElementById("etaRemaining").textContent =
    `Còn ${remainingMinutes} phút`;

  // Distance
  document.getElementById("distanceValue").textContent =
    `${remainingDistance} km`;
  document.getElementById("distanceTraveled").textContent =
    `Đã đi ${traveledDistance} km`;

  // Speed
  const speed = Math.round(Math.random() * 20) + 50;
  document.getElementById("speedValue").textContent = `${speed} km/h`;
  document.getElementById("avgSpeed").textContent =
    `${Math.round(speed * 0.85)}`;
  document.getElementById("busSpeed").textContent = `${speed} km/h`;

  // Trip details
  document.getElementById("companyName").textContent =
    trip.CompanyName || "N/A";
  document.getElementById("busType").textContent = trip.BusType || "N/A";
  document.getElementById("licensePlate").textContent = generateLicensePlate();
  document.getElementById("departureTime").textContent = formatTime(
    trip.DepartureTime,
  );
  document.getElementById("arrivalTime").textContent = formatTime(
    trip.ArrivalTime,
  );

  // Route progress bar
  const progressFill = document.getElementById("routeProgressFill");
  const busIcon = document.getElementById("routeBusIcon");
  if (progressFill) progressFill.style.width = `${currentProgress * 100}%`;
  if (busIcon) busIcon.style.left = `${currentProgress * 100}%`;

  // Render stops timeline
  renderStopsTimeline(stops);
}

/**
 * Tạo biển số xe ngẫu nhiên cho demo
 */
function generateLicensePlate() {
  const prefixes = ["51B", "30A", "43A", "92A", "36A", "61A", "49A"];
  const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
  const number = Math.floor(Math.random() * 90000 + 10000);
  return `${prefix}-${number}`;
}

/**
 * Render danh sách điểm dừng dạng timeline
 */
function renderStopsTimeline(stops) {
  const timeline = document.getElementById("stopsTimeline");
  if (!timeline || stops.length === 0) {
    if (timeline)
      timeline.innerHTML =
        '<p style="color:#9ca3af; text-align:center; padding:20px;">Chưa có dữ liệu điểm dừng</p>';
    return;
  }

  // Xác định điểm dừng nào đã đi qua dựa trên progress
  const passedCount = Math.floor(currentProgress * stops.length);

  timeline.innerHTML = stops
    .map((stop, index) => {
      let status = "upcoming";
      let icon = '<i class="fas fa-circle"></i>';
      let detail = `Cách điểm đầu ${stop.DistanceFromStart || 0} km`;

      if (index < passedCount) {
        status = "passed";
        icon = '<i class="fas fa-check"></i>';
        detail = "Đã đi qua";
      } else if (index === passedCount) {
        status = "current";
        icon = '<i class="fas fa-bus"></i>';
        detail = "Xe đang ở đây";
      }

      return `
      <div class="timeline-stop ${status}">
        <div class="timeline-stop-dot">${icon}</div>
        <div class="timeline-stop-name">${stop.StopName}</div>
        <div class="timeline-stop-detail">${detail}</div>
      </div>
    `;
    })
    .join("");
}

/**
 * Khởi tạo bản đồ Leaflet + OSRM API cho tuyến đường thực tế
 * Sử dụng OSRM (Open Source Routing Machine) - miễn phí, không cần API key
 */
async function initMap(trip, stops) {
  // Nếu đã có bản đồ, xóa đi tạo lại
  if (map) {
    clearMapLayers();
    map.remove();
    map = null;
  }

  // Lấy tọa độ điểm đầu và cuối
  // Ưu tiên tọa độ bến xe (stop đầu/cuối) thay vì chỉ tên thành phố
  let fromCoords, toCoords;
  if (stops.length > 0) {
    const firstStop = stops[0];
    const lastStop = stops[stops.length - 1];
    fromCoords = getCoordinates(
      firstStop.StopName || firstStop.TenDiemDung || trip.FromCity,
    );
    toCoords = getCoordinates(
      lastStop.StopName || lastStop.TenDiemDung || trip.ToCity,
    );
  } else if (trip._demoStops && trip._demoStops.length > 0) {
    fromCoords = getCoordinates(trip._demoStops[0].StopName);
    toCoords = getCoordinates(
      trip._demoStops[trip._demoStops.length - 1].StopName,
    );
  } else {
    fromCoords = getCoordinates(trip.FromCity);
    toCoords = getCoordinates(trip.ToCity);
  }

  // Center giữa 2 điểm
  const center = [
    (fromCoords[0] + toCoords[0]) / 2,
    (fromCoords[1] + toCoords[1]) / 2,
  ];

  // Khởi tạo map
  map = L.map("trackingMap", {
    center: center,
    zoom: 8,
    zoomControl: false,
  });

  // Thêm tile layer (OpenStreetMap dark theme)
  L.tileLayer("https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png", {
    attribution:
      '&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> &copy; <a href="https://carto.com/">CARTO</a> | Routing: <a href="https://project-osrm.org">OSRM</a>',
    maxZoom: 19,
  }).addTo(map);

  // Thêm zoom control
  L.control.zoom({ position: "bottomright" }).addTo(map);

  // Hiển thị loading trên bản đồ trong khi gọi OSRM API
  showMapLoading(true);

  // Lấy tọa độ các waypoints (điểm dừng giữa)
  const waypoints = buildWaypoints(trip, stops);

  // Gọi OSRM API lấy tuyến đường thực tế theo đường bộ
  let routePoints = await getOSRMRoute(fromCoords, toCoords, waypoints);

  // Cache lại route points và stop positions
  currentRoutePoints = routePoints;
  currentStopPositions = computeStopPositions(
    stops,
    routePoints,
    fromCoords,
    toCoords,
  );

  showMapLoading(false);

  // Vẽ tuyến đường
  drawRoute(routePoints);

  // Thêm markers cho điểm dừng
  addStopMarkers(trip, stops, routePoints);

  // Thêm marker xe bus
  addBusMarker(routePoints);

  // Fit view cho toàn tuyến đường
  const bounds = L.latLngBounds(routePoints);
  map.fitBounds(bounds, { padding: [50, 50] });

  // Log thông tin route
  const routeDistanceKm = computeRouteDistance(routePoints);
  console.log(
    `✅ OSRM Route: ${routePoints.length} điểm, ~${routeDistanceKm.toFixed(1)} km thực tế`,
  );
}

// Biến lưu trữ route points hiện tại và vị trí stop trên route
let currentRoutePoints = [];
let currentStopPositions = [];

/**
 * Hiển thị/ẩn loading overlay trên bản đồ
 */
function showMapLoading(show) {
  let overlay = document.getElementById("mapLoadingOverlay");
  if (show) {
    if (!overlay) {
      overlay = document.createElement("div");
      overlay.id = "mapLoadingOverlay";
      overlay.innerHTML = `
        <div class="map-loading-content">
          <div class="map-loading-spinner"></div>
          <span>Đang tải tuyến đường từ OSRM...</span>
        </div>
      `;
      overlay.style.cssText = `
        position: absolute; top: 0; left: 0; right: 0; bottom: 0;
        background: rgba(15,23,42,0.85); z-index: 1000;
        display: flex; align-items: center; justify-content: center;
        color: #94a3b8; font-size: 0.95rem;
      `;
      const mapContainer = document.getElementById("trackingMap");
      if (mapContainer) mapContainer.style.position = "relative";
      mapContainer?.appendChild(overlay);
    }
  } else if (overlay) {
    overlay.remove();
  }
}

/**
 * Lấy tọa độ từ tên thành phố hoặc bến xe (geocoding offline)
 * Hỗ trợ khớp: có dấu, không dấu, tên bến xe, tên tỉnh/thành
 */
function getCoordinates(cityName) {
  if (!cityName) return [10.7769, 106.7009]; // Mặc định TP.HCM

  const name = cityName.trim();

  // 1. Khớp chính xác (exact match)
  if (CITY_COORDINATES[name]) return CITY_COORDINATES[name];

  // 2. Khớp includes (partial match)
  for (const [key, coords] of Object.entries(CITY_COORDINATES)) {
    if (name.includes(key) || key.includes(name)) {
      return coords;
    }
  }

  // 3. Khớp không dấu (normalize)
  const normalized = removeAccents(name).toLowerCase();
  for (const [key, coords] of Object.entries(CITY_COORDINATES)) {
    const normalizedKey = removeAccents(key).toLowerCase();
    if (
      normalized.includes(normalizedKey) ||
      normalizedKey.includes(normalized)
    ) {
      return coords;
    }
  }

  // Mặc định nếu không tìm thấy
  console.warn(`⚠️ Không tìm thấy tọa độ cho: ${cityName}`);
  return [10.7769, 106.7009];
}

/**
 * Loại bỏ dấu tiếng Việt (dùng cho fuzzy matching)
 */
function removeAccents(str) {
  return str
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D");
}

/**
 * Xây dựng waypoints từ danh sách điểm dừng
 * Ưu tiên lấy tọa độ thực từ CITY_COORDINATES (tên bến xe, trạm dừng)
 * Nếu không tìm thấy → nội suy từ khoảng cách
 * @returns {Array} Mảng [lat, lng] cho các điểm dừng giữa
 */
function buildWaypoints(trip, stops) {
  const fromCoords = getCoordinates(trip.FromCity);
  const toCoords = getCoordinates(trip.ToCity);

  if (stops.length === 0) return [];

  const waypoints = [];
  stops.forEach((stop, index) => {
    // 1. Thử tìm tọa độ thực từ tên điểm dừng (bến xe, trạm dừng)
    const stopName = stop.StopName || stop.TenDiemDung || "";
    const realCoords = CITY_COORDINATES[stopName];
    if (realCoords) {
      waypoints.push(realCoords);
      return;
    }

    // 2. Thử fuzzy match (không dấu)
    const normalizedStop = removeAccents(stopName).toLowerCase();
    let found = false;
    for (const [key, coords] of Object.entries(CITY_COORDINATES)) {
      const normalizedKey = removeAccents(key).toLowerCase();
      if (
        normalizedStop.includes(normalizedKey) ||
        normalizedKey.includes(normalizedStop)
      ) {
        waypoints.push(coords);
        found = true;
        break;
      }
    }
    if (found) return;

    // 3. Nội suy từ khoảng cách (fallback)
    const totalDistance = trip.Distance || 300;
    const ratio =
      (stop.DistanceFromStart ||
        ((index + 1) / (stops.length + 1)) * totalDistance) / totalDistance;
    const lat = fromCoords[0] + (toCoords[0] - fromCoords[0]) * ratio;
    const lng = fromCoords[1] + (toCoords[1] - fromCoords[1]) * ratio;
    waypoints.push([lat, lng]);
  });

  return waypoints;
}

/**
 * Gọi OSRM API để lấy tuyến đường thực tế theo đường bộ
 * API: https://router.project-osrm.org (miễn phí, không cần key)
 * @param {Array} from - Tọa độ điểm đi [lat, lng]
 * @param {Array} to - Tọa độ điểm đến [lat, lng]
 * @param {Array} waypoints - Mảng các waypoints [[lat, lng], ...]
 * @returns {Array} Mảng tọa độ [[lat, lng], ...] tuyến đường thực tế
 */
async function getOSRMRoute(from, to, waypoints = []) {
  try {
    // OSRM dùng format lng,lat (ngược với Leaflet lat,lng)
    let coordinateStr = `${from[1]},${from[0]}`;

    // Thêm waypoints nếu có (tối đa 5 để tránh quá tải API)
    const limitedWaypoints =
      waypoints.length > 5
        ? waypoints
            .filter((_, i) => i % Math.ceil(waypoints.length / 5) === 0)
            .slice(0, 5)
        : waypoints;

    limitedWaypoints.forEach((wp) => {
      coordinateStr += `;${wp[1]},${wp[0]}`;
    });

    coordinateStr += `;${to[1]},${to[0]}`;

    // Gọi OSRM Routing API
    const url = `${OSRM_API_URL}/${coordinateStr}?overview=full&geometries=geojson&steps=true`;
    console.log(`🗺️ Gọi OSRM API: ${url}`);

    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`OSRM API HTTP error: ${response.status}`);
    }

    const data = await response.json();

    if (data.code !== "Ok" || !data.routes || data.routes.length === 0) {
      throw new Error(`OSRM không tìm thấy tuyến đường: ${data.code}`);
    }

    // Lấy tuyến đường tốt nhất
    const route = data.routes[0];
    const coordinates = route.geometry.coordinates; // GeoJSON format: [lng, lat]

    // Chuyển từ [lng, lat] sang [lat, lng] cho Leaflet
    const routePoints = coordinates.map((coord) => [coord[1], coord[0]]);

    // Lưu thông tin khoảng cách và thời gian thực tế từ OSRM
    currentOSRMDistance = route.distance / 1000; // mét → km
    currentOSRMDuration = route.duration / 60; // giây → phút

    console.log(
      `✅ OSRM Route: ${routePoints.length} điểm, ${currentOSRMDistance.toFixed(1)} km, ${currentOSRMDuration.toFixed(0)} phút`,
    );

    return routePoints;
  } catch (error) {
    console.warn(
      `⚠️ OSRM API lỗi: ${error.message}. Dùng fallback đường thẳng.`,
    );
    // Fallback: tạo đường thẳng nếu OSRM không khả dụng
    return createFallbackRoute(from, to, waypoints);
  }
}

// Biến lưu thông tin route từ OSRM
let currentOSRMDistance = 0;
let currentOSRMDuration = 0;

/**
 * Tạo route fallback khi OSRM không khả dụng
 * Dựng đường cong bằng phương pháp nội suy (backup)
 */
function createFallbackRoute(from, to, waypoints) {
  const points = [from];

  if (waypoints.length > 0) {
    waypoints.forEach((wp) => points.push(wp));
  } else {
    // Tạo vài điểm giữa
    for (let i = 1; i <= 5; i++) {
      const t = i / 6;
      const lat = from[0] + (to[0] - from[0]) * t;
      const lng = from[1] + (to[1] - from[1]) * t;
      const offset = Math.sin(t * Math.PI) * 0.08;
      points.push([
        lat + offset * (Math.random() - 0.5),
        lng + offset * (Math.random() - 0.5),
      ]);
    }
  }

  points.push(to);
  return points;
}

/**
 * Tính tọa độ các điểm dừng trên route thực tế (snap to nearest point)
 */
function computeStopPositions(stops, routePoints, fromCoords, toCoords) {
  if (stops.length === 0 || routePoints.length === 0) return [];

  const positions = [];
  const totalRouteLen = routePoints.length;

  stops.forEach((stop, index) => {
    // Tính tỷ lệ vị trí trên route
    const ratio = (index + 1) / (stops.length + 1);
    const pointIndex = Math.min(
      Math.floor(ratio * totalRouteLen),
      totalRouteLen - 1,
    );
    positions.push({
      stop,
      coords: routePoints[pointIndex],
      routeIndex: pointIndex,
      ratio,
    });
  });

  return positions;
}

/**
 * Tính khoảng cách tổng của route (km) dựa trên tọa độ
 */
function computeRouteDistance(routePoints) {
  let total = 0;
  for (let i = 1; i < routePoints.length; i++) {
    total += haversineDistance(routePoints[i - 1], routePoints[i]);
  }
  return total;
}

/**
 * Tính khoảng cách Haversine giữa 2 tọa độ (km)
 */
function haversineDistance(coord1, coord2) {
  const R = 6371;
  const dLat = ((coord2[0] - coord1[0]) * Math.PI) / 180;
  const dLng = ((coord2[1] - coord1[1]) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((coord1[0] * Math.PI) / 180) *
      Math.cos((coord2[0] * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/**
 * Vẽ tuyến đường OSRM lên bản đồ
 */
function drawRoute(routePoints) {
  // Vẽ viền đường (shadow) - tạo hiệu ứng đường bộ
  L.polyline(routePoints, {
    color: "#0f172a",
    weight: 8,
    opacity: 0.4,
    smoothFactor: 1,
  }).addTo(map);

  // Vẽ đường chính (toàn tuyến) - màu xám xanh
  routePolyline = L.polyline(routePoints, {
    color: "#334155",
    weight: 5,
    opacity: 0.9,
    smoothFactor: 1,
  }).addTo(map);

  // Vẽ phần đã đi (gradient xanh lá)
  const passedIndex = Math.floor(currentProgress * (routePoints.length - 1));
  const passedPoints = routePoints.slice(0, passedIndex + 1);

  if (passedPoints.length > 1) {
    L.polyline(passedPoints, {
      color: "#10b981",
      weight: 5,
      opacity: 1,
      smoothFactor: 1,
    }).addTo(map);
  }
}

/**
 * Thêm markers cho các điểm dừng (sử dụng vị trí trên route OSRM)
 */
function addStopMarkers(trip, stops, routePoints) {
  const fromCoords = getCoordinates(trip.FromCity);
  const toCoords = getCoordinates(trip.ToCity);
  const passedCount = Math.floor(
    currentProgress * (stops.length || routePoints.length),
  );

  // Marker điểm đi (xanh lá)
  const startIcon = L.divIcon({
    className: "start-marker-icon",
    html: '<div class="start-marker"><i class="fas fa-play"></i></div>',
    iconSize: [36, 36],
    iconAnchor: [18, 18],
  });

  L.marker(fromCoords, { icon: startIcon }).addTo(map).bindPopup(`
      <div class="stop-popup">
        <h4>${trip.FromCity}</h4>
        <p>Điểm khởi hành</p>
        <span class="stop-status passed">Đã xuất phát</span>
      </div>
    `);

  // Marker điểm đến (đỏ)
  const endIcon = L.divIcon({
    className: "end-marker-icon",
    html: '<div class="end-marker"><i class="fas fa-flag-checkered"></i></div>',
    iconSize: [36, 36],
    iconAnchor: [18, 18],
  });

  L.marker(toCoords, { icon: endIcon }).addTo(map).bindPopup(`
      <div class="stop-popup">
        <h4>${trip.ToCity}</h4>
        <p>Điểm đến</p>
        <span class="stop-status upcoming">Chưa đến</span>
      </div>
    `);

  // Markers cho các điểm dừng giữa (sử dụng vị trí snap trên route OSRM)
  if (stops.length > 0 && currentStopPositions.length > 0) {
    currentStopPositions.forEach((sp, index) => {
      let statusClass = "upcoming";
      let statusText = "Chưa đến";

      if (index < passedCount) {
        statusClass = "passed";
        statusText = "Đã đi qua";
      } else if (index === passedCount) {
        statusClass = "current";
        statusText = "Đang ở đây";
      }

      const stopIcon = L.divIcon({
        className: "stop-marker-icon",
        html: `<div class="stop-marker ${statusClass}"></div>`,
        iconSize: [16, 16],
        iconAnchor: [8, 8],
      });

      const marker = L.marker(sp.coords, { icon: stopIcon }).addTo(map)
        .bindPopup(`
          <div class="stop-popup">
            <h4>${sp.stop.StopName}</h4>
            <p>Điểm dừng #${sp.stop.StopOrder || index + 1}</p>
            <span class="stop-status ${statusClass}">${statusText}</span>
          </div>
        `);

      stopMarkers.push(marker);
    });
  }
}

/**
 * Thêm marker xe bus lên bản đồ
 */
function addBusMarker(routePoints) {
  // Tính vị trí xe bus dựa trên progress
  const busPos = getPointOnRoute(routePoints, currentProgress);

  const busIcon = L.divIcon({
    className: "bus-marker-icon",
    html: '<div class="bus-marker"><i class="fas fa-bus"></i></div>',
    iconSize: [44, 44],
    iconAnchor: [22, 22],
  });

  busMarker = L.marker(busPos, {
    icon: busIcon,
    zIndexOffset: 1000,
  }).addTo(map).bindPopup(`
      <div class="stop-popup">
        <h4><i class="fas fa-bus"></i> Xe đang di chuyển</h4>
        <p>Tốc độ: ${document.getElementById("speedValue")?.textContent || "--"}</p>
      </div>
    `);
}

/**
 * Lấy điểm trên tuyến đường dựa trên tỷ lệ (0 → 1)
 */
function getPointOnRoute(routePoints, progress) {
  if (routePoints.length < 2) return routePoints[0];

  const totalSegments = routePoints.length - 1;
  const segmentIndex = Math.min(
    Math.floor(progress * totalSegments),
    totalSegments - 1,
  );
  const segmentProgress = progress * totalSegments - segmentIndex;

  const from = routePoints[segmentIndex];
  const to = routePoints[segmentIndex + 1];

  return [
    from[0] + (to[0] - from[0]) * segmentProgress,
    from[1] + (to[1] - from[1]) * segmentProgress,
  ];
}

/**
 * Bắt đầu giả lập xe di chuyển (sử dụng route OSRM đã cache)
 */
function startBusSimulation(trip, stops) {
  // Dừng giả lập cũ nếu có
  if (busAnimationInterval) clearInterval(busAnimationInterval);

  // Sử dụng route points đã lấy từ OSRM
  const routePoints =
    currentRoutePoints.length > 0
      ? currentRoutePoints
      : createFallbackRoute(
          getCoordinates(trip.FromCity),
          getCoordinates(trip.ToCity),
          [],
        );

  busAnimationInterval = setInterval(() => {
    // Tăng progress
    currentProgress += 0.001; // Tăng chậm hơn vì route OSRM có nhiều điểm hơn

    if (currentProgress >= 1) {
      currentProgress = 1;
      clearInterval(busAnimationInterval);
      showNotification("🎉 Xe đã đến nơi!", "success");
    }

    // Cập nhật vị trí xe trên bản đồ
    if (busMarker && routePoints.length > 1) {
      const newPos = getPointOnRoute(routePoints, currentProgress);
      busMarker.setLatLng(newPos);
    }

    // Cập nhật info panel
    updateTrackingStats(trip);

    // Cập nhật route progress bar
    const progressFill = document.getElementById("routeProgressFill");
    const busIcon = document.getElementById("routeBusIcon");
    if (progressFill) progressFill.style.width = `${currentProgress * 100}%`;
    if (busIcon) busIcon.style.left = `${currentProgress * 100}%`;
  }, 2000); // Cập nhật mỗi 2 giây
}

/**
 * Cập nhật thống kê theo thời gian thực (dùng dữ liệu OSRM nếu có)
 */
function updateTrackingStats(trip) {
  // Ưu tiên dùng khoảng cách thực từ OSRM, fallback về trip.Distance
  const distance =
    currentOSRMDistance > 0
      ? Math.round(currentOSRMDistance)
      : trip.Distance || 300;
  const estimatedMinutes =
    currentOSRMDuration > 0
      ? Math.round(currentOSRMDuration)
      : trip.EstimatedDuration || 360;

  const remainingDistance = Math.round(distance * (1 - currentProgress));
  const traveledDistance = Math.round(distance * currentProgress);
  const remainingMinutes = Math.round(estimatedMinutes * (1 - currentProgress));

  // ETA
  const now = new Date();
  const eta = new Date(now.getTime() + remainingMinutes * 60000);
  document.getElementById("etaValue").textContent =
    `${eta.getHours().toString().padStart(2, "0")}:${eta.getMinutes().toString().padStart(2, "0")}`;
  document.getElementById("etaRemaining").textContent =
    `Còn ${remainingMinutes} phút`;

  // Distance
  document.getElementById("distanceValue").textContent =
    `${remainingDistance} km`;
  document.getElementById("distanceTraveled").textContent =
    `Đã đi ${traveledDistance} km`;

  // Speed (dao động nhẹ, dựa trên khoảng cách OSRM / thời gian)
  const avgSpeed =
    distance > 0 && estimatedMinutes > 0
      ? Math.round(distance / (estimatedMinutes / 60))
      : 55;
  const speed = Math.round(avgSpeed + (Math.random() - 0.5) * 15);
  document.getElementById("speedValue").textContent = `${speed} km/h`;
  document.getElementById("busSpeed").textContent = `${speed} km/h`;
}

/**
 * Center bản đồ vào vị trí xe bus
 */
function centerOnBus() {
  if (map && busMarker) {
    map.flyTo(busMarker.getLatLng(), 12, { duration: 1 });
  }
}

/**
 * Fit view cho toàn tuyến đường
 */
function fitRouteView() {
  if (map && routePolyline) {
    map.fitBounds(routePolyline.getBounds(), { padding: [50, 50] });
  }
}

/**
 * Xóa tất cả layers trên bản đồ
 */
function clearMapLayers() {
  if (busAnimationInterval) clearInterval(busAnimationInterval);
  stopMarkers = [];
}

// ===== AI CHATBOT NÂNG CAO =====
// Lịch sử hội thoại (gửi lên backend để Gemini hiểu ngữ cảnh)
let chatHistory = [];
let isChatTyping = false;

/**
 * Toggle hiển thị chatbot widget
 */
function toggleChatbot() {
  if (chatbotWidget) {
    const isHidden =
      chatbotWidget.style.display === "none" || !chatbotWidget.style.display;
    chatbotWidget.style.display = isHidden ? "flex" : "none";

    if (isHidden) {
      // Hiệu ứng mở mượt mà
      chatbotWidget.classList.add("chatbot-open");
      setTimeout(() => chatbotWidget.classList.remove("chatbot-open"), 400);

      // Tin nhắn chào mừng nếu chưa có
      if (chatMessages && chatMessages.children.length === 0) {
        addChatMessage("bot", getWelcomeMessage());
      }

      // Focus vào input
      setTimeout(() => chatInput?.focus(), 200);
    }
  }
}

/**
 * Tạo tin nhắn chào mừng chi tiết
 */
function getWelcomeMessage() {
  return `Xin chào! Tôi là **Trợ lý AI DatVeNhanh** 🚌

Tôi có thể giúp bạn:
- 🔍 **Tìm kiếm chuyến xe** (tuyến, giờ, giá)
- 🎫 **Hướng dẫn đặt vé** từng bước
- 📍 **Theo dõi hành trình** xe đang chạy
- ❌ **Hủy vé / đổi vé** và chính sách hoàn tiền
- 💬 **Giải đáp thắc mắc** mọi vấn đề về xe khách
- 📞 **Liên hệ hỗ trợ** hotline nhà xe

Hãy hỏi tôi bất cứ điều gì nhé! 😊`;
}

/**
 * Xử lý submit form chat
 */
async function handleChatSubmit(e) {
  e.preventDefault();

  const message = chatInput?.value.trim();
  if (!message || isChatTyping) return;

  // Hiển thị tin nhắn người dùng
  addChatMessage("user", message);
  chatInput.value = "";
  chatInput.style.height = "auto"; // Reset textarea height

  // Gửi tin nhắn đến AI
  await sendChatMessage(message);
}

/**
 * Gửi tin nhắn đến backend AI Chatbot (có lịch sử hội thoại)
 */
async function sendChatMessage(message) {
  try {
    isChatTyping = true;

    // Thêm vào lịch sử
    chatHistory.push({ role: "user", content: message });

    // Hiệu ứng "Đang gõ..." với animation
    showTypingIndicator();

    // Thêm ngữ cảnh chuyến xe đang theo dõi (nếu có)
    let contextMessage = message;
    if (currentTripData && currentTripData.trip) {
      const trip = currentTripData.trip;
      const distance =
        currentOSRMDistance > 0
          ? currentOSRMDistance.toFixed(1)
          : trip.Distance || "N/A";
      const progress = Math.round(currentProgress * 100);
      contextMessage = `[Ngữ cảnh: Người dùng đang theo dõi chuyến xe #${trip.TripId} từ ${trip.FromCity} đến ${trip.ToCity}, nhà xe ${trip.CompanyName || "N/A"}, khoảng cách ${distance} km, tiến trình ${progress}%]\n\nCâu hỏi: ${message}`;
    }

    // Gọi API backend
    const response = await fetch(`${API_BASE_URL}/chat/ask`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        message: contextMessage,
        chatHistory: chatHistory.slice(-10), // Gửi 10 tin nhắn gần nhất
      }),
    });

    const data = await response.json();

    // Xóa typing indicator
    removeTypingIndicator();

    if (data.success && data.data) {
      const reply = data.data.reply;

      // Thêm vào lịch sử
      chatHistory.push({ role: "assistant", content: reply });

      // Hiển thị với hiệu ứng typing
      await typeWriterEffect("bot", reply);
    } else {
      addChatMessage(
        "bot",
        "Xin lỗi, tôi không thể xử lý yêu cầu này. Vui lòng thử lại hoặc liên hệ hotline **1900-xxxx**.",
      );
    }
  } catch (error) {
    console.error("❌ Lỗi chatbot:", error);
    removeTypingIndicator();
    addChatMessage(
      "bot",
      "⚠️ Không thể kết nối đến trợ lý AI. Vui lòng kiểm tra kết nối mạng và thử lại.",
    );
  } finally {
    isChatTyping = false;
  }
}

/**
 * Hiển thị indicator "Đang gõ..." với animation dots
 */
function showTypingIndicator() {
  if (!chatMessages) return;

  const typingDiv = document.createElement("div");
  typingDiv.className = "chat-message bot typing-indicator";
  typingDiv.innerHTML = `
    <div class="message-avatar"><i class="fas fa-robot"></i></div>
    <div class="message-content">
      <div class="typing-dots">
        <span></span><span></span><span></span>
      </div>
    </div>
  `;
  chatMessages.appendChild(typingDiv);
  chatMessages.scrollTop = chatMessages.scrollHeight;
}

/**
 * Xóa typing indicator
 */
function removeTypingIndicator() {
  if (!chatMessages) return;
  const indicator = chatMessages.querySelector(".typing-indicator");
  if (indicator) indicator.remove();
}

/**
 * Hiệu ứng typewriter - hiển thị tin nhắn từ từ
 */
async function typeWriterEffect(type, fullMessage) {
  if (!chatMessages) return;

  const messageDiv = document.createElement("div");
  messageDiv.className = `chat-message ${type}`;

  const avatar = document.createElement("div");
  avatar.className = "message-avatar";
  avatar.innerHTML = '<i class="fas fa-robot"></i>';

  const content = document.createElement("div");
  content.className = "message-content";

  const timestamp = document.createElement("div");
  timestamp.className = "message-time";
  timestamp.textContent = new Date().toLocaleTimeString("vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
  });

  messageDiv.appendChild(avatar);
  messageDiv.appendChild(content);
  messageDiv.appendChild(timestamp);
  chatMessages.appendChild(messageDiv);

  // Render markdown rồi hiển thị typewriter
  const renderedHTML = renderMarkdown(fullMessage);

  // Hiệu ứng typewriter: hiển thị từng phần nhanh
  const tempDiv = document.createElement("div");
  tempDiv.innerHTML = renderedHTML;
  const textContent = tempDiv.textContent || tempDiv.innerText;

  if (textContent.length > 200) {
    // Tin nhắn dài: hiển thị ngay markdown đã render
    content.innerHTML = renderedHTML;
  } else {
    // Tin nhắn ngắn: hiệu ứng typewriter
    let displayedText = "";
    const chars = fullMessage.split("");
    for (let i = 0; i < chars.length; i++) {
      displayedText += chars[i];
      content.innerHTML = renderMarkdown(displayedText);
      chatMessages.scrollTop = chatMessages.scrollHeight;
      if (i % 3 === 0) {
        await new Promise((r) => setTimeout(r, 15));
      }
    }
  }

  chatMessages.scrollTop = chatMessages.scrollHeight;
}

/**
 * Render markdown đơn giản (bold, italic, lists, code, links)
 */
function renderMarkdown(text) {
  if (!text) return "";

  let html = text
    // Escape HTML
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    // Code blocks (```)
    .replace(
      /```([\s\S]*?)```/g,
      '<pre class="chat-code-block"><code>$1</code></pre>',
    )
    // Inline code (`)
    .replace(/`([^`]+)`/g, '<code class="chat-inline-code">$1</code>')
    // Bold (**text**)
    .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
    // Italic (*text*)
    .replace(/\*([^*]+)\*/g, "<em>$1</em>")
    // Bullet lists (- item hoặc • item)
    .replace(/^[•\-]\s+(.+)$/gm, '<li class="chat-list-item">$1</li>')
    // Numbered lists (1. item)
    .replace(
      /^\d+\.\s+(.+)$/gm,
      '<li class="chat-list-item chat-numbered">$1</li>',
    )
    // Line breaks
    .replace(/\n/g, "<br>");

  // Gom các li liên tiếp vào ul
  html = html.replace(
    /(<li class="chat-list-item[^"]*">.*?<\/li>(<br>)?)+/g,
    (match) => `<ul class="chat-list">${match.replace(/<br>/g, "")}</ul>`,
  );

  return html;
}

/**
 * Thêm tin nhắn vào chatbot (không có typing effect)
 */
function addChatMessage(type, message, isLoading = false) {
  if (!chatMessages) return;

  const messageDiv = document.createElement("div");
  messageDiv.className = `chat-message ${type} ${isLoading ? "loading" : ""}`;

  const avatar = document.createElement("div");
  avatar.className = "message-avatar";
  avatar.innerHTML =
    type === "user"
      ? '<i class="fas fa-user"></i>'
      : '<i class="fas fa-robot"></i>';

  const content = document.createElement("div");
  content.className = "message-content";

  // Render markdown cho bot messages
  if (type === "bot" && !isLoading) {
    content.innerHTML = renderMarkdown(message);
  } else {
    content.innerHTML = message.replace(/\n/g, "<br>");
  }

  // Timestamp
  const timestamp = document.createElement("div");
  timestamp.className = "message-time";
  timestamp.textContent = new Date().toLocaleTimeString("vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
  });

  messageDiv.appendChild(avatar);
  messageDiv.appendChild(content);
  if (!isLoading) messageDiv.appendChild(timestamp);
  chatMessages.appendChild(messageDiv);

  chatMessages.scrollTop = chatMessages.scrollHeight;
}

/**
 * Xóa tin nhắn cuối cùng (loading)
 */
function removeLastChatMessage() {
  if (!chatMessages) return;
  const lastMsg = chatMessages.querySelector(".chat-message.loading");
  if (lastMsg) lastMsg.remove();
}

/**
 * Hiển thị thông báo toast
 */
function showNotification(message, type = "info") {
  const toast = document.createElement("div");
  toast.style.cssText = `
    position: fixed;
    top: 80px;
    right: 20px;
    padding: 14px 24px;
    border-radius: 12px;
    color: white;
    font-weight: 600;
    font-size: 0.9rem;
    z-index: 10000;
    animation: slideInRight 0.3s ease;
    box-shadow: 0 8px 25px rgba(0,0,0,0.15);
  `;

  const colors = {
    success: "linear-gradient(135deg, #10b981, #059669)",
    error: "linear-gradient(135deg, #ef4444, #dc2626)",
    warning: "linear-gradient(135deg, #f59e0b, #d97706)",
    info: "linear-gradient(135deg, #3b82f6, #2563eb)",
  };

  toast.style.background = colors[type] || colors.info;
  toast.textContent = message;
  document.body.appendChild(toast);

  setTimeout(() => {
    toast.style.animation = "slideOutRight 0.3s ease";
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

// CSS animation cho toast
const toastStyle = document.createElement("style");
toastStyle.textContent = `
  @keyframes slideInRight {
    from { transform: translateX(100%); opacity: 0; }
    to { transform: translateX(0); opacity: 1; }
  }
  @keyframes slideOutRight {
    from { transform: translateX(0); opacity: 1; }
    to { transform: translateX(100%); opacity: 0; }
  }
`;
document.head.appendChild(toastStyle);
