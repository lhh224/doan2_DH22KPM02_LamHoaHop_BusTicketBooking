/**
 * File: main.js
 * Mục đích: Xử lý tương tác cho trang chủ hệ thống đặt vé xe
 */

// ===== CONSTANTS =====
const API_BASE_URL = "http://localhost:3000/api/v1";

// ===== DOM ELEMENTS =====
const searchForm = document.getElementById("searchForm");
const fromCity = document.getElementById("fromCity");
const toCity = document.getElementById("toCity");
const travelDate = document.getElementById("travelDate");
const swapBtn = document.getElementById("swapBtn");
const resultsSection = document.querySelector(".section-results");
const resultsCount = document.querySelector(".results-count");

// Chatbot elements
const chatbotBtn = document.querySelector(".chatbot-btn");
const chatbotWidget = document.querySelector(".chatbot-widget");
const chatbotClose = document.querySelector(".chatbot-close");
const chatMessages = document.querySelector(".chatbot-messages");
const chatForm = document.getElementById("chatForm");
const chatInput = document.getElementById("chatInput");

// Routes slider elements
const routesGrid = document.getElementById("routesGrid");
const routesPrevBtn = document.getElementById("routesPrevBtn");
const routesNextBtn = document.getElementById("routesNextBtn");
const routesDots = document.getElementById("routesDots");

// Routes slider state
let allRoutes = [];
let currentRouteIndex = 0;
let autoSlideInterval = null;
const AUTO_SLIDE_DELAY = 2000; // 2 giây - nhanh hơn

// ===== INITIALIZATION =====
document.addEventListener("DOMContentLoaded", () => {
  // Khởi tạo các event listeners
  initEventListeners();

  // Khởi tạo scroll animations
  initScrollAnimations();

  // Set ngày mặc định là hôm nay
  setDefaultDate();

  // Load dữ liệu ban đầu
  loadInitialData().then(() => {
    // Check URL params for auto-search
    const params = new URLSearchParams(window.location.search);
    const urlFrom = params.get("from");
    const urlTo = params.get("to");
    const urlDate = params.get("date");

    if (urlFrom && urlTo && urlDate) {
      if (fromCity) fromCity.value = urlFrom;
      if (toCity) toCity.value = urlTo;
      if (travelDate) travelDate.value = urlDate;

      // Scroll to search results section early to improve UX
      if (resultsSection) {
        resultsSection.style.display = "block";
        resultsSection.scrollIntoView({ behavior: "smooth", block: "start" });
      }

      // Auto trigger search
      searchTrips(urlFrom, urlTo, urlDate);
    }
  });

  // Load tuyến đường phổ biến
  loadPopularRoutes();

  console.log("✅ Hệ thống đã khởi tạo thành công");
});

/**
 * Khởi tạo các event listeners
 */
function initEventListeners() {
  // Search form
  if (searchForm) {
    searchForm.addEventListener("submit", handleSearch);
  }

  // Swap button
  if (swapBtn) {
    swapBtn.addEventListener("click", swapCities);
  }

  // Routes slider navigation
  if (routesPrevBtn) {
    routesPrevBtn.addEventListener("click", () => {
      stopAutoSlide();
      slideRoutes(-1);
      startAutoSlide();
    });
  }
  if (routesNextBtn) {
    routesNextBtn.addEventListener("click", () => {
      stopAutoSlide();
      slideRoutes(1);
      startAutoSlide();
    });
  }

  // Pause auto-slide khi hover vào slider
  const sliderWrapper = document.querySelector(".routes-slider-wrapper");
  if (sliderWrapper) {
    sliderWrapper.addEventListener("mouseenter", stopAutoSlide);
    sliderWrapper.addEventListener("mouseleave", startAutoSlide);
  }

  // Chatbot
  if (chatbotBtn) {
    chatbotBtn.addEventListener("click", toggleChatbot);
  }

  if (chatbotClose) {
    chatbotClose.addEventListener("click", toggleChatbot);
  }

  if (chatForm) {
    chatForm.addEventListener("submit", handleChatSubmit);
  }

  // Chatbot quick actions
  const chatQuickActions = document.getElementById("chatQuickActions");
  if (chatQuickActions) {
    chatQuickActions.addEventListener("click", (e) => {
      const btn = e.target.closest(".quick-action-btn");
      if (btn) {
        const msg = btn.dataset.msg;
        if (chatInput) chatInput.value = msg;
        if (typeof handleChatSubmit === "function") {
          handleChatSubmit(new Event("submit"));
        } else {
          chatForm.dispatchEvent(new Event("submit"));
        }
      }
    });
  }

  // Auto resize logic & enter to send
  if (chatInput) {
    chatInput.addEventListener("keydown", (e) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        if (typeof handleChatSubmit === "function") {
          handleChatSubmit(new Event("submit"));
        } else {
          chatForm.dispatchEvent(new Event("submit"));
        }
      }
    });
  }
}

/**
 * Khởi tạo scroll animations
 */
