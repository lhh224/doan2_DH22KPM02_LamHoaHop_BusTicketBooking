/**
 * File: admin-panel.js
 * Mục đích: Script chính cho trang admin - quản lý sidebar, navigation, auth
 */

const API_BASE = "http://localhost:3000/api/v1";
let currentSection = "dashboard";
let currentUser = null;

function getAllowedSectionsByRole() {
  const allSections = [
    "dashboard",
    "companies",
    "routes",
    "stops",
    "trips",
    "statistics",
    "accounts",
    "logs",
    "bookings",
    "reviews",
  ];

  if (!currentUser || currentUser.VaiTro === "ADMIN") return allSections;
  if (currentUser.VaiTro === "STAFF") {
    return allSections.filter((s) => !["accounts", "logs"].includes(s));
  }

  return [];
}

// ========================================
// KHỞI TẠO
// ========================================
document.addEventListener("DOMContentLoaded", async () => {
  await checkAdminAuth();
  setupSidebar();
  // Đọc section từ URL hash (hỗ trợ redirect từ các trang standalone cũ)
  const validSections = getAllowedSectionsByRole();
  const hashSection = window.location.hash.slice(1);
  const fallbackSection = "dashboard";
  loadSection(
    validSections.includes(hashSection) ? hashSection : fallbackSection,
  );
});

/**
 * Kiểm tra quyền admin/staff
 */
async function checkAdminAuth() {
  const token = localStorage.getItem("token");
  const userStr = localStorage.getItem("user");

  if (!token || !userStr) {
    alert("⚠️ Bạn cần đăng nhập với tài khoản Admin!");
    window.location.href = "/pages/login.html";
    return;
  }

  try {
    currentUser = JSON.parse(userStr);
    if (!["ADMIN", "STAFF"].includes(currentUser.VaiTro)) {
      alert("⚠️ Chỉ tài khoản Admin hoặc Nhà xe mới có quyền truy cập!");
      window.location.href = "/pages/index.html";
      return;
    }

    // Hiển thị thông tin admin
    const adminName = currentUser.HoTen || currentUser.Email || "Admin";
    document.getElementById("sidebarAdminName").textContent = adminName;
    document.getElementById("topAdminName").textContent = adminName;

    // Hiện/ẩn menu theo quyền
    const navAccounts = document.getElementById("navAccounts");
    const navLogs = document.querySelector('.nav-item[data-section="logs"]');
    if (navAccounts)
      navAccounts.style.display = currentUser.VaiTro === "ADMIN" ? "" : "none";
    if (navLogs)
      navLogs.style.display = currentUser.VaiTro === "ADMIN" ? "" : "none";
  } catch (error) {
    console.error("Lỗi parse user:", error);
    localStorage.clear();
    window.location.href = "/pages/login.html";
  }
}

/**
 * Thiết lập sidebar
 */
function setupSidebar() {
  const sidebar = document.getElementById("sidebar");
  const toggleBtn = document.getElementById("sidebarToggle");
  const mobileToggle = document.getElementById("mobileToggle");

  // Toggle thu gọn sidebar
  toggleBtn.addEventListener("click", () => {
    sidebar.classList.toggle("collapsed");
  });

  // Mobile toggle
  mobileToggle.addEventListener("click", () => {
    sidebar.classList.toggle("mobile-open");
  });

  // Đóng sidebar mobile khi click bên ngoài
  document.addEventListener("click", (e) => {
    if (
      window.innerWidth <= 768 &&
      !sidebar.contains(e.target) &&
      !mobileToggle.contains(e.target)
    ) {
      sidebar.classList.remove("mobile-open");
    }
  });

  // Click vào nav item
  document.querySelectorAll(".nav-item[data-section]").forEach((item) => {
    item.addEventListener("click", (e) => {
      e.preventDefault();
      const section = item.getAttribute("data-section");
      loadSection(section);

      // Đóng sidebar mobile
      if (window.innerWidth <= 768) {
        sidebar.classList.remove("mobile-open");
      }
    });
  });
}

