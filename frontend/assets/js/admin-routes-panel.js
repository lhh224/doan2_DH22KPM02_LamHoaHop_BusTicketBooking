/**
 * File: admin-routes-panel.js
 * Mục đích: Quản lý Tuyến Đường trong admin panel (sidebar layout)
 */

let routesData = [];

async function renderRoutesSection() {
  const contentArea = document.getElementById("contentArea");

  contentArea.innerHTML = `
    <div class="toolbar">
      <div class="toolbar-left">
        <input type="text" class="search-input" id="routeSearch" placeholder="Tìm theo tên tuyến, điểm đi, điểm đến..." oninput="filterRoutesPanel()" />
        <div class="toolbar-info" id="routesPanelInfo" style="margin-left: 16px; font-weight: 500; color: var(--text-secondary);">Đang tải...</div>
      </div>
      <div class="toolbar-right">
        <button class="btn btn-primary" onclick="openAddRouteModal()">Thêm Tuyến Đường</button>
      </div>
    </div>

    <div class="card">
      <div class="card-body no-padding">
        <div class="table-responsive">
          <table class="data-table">
            <thead>
              <tr>
                <th>Tên Tuyến</th>
                <th>Hành Trình</th>
                <th>Khoảng Cách</th>
                <th>Thao Tác</th>
              </tr>
            </thead>
            <tbody id="routesPanelBody">
              <tr class="loading-row"><td colspan="4"><span class="spinner"></span> Đang tải...</td></tr>
            </tbody>
          </table>
        </div>
      </div>
      <div class="table-footer" style="display:none;"></div>
    </div>
  `;

  await loadRoutesPanel();
}

async function loadRoutesPanel() {
  try {
    const res = await adminFetch("/admin/routes");
    routesData = res.data.routes || [];
    renderRoutesPanelTable(routesData);
  } catch (e) {
    console.error("Lỗi load tuyến đường:", e);
    showAlert("Lỗi khi tải danh sách tuyến đường", "error");
    const tbody = document.getElementById("routesPanelBody");
    const info = document.getElementById("routesPanelInfo");
    if (tbody)
      tbody.innerHTML = `<tr class="loading-row"><td colspan="4" style="color:#ef4444">❌ Không thể tải dữ liệu. Kiểm tra server đang chạy.</td></tr>`;
    if (info) info.textContent = "Lỗi tải dữ liệu";
  }
}

function renderRoutesPanelTable(data) {
  const tbody = document.getElementById("routesPanelBody");
  const info = document.getElementById("routesPanelInfo");

  if (!data || data.length === 0) {
    tbody.innerHTML =
      '<tr class="loading-row"><td colspan="4">Không có tuyến đường nào</td></tr>';
    info.textContent = "0 tuyến đường";
    return;
  }

  tbody.innerHTML = data
    .map(
      (r) => `
    <tr data-context="route" data-item="${encodeURIComponent(JSON.stringify(r))}">
      <td><strong>${r.route_name || r.name}</strong></td>
      <td>${r.departure_city || r.departureCity} → ${r.arrival_city || r.arrivalCity}</td>
      <td>${r.distance || 0} km</td>
      <td>
        <div class="btn-group">
          <button class="btn btn-sm btn-secondary" onclick="showRouteDetail(${r.route_id || r.id})">Chi tiết</button>
          <button class="btn btn-sm btn-warning" onclick="openEditRouteModal(${r.route_id || r.id})">Sửa</button>
          <button class="btn btn-sm btn-danger" onclick="deleteRoutePanel(${r.route_id || r.id})">Xóa</button>
        </div>
      </td>
    </tr>
  `,
    )
    .join("");

  info.textContent = `Tổng: ${data.length} tuyến đường`;
}

