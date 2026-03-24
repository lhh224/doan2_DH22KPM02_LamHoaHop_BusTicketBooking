/**
 * File: seat-map.js
 * Xử lý logic chọn ghế, tính tiền và đặt vé
 */

const API_BASE_URL = "http://localhost:3000/api/v1";

// Biến global
let currentTrip = null;
let availableStops = [];
let selectedSeats = [];
let seatPricePerSeat = 0;
let fromStopOrder = null;
let toStopOrder = null;
let allSeats = [];
let currentTemplate = null; // Template hiện tại

/**
 * Khởi tạo trang khi load
 */
document.addEventListener("DOMContentLoaded", async () => {
  // Lấy tripId từ URL
  const urlParams = new URLSearchParams(window.location.search);
  const tripId = urlParams.get("tripId");

  if (!tripId) {
    showError(
      "Không tìm thấy thông tin chuyến xe. Vui lòng quay lại trang tìm kiếm.",
    );
    return;
  }

  await loadTripInfo(tripId);
});

/**
 * Load thông tin chuyến xe
 */
async function loadTripInfo(tripId) {
  try {
    // Gọi API lấy thông tin chuyến
    const response = await fetch(`${API_BASE_URL}/trips/${tripId}`);
    const data = await response.json();

    if (!data.success) {
      throw new Error(data.message || "Không thể tải thông tin chuyến");
    }

    currentTrip = data.data.trip;
    availableStops = data.data.stops;
    console.log("API /trips/:tripId response =>", data);
    console.log("currentTrip object:", currentTrip);

    // Hiển thị thông tin
    displayTripInfo();
    displayStops();

    hideLoading();
  } catch (error) {
    console.error("Lỗi:", error);
    showError("Không thể tải thông tin chuyến xe: " + error.message);
    hideLoading();
  }
}

/**
 * Hiển thị thông tin chuyến xe
 */
function displayTripInfo() {
  console.log("🛠️ Hiển thị thông tin chuyến xe:", currentTrip);

  document.getElementById("routeName").textContent = currentTrip.RouteName;
  document.getElementById("companyName").textContent = currentTrip.CompanyName;
  document.getElementById("busType").textContent = currentTrip.BusType;

  // Lấy giá trị thời gian và ngày trực tiếp từ database
  let departureTime = "";
  let departureDate = "";

  // 1. Xử lý Giờ (DepartureTime)
  const rawTime = currentTrip.DepartureTime || currentTrip.departureTime;
  if (rawTime) {
    if (typeof rawTime === "string") {
      // Nếu là định dạng "HH:mm:ss" hoặc "HH:mm"
      departureTime = rawTime.substring(0, 5);
    } else if (rawTime instanceof Date) {
      departureTime = rawTime.toLocaleTimeString("vi-VN", {
        hour: "2-digit",
        minute: "2-digit",
      });
    }
  }

  // 2. Xử lý Ngày (DepartureDate)
  const rawDate = currentTrip.DepartureDate || currentTrip.departureDate;
  if (rawDate) {
    const d = new Date(rawDate);
    if (!isNaN(d.getTime())) {
      departureDate = d.toLocaleDateString("vi-VN");
    }
  }

  const departureText = [departureTime, departureDate]
    .filter(Boolean)
    .join(" - ");

  console.log("Final Departure Text:", departureText);
  document.getElementById("departureInfo").textContent = departureText || "-";

  document.getElementById("basePrice").textContent =
    currentTrip.BasePrice.toLocaleString("vi-VN") + " VNĐ";

  seatPricePerSeat = currentTrip.BasePrice;

  document.getElementById("tripInfoCard").style.display = "block";
}

/**
 * Hiển thị danh sách điểm dừng
 */
function displayStops() {
  const fromStopSelect = document.getElementById("fromStop");
  const toStopSelect = document.getElementById("toStop");

  fromStopSelect.innerHTML = '<option value="">-- Chọn điểm đón --</option>';
  toStopSelect.innerHTML = '<option value="">-- Chọn điểm trả --</option>';

  availableStops.forEach((stop) => {
    const option1 = new Option(stop.StopName, stop.StopOrder);
    const option2 = new Option(stop.StopName, stop.StopOrder);
    fromStopSelect.add(option1);
    toStopSelect.add(option2);
  });
}

/**
 * Khi người dùng chọn điểm đón/trả
 */
async function onStopChange() {
  const fromSelect = document.getElementById("fromStop");
  const toSelect = document.getElementById("toStop");

  fromStopOrder = parseInt(fromSelect.value);
  toStopOrder = parseInt(toSelect.value);

  // Nếu có thông báo lỗi trước đó, ẩn nó khi người dùng thay đổi lựa chọn
  hideError();

  if (fromStopOrder && toStopOrder) {
    if (fromStopOrder >= toStopOrder) {
      showError("Điểm trả phải sau điểm đón!");
      return;
    }

    // Reset ghế đã chọn
    selectedSeats = [];
    updateBookingSummary();

    // Load sơ đồ ghế
    await loadSeats();
  }
}

/**
 * Load danh sách ghế theo chặng
 */