function initScrollAnimations() {
  const observerOptions = {
    threshold: 0.1,
    rootMargin: "0px 0px -50px 0px"
  };

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry, index) => {
      if (entry.isIntersecting) {
        // Add stagger effect
        setTimeout(() => {
          entry.target.classList.add('visible');
        }, index * 100);
        observer.unobserve(entry.target);
      }
    });
  }, observerOptions);

  document.querySelectorAll('.fade-up-element').forEach(el => {
    observer.observe(el);
  });
}

/**
 * Set ngày mặc định cho input date
 */
function setDefaultDate() {
  if (travelDate) {
    const today = new Date().toISOString().split("T")[0];
    travelDate.value = today;
    travelDate.min = today; // Không cho chọn ngày quá khứ
  }
}

/**
 * Load dữ liệu ban đầu (có thể load danh sách thành phố từ API)
 */
async function loadInitialData() {
  try {
    console.log("📊 Đang load dữ liệu ban đầu...");

    // Ẩn phần kết quả ban đầu
    if (resultsSection) {
      resultsSection.style.display = "none";
    }

    // Gọi API lấy danh sách điểm đi/đến
    const response = await fetch(`${API_BASE_URL}/trips/cities`);
    const data = await response.json();

    if (data.success && data.data) {
      const { fromCities = [], toCities = [] } = data.data;

      populateCitySelect(fromCity, fromCities, "Chọn điểm đi");
      populateCitySelect(toCity, toCities, "Chọn điểm đến");
    } else {
      console.warn("⚠️ Không lấy được danh sách thành phố", data.message);
    }
  } catch (error) {
    console.error("❌ Lỗi khi load dữ liệu ban đầu:", error);
    showNotification(
      "Không lấy được danh sách thành phố. Vui lòng thử lại sau",
      "danger",
    );
  }
}

/**
 * Xử lý tìm kiếm chuyến xe
 */
async function handleSearch(e) {
  e.preventDefault();

  const from = fromCity.value.trim();
  const to = toCity.value.trim();
  const date = travelDate.value;

  // Validate
  if (!from || !to || !date) {
    showNotification("Vui lòng điền đầy đủ thông tin tìm kiếm", "warning");
    return;
  }

  if (from === to) {
    showNotification("Điểm đi và điểm đến không được trùng nhau", "warning");
    return;
  }

  // Gọi API tìm kiếm
  await searchTrips(from, to, date);
}

// ===== SEARCH & FILTER STATE =====
let allTrips = []; // Tất cả chuyến xe từ API
let filteredTrips = []; // Chuyến xe sau khi lọc

/**
 * Gọi API tìm kiếm chuyến xe
 */
async function searchTrips(from, to, date) {
  try {
    showLoading(true);

    const response = await fetch(
      `${API_BASE_URL}/trips/search?from=${encodeURIComponent(
        from,
      )}&to=${encodeURIComponent(to)}&date=${date}`,
    );

    const data = await response.json();

    showLoading(false);

    if (data.success && data.data) {
      const trips = data.data.trips || [];
      allTrips = trips;
      filteredTrips = [...trips];
      displaySearchResults(trips, from, to, date);
    } else {
      allTrips = [];
      filteredTrips = [];
      displaySearchResults([], from, to, date);
    }
  } catch (error) {
    showLoading(false);
    console.error("❌ Lỗi khi tìm kiếm:", error);
    showNotification("Có lỗi xảy ra khi tìm kiếm. Vui lòng thử lại", "danger");
  }
}

/**
 * Hiển thị kết quả tìm kiếm inline trong trang chính
 */
function displaySearchResults(trips, from, to, date) {
  if (!resultsSection) return;

  // Hiển thị section kết quả
  resultsSection.style.display = "block";

  // Scroll xuống kết quả
  resultsSection.scrollIntoView({ behavior: "smooth", block: "start" });

  // Cập nhật route info
  const indexFromCity = document.getElementById("indexFromCity");
  const indexToCity = document.getElementById("indexToCity");
  const indexTripDate = document.getElementById("indexTripDate");
  const resultsCountSpan = document.getElementById("resultsCount");

  if (indexFromCity) indexFromCity.textContent = from;
  if (indexToCity) indexToCity.textContent = to;
  if (indexTripDate) {
    if (date === "all") {
      indexTripDate.textContent = "Tất cả các ngày tiếp theo";
    } else {
      const d = new Date(date);
      indexTripDate.textContent =
        ["CN", "T2", "T3", "T4", "T5", "T6", "T7"][d.getDay()] +
        ", " +
        d.toLocaleDateString("vi-VN");
    }
  }
  if (resultsCountSpan) resultsCountSpan.textContent = trips.length;

  // Load bộ lọc động (nhà xe, loại xe)
  loadDynamicFilters(trips);

  // Khởi tạo event listeners cho bộ lọc
  initFilterListeners();

  // Render danh sách chuyến xe
  renderTripList(trips);
}

/**
 * Load bộ lọc động: nhà xe, loại xe, khoảng giá, đánh giá từ dữ liệu chuyến
 */
