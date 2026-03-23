/**
 * File: admin-accounts.js
 * Mục đích: Quản lý tài khoản - chỉ admin mới thấy
 * Chức năng: Tạo tài khoản nhân viên, khóa/mở khóa tài khoản
 */

let accountsList = [];

// ========================================
// RENDER SECTION TÀI KHOẢN
// ========================================
async function renderAccountsSection() {
  const contentArea = document.getElementById("contentArea");

  contentArea.innerHTML = `
    <!-- Toolbar -->
    <div class="toolbar">
      <div class="toolbar-left">
        <input type="text" class="search-input" id="accountSearch" placeholder="Tìm theo tên, email, SĐT..." oninput="filterAccounts()" />
        <select class="filter-select" id="accountRoleFilter" onchange="filterAccounts()">
          <option value="">Tất cả vai trò</option>
          <option value="ADMIN">Admin</option>
          <option value="STAFF">Nhân viên</option>
          <option value="CUSTOMER">Khách hàng</option>
        </select>
        <select class="filter-select" id="accountStatusFilter" onchange="filterAccounts()">
          <option value="">Tất cả trạng thái</option>
          <option value="1">Đang mở</option>
          <option value="0">Đã khóa</option>
        </select>
        <div class="toolbar-info" id="accountsTableInfo" style="margin-left: 16px; font-weight: 500; color: var(--text-secondary);">Đang tải...</div>
      </div>
      <div class="toolbar-right">
        <button class="btn btn-primary" onclick="openCreateStaffModal()">
          Tạo Tài Khoản Nhân Viên
        </button>
      </div>
    </div>

    <!-- Table -->
    <div class="card">
      <div class="card-body no-padding">
        <div class="table-responsive">
          <table class="data-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Họ Tên</th>
                <th>Email</th>
                <th>SĐT</th>
                <th>Vai Trò</th>
                <th>Trạng Thái</th>
                <th>Ngày Tạo</th>
                <th>Lần Đăng Nhập Cuối</th>
              </tr>
            </thead>
            <tbody id="accountsTableBody">
              <tr class="loading-row"><td colspan="8"><span class="spinner"></span> Đang tải...</td></tr>
            </tbody>
          </table>
        </div>
      </div>
      <div class="table-footer" style="display:none;"></div>
    </div>
  `;

  await loadAccounts();
}

/**
 * Load danh sách tài khoản
 */
async function loadAccounts() {
  try {
    const res = await adminFetch("/admin/users");
    accountsList = res.data || [];
    renderAccountsTable(accountsList);
  } catch (e) {
    console.error("Lỗi load tài khoản:", e);
    showAlert("Lỗi khi tải danh sách tài khoản", "error");
  }
}

/**
 * Render bảng tài khoản
 */
function renderAccountsTable(data) {
  const tbody = document.getElementById("accountsTableBody");
  const info = document.getElementById("accountsTableInfo");

  if (!data || data.length === 0) {
    tbody.innerHTML =
      '<tr class="loading-row"><td colspan="8">Không có dữ liệu</td></tr>';
    info.textContent = "0 tài khoản";
    return;
  }

  tbody.innerHTML = data
    .map((user) => {
      const roleBadge = {
        ADMIN: '<span style="color:var(--text-primary); font-weight:700">ADMIN</span>',
        STAFF: '<span style="color:var(--text-primary); font-weight:700">NHÂN VIÊN</span>',
        CUSTOMER: '<span style="color:var(--text-primary); font-weight:700">KHÁCH HÀNG</span>',
      };



      return `
      <tr data-context="account" data-item="${encodeURIComponent(JSON.stringify(user))}">
        <td class="col-id">#${user.UserId}</td>
        <td><strong>${user.FullName || "--"}</strong></td>
        <td class="col-email">${user.Email}</td>
        <td>${user.Phone || "--"}</td>
        <td>${roleBadge[user.Role] || user.Role}</td>
        <td>
          ${statusBadge(user.Status)}
        </td>
        <td>${formatDate(user.CreatedAt)}</td>
        <td>${user.LastLoginAt ? formatDateTime(user.LastLoginAt) : '<span style="color:var(--text-secondary)">Chưa đăng nhập</span>'}</td>
      </tr>
    `;
    })
    .join("");

  info.textContent = `Tổng: ${data.length} tài khoản`;
}