async function loadSeats() {
  try {
    document.getElementById("mainContent").style.display = "none";
    document.getElementById("loadingMessage").style.display = "block";
    document.getElementById("loadingMessage").querySelector("p").textContent =
      "⏳ Đang tải sơ đồ ghế...";

    // Load danh sách ghế
    const response = await fetch(
      `${API_BASE_URL}/seats?tripId=${currentTrip.TripId}&fromStopOrder=${fromStopOrder}&toStopOrder=${toStopOrder}`,
    );
    const data = await response.json();

    if (!data.success) {
      throw new Error(data.message || "Không thể tải sơ đồ ghế");
    }

    // Response mới có cấu trúc: { busType, totalSeats, seats }
    allSeats = data.data.seats;
    const busType = data.data.busType;
    const totalSeats = data.data.totalSeats;

    console.log("✅ Loaded seats:", allSeats.length, "seats");
    console.log("Bus type:", busType, "| Total seats:", totalSeats);

    // Load template cho loại xe này
    try {
      await loadTemplate(busType);
      console.log("✅ Template loaded, using template-based rendering");
    } catch (templateError) {
      console.warn(
        "⚠️ Cannot load template, using legacy rendering:",
        templateError.message,
      );
      currentTemplate = null;
    }

    // Render sơ đồ ghế bằng template hoặc fallback
    renderSeatsFromTemplate();

    document.getElementById("loadingMessage").style.display = "none";
    document.getElementById("mainContent").style.display = "grid";
  } catch (error) {
    console.error("Lỗi:", error);
    showError("Không thể tải sơ đồ ghế: " + error.message);
    document.getElementById("loadingMessage").style.display = "none";
  }
}

/**
 * Load template cho loại xe
 */
async function loadTemplate(busType) {
  console.log("🔍 Loading template for:", busType);

  const response = await fetch(
    `${API_BASE_URL}/seat-templates/by-bus-type/${encodeURIComponent(busType)}`,
  );

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }

  const data = await response.json();

  if (!data.success) {
    throw new Error(data.message || "Không thể tải template");
  }

  currentTemplate = data.data.template;
  console.log("✅ Template loaded:", currentTemplate.name);
  return currentTemplate;
}

/**
 * Render sơ đồ ghế từ template
 */
function renderSeatsFromTemplate() {
  const seatsGrid = document.getElementById("seatsGrid");
  seatsGrid.innerHTML = "";

  if (!currentTemplate) {
    // Fallback: dùng logic cũ nếu không có template
    console.warn("⚠️ No template loaded, using legacy render");
    renderSeatsLegacy();
    return;
  }

  console.log("🎨 Rendering from template:", currentTemplate.templateId);

  // Tạo renderer
  const renderer = new SeatTemplateRenderer(currentTemplate, allSeats);

  // Override onSeatClick để kết nối với logic chọn ghế
  renderer.onSeatClick = toggleSeat;

  // Render vào container
  renderer.render(seatsGrid);

  // Cập nhật class cho seatsGrid để CSS hoạt động đúng
  seatsGrid.className = `seats-grid layout-${currentTemplate.busType.toLowerCase().replace(/\s+/g, "-")}`;
  // Thêm class template-mode để reset các style cũ nếu cần
  seatsGrid.classList.add("template-mode");

  console.log("✅ Render complete from template");
}

/**
 * Render sơ đồ ghế theo loại xe (legacy - giữ lại cho fallback)
 */
function renderSeats() {
  renderSeatsLegacy();
}

/**
 * Render sơ đồ ghế theo cách cũ (fallback)
 */
function renderSeatsLegacy() {
  const seatsGrid = document.getElementById("seatsGrid");
  seatsGrid.innerHTML = "";

  console.log("🎨 Rendering seats (legacy mode)...");
  console.log("Total seats to render:", allSeats.length);

  // Lấy layout theo loại xe
  const layout = getBusLayout(currentTrip.BusType);
  console.log(
    "Layout type:",
    layout.type,
    "| Floors:",
    layout.floors,
    "| Columns:",
    layout.columns,
  );

  // Cập nhật CSS grid columns
  seatsGrid.style.gridTemplateColumns = `repeat(${layout.columns}, 1fr)`;
  seatsGrid.className = `seats-grid layout-${layout.type}`;

  // Nếu xe 2 tầng, chia thành 2 phần
  if (layout.floors === 2) {
    console.log("📊 Rendering 2-floor bus");
    renderTwoFloorBus(seatsGrid, layout);
  } else if (layout.type === "limousine") {
    console.log("📊 Rendering limousine 34-seat bus");
    renderLimousineBus(seatsGrid, layout);
  } else {
    console.log("📊 Rendering single-floor bus");
    renderSingleFloorBus(seatsGrid, layout);
  }

  console.log("✅ Render complete (legacy)");
}

/**
 * Lấy cấu hình layout theo loại xe
 */