function loadDynamicFilters(trips) {
  // Lọc nhà xe
  const companies = [
    ...new Set(trips.map((t) => t.CompanyName).filter(Boolean)),
  ];
  const companyFilter = document.getElementById("companyFilterIndex");
  if (companyFilter) {
    companyFilter.innerHTML =
      companies.length > 0
        ? companies
            .map(
              (c) =>
                `<label class="option"><input type="checkbox" name="companyIndex" value="${c}"> ${c}</label>`,
            )
            .join("")
        : '<p style="color: #999; font-size: 0.9rem; padding: 8px;">Không có dữ liệu</p>';
  }

  // Lọc loại xe
  const busTypes = [...new Set(trips.map((t) => t.BusType).filter(Boolean))];
  const busTypeFilter = document.getElementById("busTypeFilter");
  if (busTypeFilter) {
    busTypeFilter.innerHTML =
      busTypes.length > 0
        ? busTypes
            .map(
              (bt) =>
                `<label class="option"><input type="checkbox" name="busTypeIndex" value="${bt}"> ${bt}</label>`,
            )
            .join("")
        : '<p style="color: #999; font-size: 0.9rem; padding: 8px;">Không có dữ liệu</p>';
  }

  // Lọc khoảng giá - tính từ giá thực tế
  const prices = trips.map((t) => t.BasePrice || 0).filter((p) => p > 0);
  const priceFilter = document.getElementById("priceFilterIndex");
  if (priceFilter && prices.length > 0) {
    const minPrice = Math.min(...prices);
    const maxPrice = Math.max(...prices);

    // Tạo các khoảng giá dựa trên min/max thực tế
    const priceRanges = [];
    if (minPrice < 200000)
      priceRanges.push({ label: "Dưới 200.000đ", value: "0-200000" });
    if (maxPrice >= 200000)
      priceRanges.push({
        label: "200.000đ - 400.000đ",
        value: "200000-400000",
      });
    if (maxPrice >= 400000)
      priceRanges.push({
        label: "400.000đ - 600.000đ",
        value: "400000-600000",
      });
    if (maxPrice >= 600000)
      priceRanges.push({
        label: "600.000đ - 1.000.000đ",
        value: "600000-1000000",
      });
    if (maxPrice > 1000000)
      priceRanges.push({
        label: "Trên 1.000.000đ",
        value: "1000000-99999999",
      });

    priceFilter.innerHTML = priceRanges
      .map(
        (r) =>
          `<label class="option"><input type="checkbox" name="priceIndex" value="${r.value}"> ${r.label}</label>`,
      )
      .join("");
  } else if (priceFilter) {
    priceFilter.innerHTML =
      '<p style="color: #999; font-size: 0.9rem; padding: 8px;">Không có dữ liệu</p>';
  }

  // Lọc đánh giá - tính từ rating thực tế
  const ratings = trips
    .map((t) => parseFloat(t.Rating) || 0)
    .filter((r) => r > 0);
  const ratingFilter = document.getElementById("ratingFilterIndex");
  if (ratingFilter && ratings.length > 0) {
    const maxRating = Math.max(...ratings);
    const ratingOptions = [];

    if (maxRating >= 4.5)
      ratingOptions.push({ label: "4.5 trở lên", value: "4.5" });
    if (maxRating >= 4.0)
      ratingOptions.push({ label: "4.0 trở lên", value: "4" });
    if (maxRating >= 3.5)
      ratingOptions.push({ label: "3.5 trở lên", value: "3.5" });
    if (maxRating >= 3.0)
      ratingOptions.push({ label: "3.0 trở lên", value: "3" });

    ratingFilter.innerHTML = ratingOptions
      .map(
        (r) =>
          `<label class="option"><input type="checkbox" name="ratingIndex" value="${r.value}"> <i class="fas fa-star" style="color: #f59e0b;"></i> ${r.label}</label>`,
      )
      .join("");
  } else if (ratingFilter) {
    ratingFilter.innerHTML =
      '<p style="color: #999; font-size: 0.9rem; padding: 8px;">Không có dữ liệu</p>';
  }
}

/**
 * Khởi tạo event listeners cho bộ lọc và sắp xếp
 */
function initFilterListeners() {
  // Lắng nghe tất cả input filter/sort trong section kết quả
  const filterInputs = resultsSection.querySelectorAll(
    'input[name="sortIndex"], input[name="timeIndex"], input[name="companyIndex"], input[name="busTypeIndex"], input[name="priceIndex"], input[name="ratingIndex"]',
  );
  filterInputs.forEach((input) => {
    input.onchange = applyIndexFilters;
  });

  // Nút xóa lọc
  const btnClear = document.getElementById("btnClearFilters");
  if (btnClear) {
    btnClear.onclick = clearIndexFilters;
  }
}

/**
 * Áp dụng bộ lọc và sắp xếp
 */
