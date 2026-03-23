/**
 * File: admin-logs.js
 * Mục đích: Quản lý Log hệ thống
 * Bao gồm: Transaction Logs (lịch sử giao dịch), Login Logs (phiên đăng nhập)
 */

// ========================================
// RENDER SECTION LOG
// ========================================
async function renderLogsSection() {
  const contentArea = document.getElementById("contentArea");

  contentArea.innerHTML = `
    <!-- Tabs -->
    <div class="tabs">
      <button class="tab-btn active" data-tab="transactionLogs" onclick="switchLogTab('transactionLogs')">
        Lịch Sử Giao Dịch
      </button>
      <button class="tab-btn" data-tab="loginLogs" onclick="switchLogTab('loginLogs')">
        Lịch Sử Đăng Nhập
      </button>
    </div>

    <!-- Transaction Logs Tab -->
    <div class="tab-content active" id="tab-transactionLogs">
      <div class="toolbar">
        <div class="toolbar-left">
          <input type="date" class="search-input" id="txnFromDate" style="min-width:160px" onchange="loadTransactionLogs()" />
          <input type="date" class="search-input" id="txnToDate" style="min-width:160px" onchange="loadTransactionLogs()" />
          <select class="search-input" id="txnStatusFilter" onchange="loadTransactionLogs()">
            <option value="">Tất cả trạng thái</option>
            <option value="COMPLETED">Thành công</option>
            <option value="PENDING">Đang xử lý</option>
            <option value="FAILED">Thất bại</option>
            <option value="REFUNDED">Đã hoàn tiền</option>
          </select>
          <div class="toolbar-info" id="txnLogsInfo" style="margin-left: 16px; font-weight: 500; color: var(--text-secondary);">Đang tải...</div>
        </div>
      </div>

      <div class="card">
        <div class="card-body no-padding">
          <div class="table-responsive">
            <table class="data-table">
              <thead>
                <tr>
                  <th style="display:none">ID</th>
                  <th>Mã Booking</th>
                  <th>Mã Vé</th>
                  <th>Khách Hàng</th>
                  <th>Tuyến</th>
                  <th>Số Tiền</th>
                  <th>Phương Thức</th>
                  <th>Trạng Thái</th>
                  <th>Mã GD Ngoài</th>
                  <th>Ghi Chú</th>
                  <th>Thời Gian</th>
                </tr>
              </thead>
              <tbody id="txnLogsBody">
                <tr class="loading-row"><td colspan="11"><span class="spinner"></span> Đang tải...</td></tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>

    <!-- Login Logs Tab -->
    <div class="tab-content" id="tab-loginLogs">
      <div class="toolbar">
        <div class="toolbar-left">
          <input type="date" class="search-input" id="loginFromDate" style="min-width:160px" onchange="loadLoginLogs()" />
          <input type="date" class="search-input" id="loginToDate" style="min-width:160px" onchange="loadLoginLogs()" />
          <div class="toolbar-info" id="loginLogsInfo" style="margin-left: 16px; font-weight: 500; color: var(--text-secondary);">Đang tải...</div>
        </div>
      </div>

      <div class="card">
        <div class="card-body no-padding">
          <div class="table-responsive">
            <table class="data-table">
              <thead>
                <tr>
                  <th>Session ID</th>
                  <th>Người Dùng</th>
                  <th>Email</th>
                  <th>Vai Trò</th>
                  <th>Trạng Thái Session</th>
                  <th>Trạng Thái TK</th>
                  <th>Thời Gian Tạo</th>
                  <th>Hết Hạn</th>
                  <th>Đăng Nhập Cuối</th>
                </tr>
              </thead>
              <tbody id="loginLogsBody">
                <tr class="loading-row"><td colspan="9"><span class="spinner"></span> Đang tải...</td></tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  `;

  // Load tab đầu tiên
  await loadTransactionLogs();
}

/**
 * Chuyển tab
 */
function switchLogTab(tabId) {
  // Ẩn tất cả tab content
  document
    .querySelectorAll(".tab-content")
    .forEach((el) => el.classList.remove("active"));
  document
    .querySelectorAll(".tab-btn")
    .forEach((btn) => btn.classList.remove("active"));

  // Hiện tab được chọn
  document.getElementById(`tab-${tabId}`).classList.add("active");
  document
    .querySelector(`.tab-btn[data-tab="${tabId}"]`)
    .classList.add("active");

  // Load dữ liệu
  if (tabId === "transactionLogs") {
    loadTransactionLogs();
  } else {
    loadLoginLogs();
  }
}