/**
 * Lọc danh sách tài khoản
 */
function filterAccounts() {
  const search = document.getElementById("accountSearch").value.toLowerCase();
  const roleFilter = document.getElementById("accountRoleFilter").value;
  const statusFilter = document.getElementById("accountStatusFilter").value;

  let filtered = accountsList;

  if (search) {
    filtered = filtered.filter(
      (u) =>
        (u.FullName && u.FullName.toLowerCase().includes(search)) ||
        (u.Email && u.Email.toLowerCase().includes(search)) ||
        (u.Phone && u.Phone.includes(search)),
    );
  }

  if (roleFilter) {
    filtered = filtered.filter((u) => u.Role === roleFilter);
  }

  if (statusFilter !== "") {
    const statusVal = statusFilter === "1";
    filtered = filtered.filter((u) => (u.Status === statusVal || u.Status === parseInt(statusFilter)));
  }

  renderAccountsTable(filtered);
}

/**
 * Mở modal tạo tài khoản nhân viên
 */
function openCreateStaffModal() {
  const html = `
    <form id="createStaffForm" onsubmit="submitCreateStaff(event)">
      <div class="form-row">
        <div class="form-group">
          <label>Họ Tên *</label>
          <input type="text" id="staffFullName" required placeholder="Nhập họ tên" />
        </div>
        <div class="form-group">
          <label>Email *</label>
          <input type="email" id="staffEmail" required placeholder="email@example.com" />
        </div>
      </div>
      <div class="form-row">
        <div class="form-group">
          <label>Mật khẩu *</label>
          <input type="password" id="staffPassword" required placeholder="Tối thiểu 6 ký tự" minlength="6" />
        </div>
        <div class="form-group">
          <label>Số Điện Thoại</label>
          <input type="tel" id="staffPhone" placeholder="0900000000" />
        </div>
      </div>
      <div class="form-row">
        <div class="form-group">
          <label>Vai Trò *</label>
          <select id="staffRole" required>
            <option value="STAFF">Nhân viên</option>
            <option value="ADMIN">Admin</option>
          </select>
        </div>
        <div class="form-group">
          <label>Địa Chỉ</label>
          <input type="text" id="staffAddress" placeholder="Nhập địa chỉ" />
        </div>
      </div>
      <div class="form-actions">
        <button type="button" class="btn btn-secondary" onclick="closeGlobalModal()">Hủy</button>
        <button type="submit" class="btn btn-primary">Tạo Tài Khoản</button>
      </div>
    </form>
  `;

  openGlobalModal("Tạo Tài Khoản Nhân Viên", html);
}

/**
 * Submit tạo tài khoản nhân viên
 */
async function submitCreateStaff(e) {
  e.preventDefault();

  const data = {
    email: document.getElementById("staffEmail").value,
    password: document.getElementById("staffPassword").value,
    fullName: document.getElementById("staffFullName").value,
    phone: document.getElementById("staffPhone").value || null,
    address: document.getElementById("staffAddress").value || null,
    role: document.getElementById("staffRole").value,
  };

  try {
    await adminFetch("/admin/accounts/create-staff", {
      method: "POST",
      body: JSON.stringify(data),
    });

    showAlert("Tạo tài khoản thành công!", "success");
    closeGlobalModal();
    await loadAccounts();
  } catch (error) {
    showAlert(error.message || "Lỗi khi tạo tài khoản", "error");
  }
}

/**
 * Khóa/Mở khóa tài khoản
 */
async function toggleLockAccount(userId, action) {
  const actionText = action === "lock" ? "khóa" : "mở khóa";

  if (!confirm(`Bạn có chắc chắn muốn ${actionText} tài khoản #${userId}?`)) {
    return;
  }

  try {
    await adminFetch(`/admin/accounts/${userId}/toggle-lock`, {
      method: "PUT",
      body: JSON.stringify({ action }),
    });

    showAlert(`Đã ${actionText} tài khoản thành công!`, "success");
    await loadAccounts();
  } catch (error) {
    showAlert(error.message || `Lỗi khi ${actionText} tài khoản`, "error");
  }
}
