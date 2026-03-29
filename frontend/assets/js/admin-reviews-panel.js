/**
 * File: admin-reviews-panel.js
 * Mục đích: Quản lý Đánh Giá trong admin panel
 * Chức năng: Xem danh sách, duyệt, từ chối, xem chi tiết đánh giá
 */

let reviewsData = [];

// ========================================
// RENDER SECTION ĐÁNH GIÁ
// ========================================
async function renderReviewsSection() {
  const contentArea = document.getElementById("contentArea");

  contentArea.innerHTML = `
    <div class="toolbar">
      <div class="toolbar-left" style="display: flex; flex-wrap: wrap; gap: 12px; align-items: center;">
        <select class="filter-select" id="reviewStatusFilter" onchange="filterReviewsPanel()" style="max-width: 180px;">
          <option value="">Tất cả trạng thái</option>
          <option value="PENDING">Chờ duyệt</option>
          <option value="APPROVED">Đã duyệt</option>
          <option value="REJECTED">Đã từ chối</option>
        </select>
        <input type="text" class="search-input" id="reviewSearchInput"
          placeholder="Tìm theo nhà xe, tuyến đường..."
          oninput="filterReviewsPanel()" style="max-width: 300px;" />
        <div class="toolbar-info" id="reviewsPanelInfo"
          style="display: flex; gap: 8px; align-items: center;">Đang tải...</div>
        <div style="font-size: 12px; color: #64748b;">
          Chuột phải lên dòng đánh giá để thao tác
        </div>
      </div>
    </div>

    <div class="card">
      <div class="card-body no-padding">
        <div class="table-responsive">
          <table class="data-table">
            <thead>
              <tr>
                <th>Người Đánh Giá</th>
                <th>Nhà Xe & Tuyến</th>
                <th>Đánh Giá</th>
                <th>Ngày Gửi</th>
                <th>Trạng Thái</th>
              </tr>
            </thead>
            <tbody id="reviewsPanelBody">
              <tr class="loading-row"><td colspan="5"><span class="spinner"></span> Đang tải...</td></tr>
            </tbody>
          </table>
        </div>
      </div>
      <div class="table-footer" style="display:none;"></div>
    </div>
  `;

  await loadReviewsData();
}

/**
 * Tải danh sách đánh giá từ server
 */
async function loadReviewsData() {
  try {
    const res = await adminFetch("/admin/reviews");
    reviewsData = res.data || [];
    renderReviewsPanelTable(reviewsData);
  } catch (e) {
    console.error("Lỗi load đánh giá:", e);
    showAlert("Lỗi khi tải danh sách đánh giá", "error");
    const tbody = document.getElementById("reviewsPanelBody");
    const info = document.getElementById("reviewsPanelInfo");
    if (tbody)
      tbody.innerHTML = `<tr class="loading-row"><td colspan="5" style="color:#ef4444">Không thể tải dữ liệu. Kiểm tra server đang chạy.</td></tr>`;
    if (info) info.textContent = "Lỗi tải dữ liệu";
  }
}

/**
 * Render bảng đánh giá
 */
function renderReviewsPanelTable(data) {
  const tbody = document.getElementById("reviewsPanelBody");
  const info = document.getElementById("reviewsPanelInfo");

  if (!data || data.length === 0) {
    tbody.innerHTML =
      '<tr class="loading-row"><td colspan="5">Không có đánh giá nào</td></tr>';
    info.textContent = "0 đánh giá";
    return;
  }

  const statusMap = {
    PENDING: { label: "Chờ duyệt", cls: "status-pending" },
    APPROVED: { label: "Đã duyệt", cls: "status-active" },
    REJECTED: { label: "Từ chối", cls: "status-inactive" },
  };

  tbody.innerHTML = data
    .map((r) => {
      const st = statusMap[r.Status] || { label: r.Status, cls: "" };
      const stars = "★".repeat(r.Rating) + "☆".repeat(5 - r.Rating);
      return `
      <tr data-context="review" data-item="${encodeURIComponent(JSON.stringify(r))}" style="cursor: context-menu" title="Chuột phải để thao tác">
        <td>
          <div style="font-weight:600">${r.UserName || "Ẩn danh"}</div>
          <div style="font-size:12px;color:#888">${r.Email || ""}</div>
        </td>
        <td>
          <div style="font-weight:600">${r.CompanyName || "-"}</div>
          <div style="font-size:12px;color:#888">${r.RouteName || ""}</div>
        </td>
        <td>
          <span style="color:#FFB300;font-size:16px">${stars}</span>
        </td>
        <td>${formatDate(r.CreatedAt)}</td>
        <td><span class="status-badge ${st.cls}">${st.label}</span></td>
      </tr>`;
    })
    .join("");

  const pending = data.filter((r) => r.Status === "PENDING").length;
  const approved = data.filter((r) => r.Status === "APPROVED").length;

  info.innerHTML = `
    <span style="color: #000; font-weight: 600;">Tổng: ${data.length}</span>
    <span style="color: #000; font-weight: 500; margin-left: 16px;">Chờ duyệt: ${pending}</span>
    <span style="color: #000; font-weight: 500; margin-left: 16px;">Đã duyệt: ${approved}</span>
  `;
}