/**
 * Chuyển section
 */
function loadSection(section) {
  const allowedSections = getAllowedSectionsByRole();
  if (!allowedSections.includes(section)) {
    section = "dashboard";
  }

  currentSection = section;

  // Cập nhật active state
  document.querySelectorAll(".nav-item[data-section]").forEach((item) => {
    item.classList.remove("active");
    if (item.getAttribute("data-section") === section) {
      item.classList.add("active");
    }
  });

  // Cập nhật tiêu đề
  const titles = {
    dashboard: "Dashboard",
    companies: "Quản Lý Nhà Xe",
    routes: "Quản Lý Tuyến Đường",
    stops: "Quản Lý Điểm Dừng",
    trips: "Quản Lý Chuyến Xe",
    statistics: "Thống Kê",
    accounts: "Quản Lý Tài Khoản",
    logs: "Nhật Ký Hệ Thống",
    bookings: "Quản Lý Đặt Vé",
    reviews: "Quản Lý Đánh Giá",
  };
  document.getElementById("pageTitle").textContent = titles[section] || section;

  // Hiển thị loading
  const contentArea = document.getElementById("contentArea");
  contentArea.innerHTML =
    '<div class="section-loading"><span class="spinner"></span> Đang tải...</div>';

  // Gọi hàm render tương ứng
  switch (section) {
    case "dashboard":
      renderDashboard();
      break;
    case "companies":
      renderCompaniesSection();
      break;
    case "routes":
      renderRoutesSection();
      break;
    case "stops":
      renderStopsSection();
      break;
    case "trips":
      renderTripsSection();
      break;
    case "statistics":
      renderStatisticsSection();
      break;
    case "accounts":
      renderAccountsSection();
      break;
    case "logs":
      renderLogsSection();
      break;
    case "bookings":
      renderBookingsSection();
      break;
    case "reviews":
      renderReviewsSection();
      break;
    default:
      contentArea.innerHTML =
        '<div class="empty-state"><div class="empty-state-text">Chức năng đang phát triển</div></div>';
  }
}