function getBusLayout(busType) {
  const type = (busType || "").toLowerCase();

  // Giường nằm 40 chỗ (2 tầng, 5 cột)
  if (type.includes("giường") || type.includes("giuong")) {
    return { columns: 5, type: "sleeper", floors: 2 };
  }

  // Limousine 34 chỗ - 1 tầng, layout tương tự xe 45 chỗ
  if (type.includes("limousine")) {
    return { columns: 5, type: "limousine", floors: 1 };
  }

  // VIP Cabin 22 chỗ (2 tầng, 2 cột)
  if (type.includes("cabin")) {
    return { columns: 2, type: "cabin", floors: 2 };
  }

  // Ghế ngồi thường 45 chỗ (1 tầng, 5 cột)
  return { columns: 5, type: "standard", floors: 1 };
}

/**
 * Sắp xếp ghế theo mã ghế (A01, A02, ..., B01, B02, ...)
 */
function sortSeatsByCode(seats) {
  return seats.sort((a, b) => {
    const codeA = a.SeatCode || "";
    const codeB = b.SeatCode || "";

    // Lấy chữ cái đầu (A, B, C, D)
    const letterA = codeA.charAt(0);
    const letterB = codeB.charAt(0);

    // So sánh chữ cái trước
    if (letterA !== letterB) {
      return letterA.localeCompare(letterB);
    }

    // Nếu cùng chữ cái, so sánh số
    const numA = parseInt(codeA.substring(1)) || 0;
    const numB = parseInt(codeB.substring(1)) || 0;
    return numA - numB;
  });
}

/**
 * Render xe 1 tầng (Ghế ngồi 45 chỗ)
 * Layout theo sơ đồ:
 * - Hàng 1-10: 4 ghế mỗi hàng (A, B | lối đi | D, E)
 * - Hàng 11: 5 ghế cùng dòng (A11, B11, C01, D11, E11) - C01 nằm giữa
 * Tổng: 11 + 11 + 1 + 11 + 11 = 45 ghế
 */
function renderSingleFloorBus(container, layout) {
  const seatIcon = getSeatIcon(layout.type);
  const sortedSeats = sortSeatsByCode([...allSeats]);

  // Tạo map để tra cứu ghế theo mã
  const seatMap = new Map();
  sortedSeats.forEach((seat) => {
    seatMap.set(seat.SeatCode, seat);
  });

  const busWrapper = document.createElement("div");
  busWrapper.className = "standard-bus-wrapper";

  const busContainer = document.createElement("div");
  busContainer.className = "standard-bus-container-45";

  // Hàm tạo ghế hoặc ô trống
  const createSeatOrEmpty = (code) => {
    const seat = seatMap.get(code);
    return seat
      ? createSeatElement(seat, seatIcon, layout.type)
      : createEmptySeat();
  };

  // ===== PHẦN TRÊN: 10 HÀNG x 4 CỘT =====
  const upperSection = document.createElement("div");
  upperSection.className = "standard-upper-section";

  // Nhóm trái (A, B) - 10 hàng
  const leftGroup = document.createElement("div");
  leftGroup.className = "standard-group";

  ["A", "B"].forEach((col) => {
    const columnDiv = document.createElement("div");
    columnDiv.className = "standard-column";

    const labelDiv = document.createElement("div");
    labelDiv.className = "column-label";
    labelDiv.textContent = col;
    columnDiv.appendChild(labelDiv);

    for (let i = 1; i <= 10; i++) {
      const numStr = String(i).padStart(2, "0");
      columnDiv.appendChild(createSeatOrEmpty(`${col}${numStr}`));
    }

    leftGroup.appendChild(columnDiv);
  });

  upperSection.appendChild(leftGroup);

  // Lối đi
  const aisleDiv = document.createElement("div");
  aisleDiv.className = "standard-aisle-vertical";
  upperSection.appendChild(aisleDiv);

  // Nhóm phải (D, E) - 10 hàng
  const rightGroup = document.createElement("div");
  rightGroup.className = "standard-group";

  ["D", "E"].forEach((col) => {
    const columnDiv = document.createElement("div");
    columnDiv.className = "standard-column";

    const labelDiv = document.createElement("div");
    labelDiv.className = "column-label";
    labelDiv.textContent = col;
    columnDiv.appendChild(labelDiv);

    for (let i = 1; i <= 10; i++) {
      const numStr = String(i).padStart(2, "0");
      columnDiv.appendChild(createSeatOrEmpty(`${col}${numStr}`));
    }

    rightGroup.appendChild(columnDiv);
  });

  upperSection.appendChild(rightGroup);
  busContainer.appendChild(upperSection);

  // ===== HÀNG CUỐI: 5 GHẾ (A11, B11, C01, D11, E11) =====
  const lastRow = document.createElement("div");
  lastRow.className = "standard-last-row";

  lastRow.appendChild(createSeatOrEmpty("A11"));
  lastRow.appendChild(createSeatOrEmpty("B11"));
  lastRow.appendChild(createSeatOrEmpty("C01")); // C01 nằm giữa
  lastRow.appendChild(createSeatOrEmpty("D11"));
  lastRow.appendChild(createSeatOrEmpty("E11"));

  busContainer.appendChild(lastRow);

  busWrapper.appendChild(busContainer);
  container.appendChild(busWrapper);

  console.log(
    "✅ Standard 45-seat bus rendered: A01-A11, B01-B11, C01, D01-D11, E01-E11",
  );
}