function applyIndexFilters() {
  filteredTrips = [...allTrips];

  // === Lọc theo giờ đi ===
  const times = [
    ...document.querySelectorAll('input[name="timeIndex"]:checked'),
  ].map((c) => c.value);
  if (times.length) {
    filteredTrips = filteredTrips.filter((t) => {
      const h = new Date(t.DepartureTime).getHours();
      return times.some((r) => {
        const [a, b] = r.split("-").map(Number);
        return h >= a && h < b;
      });
    });
  }

  // === Lọc theo loại xe ===
  const busTypes = [
    ...document.querySelectorAll('input[name="busTypeIndex"]:checked'),
  ].map((c) => c.value);
  if (busTypes.length) {
    filteredTrips = filteredTrips.filter((t) => busTypes.includes(t.BusType));
  }

  // === Lọc theo nhà xe ===
  const companies = [
    ...document.querySelectorAll('input[name="companyIndex"]:checked'),
  ].map((c) => c.value);
  if (companies.length) {
    filteredTrips = filteredTrips.filter((t) =>
      companies.includes(t.CompanyName),
    );
  }

  // === Lọc theo khoảng giá ===
  const prices = [
    ...document.querySelectorAll('input[name="priceIndex"]:checked'),
  ].map((c) => c.value);
  if (prices.length) {
    filteredTrips = filteredTrips.filter((t) => {
      const price = t.BasePrice || 0;
      return prices.some((r) => {
        const [min, max] = r.split("-").map(Number);
        return price >= min && price <= max;
      });
    });
  }

  // === Lọc theo đánh giá ===
  const ratings = [
    ...document.querySelectorAll('input[name="ratingIndex"]:checked'),
  ].map((c) => parseFloat(c.value));
  if (ratings.length) {
    const minRating = Math.min(...ratings);
    filteredTrips = filteredTrips.filter(
      (t) => (parseFloat(t.Rating) || 0) >= minRating,
    );
  }

  // === Sắp xếp ===
  const sort = document.querySelector('input[name="sortIndex"]:checked')?.value;
  if (sort === "early") {
    filteredTrips.sort(
      (a, b) => new Date(a.DepartureTime) - new Date(b.DepartureTime),
    );
  } else if (sort === "late") {
    filteredTrips.sort(
      (a, b) => new Date(b.DepartureTime) - new Date(a.DepartureTime),
    );
  } else if (sort === "price-asc") {
    filteredTrips.sort((a, b) => (a.BasePrice || 0) - (b.BasePrice || 0));
  } else if (sort === "price-desc") {
    filteredTrips.sort((a, b) => (b.BasePrice || 0) - (a.BasePrice || 0));
  }

  // Cập nhật số lượng
  const resultsCountSpan = document.getElementById("resultsCount");
  if (resultsCountSpan) resultsCountSpan.textContent = filteredTrips.length;

  // Render lại danh sách
  renderTripList(filteredTrips);
}

/**
 * Xóa tất cả bộ lọc
 */
function clearIndexFilters() {
  if (!resultsSection) return;
  resultsSection
    .querySelectorAll('input[type="checkbox"]')
    .forEach((c) => (c.checked = false));
  const defaultSort = resultsSection.querySelector(
    'input[name="sortIndex"][value="default"]',
  );
  if (defaultSort) defaultSort.checked = true;
  applyIndexFilters();
}

/**
 * Render danh sách chuyến xe
 */