// ========================================
// CONTEXT MENU LOGIC
// ========================================
const ContextMenu = {
  menu: null,
  activeItem: null,

  init() {
    this.menu = document.getElementById("contextMenu");

    // Hide menu on click elsewhere
    document.addEventListener("click", () => this.hide());

    // Hide menu on scroll
    document.addEventListener("scroll", () => this.hide(), true);

    // Global right-click listener for tables
    document.addEventListener("contextmenu", (e) => {
      const row = e.target.closest("tr");
      if (row && row.dataset.context) {
        e.preventDefault();
        this.show(e.clientX, e.clientY, row);
      }
    });
  },

  show(x, y, row) {
    const contextType = row.dataset.context;
    const dataItem = JSON.parse(decodeURIComponent(row.dataset.item));
    this.activeItem = dataItem;

    const items = this.getMenuItems(contextType, dataItem);
    if (!items || items.length === 0) return;

    this.renderItems(items);

    // Position
    this.menu.style.display = "block";

    // Adjust position if it goes off screen
    const menuWidth = this.menu.offsetWidth;
    const menuHeight = this.menu.offsetHeight;
    const winWidth = window.innerWidth;
    const winHeight = window.innerHeight;

    let posX = x;
    let posY = y;

    if (x + menuWidth > winWidth) posX = x - menuWidth;
    if (y + menuHeight > winHeight) posY = y - menuHeight;

    this.menu.style.left = `${posX}px`;
    this.menu.style.top = `${posY}px`;
  },

  hide() {
    if (this.menu) this.menu.style.display = "none";
  },

  renderItems(items) {
    const list = this.menu.querySelector(".context-menu-items");
    list.innerHTML = items
      .map((item) => {
        if (item.separator) return '<li class="context-menu-separator"></li>';
        return `
        <li class="context-menu-item ${item.danger ? "danger" : ""}" 
            onclick="${item.action}">
          ${item.label}
        </li>
      `;
      })
      .join("");
  },

  getMenuItems(type, data) {
    switch (type) {
      case "company":
        return [
          {
            label: "Xem chi tiết",
            action: `showCompanyDetail(${data.CompanyID})`,
          },
          { separator: true },
          {
            label: "Chỉnh sửa",
            action: `openEditCompanyModal(${data.CompanyID})`,
          },
          { separator: true },
          {
            label: "Xóa nhà xe",
            action: `deleteCompanyPanel(${data.CompanyID})`,
            danger: true,
          },
        ];
      case "route":
        return [
          {
            label: "Xem chi tiết",
            action: `showRouteDetail(${data.route_id || data.id})`,
          },
          { separator: true },
          {
            label: "Chỉnh sửa",
            action: `openEditRouteModal(${data.route_id || data.id})`,
          },
          { separator: true },
          {
            label: "Xóa tuyến đường",
            action: `deleteRoutePanel(${data.route_id || data.id})`,
            danger: true,
          },
        ];
      case "stop":
        return [
          { label: "Xem chi tiết", action: `showStopDetail(${data.StopId})` },
          { separator: true },
          { label: "Chỉnh sửa", action: `openEditStopModal(${data.StopId})` },
          { separator: true },
          {
            label: "Xóa điểm dừng",
            action: `deleteStopPanel(${data.StopId})`,
            danger: true,
          },
        ];
      case "trip":
        return [
          { label: "Xem chi tiết", action: `showTripDetail(${data.TripId})` },
          { separator: true },
          { label: "Chỉnh sửa", action: `openEditTripModal(${data.TripId})` },
          { separator: true },
          {
            label: "Xóa chuyến xe",
            action: `deleteTripPanel(${data.TripId})`,
            danger: true,
          },
        ];
      case "account":
        const isActive = data.Status === true || data.Status === 1;
        const action = isActive ? "lock" : "unlock";
        const label = isActive ? "Khóa tài khoản" : "Mở khóa tài khoản";
        return [
          {
            label: label,
            action: `toggleLockAccount(${data.UserId}, '${action}')`,
            danger: isActive,
          },
        ];
      case "booking":
        const isPending = data.Status === "PENDING";
        const bookingItems = [
          {
            label: "Xem chi tiết",
            action: `showBookingDetail(${data.BookingId})`,
          },
        ];
        if (isPending) {
          bookingItems.push({ separator: true });
          bookingItems.push({
            label: "Xác nhận thanh toán",
            action: `confirmBookingPayment(${data.BookingId})`,
          });
          bookingItems.push({
            label: "Hủy đặt vé",
            action: `cancelBooking(${data.BookingId})`,
            danger: true,
          });
        }
        return bookingItems;
      case "review":
        const reviewItems = [
          {
            label: "Xem chi tiết",
            action: `showReviewDetail(${data.ReviewId})`,
          },
        ];
        if (data.Status === "PENDING") {
          reviewItems.push({ separator: true });
          reviewItems.push({
            label: "Duyệt đánh giá",
            action: `approveReview(${data.ReviewId})`,
          });
          reviewItems.push({
            label: "Từ chối đánh giá",
            action: `rejectReview(${data.ReviewId})`,
            danger: true,
          });
        }
        return reviewItems;
      default:
        return [];
    }
  },
};

// Initialize Context Menu
document.addEventListener("DOMContentLoaded", () => {
  ContextMenu.init();
});

// ========================================
// UTILITY FUNCTIONS
// ========================================

/**
 * Gọi API với token
 */