/**
 * Tạo ô ghế trống (placeholder)
 */
function createEmptySeat() {
  const empty = document.createElement("div");
  empty.className = "standard-empty-seat";
  return empty;
}

/**
 * Render xe Limousine 34 chỗ
 * Layout theo sơ đồ:
 * - Hàng 1-7: 4 ghế mỗi hàng (A, B | lối đi | D, E)
 * - Hàng 8: 5 ghế cùng dòng (A08, B08, C01, D08, E08) - C01 nằm giữa
 * Tổng: 8 + 8 + 1 + 8 + 8 = 33 ghế (hoặc 34 nếu thêm 1 ghế)
 */
function renderLimousineBus(container, layout) {
  const seatIcon = getSeatIcon(layout.type);
  const sortedSeats = sortSeatsByCode([...allSeats]);

  // Tạo map để tra cứu ghế theo mã
  const seatMap = new Map();
  sortedSeats.forEach((seat) => {
    seatMap.set(seat.SeatCode, seat);
  });

  const busWrapper = document.createElement("div");
  busWrapper.className = "standard-bus-wrapper";

  const busContainer = document.createElement("div");
  busContainer.className = "limousine-bus-container-34";

  // Hàm tạo ghế hoặc ô trống
  const createSeatOrEmpty = (code) => {
    const seat = seatMap.get(code);
    return seat
      ? createSeatElement(seat, seatIcon, layout.type)
      : createEmptySeat();
  };

  // ===== PHẦN TRÊN: 7 HÀNG x 4 CỘT =====
  const upperSection = document.createElement("div");
  upperSection.className = "standard-upper-section";

  // Nhóm trái (A, B) - 7 hàng
  const leftGroup = document.createElement("div");
  leftGroup.className = "standard-group";

  ["A", "B"].forEach((col) => {
    const columnDiv = document.createElement("div");
    columnDiv.className = "standard-column";

    const labelDiv = document.createElement("div");
    labelDiv.className = "column-label";
    labelDiv.textContent = col;
    columnDiv.appendChild(labelDiv);

    for (let i = 1; i <= 7; i++) {
      const numStr = String(i).padStart(2, "0");
      columnDiv.appendChild(createSeatOrEmpty(`${col}${numStr}`));
    }

    leftGroup.appendChild(columnDiv);
  });

  upperSection.appendChild(leftGroup);

  // Lối đi
  const aisleDiv = document.createElement("div");
  aisleDiv.className = "standard-aisle-vertical";
  upperSection.appendChild(aisleDiv);

  // Nhóm phải (D, E) - 7 hàng
  const rightGroup = document.createElement("div");
  rightGroup.className = "standard-group";

  ["D", "E"].forEach((col) => {
    const columnDiv = document.createElement("div");
    columnDiv.className = "standard-column";

    const labelDiv = document.createElement("div");
    labelDiv.className = "column-label";
    labelDiv.textContent = col;
    columnDiv.appendChild(labelDiv);

    for (let i = 1; i <= 7; i++) {
      const numStr = String(i).padStart(2, "0");
      columnDiv.appendChild(createSeatOrEmpty(`${col}${numStr}`));
    }

    rightGroup.appendChild(columnDiv);
  });

  upperSection.appendChild(rightGroup);
  busContainer.appendChild(upperSection);

  // ===== HÀNG CUỐI: 5 GHẾ (A08, B08, C01, D08, E08) =====
  const lastRow = document.createElement("div");
  lastRow.className = "standard-last-row";

  lastRow.appendChild(createSeatOrEmpty("A08"));
  lastRow.appendChild(createSeatOrEmpty("B08"));
  lastRow.appendChild(createSeatOrEmpty("C01")); // C01 nằm giữa
  lastRow.appendChild(createSeatOrEmpty("D08"));
  lastRow.appendChild(createSeatOrEmpty("E08"));

  busContainer.appendChild(lastRow);

  busWrapper.appendChild(busContainer);
  container.appendChild(busWrapper);

  console.log(
    "✅ Limousine 34-seat bus rendered: A01-A08, B01-B08, C01, D01-D08, E01-E08",
  );
}

/**
 * Render xe 2 tầng (giường nằm 40 chỗ, cabin 22 chỗ, limousine 34 chỗ)
 */