function renderTripList(trips) {
  const tripsList = document.getElementById("tripsList");
  if (!tripsList) return;

  if (!trips || trips.length === 0) {
    tripsList.innerHTML = `
      <div class="search-empty">
        <i class="fas fa-bus"></i>
        <h3>Không tìm thấy chuyến xe nào</h3>
        <p>Vui lòng thử tìm kiếm với thông tin khác hoặc thay đổi bộ lọc</p>
      </div>
    `;
    return;
  }

  tripsList.innerHTML = trips
    .map((t) => {
      // Ghép ngày và giờ để tạo đối tượng Date hợp lệ
      const parseDateTime = (dateStr, timeStr) => {
        if (!dateStr || !timeStr) return new Date();
        const dateOnly = new Date(dateStr).toISOString().split('T')[0];
        
        // Nếu timeStr là ISO string (chứa T), lấy phần HH:mm:ss
        let timeOnly = timeStr;
        if (timeStr.includes('T')) {
          timeOnly = timeStr.split('T')[1].split('.')[0];
        } else if (timeStr.includes('.')) {
          timeOnly = timeStr.split('.')[0];
        }
        
        return new Date(`${dateOnly}T${timeOnly}`);
      };

      // Tính ngày đến: nếu giờ đến < giờ đi thì chuyến qua đêm (+1 ngày)
      const computeArrivalDate = (departureDateStr, depTimeStr, arrTimeStr) => {
        const base = parseDateTime(departureDateStr, arrTimeStr);
        const depH = parseInt((depTimeStr || '00:00').split(':')[0], 10);
        const depM = parseInt((depTimeStr || '00:00').split(':')[1] || '0', 10);
        const arrH = parseInt((arrTimeStr || '00:00').split(':')[0], 10);
        const arrM = parseInt((arrTimeStr || '00:00').split(':')[1] || '0', 10);
        const depMinutes = depH * 60 + depM;
        const arrMinutes = arrH * 60 + arrM;
        if (arrMinutes < depMinutes) {
          base.setDate(base.getDate() + 1);
        }
        return base;
      };

      const dep = parseDateTime(t.DepartureDate, t.DepartureTime);
      const arr = computeArrivalDate(t.DepartureDate, t.DepartureTime, t.ArrivalTime);
      const seats = t.AvailableSeats || 0;
      const fmtTime = (d) =>
        isNaN(d.getTime()) ? "--:--" : d.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" });

      return `
      <div class="trip-card-search">
        <div class="trip-content">
          <div class="trip-img">
            <img src="${t.ImageUrl || 'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=300'}" alt="Bus">
            <span class="badge"><i class="fas fa-check"></i> Xác nhận</span>
          </div>
          <div class="trip-info-search">
            <h3>${t.CompanyName || "Nhà xe"} <span class="rating"><i class="fas fa-star"></i> ${t.Rating || "4.5"}</span></h3>
            <p class="bus-type">${t.BusType || "Xe khách"}</p>
            <div class="time-route">
              <div class="time-point">
                <div class="time">
                  ${fmtTime(dep)}
                  <div style="font-size: 0.75rem; color: var(--text-light); margin-top: 2px;">
                    ${t.DepartureDate ? new Date(t.DepartureDate).toLocaleDateString("vi-VN") : ""}
                  </div>
                </div>
                <div class="loc">${t.FromCity || "Điểm đi"}</div>
              </div>
              <div class="duration"><i class="fas fa-bus"></i><br>${t.EstimatedDuration || "--"}h</div>
              <div class="time-point">
                <div class="time">
                  ${fmtTime(arr)}
                  <div style="font-size: 0.75rem; color: var(--text-light); margin-top: 2px;">
                    ${arr && !isNaN(arr.getTime()) ? arr.toLocaleDateString("vi-VN") : (t.DepartureDate ? new Date(t.DepartureDate).toLocaleDateString("vi-VN") : "")}
                  </div>
                </div>
                <div class="loc">${t.ToCity || "Điểm đến"}</div>
              </div>
            </div>
          </div>
          <div class="trip-price-search">
            <div>
              <div class="price-value">${(t.BasePrice || 0).toLocaleString("vi-VN")}đ</div>
              <div class="seats-info ${seats <= 5 ? "low" : ""}">Còn ${seats} chỗ</div>
            </div>
            <div class="trip-actions-search">
              <button class="btn-detail" onclick="toggleTripDetail(this)">Chi tiết <i class="fas fa-chevron-down"></i></button>
              <button class="btn-select" onclick="location.href='seat-map.html?tripId=${t.TripId}'">Chọn chuyến</button>
            </div>
          </div>
        </div>
        <div class="trip-footer">
          <div class="features">
            <span><i class="fas fa-wifi"></i> Wifi</span>
            <span><i class="fas fa-snowflake"></i> Điều hòa</span>
            <span><i class="fas fa-plug"></i> Sạc điện</span>
          </div>
          <span>Không cần thanh toán trước</span>
        </div>
      </div>
    `;
    })
    .join("");
}

/**
 * Toggle chi tiết chuyến xe
 */
function toggleTripDetail(btn) {
  const card = btn.closest(".trip-card-search");
  if (card) {
    card.classList.toggle("expanded");
    const icon = btn.querySelector("i");
    if (icon) {
      icon.classList.toggle("fa-chevron-down");
      icon.classList.toggle("fa-chevron-up");
    }
  }
}

/**
 * Tạo card hiển thị thông tin chuyến xe
 */