async function adminFetch(url, options = {}) {
  const token = localStorage.getItem("token");
  const defaultHeaders = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  };

  const response = await fetch(`${API_BASE}${url}`, {
    ...options,
    headers: { ...defaultHeaders, ...options.headers },
  });

  // Token hết hạn hoặc không hợp lệ → redirect về login
  if (response.status === 401) {
    localStorage.removeItem("token");
    localStorage.removeItem("refreshToken");
    localStorage.removeItem("user");
    alert("⚠️ Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.");
    window.location.href = "/pages/login.html";
    throw new Error("Token không hợp lệ hoặc đã hết hạn.");
  }

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Lỗi API");
  }

  return data;
}

/**
 * Hiển thị thông báo
 */
function showAlert(message, type = "success") {
  const alertBox = document.getElementById("alertBox");
  const alert = document.createElement("div");
  alert.className = `alert-item ${type}`;
  alert.innerHTML = `${message}`;
  alertBox.appendChild(alert);

  setTimeout(() => {
    alert.style.opacity = "0";
    alert.style.transform = "translateX(100%)";
    setTimeout(() => alert.remove(), 300);
  }, 3000);
}

/**
 * Format tiền VNĐ
 */
function formatCurrency(amount) {
  if (!amount) return "0 đ";
  return new Intl.NumberFormat("vi-VN").format(amount) + " đ";
}

/**
 * Format giá tiền (dạng currency VND)
 */
function formatPrice(price) {
  if (!price) return "0 ₫";
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
  }).format(price);
}

/**
 * Format ngày
 */
function formatDate(dateStr) {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  return d.toLocaleDateString("vi-VN");
}

/**
 * Format ngày giờ
 */
function formatDateTime(dateStr) {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  return d.toLocaleString("vi-VN");
}

/**
 * Mở modal chung
 */
function openGlobalModal(title, bodyHtml, maxWidth = "600px") {
  const modal = document.getElementById("globalModal");
  document.getElementById("modalTitle").textContent = title;
  document.getElementById("modalBody").innerHTML = bodyHtml;
  document.getElementById("modalContent").style.maxWidth = maxWidth;
  modal.classList.add("show");
}

/**
 * Đóng modal chung
 */
function closeGlobalModal() {
  document.getElementById("globalModal").classList.remove("show");
}

/**
 * Đóng modal khi click bên ngoài
 */
document.addEventListener("click", (e) => {
  const modal = document.getElementById("globalModal");
  if (e.target === modal) {
    closeGlobalModal();
  }
});

/**
 * Đăng xuất
 */
function logout() {
  if (confirm("Bạn có chắc chắn muốn đăng xuất?")) {
    localStorage.removeItem("token");
    localStorage.removeItem("refreshToken");
    localStorage.removeItem("user");
    window.location.href = "/pages/login.html";
  }
}

/**
 * Hiển thị badge trạng thái
 */
function statusBadge(status) {
  const map = {
    ACTIVE: '<span class="badge badge-success">Hoạt động</span>',
    INACTIVE: '<span class="badge badge-secondary">Không hoạt động</span>',
    BLOCKED: '<span class="badge badge-danger">Đã khóa</span>',
    1: '<span class="badge badge-success">Hoạt động</span>',
    0: '<span class="badge badge-danger">Đã khóa</span>',
    true: '<span class="badge badge-success">Hoạt động</span>',
    false: '<span class="badge badge-danger">Đã khóa</span>',
    PAID: '<span class="badge badge-success">Đã thanh toán</span>',
    PENDING: '<span class="badge badge-warning">Chờ xử lý</span>',
    CANCELLED: '<span class="badge badge-danger">Đã hủy</span>',
    COMPLETED: '<span class="badge badge-success">Hoàn thành</span>',
    SUCCESS: '<span class="badge badge-success">Thành công</span>',
    FAILED: '<span class="badge badge-danger">Thất bại</span>',
  };
  return map[status] || `<span class="badge badge-secondary">${status}</span>`;
}