function renderTwoFloorBus(container, layout) {
  const seatIcon = getSeatIcon(layout.type);

  // Sắp xếp ghế theo mã
  const sortedSeats = sortSeatsByCode([...allSeats]);

  // Lọc và sắp xếp ghế theo tầng
  const floor1Seats = sortedSeats.filter(
    (s) => s.SeatCode && s.SeatCode.startsWith("A"),
  );
  const floor2Seats = sortedSeats.filter(
    (s) => s.SeatCode && s.SeatCode.startsWith("B"),
  );

  // ===== VIP CABIN 22 CHỖ =====
  // Tầng dưới: 2 cột (A01-A05, A06-A10) = 10 ghế
  // Tầng trên: 2 cột (B01-B06, B07-B12) = 12 ghế
  if (layout.type === "cabin") {
    // Container cho cả 2 tầng ngang hàng
    const floorsWrapper = document.createElement("div");
    floorsWrapper.className = "cabin-floors-wrapper";

    // ----- TẦNG DƯỚI -----
    const floor1Wrapper = document.createElement("div");
    floor1Wrapper.className = "cabin-floor-wrapper";

    const floor1Label = document.createElement("div");
    floor1Label.className = "floor-label-cabin";
    floor1Label.innerHTML = "<span>Tầng dưới</span>";
    floor1Wrapper.appendChild(floor1Label);

    const floor1Container = document.createElement("div");
    floor1Container.className = "cabin-floor-container";

    // Cột 1: A01, A02, A03, A04, A05
    const floor1Col1 = document.createElement("div");
    floor1Col1.className = "cabin-column";
    for (let i = 0; i < 5 && i < floor1Seats.length; i++) {
      const seatDiv = createSeatElement(floor1Seats[i], seatIcon, layout.type);
      floor1Col1.appendChild(seatDiv);
    }

    // Cột 2: A06, A07, A08, A09, A10
    const floor1Col2 = document.createElement("div");
    floor1Col2.className = "cabin-column";
    for (let i = 5; i < 10 && i < floor1Seats.length; i++) {
      const seatDiv = createSeatElement(floor1Seats[i], seatIcon, layout.type);
      floor1Col2.appendChild(seatDiv);
    }

    floor1Container.appendChild(floor1Col1);
    floor1Container.appendChild(floor1Col2);
    floor1Wrapper.appendChild(floor1Container);
    floorsWrapper.appendChild(floor1Wrapper);

    // ----- TẦNG TRÊN -----
    const floor2Wrapper = document.createElement("div");
    floor2Wrapper.className = "cabin-floor-wrapper";

    const floor2Label = document.createElement("div");
    floor2Label.className = "floor-label-cabin";
    floor2Label.innerHTML = "<span>Tầng trên</span>";
    floor2Wrapper.appendChild(floor2Label);

    const floor2Container = document.createElement("div");
    floor2Container.className = "cabin-floor-container";

    // Cột 1: B01, B02, B03, B04, B05, B06
    const floor2Col1 = document.createElement("div");
    floor2Col1.className = "cabin-column";
    for (let i = 0; i < 6 && i < floor2Seats.length; i++) {
      const seatDiv = createSeatElement(floor2Seats[i], seatIcon, layout.type);
      floor2Col1.appendChild(seatDiv);
    }

    // Cột 2: B07, B08, B09, B10, B11, B12
    const floor2Col2 = document.createElement("div");
    floor2Col2.className = "cabin-column";
    for (let i = 6; i < 12 && i < floor2Seats.length; i++) {
      const seatDiv = createSeatElement(floor2Seats[i], seatIcon, layout.type);
      floor2Col2.appendChild(seatDiv);
    }

    floor2Container.appendChild(floor2Col1);
    floor2Container.appendChild(floor2Col2);
    floor2Wrapper.appendChild(floor2Container);
    floorsWrapper.appendChild(floor2Wrapper);

    container.appendChild(floorsWrapper);
  }
  // ===== LIMOUSINE 34 CHỖ =====
  // Mỗi tầng: Cột trái 6 ghế, Cột giữa 5 ghế, Cột phải 6 ghế = 17 ghế
  else if (layout.type === "limousine") {
    // Container cho cả 2 tầng ngang hàng
    const floorsWrapper = document.createElement("div");
    floorsWrapper.className = "limousine-floors-wrapper";

    // ----- TẦNG DƯỚI -----
    const floor1Wrapper = document.createElement("div");
    floor1Wrapper.className = "limousine-floor-wrapper";

    const floor1Label = document.createElement("div");
    floor1Label.className = "floor-label-limousine";
    floor1Label.innerHTML = "<span>Tầng dưới</span>";
    floor1Wrapper.appendChild(floor1Label);

    const floor1Container = document.createElement("div");
    floor1Container.className = "limousine-floor-container";

    // Cột 1: A01-A06 (6 ghế)
    const floor1Col1 = document.createElement("div");
    floor1Col1.className = "limousine-column";
    for (let i = 0; i < 6 && i < floor1Seats.length; i++) {
      const seatDiv = createSeatElement(floor1Seats[i], seatIcon, layout.type);
      floor1Col1.appendChild(seatDiv);
    }

    // Cột 2: A07-A11 (5 ghế) - cột giữa offset
    const floor1Col2 = document.createElement("div");
    floor1Col2.className = "limousine-column limousine-column-middle";
    for (let i = 6; i < 11 && i < floor1Seats.length; i++) {
      const seatDiv = createSeatElement(floor1Seats[i], seatIcon, layout.type);
      floor1Col2.appendChild(seatDiv);
    }

    // Cột 3: A12-A17 (6 ghế)
    const floor1Col3 = document.createElement("div");
    floor1Col3.className = "limousine-column";
    for (let i = 11; i < 17 && i < floor1Seats.length; i++) {
      const seatDiv = createSeatElement(floor1Seats[i], seatIcon, layout.type);
      floor1Col3.appendChild(seatDiv);
    }

    floor1Container.appendChild(floor1Col1);
    floor1Container.appendChild(floor1Col2);
    floor1Container.appendChild(floor1Col3);
    floor1Wrapper.appendChild(floor1Container);
    floorsWrapper.appendChild(floor1Wrapper);

    // ----- TẦNG TRÊN -----
    const floor2Wrapper = document.createElement("div");
    floor2Wrapper.className = "limousine-floor-wrapper";

    const floor2Label = document.createElement("div");
    floor2Label.className = "floor-label-limousine";
    floor2Label.innerHTML = "<span>Tầng trên</span>";
    floor2Wrapper.appendChild(floor2Label);

    const floor2Container = document.createElement("div");
    floor2Container.className = "limousine-floor-container";

    // Cột 1: B01-B06 (6 ghế)
    const floor2Col1 = document.createElement("div");
    floor2Col1.className = "limousine-column";
    for (let i = 0; i < 6 && i < floor2Seats.length; i++) {
      const seatDiv = createSeatElement(floor2Seats[i], seatIcon, layout.type);
      floor2Col1.appendChild(seatDiv);
    }

    // Cột 2: B07-B11 (5 ghế) - cột giữa offset
    const floor2Col2 = document.createElement("div");
    floor2Col2.className = "limousine-column limousine-column-middle";
    for (let i = 6; i < 11 && i < floor2Seats.length; i++) {
      const seatDiv = createSeatElement(floor2Seats[i], seatIcon, layout.type);
      floor2Col2.appendChild(seatDiv);
    }

    // Cột 3: B12-B17 (6 ghế)
    const floor2Col3 = document.createElement("div");
    floor2Col3.className = "limousine-column";
    for (let i = 11; i < 17 && i < floor2Seats.length; i++) {
      const seatDiv = createSeatElement(floor2Seats[i], seatIcon, layout.type);
      floor2Col3.appendChild(seatDiv);
    }

    floor2Container.appendChild(floor2Col1);
    floor2Container.appendChild(floor2Col2);
    floor2Container.appendChild(floor2Col3);
    floor2Wrapper.appendChild(floor2Container);
    floorsWrapper.appendChild(floor2Wrapper);

    container.appendChild(floorsWrapper);
  }
  // ===== GIƯỜNG NẰM 40 CHỖ =====
  // Mỗi tầng 20 ghế theo bố cục:
  // - 3 cột dọc: mỗi cột 5 ghế (15 ghế)
  // - Hàng cuối: 5 ghế ngang
  //
  // Tầng dưới (A): A01-A05 | A06-A10 | A11-A15 + A16, A17, A18, A19, A20
  // Tầng trên (B): B01-B05 | B06-B10 | B11-B15 + B16, B17, B18, B19, B20
  else if (layout.type === "sleeper") {
    console.log("🛏️ Rendering SLEEPER layout");
    console.log("Floor 1 seats:", floor1Seats.length);
    console.log("Floor 2 seats:", floor2Seats.length);

    // Tạo map để tra cứu ghế theo mã
    const seatMap = new Map();
    sortedSeats.forEach((seat) => {
      seatMap.set(seat.SeatCode, seat);
    });

    // Hàm tạo ghế hoặc ô trống
    const createSeatOrEmpty = (code) => {
      const seat = seatMap.get(code);
      return seat
        ? createSeatElement(seat, seatIcon, layout.type)
        : createEmptySeat();
    };

    // Container cho cả 2 tầng ngang hàng
    const floorsWrapper = document.createElement("div");
    floorsWrapper.className = "sleeper-floors-wrapper";

    // Helper render tầng
    const renderFloor = (prefix, labelText) => {
      const floorWrapper = document.createElement("div");
      floorWrapper.className = "sleeper-floor-wrapper";

      // Label tầng
      const floorLabel = document.createElement("div");
      floorLabel.className = "floor-label-sleeper";
      floorLabel.innerHTML = `<span>${labelText}</span>`;
      floorWrapper.appendChild(floorLabel);

      // Container chứa các cột
      const floorContainer = document.createElement("div");
      floorContainer.className = "sleeper-floor-container-new";

      // Phần trên: 3 cột × 5 hàng
      const upperSection = document.createElement("div");
      upperSection.className = "sleeper-upper-section";

      // Cột 1: prefix01-prefix05
      const col1 = document.createElement("div");
      col1.className = "sleeper-column-main";
      for (let i = 1; i <= 5; i++) {
        col1.appendChild(
          createSeatOrEmpty(`${prefix}${String(i).padStart(2, "0")}`),
        );
      }

      // Cột 2: prefix06-prefix10
      const col2 = document.createElement("div");
      col2.className = "sleeper-column-main";
      for (let i = 6; i <= 10; i++) {
        col2.appendChild(
          createSeatOrEmpty(`${prefix}${String(i).padStart(2, "0")}`),
        );
      }

      // Cột 3: prefix11-prefix15
      const col3 = document.createElement("div");
      col3.className = "sleeper-column-main";
      for (let i = 11; i <= 15; i++) {
        col3.appendChild(
          createSeatOrEmpty(`${prefix}${String(i).padStart(2, "0")}`),
        );
      }

      upperSection.appendChild(col1);
      upperSection.appendChild(col2);
      upperSection.appendChild(col3);

      floorContainer.appendChild(upperSection);

      // Hàng cuối: 5 ghế ngang (prefix16-prefix20)
      const lastRow = document.createElement("div");
      lastRow.className = "sleeper-last-row";
      for (let i = 16; i <= 20; i++) {
        lastRow.appendChild(
          createSeatOrEmpty(`${prefix}${String(i).padStart(2, "0")}`),
        );
      }

      floorContainer.appendChild(lastRow);

      floorWrapper.appendChild(floorContainer);
      return floorWrapper;
    };

    // Render Tầng dưới (A)
    floorsWrapper.appendChild(renderFloor("A", "Tầng dưới"));

    // Render Tầng trên (B)
    floorsWrapper.appendChild(renderFloor("B", "Tầng trên"));

    container.appendChild(floorsWrapper);
    console.log("✅ Sleeper 40-seat layout rendered: A01-A20, B01-B20");
  }
}