function createTripCard(trip) {
  const card = document.createElement("div");
  card.className = "trip-card animate-fade-in";

  // Ghép ngày và giờ để tạo đối tượng Date hợp lệ
  const parseDateTime = (dateStr, timeStr) => {
    if (!dateStr || !timeStr) return new Date();
    const dateOnly = new Date(dateStr).toISOString().split('T')[0];
    
    // Nếu timeStr là ISO string (chứa T), lấy phần HH:mm:ss
    let timeOnly = timeStr;
    if (timeStr.includes('T')) {
      timeOnly = timeStr.split('T')[1].split('.')[0];
    } else if (timeStr.includes('.')) {
      timeOnly = timeStr.split('.')[0];
    }
    
    return new Date(`${dateOnly}T${timeOnly}`);
  };

  // Format giá tiền - sử dụng BasePrice từ API
  const priceFormatted = new Intl.NumberFormat("vi-VN").format(
    trip.BasePrice || 0,
  );

  // Số ghế còn trống từ API
  const seatsLeft = trip.AvailableSeats || 0;

  // Tính ngày đến: nếu giờ đến < giờ đi thì chuyến qua đêm (+1 ngày)
  const computeArrivalDate = (departureDateStr, depTimeStr, arrTimeStr) => {
    const base = parseDateTime(departureDateStr, arrTimeStr);
    const depH = parseInt((depTimeStr || '00:00').split(':')[0], 10);
    const depM = parseInt((depTimeStr || '00:00').split(':')[1] || '0', 10);
    const arrH = parseInt((arrTimeStr || '00:00').split(':')[0], 10);
    const arrM = parseInt((arrTimeStr || '00:00').split(':')[1] || '0', 10);
    const depMinutes = depH * 60 + depM;
    const arrMinutes = arrH * 60 + arrM;
    if (arrMinutes < depMinutes) {
      base.setDate(base.getDate() + 1);
    }
    return base;
  };

  // Format thời gian
  const depDate = parseDateTime(trip.DepartureDate, trip.DepartureTime);
  const arrDate = computeArrivalDate(trip.DepartureDate, trip.DepartureTime, trip.ArrivalTime);

  const departureTime = !isNaN(depDate.getTime()) 
    ? depDate.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })
    : "--:--";
  const arrivalTime = !isNaN(arrDate.getTime())
    ? arrDate.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })
    : "--:--";

  card.innerHTML = `
        <div class="trip-header">
            <div class="company-info">
                <i class="fas fa-bus-alt"></i>
                <div>
                    <h3>${trip.CompanyName || "Nhà xe"}</h3>
                    <p>${trip.BusType || "Xe khách"}</p>
                </div>
            </div>
            <div class="trip-price">
                <span class="price-label">Giá vé</span>
                <span class="price-value">${priceFormatted}đ</span>
            </div>
        </div>
        
        <div class="trip-route">
            <div class="route-point">
                <i class="fas fa-map-marker-alt"></i>
                <div>
                    <strong>${departureTime}</strong>
                    <p>${trip.FromCity || "Điểm đi"}</p>
                </div>
            </div>
            
            <div class="route-duration">
                <i class="fas fa-arrow-right"></i>
                <span>${trip.EstimatedDuration || "--"}h</span>
            </div>
            
            <div class="route-point">
                <i class="fas fa-map-marker-alt"></i>
                <div>
                    <strong>${arrivalTime}</strong>
                    <p>${trip.ToCity || "Điểm đến"}</p>
                </div>
            </div>
        </div>
        
        <div class="trip-info">
            <div class="info-item">
                <i class="fas fa-chair"></i>
                <span>${seatsLeft} ghế trống</span>
            </div>
            <div class="info-item">
                <i class="fas fa-star"></i>
                <span>${trip.Rating || "4.5"}/5</span>
            </div>
            <div class="info-item">
                <i class="fas fa-road"></i>
                <span>${trip.Distance || "--"}km</span>
            </div>
        </div>
        
        <div class="trip-actions">
            <button class="btn-view-seats" data-trip-id="${trip.TripId}">
                <i class="fas fa-th"></i>
                Xem sơ đồ ghế
            </button>
            <button class="btn-book-now" data-trip-id="${trip.TripId}">
                <i class="fas fa-ticket-alt"></i>
                Đặt vé ngay
            </button>
        </div>
    `;

  // Add event listeners cho các nút
  const viewSeatsBtn = card.querySelector(".btn-view-seats");
  const bookNowBtn = card.querySelector(".btn-book-now");

  viewSeatsBtn.addEventListener("click", () => viewSeats(trip.TripId));
  bookNowBtn.addEventListener("click", () => bookNow(trip.TripId));

  return card;
}

/**
 * Đổi chỗ điểm đi - điểm đến
 */
function swapCities() {
  if (fromCity && toCity) {
    const temp = fromCity.value;
    fromCity.value = toCity.value;
    toCity.value = temp;

    // Thêm animation
    swapBtn.style.transform = "rotate(180deg)";
    setTimeout(() => {
      swapBtn.style.transform = "rotate(0deg)";
    }, 300);
  }
}

/**
 * Xử lý tìm kiếm nhanh từ tuyến phổ biến
 */
function handleQuickSearch(e) {
  const card = e.currentTarget;
  const from = card.dataset.from;
  const to = card.dataset.to;

  if (from && to) {
    fromCity.value = from;
    toCity.value = to;

    // Scroll lên form tìm kiếm
    searchForm.scrollIntoView({ behavior: "smooth" });

    // Tự động submit sau 500ms
    setTimeout(() => {
      searchForm.dispatchEvent(new Event("submit"));
    }, 500);
  }
}

/**
 * Điền danh sách thành phố vào select từ dữ liệu API
 * @param {HTMLSelectElement} selectElement - thẻ select cần điền dữ liệu
 * @param {string[]} cities - danh sách thành phố lấy từ DB
 * @param {string} placeholder - nội dung option placeholder
 */
function populateCitySelect(selectElement, cities, placeholder) {
  if (!selectElement) return;

  selectElement.innerHTML = `<option value="">${placeholder}</option>`;

  const uniqueCities = Array.from(
    new Set((cities || []).filter((city) => city && city.trim())),
  ).sort((a, b) => a.localeCompare(b, "vi", { sensitivity: "base" }));

  uniqueCities.forEach((city) => {
    const option = document.createElement("option");
    option.value = city;
    option.textContent = city;
    selectElement.appendChild(option);
  });
}

