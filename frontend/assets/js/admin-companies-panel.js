/**
 * File: admin-companies-panel.js
 * Mục đích: Quản lý Nhà Xe trong admin panel (sidebar layout)
 */

let companiesData = [];

async function renderCompaniesSection() {
  const contentArea = document.getElementById("contentArea");

  contentArea.innerHTML = `
    <div class="toolbar">
      <div class="toolbar-left">
        <input type="text" class="search-input" id="companySearch" placeholder="Tìm theo tên nhà xe, SĐT, địa chỉ..." oninput="filterCompaniesPanel()" />
        <div class="toolbar-info" id="companiesPanelInfo" style="margin-left: 16px; font-weight: 500; color: var(--text-secondary);">Đang tải...</div>
      </div>
      <div class="toolbar-right">
        <button class="btn btn-primary" onclick="openAddCompanyModal()">Thêm Nhà Xe</button>
      </div>
    </div>

    <div class="card">
      <div class="card-body no-padding">
        <div class="table-responsive">
          <table class="data-table">
            <thead>
              <tr>
                <th>Tên Nhà Xe</th>
                <th>SĐT</th>
                <th>Số Chuyến</th>
                <th>Đánh Giá</th>
                <th>Thao Tác</th>
              </tr>
            </thead>
            <tbody id="companiesPanelBody">
              <tr class="loading-row"><td colspan="5"><span class="spinner"></span> Đang tải...</td></tr>
            </tbody>
          </table>
        </div>
      </div>
      <div class="table-footer" style="display:none;"></div>
    </div>
  `;

  await loadCompaniesPanel();
}

async function loadCompaniesPanel() {
  try {
    const res = await adminFetch("/admin/companies");
    companiesData = res.data.companies || [];
    renderCompaniesPanelTable(companiesData);
  } catch (e) {
    console.error("Lỗi load nhà xe:", e);
    showAlert("Lỗi khi tải danh sách nhà xe", "error");
    const tbody = document.getElementById("companiesPanelBody");
    const info = document.getElementById("companiesPanelInfo");
    if (tbody)
      tbody.innerHTML = `<tr class="loading-row"><td colspan="5" style="color:#ef4444">❌ Không thể tải dữ liệu. Kiểm tra server đang chạy.</td></tr>`;
    if (info) info.textContent = "Lỗi tải dữ liệu";
  }
}

function renderCompaniesPanelTable(data) {
  const tbody = document.getElementById("companiesPanelBody");
  const info = document.getElementById("companiesPanelInfo");

  if (!data || data.length === 0) {
    tbody.innerHTML =
      '<tr class="loading-row"><td colspan="5">Không có nhà xe nào</td></tr>';
    info.textContent = "0 nhà xe";
    return;
  }

  tbody.innerHTML = data
    .map(
      (c) => `
    <tr data-context="company" data-item="${encodeURIComponent(JSON.stringify(c))}">
      <td>
        <strong>${c.CompanyName}</strong>
        <div style="font-size:11px;color:#888">${c.Email || ""}</div>
      </td>
      <td>${c.Phone || "--"}</td>
      <td>${c.TotalTrips || 0}</td>
      <td>${c.Rating ? Number(c.Rating).toFixed(1) : "5.0"} ⭐</td>
      <td>
        <div class="btn-group">
          <button class="btn btn-sm btn-secondary" onclick="showCompanyDetail(${c.CompanyID})">Chi tiết</button>
          <button class="btn btn-sm btn-warning" onclick="openEditCompanyModal(${c.CompanyID})">Sửa</button>
          <button class="btn btn-sm btn-danger" onclick="deleteCompanyPanel(${c.CompanyID})">Xóa</button>
        </div>
      </td>
    </tr>
  `,
    )
    .join("");

  info.textContent = `Tổng: ${data.length} nhà xe`;
}

function showCompanyDetail(companyId) {
  const c = companiesData.find((x) => x.CompanyID === companyId);
  if (!c) return;
  const html = `
    <table style="width:100%;border-collapse:collapse;font-size:14px">
      <tr><td style="padding:10px 0;color:#888;width:40%;border-bottom:1px solid #f0f0f0">Tên Nhà Xe</td><td style="padding:10px 0;border-bottom:1px solid #f0f0f0"><strong>${c.CompanyName}</strong></td></tr>
      <tr><td style="padding:10px 0;color:#888;border-bottom:1px solid #f0f0f0">Số Điện Thoại</td><td style="padding:10px 0;border-bottom:1px solid #f0f0f0">${c.Phone || "--"}</td></tr>
      <tr><td style="padding:10px 0;color:#888;border-bottom:1px solid #f0f0f0">Email</td><td style="padding:10px 0;border-bottom:1px solid #f0f0f0">${c.Email || "--"}</td></tr>
      <tr><td style="padding:10px 0;color:#888;border-bottom:1px solid #f0f0f0">Địa Chỉ</td><td style="padding:10px 0;border-bottom:1px solid #f0f0f0">${c.Address || "--"}</td></tr>
      <tr><td style="padding:10px 0;color:#888;border-bottom:1px solid #f0f0f0">Hotline KH</td><td style="padding:10px 0;border-bottom:1px solid #f0f0f0">${c.CustomerHotline || "--"}</td></tr>
      <tr><td style="padding:10px 0;color:#888;border-bottom:1px solid #f0f0f0">Số Chuyến</td><td style="padding:10px 0;border-bottom:1px solid #f0f0f0">${c.TotalTrips || 0} chuyến</td></tr>
      <tr><td style="padding:10px 0;color:#888;border-bottom:1px solid #f0f0f0">Đánh Giá</td><td style="padding:10px 0;border-bottom:1px solid #f0f0f0">⭐ ${c.Rating ? Number(c.Rating).toFixed(1) : "5.0"} / 5.0</td></tr>
      <tr><td style="padding:10px 0;color:#888">Trạng Thái</td><td style="padding:10px 0">${c.IsActive ? '<span class="status-badge status-active">Hoạt động</span>' : '<span class="status-badge status-inactive">Tạm ngưng</span>'}</td></tr>
    </table>
    <div class="form-actions" style="margin-top:16px">
      <button class="btn btn-secondary" onclick="closeGlobalModal()">Đóng</button>
      <button class="btn btn-warning" onclick="closeGlobalModal(); openEditCompanyModal(${c.CompanyID})">Chỉnh Sửa</button>
    </div>
  `;
  openGlobalModal("Chi Tiết Nhà Xe", html);
}