// ========================================
// TRANSACTION LOGS
// ========================================
async function loadTransactionLogs() {
  try {
    const fromDate = document.getElementById("txnFromDate")?.value || "";
    const toDate = document.getElementById("txnToDate")?.value || "";
    const status = document.getElementById("txnStatusFilter")?.value || "";

    let url = "/admin/logs/transactions?";
    if (fromDate) url += `fromDate=${fromDate}&`;
    if (toDate) url += `toDate=${toDate}&`;
    if (status) url += `status=${status}&`;

    const res = await adminFetch(url);
    const logs = res.data || [];

    const tbody = document.getElementById("txnLogsBody");
    const info = document.getElementById("txnLogsInfo");

    if (logs.length === 0) {
      tbody.innerHTML =
        '<tr class="loading-row"><td colspan="11">Không có dữ liệu giao dịch</td></tr>';
      info.textContent = "0 giao dịch";
      return;
    }

    tbody.innerHTML = logs
      .map(
        (log) => `
      <tr>
        <td style="display:none">#${log.PaymentId}</td>
        <td><strong>#${log.BookingId}</strong></td>
        <td><small>${log.TicketCode || "--"}</small></td>
        <td>
          <strong>${log.CustomerName}</strong>
          <br><small style="color:var(--text-secondary)">${log.CustomerPhone || ""}</small>
        </td>
        <td>${log.RouteName || "--"}</td>
        <td><strong style="color:var(--success)">${formatCurrency(log.Amount)}</strong></td>
        <td>${log.PaymentMethod || "--"}</td>
        <td>${statusBadge(log.Status)}</td>
        <td><small>${log.ExternalTransactionId || "--"}</small></td>
        <td><small>${log.Note || "--"}</small></td>
        <td>${formatDateTime(log.CreatedAt)}</td>
      </tr>
    `,
      )
      .join("");

    info.textContent = `Tổng: ${logs.length} giao dịch`;
  } catch (e) {
    console.error("Lỗi load transaction logs:", e);
    document.getElementById("txnLogsBody").innerHTML =
      '<tr class="loading-row"><td colspan="11">Lỗi khi tải dữ liệu</td></tr>';
  }
}

// ========================================
// LOGIN LOGS
// ========================================
async function loadLoginLogs() {
  try {
    const fromDate = document.getElementById("loginFromDate")?.value || "";
    const toDate = document.getElementById("loginToDate")?.value || "";

    let url = "/admin/logs/logins?";
    if (fromDate) url += `fromDate=${fromDate}&`;
    if (toDate) url += `toDate=${toDate}&`;

    const res = await adminFetch(url);
    const logs = res.data || [];

    const tbody = document.getElementById("loginLogsBody");
    const info = document.getElementById("loginLogsInfo");

    if (logs.length === 0) {
      tbody.innerHTML =
        '<tr class="loading-row"><td colspan="9">Không có dữ liệu đăng nhập</td></tr>';
      info.textContent = "0 phiên";
      return;
    }

    tbody.innerHTML = logs
      .map((log) => {
        const roleBadge = {
          ADMIN: '<span class="badge badge-danger">Admin</span>',
          STAFF: '<span class="badge badge-info">Nhân viên</span>',
          CUSTOMER: '<span class="badge badge-secondary">Khách hàng</span>',
        };

        const isExpired = log.ExpiresAt && new Date(log.ExpiresAt) < new Date();
        const sessionStatus =
          log.SessionStatus === "ACTIVE" && !isExpired
            ? '<span class="badge badge-success">Active</span>'
            : '<span class="badge badge-secondary">Expired</span>';

        return `
        <tr>
          <td>#${log.SessionId}</td>
          <td><strong>${log.FullName || "--"}</strong></td>
          <td>${log.Email}</td>
          <td>${roleBadge[log.Role] || log.Role}</td>
          <td>${sessionStatus}</td>
          <td>${statusBadge(log.UserStatus)}</td>
          <td>${formatDateTime(log.CreatedAt)}</td>
          <td>${log.ExpiresAt ? formatDateTime(log.ExpiresAt) : "--"}</td>
          <td>${log.LastLoginAt ? formatDateTime(log.LastLoginAt) : "--"}</td>
        </tr>
      `;
      })
      .join("");

    info.textContent = `Tổng: ${logs.length} phiên đăng nhập`;
  } catch (e) {
    console.error("Lỗi load login logs:", e);
    document.getElementById("loginLogsBody").innerHTML =
      '<tr class="loading-row"><td colspan="9">Lỗi khi tải dữ liệu</td></tr>';
  }
}