/**
 * Xem sơ đồ ghế
 */
function viewSeats(tripId) {
  window.location.href = `seat-map.html?tripId=${tripId}`;
}

/**
 * Đặt vé ngay
 */
function bookNow(tripId) {
  window.location.href = `seat-map.html?tripId=${tripId}`;
}

/**
 * Toggle chatbot
 */
let chatHistory = [];

function toggleChatbot() {
  if (chatbotWidget) {
    const isHidden =
      chatbotWidget.style.display === "none" || !chatbotWidget.style.display;
    chatbotWidget.style.display = isHidden ? "flex" : "none";

    if (isHidden) {
      if (chatMessages && chatMessages.children.length === 0) {
        addChatMessage(
          "Xin chào! Tôi là trợ lý AI DatVeNhanh 🚌. Bạn cần hỗ trợ gì?",
          false
        );
      }
    }
  }
}

function clearChatHistory() {
  chatHistory = [];
  if (chatMessages) chatMessages.innerHTML = "";
  addChatMessage(
    "Xin chào! Tôi là trợ lý AI DatVeNhanh 🚌. Bạn cần hỗ trợ gì?",
    false
  );
}

/**
 * Xử lý gửi tin nhắn chat
 */
async function handleChatSubmit(e) {
  e.preventDefault();

  const msg = chatInput.value.trim();
  if (!msg) return;

  addChatMessage(msg, true);
  chatInput.value = "";
  chatHistory.push({ role: "user", content: msg });

  try {
    const res = await fetch(`${API_BASE_URL}/chat/ask`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: msg, chatHistory }),
    });
    const data = await res.json();
    if (data.success) {
      addChatMessage(data.data.reply, false);
      chatHistory.push({ role: "assistant", content: data.data.reply });
    } else {
      addChatMessage("Xin lỗi, tôi không thể trả lời lúc này.", false);
    }
  } catch {
    addChatMessage("Không thể kết nối server. Vui lòng thử lại sau.", false);
  }
}

/**
 * Thêm tin nhắn vào chatbot
 */
function addChatMessage(content, isUser = false) {
  if (!chatMessages) return;

  const div = document.createElement("div");
  div.className = `chat-message ${isUser ? "user" : "bot"}`;
  
  const safeContent = isUser
    ? content
    : content
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/\n/g, "<br>");
        
  div.innerHTML = `<div class="message-content">${safeContent}</div>`;
  chatMessages.appendChild(div);
  chatMessages.scrollTop = chatMessages.scrollHeight;
}

/**
 * Hiển thị thông báo
 */
function showNotification(message, type = "info") {
  console.log(`[${type.toUpperCase()}] ${message}`);
  alert(message);
}

/**
 * Hiển thị/Ẩn loading
 */
function showLoading(show) {
  console.log(show ? "⏳ Loading..." : "✅ Done");
}

/**
 * Format giá tiền VND
 */
function formatPrice(price) {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
  }).format(price);
}

/**
 * Format ngày giờ
 */
function formatDateTime(dateString) {
  const date = new Date(dateString);
  return date.toLocaleString("vi-VN");
}

// ===== POPULAR ROUTES SLIDER =====

/**
 * Load tuyến đường phổ biến từ database
 */
async function loadPopularRoutes() {
  if (!routesGrid) return;

  try {
    const response = await fetch(`${API_BASE_URL}/trips/routes`);
    const data = await response.json();

    if (data.success && data.data && data.data.routes) {
      allRoutes = data.data.routes;
      currentRouteIndex = 0;
      renderRoutesSlider();
      renderRoutesDots();
      updateRoutesNavigation();
      // Bắt đầu auto-slide
      startAutoSlide();
    } else {
      routesGrid.innerHTML = `
        <div class="routes-loading">
          <i class="fas fa-exclamation-circle"></i>
          <span>Không tải được tuyến đường</span>
        </div>
      `;
    }
  } catch (error) {
    console.error("❌ Lỗi khi load tuyến đường:", error);
    routesGrid.innerHTML = `
      <div class="routes-loading">
        <i class="fas fa-exclamation-triangle"></i>
        <span>Lỗi kết nối server</span>
      </div>
    `;
  }
}

/**
 * Render các thẻ tuyến đường - tạo infinite loop bằng cách clone
 */
function renderRoutesSlider() {
  if (!routesGrid || allRoutes.length === 0) return;

  // Hình ảnh mặc định nếu không có
  const defaultImage =
    "https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=400";

  // Tạo HTML cho các route với hình ảnh và layout mới
  const routeHTML = (route, index) => `
    <div class="route-card" 
         data-from="${route.DepartureCity}" 
         data-to="${route.ArrivalCity}"
         data-route-id="${route.RouteId}"
         onclick="handleRouteClick('${route.DepartureCity}', '${route.ArrivalCity}')"
         style="background-image: url('${route.ImageUrl || defaultImage}');">
      <div class="route-content">
        <h3>${route.DepartureCity} → ${route.ArrivalCity}</h3>
        <p class="route-info">
          ${route.Distance || "N/A"} km • ${route.EstimatedDuration || "N/A"}h
        </p>
        <p class="route-price">
          <span>Giá từ</span>
          <strong>${formatPrice(route.BasePrice || 200000)}</strong>
        </p>
      </div>
    </div>
  `;

  // Clone các route để tạo infinite loop (gấp 3 lần)
  const allRoutesHTML = allRoutes
    .map((route, i) => routeHTML(route, i))
    .join("");
  routesGrid.innerHTML = allRoutesHTML + allRoutesHTML + allRoutesHTML;

  // Bắt đầu từ giữa (phần gốc)
  currentRouteIndex = allRoutes.length;
  updateSliderPosition();
}