/**
 * Lấy icon SVG theo loại xe - Tất cả dùng icon ghế sofa giống Limousine
 */
function getSeatIcon(type) {
  // Icon ghế sofa chung cho tất cả loại xe
  return `<svg viewBox="0 0 64 64" class="seat-icon limo-icon">
    <path class="seat-back" d="M8 6 C8 2, 12 0, 16 0 L48 0 C52 0, 56 2, 56 6 L56 30 L8 30 Z"/>
    <path class="seat-cushion" d="M4 32 C4 30, 6 28, 8 28 L56 28 C58 28, 60 30, 60 32 L60 48 C60 50, 58 52, 56 52 L8 52 C6 52, 4 50, 4 48 Z"/>
    <path class="seat-arm-left" d="M0 24 L6 24 L6 54 L0 54 C-2 54, -2 52, -2 50 L-2 28 C-2 26, -2 24, 0 24 Z"/>
    <path class="seat-arm-right" d="M58 24 L64 24 C66 24, 66 26, 66 28 L66 50 C66 52, 66 54, 64 54 L58 54 Z"/>
  </svg>`;
}

/**
 * Tạo element ghế
 */
function createSeatElement(seat, seatIcon, type) {
  const seatDiv = document.createElement("div");
  seatDiv.className = `seat seat-${type}`;
  seatDiv.dataset.seatId = seat.SeatId;
  seatDiv.dataset.seatCode = seat.SeatCode;
  seatDiv.innerHTML =
    seatIcon + `<span class="seat-code">${seat.SeatCode}</span>`;

  if (seat.IsAvailableForSegment === 0) {
    seatDiv.classList.add("occupied");
  } else {
    seatDiv.classList.add("available");
    seatDiv.onclick = () => toggleSeat(seat);
  }

  return seatDiv;
}