/**
 * Lọc danh sách đánh giá
 */
function filterReviewsPanel() {
  const status = document.getElementById("reviewStatusFilter").value;
  const search = document
    .getElementById("reviewSearchInput")
    .value.toLowerCase();

  let filtered = reviewsData;
  if (status) filtered = filtered.filter((r) => r.Status === status);
  if (search) {
    filtered = filtered.filter(
      (r) =>
        (r.CompanyName && r.CompanyName.toLowerCase().includes(search)) ||
        (r.RouteName && r.RouteName.toLowerCase().includes(search)) ||
        (r.UserName && r.UserName.toLowerCase().includes(search)),
    );
  }
  renderReviewsPanelTable(filtered);
}

/**
 * Xem chi tiết đánh giá
 */
function showReviewDetail(reviewId) {
  const r = reviewsData.find((x) => x.ReviewId === reviewId);
  if (!r) return;
  const stars = "★".repeat(r.Rating) + "☆".repeat(5 - r.Rating);
  const statusLabel = {
    PENDING: "Chờ duyệt",
    APPROVED: "Đã duyệt",
    REJECTED: "Từ chối",
  };
  const html = `
    <table style="width:100%;border-collapse:collapse;font-size:14px">
      <tr><td style="padding:10px 0;color:#888;width:35%;border-bottom:1px solid #f0f0f0">Người đánh giá</td><td style="padding:10px 0;border-bottom:1px solid #f0f0f0"><strong>${r.UserName || "Ẩn danh"}</strong><br><span style="font-size:12px;color:#888">${r.Email || ""}</span></td></tr>
      <tr><td style="padding:10px 0;color:#888;border-bottom:1px solid #f0f0f0">Nhà Xe</td><td style="padding:10px 0;border-bottom:1px solid #f0f0f0">${r.CompanyName}</td></tr>
      <tr><td style="padding:10px 0;color:#888;border-bottom:1px solid #f0f0f0">Tuyến Đường</td><td style="padding:10px 0;border-bottom:1px solid #f0f0f0">${r.RouteName}</td></tr>
      <tr><td style="padding:10px 0;color:#888;border-bottom:1px solid #f0f0f0">Điểm Đánh Giá</td><td style="padding:10px 0;border-bottom:1px solid #f0f0f0"><span style="color:#FFB300;font-size:18px">${stars}</span> <strong>${r.Rating}/5</strong></td></tr>
      ${r.Title ? `<tr><td style="padding:10px 0;color:#888;border-bottom:1px solid #f0f0f0">Tiêu Đề</td><td style="padding:10px 0;border-bottom:1px solid #f0f0f0"><strong>${r.Title}</strong></td></tr>` : ""}
      <tr><td style="padding:10px 0;color:#888;border-bottom:1px solid #f0f0f0">Nội Dung</td><td style="padding:10px 0;border-bottom:1px solid #f0f0f0">${r.Content || '<em style="color:#aaa">Không có nội dung</em>'}</td></tr>
      <tr><td style="padding:10px 0;color:#888;border-bottom:1px solid #f0f0f0">Ngày Gửi</td><td style="padding:10px 0;border-bottom:1px solid #f0f0f0">${formatDate(r.CreatedAt)}</td></tr>
      <tr><td style="padding:10px 0;color:#888">Trạng Thái</td><td style="padding:10px 0">${statusLabel[r.Status] || r.Status}</td></tr>
    </table>
    <div class="form-actions" style="margin-top:16px">
      ${r.Status === "PENDING" ? `<button class="btn btn-primary" onclick="closeGlobalModal(); approveReview(${r.ReviewId})">Duyệt</button>` : ""}
      ${r.Status === "PENDING" ? `<button class="btn btn-danger" onclick="closeGlobalModal(); rejectReview(${r.ReviewId})">Từ Chối</button>` : ""}
    </div>
  `;
  openGlobalModal(`Chi Tiết Đánh Giá #${r.ReviewId}`, html);
}

/**
 * Duyệt đánh giá
 */
async function approveReview(reviewId) {
  try {
    await adminFetch(`/admin/reviews/${reviewId}/status`, {
      method: "PUT",
      body: JSON.stringify({ status: "APPROVED" }),
    });
    showAlert("Duyệt đánh giá thành công!", "success");
    await loadReviewsData();
  } catch (e) {
    showAlert(e.message || "Lỗi khi duyệt đánh giá", "error");
  }
}

/**
 * Từ chối đánh giá
 */
async function rejectReview(reviewId) {
  if (!confirm("Từ chối đánh giá này?")) return;
  try {
    await adminFetch(`/admin/reviews/${reviewId}/status`, {
      method: "PUT",
      body: JSON.stringify({ status: "REJECTED" }),
    });
    showAlert("Đã từ chối đánh giá!", "success");
    await loadReviewsData();
  } catch (e) {
    showAlert(e.message || "Lỗi khi từ chối đánh giá", "error");
  }
}