/**
 * Cập nhật vị trí của slider
 */
function updateSliderPosition() {
  if (!routesGrid) return;

  // Tính toán khoảng cách dịch chuyển (card width 320px + gap 25px)
  const cardWidth = 320;
  const gap = 25;
  const offset = currentRouteIndex * (cardWidth + gap);

  routesGrid.style.transform = `translateX(-${offset}px)`;
}

/**
 * Render các dots indicator
 */
function renderRoutesDots() {
  if (!routesDots || allRoutes.length === 0) return;

  routesDots.innerHTML = allRoutes
    .map(
      (_, i) => `
    <button class="routes-dot ${i === 0 ? "active" : ""}" 
            data-index="${i}"
            onclick="goToRoute(${i})">
    </button>
  `,
    )
    .join("");
}

/**
 * Cập nhật trạng thái dots (infinite loop)
 */
function updateRoutesNavigation() {
  if (routesDots) {
    const dots = routesDots.querySelectorAll(".routes-dot");
    // Tính index thực tế trong mảng gốc
    const realIndex = currentRouteIndex % allRoutes.length;
    dots.forEach((dot, i) => {
      dot.classList.toggle("active", i === realIndex);
    });
  }
}

/**
 * Bắt đầu auto-slide từ phải sang trái (infinite loop mượt mà)
 */
function startAutoSlide() {
  if (autoSlideInterval || allRoutes.length <= 1) return;

  autoSlideInterval = setInterval(() => {
    currentRouteIndex++;
    updateSliderPosition();
    updateRoutesNavigation();

    // Khi đến cuối phần clone thứ 2, nhảy về phần giữa (không có animation)
    if (currentRouteIndex >= allRoutes.length * 2) {
      setTimeout(() => {
        routesGrid.style.transition = "none";
        currentRouteIndex = allRoutes.length;
        updateSliderPosition();
        // Bật lại transition
        setTimeout(() => {
          routesGrid.style.transition = "transform 0.5s ease";
        }, 50);
      }, 500); // Đợi animation xong
    }
  }, AUTO_SLIDE_DELAY);
}

/**
 * Dừng auto-slide
 */
function stopAutoSlide() {
  if (autoSlideInterval) {
    clearInterval(autoSlideInterval);
    autoSlideInterval = null;
  }
}

/**
 * Slide tuyến đường theo hướng (infinite)
 * @param {number} direction - -1: trái, 1: phải
 */
function slideRoutes(direction) {
  currentRouteIndex += direction;
  updateSliderPosition();
  updateRoutesNavigation();

  // Xử lý loop khi đi quá giới hạn
  setTimeout(() => {
    if (currentRouteIndex >= allRoutes.length * 2) {
      routesGrid.style.transition = "none";
      currentRouteIndex = allRoutes.length;
      updateSliderPosition();
      setTimeout(() => {
        routesGrid.style.transition = "transform 0.5s ease";
      }, 50);
    } else if (currentRouteIndex < allRoutes.length) {
      routesGrid.style.transition = "none";
      currentRouteIndex = allRoutes.length * 2 - 1;
      updateSliderPosition();
      setTimeout(() => {
        routesGrid.style.transition = "transform 0.5s ease";
      }, 50);
    }
  }, 500);
}

/**
 * Nhảy đến tuyến đường theo index (từ dots)
 */
function goToRoute(index) {
  stopAutoSlide();
  // Chuyển đến vị trí trong phần giữa (phần gốc)
  currentRouteIndex = allRoutes.length + index;
  updateSliderPosition();
  updateRoutesNavigation();
  startAutoSlide();
}

/**
 * Xử lý khi click vào thẻ tuyến đường
 */
function handleRouteClick(from, to) {
  stopAutoSlide();

  // Khi click vào tuyến đường phổ biến, luôn tìm kiếm tất cả các chuyến từ hiện tại
  const date = "all";

  // Nếu đang ở index.html, chỉ cần thay đổi query parameters và scroll lên
  // Hoặc đổi URL rồi load lại trang
  window.location.href = `index.html?from=${encodeURIComponent(
    from,
  )}&to=${encodeURIComponent(to)}&date=${date}`;
}

// ===== EXPORT FOR OTHER PAGES =====
window.DatVeNhanhApp = {
  API_BASE_URL,
  formatPrice,
  formatDateTime,
  showNotification,
  showLoading,
};