function filterCompaniesPanel() {
  const search = document.getElementById("companySearch").value.toLowerCase();
  const filtered = companiesData.filter(
    (c) =>
      (c.CompanyName && c.CompanyName.toLowerCase().includes(search)) ||
      (c.Phone && c.Phone.includes(search)) ||
      (c.Address && c.Address.toLowerCase().includes(search)),
  );
  renderCompaniesPanelTable(filtered);
}

function openAddCompanyModal() {
  const html = `
    <form id="companyPanelForm" onsubmit="submitCompanyPanel(event, false)">
      <div class="form-group">
        <label>Tên Nhà Xe *</label>
        <input type="text" id="cpName" required placeholder="Nhập tên nhà xe" />
      </div>
      <div class="form-row">
        <div class="form-group">
          <label>Số Điện Thoại</label>
          <input type="tel" id="cpPhone" placeholder="0900000000" />
        </div>
        <div class="form-group">
          <label>Email</label>
          <input type="email" id="cpEmail" placeholder="email@example.com" />
        </div>
      </div>
      <div class="form-group">
        <label>Địa Chỉ</label>
        <input type="text" id="cpAddress" placeholder="Nhập địa chỉ" />
      </div>
      <div class="form-group">
        <label>Trạng Thái</label>
        <select id="cpActive">
          <option value="true">Hoạt động</option>
          <option value="false">Tạm ngưng</option>
        </select>
      </div>
      <div class="form-actions">
        <button type="button" class="btn btn-secondary" onclick="closeGlobalModal()">Hủy</button>
        <button type="submit" class="btn btn-primary">Lưu</button>
      </div>
    </form>
  `;
  openGlobalModal("Thêm Nhà Xe Mới", html);
}

function openEditCompanyModal(companyId) {
  const c = companiesData.find((x) => x.CompanyID === companyId);
  if (!c) return;

  const html = `
    <form id="companyPanelForm" onsubmit="submitCompanyPanel(event, true, ${c.CompanyID})">
      <div class="form-group">
        <label>Tên Nhà Xe *</label>
        <input type="text" id="cpName" required value="${c.CompanyName || ""}" />
      </div>
      <div class="form-row">
        <div class="form-group">
          <label>Số Điện Thoại</label>
          <input type="tel" id="cpPhone" value="${c.Phone || ""}" />
        </div>
        <div class="form-group">
          <label>Email</label>
          <input type="email" id="cpEmail" value="${c.Email || ""}" />
        </div>
      </div>
      <div class="form-group">
        <label>Địa Chỉ</label>
        <input type="text" id="cpAddress" value="${c.Address || ""}" />
      </div>
      <div class="form-group">
        <label>Trạng Thái</label>
        <select id="cpActive">
          <option value="true" ${c.IsActive ? "selected" : ""}>Hoạt động</option>
          <option value="false" ${!c.IsActive ? "selected" : ""}>Tạm ngưng</option>
        </select>
      </div>
      <div class="form-actions">
        <button type="button" class="btn btn-secondary" onclick="closeGlobalModal()">Hủy</button>
        <button type="submit" class="btn btn-primary">Cập Nhật</button>
      </div>
    </form>
  `;
  openGlobalModal("Chỉnh Sửa Nhà Xe", html);
}

async function submitCompanyPanel(e, isEdit, companyId) {
  e.preventDefault();
  const data = {
    tenNhaXe: document.getElementById("cpName").value.trim(),
    soDienThoai: document.getElementById("cpPhone").value.trim(),
    email: document.getElementById("cpEmail").value.trim(),
    diaChi: document.getElementById("cpAddress").value.trim(),
    hoatDong: document.getElementById("cpActive").value === "true",
  };

  try {
    if (isEdit) {
      await adminFetch(`/admin/companies/${companyId}`, {
        method: "PUT",
        body: JSON.stringify(data),
      });
      showAlert("Cập nhật nhà xe thành công!", "success");
    } else {
      await adminFetch("/admin/companies", {
        method: "POST",
        body: JSON.stringify(data),
      });
      showAlert("Thêm nhà xe thành công!", "success");
    }
    closeGlobalModal();
    await loadCompaniesPanel();
  } catch (error) {
    showAlert(error.message || "Lỗi khi lưu nhà xe", "error");
  }
}

async function deleteCompanyPanel(companyId) {
  if (!confirm("Bạn có chắc muốn xóa nhà xe này?")) return;
  try {
    await adminFetch(`/admin/companies/${companyId}`, { method: "DELETE" });
    showAlert("Đã xóa nhà xe thành công!", "success");
    await loadCompaniesPanel();
  } catch (error) {
    showAlert(error.message || "Lỗi khi xóa nhà xe", "error");
  }
}