/**
 * Toggle chọn/bỏ chọn ghế
 */
function toggleSeat(seat) {
  const seatDiv = document.querySelector(`[data-seat-id="${seat.SeatId}"]`);

  if (seatDiv.classList.contains("occupied")) {
    return;
  }

  const index = selectedSeats.findIndex((s) => s.SeatId === seat.SeatId);

  if (index > -1) {
    // Bỏ chọn
    selectedSeats.splice(index, 1);
    seatDiv.classList.remove("selected");
    seatDiv.classList.add("available");
  } else {
    // Chọn ghế
    selectedSeats.push(seat);
    seatDiv.classList.remove("available");
    seatDiv.classList.add("selected");
  }

  updateBookingSummary();
}

/**
 * Cập nhật thông tin tóm tắt đặt vé
 */
function updateBookingSummary() {
  const selectedSeatsText = document.getElementById("selectedSeatsText");
  const seatCount = document.getElementById("seatCount");
  const totalAmount = document.getElementById("totalAmount");
  const btnBook = document.getElementById("btnBook");

  if (selectedSeats.length === 0) {
    selectedSeatsText.textContent = "Chưa chọn";
    seatCount.textContent = "0";
    totalAmount.textContent = "0 VNĐ";
    btnBook.disabled = true;
  } else {
    const seatCodes = selectedSeats.map((s) => s.SeatCode).join(", ");
    selectedSeatsText.textContent = seatCodes;
    seatCount.textContent = selectedSeats.length;

    const total = selectedSeats.length * seatPricePerSeat;
    totalAmount.textContent = total.toLocaleString("vi-VN") + " VNĐ";

    // Enable nút đặt vé nếu đã nhập thông tin
    const name = document.getElementById("customerName").value.trim();
    const phone = document.getElementById("customerPhone").value.trim();
    btnBook.disabled = !(name && phone);
  }
}

/**
 * Validate form khách hàng
 */
document
  .getElementById("customerName")
  .addEventListener("input", updateBookingSummary);
