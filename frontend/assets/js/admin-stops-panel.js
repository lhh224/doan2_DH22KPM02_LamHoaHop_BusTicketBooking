/**
 * File: admin-stops-panel.js
 * Mục đích: Quản lý Điểm Dừng trong admin panel (sidebar layout)
 * Luồng: Chọn tuyến → hiển thị danh sách điểm dừng → CRUD
 *
 * GET response keys (from SQL): StopId, RouteId, StopOrder, StopName, StopAddress, DistanceFromStart, IsActive
 * POST/PUT expected keys: maTuyen, thuTu, tenDiemDung, diaChiDiemDung, khoangCachTuDiemDau, kinhDo, viDo
 */

let stopsData = [];
let stopsRouteList = [];
let stopsSelectedRouteId = null;

async function renderStopsSection() {
  const contentArea = document.getElementById("contentArea");

  contentArea.innerHTML = `
    <div class="toolbar">
      <div class="toolbar-left">
        <select id="stopsRouteFilter" class="search-input" style="min-width:280px" onchange="onStopRouteChange()">
          <option value="">-- Chọn tuyến đường --</option>
        </select>
        <input type="text" class="search-input" id="stopSearchInput" placeholder="Tìm điểm dừng..." oninput="filterStopsPanel()" style="margin-left:8px" />
        <div class="toolbar-info" id="stopsPanelInfo" style="margin-left: 16px; font-weight: 500; color: var(--text-secondary);">Chọn tuyến đường</div>
      </div>
      <div class="toolbar-right">
        <button class="btn btn-primary" id="btnAddStop" onclick="openAddStopModal()" disabled>Thêm Điểm Dừng</button>
      </div>
    </div>

    <!-- Thông tin tuyến đã chọn -->
    <div id="stopRouteInfo" class="card" style="display:none; margin-bottom:16px;">
      <div class="card-header">
        <h3 id="stopRouteName">Tuyến đường</h3>
      </div>
      <div class="card-body">
        <p id="stopRouteDetails" style="margin:0; color:#666;"></p>
      </div>
    </div>

    <div class="card">
      <div class="card-body no-padding">
        <div class="table-responsive">
          <table class="data-table">
            <thead>
              <tr>
                <th>Thứ Tự</th>
                <th>Tên Điểm Dừng</th>
                <th>KC Từ Đầu</th>
                <th>Thao Tác</th>
              </tr>
            </thead>
            <tbody id="stopsPanelBody">
              <tr class="loading-row"><td colspan="4">Vui lòng chọn tuyến đường để xem điểm dừng</td></tr>
            </tbody>
          </table>
        </div>
      </div>
      <div class="table-footer" style="display:none;"></div>
    </div>
  `;

  // Load danh sách tuyến để cho user chọn
  await loadStopsRouteList();
}

async function loadStopsRouteList() {
  try {
    const res = await adminFetch("/admin/routes");
    stopsRouteList = res.data.routes || [];
    const select = document.getElementById("stopsRouteFilter");
    select.innerHTML = '<option value="">-- Chọn tuyến đường --</option>';
    stopsRouteList.forEach((r) => {
      const opt = document.createElement("option");
      opt.value = r.route_id || r.id;
      opt.textContent = `${r.route_name || r.name} (${r.departure_city || r.departureCity} → ${r.arrival_city || r.arrivalCity})`;
      select.appendChild(opt);
    });
  } catch (e) {
    console.error("Lỗi load tuyến đường cho stops:", e);
  }
}

async function onStopRouteChange() {
  const val = document.getElementById("stopsRouteFilter").value;
  if (!val) {
    stopsSelectedRouteId = null;
    document.getElementById("btnAddStop").disabled = true;
    document.getElementById("stopRouteInfo").style.display = "none";
    document.getElementById("stopsPanelBody").innerHTML =
      '<tr class="loading-row"><td colspan="4">Vui lòng chọn tuyến đường</td></tr>';
    document.getElementById("stopsPanelInfo").textContent = "Chọn tuyến đường";
    return;
  }
  stopsSelectedRouteId = parseInt(val);
  document.getElementById("btnAddStop").disabled = false;

  // Hiển thị thông tin tuyến
  const route = stopsRouteList.find(
    (r) => (r.route_id || r.id) == stopsSelectedRouteId,
  );
  if (route) {
    document.getElementById("stopRouteInfo").style.display = "block";
    document.getElementById("stopRouteName").textContent =
      route.route_name || route.name;
    document.getElementById("stopRouteDetails").textContent =
      `${route.departure_city || route.departureCity} → ${route.arrival_city || route.arrivalCity} | Khoảng cách: ${route.distance || 0} km`;
  }

  await loadStopsPanel();
}