function showRouteDetail(routeId) {
  const r = routesData.find((x) => (x.route_id || x.id) === routeId);
  if (!r) return;
  const durationText = r.estimated_time ? `${r.estimated_time} giờ` : "--";
  const html = `
    <table style="width:100%;border-collapse:collapse;font-size:14px">
      <tr><td style="padding:10px 0;color:#888;width:40%;border-bottom:1px solid #f0f0f0">Tên Tuyến</td><td style="padding:10px 0;border-bottom:1px solid #f0f0f0"><strong>${r.route_name || r.name}</strong></td></tr>
      <tr><td style="padding:10px 0;color:#888;border-bottom:1px solid #f0f0f0">Điểm Đi</td><td style="padding:10px 0;border-bottom:1px solid #f0f0f0">${r.departure_city || r.departureCity}</td></tr>
      <tr><td style="padding:10px 0;color:#888;border-bottom:1px solid #f0f0f0">Điểm Đến</td><td style="padding:10px 0;border-bottom:1px solid #f0f0f0">${r.arrival_city || r.arrivalCity}</td></tr>
      <tr><td style="padding:10px 0;color:#888;border-bottom:1px solid #f0f0f0">Khoảng Cách</td><td style="padding:10px 0;border-bottom:1px solid #f0f0f0">${r.distance || 0} km</td></tr>
      <tr><td style="padding:10px 0;color:#888;border-bottom:1px solid #f0f0f0">Thời Gian Ước Tính</td><td style="padding:10px 0;border-bottom:1px solid #f0f0f0">${durationText}</td></tr>
      <tr><td style="padding:10px 0;color:#888;border-bottom:1px solid #f0f0f0">Số Chuyến</td><td style="padding:10px 0;border-bottom:1px solid #f0f0f0">${r.total_trips || 0} chuyến</td></tr>
      <tr><td style="padding:10px 0;color:#888">Trạng Thái</td><td style="padding:10px 0">${r.is_active || r.IsActive ? '<span class="status-badge status-active">Hoạt động</span>' : '<span class="status-badge status-inactive">Tạm ngưng</span>'}</td></tr>
    </table>
    <div class="form-actions" style="margin-top:16px">
      <button class="btn btn-secondary" onclick="closeGlobalModal()">Đóng</button>
      <button class="btn btn-warning" onclick="closeGlobalModal(); openEditRouteModal(${r.route_id || r.id})">Chỉnh Sửa</button>
    </div>
  `;
  openGlobalModal("Chi Tiết Tuyến Đường", html);
}

function filterRoutesPanel() {
  const search = document.getElementById("routeSearch").value.toLowerCase();
  const filtered = routesData.filter((r) => {
    const name = (r.route_name || r.name || "").toLowerCase();
    const dep = (r.departure_city || r.departureCity || "").toLowerCase();
    const arr = (r.arrival_city || r.arrivalCity || "").toLowerCase();
    return (
      name.includes(search) || dep.includes(search) || arr.includes(search)
    );
  });
  renderRoutesPanelTable(filtered);
}

function openAddRouteModal() {
  const html = `
    <form onsubmit="submitRoutePanel(event, false)">
      <div class="form-group">
        <label>Tên Tuyến *</label>
        <input type="text" id="rtName" required placeholder="VD: TP.HCM - Đà Lạt" />
      </div>
      <div class="form-row">
        <div class="form-group">
          <label>Điểm Đi *</label>
          <input type="text" id="rtDeparture" required placeholder="VD: TP.HCM" />
        </div>
        <div class="form-group">
          <label>Điểm Đến *</label>
          <input type="text" id="rtArrival" required placeholder="VD: Đà Lạt" />
        </div>
      </div>
      <div class="form-row">
        <div class="form-group">
          <label>Khoảng Cách (km)</label>
          <input type="number" id="rtDistance" min="0" value="0" />
        </div>
        <div class="form-group">
          <label>Thời Gian Ước Tính (giờ)</label>
          <input type="number" id="rtDuration" min="0" step="0.5" value="0" />
        </div>
      </div>
      <div class="form-group">
        <label>Trạng Thái</label>
        <select id="rtActive">
          <option value="true">Hoạt động</option>
          <option value="false">Tạm ngưng</option>
        </select>
      </div>
      <div class="form-group">
        <label>Hình Ảnh (URL)</label>
        <input type="url" id="rtImage" placeholder="https://images.unsplash.com/..." />
      </div>
      <div class="form-actions">
        <button type="button" class="btn btn-secondary" onclick="closeGlobalModal()">Hủy</button>
        <button type="submit" class="btn btn-primary">Lưu</button>
      </div>
    </form>
  `;
  openGlobalModal("Thêm Tuyến Đường Mới", html);
}

