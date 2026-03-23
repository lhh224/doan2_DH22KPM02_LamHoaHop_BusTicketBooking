/**
 * File: assets/js/register.js
 * Mục đích: Xử lý đăng ký tài khoản
 */

const API_URL = "http://localhost:3000/api/v1";

// Get form elements
const registerForm = document.getElementById("registerForm");
const hoTenInput = document.getElementById("hoTen");
const usernameInput = document.getElementById("username");
const emailInput = document.getElementById("email");
const soDienThoaiInput = document.getElementById("soDienThoai");
const passwordInput = document.getElementById("password");
const confirmPasswordInput = document.getElementById("confirmPassword");
const submitBtn = document.getElementById("submitBtn");
const loading = document.getElementById("loading");
const alert = document.getElementById("alert");
const strengthBar = document.getElementById("strengthBar");

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
 * Validate phone
 */
function validatePhone(phone) {
  const re = /^(0|\+84)[0-9]{9}$/;
  return re.test(phone);
}

/**
 * Kiểm tra độ mạnh password
 */
function checkPasswordStrength(password) {
  let strength = 0;

  if (password.length >= 6) strength++;
  if (password.length >= 10) strength++;
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) strength++;
  if (/[0-9]/.test(password)) strength++;
  if (/[^a-zA-Z0-9]/.test(password)) strength++;

  return strength;
}

/**
 * Cập nhật thanh độ mạnh password
 */
passwordInput.addEventListener("input", () => {
  const password = passwordInput.value;
  const strength = checkPasswordStrength(password);

  strengthBar.className = "password-strength-bar";

  if (password.length === 0) {
    strengthBar.className = "password-strength-bar";
  } else if (strength <= 2) {
    strengthBar.className = "password-strength-bar weak";
  } else if (strength <= 3) {
    strengthBar.className = "password-strength-bar medium";
  } else {
    strengthBar.className = "password-strength-bar strong";
  }

  clearFieldError("password");
});

/**
 * Xử lý đăng ký
 */
registerForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  // Clear previous errors
  alert.classList.remove("show");
  [
    "hoTen",
    "username",
    "email",
    "soDienThoai",
    "password",
    "confirmPassword",
  ].forEach(clearFieldError);

  // Get form data
  const hoTen = hoTenInput.value.trim();
  const username = usernameInput.value.trim();
  const email = emailInput.value.trim();
  const soDienThoai = soDienThoaiInput.value.trim();
  const password = passwordInput.value;
  const confirmPassword = confirmPasswordInput.value;

  // Validation
  let hasError = false;

  if (!hoTen) {
    showFieldError("hoTen", "Vui lòng nhập họ tên");
    hasError = true;
  }

  if (!username) {
    showFieldError("username", "Vui lòng nhập tên đăng nhập");
    hasError = true;
  } else if (!/^[a-zA-Z0-9_]{3,50}$/.test(username)) {
    showFieldError(
      "username",
      "Tên đăng nhập chỉ gồm chữ, số, dấu _ (3-50 ký tự)",
    );
    hasError = true;
  }

  if (!email) {
    showFieldError("email", "Vui lòng nhập email");
    hasError = true;
  } else if (!validateEmail(email)) {
    showFieldError("email", "Email không hợp lệ");
    hasError = true;
  }

  if (soDienThoai && !validatePhone(soDienThoai)) {
    showFieldError("soDienThoai", "Số điện thoại không hợp lệ");
    hasError = true;
  }

  if (!password) {
    showFieldError("password", "Vui lòng nhập mật khẩu");
    hasError = true;
  } else if (password.length < 6) {
    showFieldError("password", "Mật khẩu phải có ít nhất 6 ký tự");
    hasError = true;
  }

  if (!confirmPassword) {
    showFieldError("confirmPassword", "Vui lòng xác nhận mật khẩu");
    hasError = true;
  } else if (password !== confirmPassword) {
    showFieldError("confirmPassword", "Mật khẩu xác nhận không khớp");
    hasError = true;
  }

  if (hasError) return;

  // Show loading
  submitBtn.disabled = true;
  loading.classList.add("show");

  try {
    const response = await fetch(`${API_URL}/auth/register`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        username,
        email,
        password,
        hoTen,
        soDienThoai: soDienThoai || null,
      }),
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.message || "Đăng ký thất bại");
    }

    // Lưu token vào localStorage
    localStorage.setItem("token", result.data.token);
    localStorage.setItem("refreshToken", result.data.refreshToken);
    localStorage.setItem("user", JSON.stringify(result.data.user));

    // Hiển thị thông báo thành công
    showAlert("Đăng ký thành công! Đang chuyển hướng...", "success");

    // Chuyển hướng
    setTimeout(() => {
      window.location.href = "index.html";
    }, 1500);
  } catch (error) {
    console.error("Register error:", error);
    showAlert(error.message || "Đã xảy ra lỗi. Vui lòng thử lại.");
  } finally {
    submitBtn.disabled = false;
    loading.classList.remove("show");
  }
});

// Clear error khi user nhập
hoTenInput.addEventListener("input", () => clearFieldError("hoTen"));
usernameInput.addEventListener("input", () => clearFieldError("username"));
emailInput.addEventListener("input", () => clearFieldError("email"));
soDienThoaiInput.addEventListener("input", () =>
  clearFieldError("soDienThoai"),
);
confirmPasswordInput.addEventListener("input", () =>
  clearFieldError("confirmPassword"),
);

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
          window.location.href = "index.html";
        }
      })
      .catch((err) => {
        // Token không hợp lệ, xóa và cho phép register
        localStorage.clear();
      });
  }
});