async function loadStopsPanel() {
  if (!stopsSelectedRouteId) return;
  try {
    const res = await adminFetch(
      `/admin/stops?routeId=${stopsSelectedRouteId}`,
    );
    stopsData = res.data.stops || [];
    renderStopsPanelTable(stopsData);
  } catch (e) {
    console.error("Lỗi load điểm dừng:", e);
    showAlert("Lỗi khi tải danh sách điểm dừng", "error");
    const tbody = document.getElementById("stopsPanelBody");
    const info = document.getElementById("stopsPanelInfo");
    if (tbody)
      tbody.innerHTML = `<tr class="loading-row"><td colspan="4" style="color:#ef4444">❌ Không thể tải dữ liệu. Kiểm tra server đang chạy.</td></tr>`;
    if (info) info.textContent = "Lỗi tải dữ liệu";
  }
}

function renderStopsPanelTable(data) {
  const tbody = document.getElementById("stopsPanelBody");
  const info = document.getElementById("stopsPanelInfo");

  if (!data || data.length === 0) {
    tbody.innerHTML =
      '<tr class="loading-row"><td colspan="4">Chưa có điểm dừng nào</td></tr>';
    info.textContent = "0 điểm dừng";
    return;
  }

  tbody.innerHTML = data
    .map((s) => {
      return `
    <tr data-context="stop" data-item="${encodeURIComponent(JSON.stringify(s))}">
      <td><strong>${s.StopOrder}</strong></td>
      <td>
        ${s.StopName}
        <div style="font-size:11px;color:#888">${s.StopAddress || ""}</div>
      </td>
      <td>${s.DistanceFromStart || 0} km</td>
      <td>
        <div class="btn-group">
          <button class="btn btn-sm btn-secondary" onclick="showStopDetail(${s.StopId})">Chi tiết</button>
          <button class="btn btn-sm btn-warning" onclick="openEditStopModal(${s.StopId})">Sửa</button>
          <button class="btn btn-sm btn-danger" onclick="deleteStopPanel(${s.StopId})">Xóa</button>
        </div>
      </td>
    </tr>
  `;
    })
    .join("");

  info.textContent = `Tổng: ${data.length} điểm dừng`;
}

function showStopDetail(stopId) {
  const s = stopsData.find((x) => x.StopId === stopId);
  if (!s) return;
  const html = `
    <table style="width:100%;border-collapse:collapse;font-size:14px">
      <tr><td style="padding:10px 0;color:#888;width:40%;border-bottom:1px solid #f0f0f0">Thứ Tự</td><td style="padding:10px 0;border-bottom:1px solid #f0f0f0"><strong>${s.StopOrder}</strong></td></tr>
      <tr><td style="padding:10px 0;color:#888;border-bottom:1px solid #f0f0f0">Tên Điểm Dừng</td><td style="padding:10px 0;border-bottom:1px solid #f0f0f0">${s.StopName}</td></tr>
      <tr><td style="padding:10px 0;color:#888;border-bottom:1px solid #f0f0f0">Địa Chỉ</td><td style="padding:10px 0;border-bottom:1px solid #f0f0f0">${s.StopAddress || "--"}</td></tr>
      <tr><td style="padding:10px 0;color:#888;border-bottom:1px solid #f0f0f0">KC Từ Điểm Đầu</td><td style="padding:10px 0;border-bottom:1px solid #f0f0f0">${s.DistanceFromStart || 0} km</td></tr>
      <tr><td style="padding:10px 0;color:#888;border-bottom:1px solid #f0f0f0">Kinh Độ</td><td style="padding:10px 0;border-bottom:1px solid #f0f0f0">${s.Longitude || "--"}</td></tr>
      <tr><td style="padding:10px 0;color:#888">Vĩ Độ</td><td style="padding:10px 0">${s.Latitude || "--"}</td></tr>
    </table>
    <div class="form-actions" style="margin-top:16px">
      <button class="btn btn-secondary" onclick="closeGlobalModal()">Đóng</button>
      <button class="btn btn-warning" onclick="closeGlobalModal(); openEditStopModal(${s.StopId})">Chỉnh Sửa</button>
    </div>
  `;
  openGlobalModal("Chi Tiết Điểm Dừng", html);
}

function filterStopsPanel() {
  const search = document.getElementById("stopSearchInput").value.toLowerCase();
  const filtered = stopsData.filter((s) => {
    const name = (s.StopName || "").toLowerCase();
    const address = (s.StopAddress || "").toLowerCase();
    return name.includes(search) || address.includes(search);
  });
  renderStopsPanelTable(filtered);
}

