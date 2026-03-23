/**
 * File: assets/js/login.js
 * Mục đích: Xử lý đăng nhập
 */

const API_URL = "http://localhost:3000/api/v1";

// Get form elements
const loginForm = document.getElementById("loginForm");
const usernameInput = document.getElementById("username");
const passwordInput = document.getElementById("password");
const submitBtn = document.getElementById("submitBtn");
const loading = document.getElementById("loading");
const alert = document.getElementById("alert");

/**
 * Hiển thị alert
 */
function showAlert(message, type = "error") {
  alert.textContent = message;
  alert.className = `alert alert-${type} show`;

  if (type === "success") {
    setTimeout(() => {
      alert.classList.remove("show");
    }, 3000);
  }
}

/**
 * Hiển thị lỗi field
 */
function showFieldError(fieldId, message) {
  const input = document.getElementById(fieldId);
  const errorDiv = document.getElementById(`${fieldId}Error`);

  input.classList.add("error");
  errorDiv.textContent = message;
  errorDiv.classList.add("show");
}

/**
 * Xóa lỗi field
 */
function clearFieldError(fieldId) {
  const input = document.getElementById(fieldId);
  const errorDiv = document.getElementById(`${fieldId}Error`);

  input.classList.remove("error");
  errorDiv.classList.remove("show");
}

/**
 * Validate email
 */
function validateEmail(email) {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
}

/**
 * Xử lý đăng nhập
 */
loginForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  // Clear previous errors
  alert.classList.remove("show");
  clearFieldError("username");
  clearFieldError("password");

  // Get form data
  const username = usernameInput.value.trim();
  const password = passwordInput.value;

  // Validation
  let hasError = false;

  if (!username) {
    showFieldError("username", "Vui lòng nhập tên đăng nhập");
    hasError = true;
  }

  if (!password) {
    showFieldError("password", "Vui lòng nhập mật khẩu");
    hasError = true;
  }

  if (hasError) return;

  // Show loading
  submitBtn.disabled = true;
  loading.classList.add("show");

  try {
    const response = await fetch(`${API_URL}/auth/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ username, password }),
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.message || "Đăng nhập thất bại");
    }

    // Lưu token vào localStorage
    localStorage.setItem("token", result.data.token);
    localStorage.setItem("refreshToken", result.data.refreshToken);
    localStorage.setItem("user", JSON.stringify(result.data.user));

    // Hiển thị thông báo thành công
    showAlert("Đăng nhập thành công! Đang chuyển hướng...", "success");

    // Chuyển hướng dựa vào vai trò
    setTimeout(() => {
      if (["ADMIN", "STAFF"].includes(result.data.user.VaiTro)) {
        window.location.href = "admin.html#bookings";
      } else {
        window.location.href = "index.html";
      }
    }, 1500);
  } catch (error) {
    console.error("Login error:", error);
    showAlert(error.message || "Đã xảy ra lỗi. Vui lòng thử lại.");
  } finally {
    submitBtn.disabled = false;
    loading.classList.remove("show");
  }
});

// Clear error khi user nhập
usernameInput.addEventListener("input", () => clearFieldError("username"));
passwordInput.addEventListener("input", () => clearFieldError("password"));

// Kiểm tra nếu đã đăng nhập
window.addEventListener("DOMContentLoaded", () => {
  const token = localStorage.getItem("token");
  if (token) {
    // Verify token còn hợp lệ không
    fetch(`${API_URL}/auth/me`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
      .then((response) => {
        if (response.ok) {
          // Token còn hợp lệ, redirect về trang chủ
          window.location.href = "/";
        }
      })
      .catch((err) => {
        // Token không hợp lệ, xóa và cho phép login
        localStorage.clear();
      });
  }
});
