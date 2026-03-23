/**
 * File: auth-nav.js
 * Mục đích: Quản lý hiển thị navigation dựa trên trạng thái đăng nhập
 */

document.addEventListener("DOMContentLoaded", () => {
  updateNavigationAuth();
});

/**
 * Cập nhật navigation bar dựa trên trạng thái đăng nhập
 */
function updateNavigationAuth() {
  const token = localStorage.getItem("token");
  const userStr = localStorage.getItem("user");
  const navMenu = document.querySelector(".nav-menu");

  if (!navMenu) return;

  // Tìm các menu item đăng nhập/đăng ký
  const loginItem = Array.from(navMenu.querySelectorAll("li")).find((li) =>
    li.querySelector('a[href*="login.html"]'),
  );
  const registerItem = Array.from(navMenu.querySelectorAll("li")).find((li) =>
    li.querySelector('a[href*="register.html"]'),
  );

  if (token && userStr) {
    try {
      const user = JSON.parse(userStr);

      // Ẩn nút đăng nhập/đăng ký
      if (loginItem) loginItem.style.display = "none";
      if (registerItem) registerItem.style.display = "none";

      // Thêm menu người dùng
      const userMenuItem = document.createElement("li");
      userMenuItem.innerHTML = `
        <a href="#" class="user-menu">
          <i class="fas fa-user-circle"></i> ${user.HoTen || user.Email}
        </a>
      `;
      navMenu.appendChild(userMenuItem);

      // Thêm menu đăng xuất
      const logoutMenuItem = document.createElement("li");
      logoutMenuItem.innerHTML = `
        <a href="#" onclick="handleLogout(event)" style="color: #e74c3c;">
          <i class="fas fa-sign-out-alt"></i> Đăng Xuất
        </a>
      `;
      navMenu.appendChild(logoutMenuItem);

      // Nếu là admin, thêm link quản trị
      if (user.VaiTro === "ADMIN") {
        const adminMenuItem = document.createElement("li");
        adminMenuItem.innerHTML = `
          <a href="admin.html" style="color: #f39c12;">
            <i class="fas fa-cog"></i> Quản Trị
          </a>
        `;
        navMenu.insertBefore(adminMenuItem, userMenuItem);
      }
    } catch (error) {
      console.error("Lỗi parse user data:", error);
      localStorage.clear();
    }
  }
}

/**
 * Xử lý đăng xuất
 */
function handleLogout(event) {
  event.preventDefault();

  if (confirm("Bạn có chắc chắn muốn đăng xuất?")) {
    // Xóa thông tin đăng nhập
    localStorage.removeItem("token");
    localStorage.removeItem("refreshToken");
    localStorage.removeItem("user");

    // Chuyển về trang chủ
    window.location.href = "index.html";
  }
}