document
  .getElementById("customerPhone")
  .addEventListener("input", updateBookingSummary);

/**
 * Đặt vé
 */
async function bookSeats() {
  const btnBook = document.getElementById("btnBook");
  const customerName = document.getElementById("customerName").value.trim();
  const customerPhone = document.getElementById("customerPhone").value.trim();
  const customerEmail = document.getElementById("customerEmail").value.trim();

  // Validate
  if (selectedSeats.length === 0) {
    showToast("Vui lòng chọn ít nhất 1 ghế!", "error");
    return;
  }

  if (!customerName || !customerPhone) {
    showToast(
      "Vui lòng nhập đầy đủ thông tin họ tên và số điện thoại!",
      "error",
    );
    return;
  }

  if (!fromStopOrder || !toStopOrder) {
    showToast("Vui lòng chọn điểm đón và điểm trả!", "error");
    return;
  }

  // Disable button
  btnBook.disabled = true;
  btnBook.textContent = "Đang xử lý...";

  try {
    const userStr = localStorage.getItem("user");
    let userId = null;
    if (userStr) {
      try {
        const user = JSON.parse(userStr);
        userId = user.id;
      } catch (e) {
        console.error("Error parsing user from localStorage:", e);
      }
    }

    const bookingData = {
      tripId: currentTrip.TripId,
      userId: userId,
      seatCodes: selectedSeats.map((s) => s.SeatCode),
      fromStopOrder: fromStopOrder,
      toStopOrder: toStopOrder,
      customerName: customerName,
      customerPhone: customerPhone,
      customerEmail: customerEmail || null,
      amount: selectedSeats.length * seatPricePerSeat,
    };

    console.log("Gửi request đặt vé:", bookingData);

    const response = await fetch(`${API_BASE_URL}/bookings/lock`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(bookingData),
    });

    const data = await response.json();
    console.log("Response:", data);

    if (!data.success) {
      throw new Error(data.message || "Không thể đặt vé");
    }

    // Lưu bookingId vào sessionStorage
    const bookingId = data.data.booking.BookingId;
    sessionStorage.setItem("bookingId", bookingId);
    sessionStorage.setItem("bookingData", JSON.stringify(data.data.booking));

    // Chuyển sang trang thanh toán
    showToast("Đặt vé thành công! Chuyển sang trang thanh toán...", "success");
    setTimeout(() => {
      window.location.href = `checkout.html?bookingId=${bookingId}`;
    }, 1500);
  } catch (error) {
    console.error("Lỗi đặt vé:", error);
    showToast("Lỗi: " + error.message, "error");
    btnBook.disabled = false;
    btnBook.textContent = "Đặt Vé Ngay";
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

  // Hiệu ứng trượt vào
  requestAnimationFrame(() => {
    toast.style.transform = "translateX(0)";
  });

  // Tự động biến mất
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
 * Ẩn lỗi (nếu có)
 */
function hideError() {
  const errorDiv = document.getElementById("errorMessage");
  if (!errorDiv) return;
  errorDiv.textContent = "";
  errorDiv.style.display = "none";
}

/**
 * Định dạng thời gian an toàn từ chuỗi đầu vào. Trả về chuỗi rỗng nếu không hợp lệ.
 */
function safeFormatTime(timeInput) {
  try {
    if (!timeInput) return "";
    const d = new Date(timeInput);
    if (isNaN(d.getTime())) return "";
    return d.toLocaleTimeString("vi-VN", {
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch (e) {
    return "";
  }
}

/**
 * Định dạng ngày an toàn từ chuỗi đầu vào. Trả về chuỗi rỗng nếu không hợp lệ.
 */
function safeFormatDate(dateInput) {
  try {
    if (!timeInput) return "";
    // Nếu input đã là kiểu Date
    if (timeInput instanceof Date) {
      if (isNaN(timeInput.getTime())) return "";
      return timeInput.toLocaleTimeString("vi-VN", {
        hour: "2-digit",
        minute: "2-digit",
      });
    }

    // Nếu là chuỗi, thử parse bằng Date
    if (typeof timeInput === "string") {
      const trimmed = timeInput.trim();
      const d = new Date(trimmed);
      if (!isNaN(d.getTime())) {
        return d.toLocaleTimeString("vi-VN", {
          hour: "2-digit",
          minute: "2-digit",
        });
      }

      // Nếu không parse được bằng Date, kiểm tra chuỗi dạng HH:MM hoặc HH:MM:SS
      const m = trimmed.match(/^(\d{1,2}):(\d{2})(?::(\d{2}))?$/);
      if (m) {
        const hh = m[1].padStart(2, "0");
        const mm = m[2];
        return `${hh}:${mm}`;
      }

      return "";
    }

    // Fallback: thử tạo Date
    const d2 = new Date(timeInput);
    if (isNaN(d2.getTime())) return "";
    return d2.toLocaleTimeString("vi-VN", {
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch (e) {
    return "";
  }
}

/**
 * Ẩn loading
 */
function hideLoading() {
  document.getElementById("loadingMessage").style.display = "none";
}