function openEditRouteModal(routeId) {
  const r = routesData.find((x) => (x.route_id || x.id) === routeId);
  if (!r) return;

  const html = `
    <form onsubmit="submitRoutePanel(event, true, ${routeId})">
      <div class="form-group">
        <label>Tên Tuyến *</label>
        <input type="text" id="rtName" required value="${r.route_name || r.name || ""}" />
      </div>
      <div class="form-row">
        <div class="form-group">
          <label>Điểm Đi *</label>
          <input type="text" id="rtDeparture" required value="${r.departure_city || r.departureCity || ""}" />
        </div>
        <div class="form-group">
          <label>Điểm Đến *</label>
          <input type="text" id="rtArrival" required value="${r.arrival_city || r.arrivalCity || ""}" />
        </div>
      </div>
      <div class="form-row">
        <div class="form-group">
          <label>Khoảng Cách (km)</label>
          <input type="number" id="rtDistance" min="0" value="${r.distance || 0}" />
        </div>
        <div class="form-group">
          <label>Thời Gian Ước Tính (giờ)</label>
          <input type="number" id="rtDuration" min="0" step="0.5" value="${r.estimated_time || 0}" />
        </div>
      </div>      <div class="form-group">
        <label>Trạng Thái</label>
        <select id="rtActive">
          <option value="true" ${r.is_active === 1 || r.is_active === true || r.IsActive === 1 || r.IsActive === true ? "selected" : ""}>Hoạt động</option>
          <option value="false" ${r.is_active === 0 || r.is_active === false || r.IsActive === 0 || r.IsActive === false ? "selected" : ""}>Tạm ngưng</option>
        </select>
      </div>
      <div class="form-group">
        <label>Hình Ảnh (URL)</label>
        <input type="url" id="rtImage" value="${r.image_url || r.ImageUrl || r.RouteImage || ""}" placeholder="https://images.unsplash.com/..." />
      </div>      <div class="form-actions">
        <button type="button" class="btn btn-secondary" onclick="closeGlobalModal()">Hủy</button>
        <button type="submit" class="btn btn-primary">Cập Nhật</button>
      </div>
    </form>
  `;
  openGlobalModal("Chỉnh Sửa Tuyến Đường", html);
}

async function submitRoutePanel(e, isEdit, routeId) {
  e.preventDefault();
  const data = {
    tenTuyen: document.getElementById("rtName").value.trim(),
    diemDi: document.getElementById("rtDeparture").value.trim(),
    diemDen: document.getElementById("rtArrival").value.trim(),
    khoangCach: parseInt(document.getElementById("rtDistance").value) || 0,
    thoiGianUocTinh:
      parseFloat(document.getElementById("rtDuration").value) || 0,
    hoatDong: document.getElementById("rtActive")
      ? document.getElementById("rtActive").value === "true"
      : true,
    hinhAnh: document.getElementById("rtImage")
      ? document.getElementById("rtImage").value.trim() || null
      : null,
  };

  try {
    if (isEdit) {
      await adminFetch(`/admin/routes/${routeId}`, {
        method: "PUT",
        body: JSON.stringify(data),
      });
      showAlert("Cập nhật tuyến đường thành công!", "success");
    } else {
      await adminFetch("/admin/routes", {
        method: "POST",
        body: JSON.stringify(data),
      });
      showAlert("Thêm tuyến đường thành công!", "success");
    }
    closeGlobalModal();
    await loadRoutesPanel();
  } catch (error) {
    showAlert(error.message || "Lỗi khi lưu tuyến đường", "error");
  }
}

async function deleteRoutePanel(routeId) {
  if (!confirm("Bạn có chắc muốn xóa tuyến đường này?")) return;
  try {
    await adminFetch(`/admin/routes/${routeId}`, { method: "DELETE" });
    showAlert("Đã xóa tuyến đường thành công!", "success");
    await loadRoutesPanel();
  } catch (error) {
    showAlert(error.message || "Lỗi khi xóa tuyến đường", "error");
  }
}