function openAddStopModal() {
  if (!stopsSelectedRouteId) {
    showAlert("Vui lòng chọn tuyến đường trước", "error");
    return;
  }
  // Tính thứ tự tiếp theo
  const maxOrder = stopsData.reduce(
    (max, s) => Math.max(max, s.StopOrder || 0),
    0,
  );

  const html = `
    <form onsubmit="submitStopPanel(event, false)">
      <div class="form-row">
        <div class="form-group">
          <label>Thứ Tự *</label>
          <input type="number" id="spOrder" min="1" required value="${maxOrder + 1}" />
        </div>
        <div class="form-group">
          <label>Khoảng Cách Từ Điểm Đầu (km)</label>
          <input type="number" id="spDistance" min="0" value="0" />
        </div>
      </div>
      <div class="form-group">
        <label>Tên Điểm Dừng *</label>
        <input type="text" id="spName" required placeholder="VD: Bến xe Miền Đông" />
      </div>
      <div class="form-group">
        <label>Địa Chỉ</label>
        <input type="text" id="spAddress" placeholder="VD: 292 Đinh Bộ Lĩnh, Bình Thạnh, TP.HCM" />
      </div>
      <div class="form-row">
        <div class="form-group">
          <label>Kinh Độ</label>
          <input type="text" id="spLng" placeholder="VD: 106.6942" />
        </div>
        <div class="form-group">
          <label>Vĩ Độ</label>
          <input type="text" id="spLat" placeholder="VD: 10.8142" />
        </div>
      </div>
      <div class="form-actions">
        <button type="button" class="btn btn-secondary" onclick="closeGlobalModal()">Hủy</button>
        <button type="submit" class="btn btn-primary">Lưu</button>
      </div>
    </form>
  `;
  openGlobalModal("Thêm Điểm Dừng Mới", html);
}

function openEditStopModal(stopId) {
  const s = stopsData.find((x) => x.StopId === stopId);
  if (!s) return;

  const html = `
    <form onsubmit="submitStopPanel(event, true, ${stopId})">
      <div class="form-row">
        <div class="form-group">
          <label>Thứ Tự *</label>
          <input type="number" id="spOrder" min="1" required value="${s.StopOrder}" />
        </div>
        <div class="form-group">
          <label>Khoảng Cách Từ Điểm Đầu (km)</label>
          <input type="number" id="spDistance" min="0" value="${s.DistanceFromStart || 0}" />
        </div>
      </div>
      <div class="form-group">
        <label>Tên Điểm Dừng *</label>
        <input type="text" id="spName" required value="${s.StopName}" />
      </div>
      <div class="form-group">
        <label>Địa Chỉ</label>
        <input type="text" id="spAddress" value="${s.StopAddress || ""}" />
      </div>
      <div class="form-row">
        <div class="form-group">
          <label>Kinh Độ</label>
          <input type="text" id="spLng" value="${s.Longitude || ""}" />
        </div>
        <div class="form-group">
          <label>Vĩ Độ</label>
          <input type="text" id="spLat" value="${s.Latitude || ""}" />
        </div>
      </div>
      <div class="form-actions">
        <button type="button" class="btn btn-secondary" onclick="closeGlobalModal()">Hủy</button>
        <button type="submit" class="btn btn-primary">Cập Nhật</button>
      </div>
    </form>
  `;
  openGlobalModal("Chỉnh Sửa Điểm Dừng", html);
}

async function submitStopPanel(e, isEdit, stopId) {
  e.preventDefault();
  const data = {
    maTuyen: stopsSelectedRouteId,
    thuTu: parseInt(document.getElementById("spOrder").value),
    tenDiemDung: document.getElementById("spName").value.trim(),
    diaChiDiemDung: document.getElementById("spAddress").value.trim() || null,
    khoangCachTuDiemDau:
      parseInt(document.getElementById("spDistance").value) || 0,
    kinhDo: document.getElementById("spLng").value.trim() || null,
    viDo: document.getElementById("spLat").value.trim() || null,
  };

  if (!data.tenDiemDung) {
    showAlert("Vui lòng nhập tên điểm dừng", "error");
    return;
  }

  try {
    if (isEdit) {
      await adminFetch(`/admin/stops/${stopId}`, {
        method: "PUT",
        body: JSON.stringify(data),
      });
      showAlert("Cập nhật điểm dừng thành công!", "success");
    } else {
      await adminFetch("/admin/stops", {
        method: "POST",
        body: JSON.stringify(data),
      });
      showAlert("Thêm điểm dừng thành công!", "success");
    }
    closeGlobalModal();
    await loadStopsPanel();
  } catch (error) {
    showAlert(error.message || "Lỗi khi lưu điểm dừng", "error");
  }
}

async function deleteStopPanel(stopId) {
  if (!confirm("Bạn có chắc muốn xóa điểm dừng này?")) return;
  try {
    await adminFetch(`/admin/stops/${stopId}`, { method: "DELETE" });
    showAlert("Đã xóa điểm dừng thành công!", "success");
    await loadStopsPanel();
  } catch (error) {
    showAlert(error.message || "Lỗi khi xóa điểm dừng", "error");
  }
}
