/**
 * File: admin-trips-panel.js
 * Mục đích: Quản lý Chuyến Xe trong admin panel (sidebar layout)
 * CRUD đầy đủ: Thêm / Sửa / Xóa chuyến xe
 */

let tripsData = [];
let tripsRouteList = [];
let tripsCompanyList = [];
let tripsBusTypeList = [];

async function renderTripsSection() {
  const contentArea = document.getElementById("contentArea");

  contentArea.innerHTML = `
    <div class="toolbar">
      <div class="toolbar-left">
        <input type="text" class="search-input" id="tripSearchInput" placeholder="Tìm theo tuyến, nhà xe, thành phố..." oninput="filterTripsPanel()" />
        <div class="toolbar-info" id="tripsPanelInfo" style="margin-left: 16px; font-weight: 500; color: var(--text-secondary);">Đang tải...</div>
      </div>
      <div class="toolbar-right">
        <button class="btn btn-primary" onclick="openAddTripModal()">Thêm Chuyến Xe</button>
      </div>
    </div>

    <div class="card">
      <div class="card-body no-padding">
        <div class="table-responsive">
          <table class="data-table">
            <thead>
              <tr>
                <th>Tuyến & Nhà Xe</th>
                <th>Ngày & Giờ</th>
                <th>Giá Vé</th>
                <th>Trạng Thái</th>
                <th>Thao Tác</th>
              </tr>
            </thead>
            <tbody id="tripsPanelBody">
              <tr class="loading-row"><td colspan="5"><span class="spinner"></span> Đang tải...</td></tr>
            </tbody>
          </table>
        </div>
      </div>
      <div class="table-footer" style="display:none;"></div>
    </div>
  `;

  // Load tất cả dữ liệu cần thiết song song
  await Promise.all([
    loadTripsData(),
    loadTripsRoutes(),
    loadTripsCompanies(),
    loadTripsBusTypes(),
  ]);
}

async function loadTripsData() {
  try {
    const res = await adminFetch("/admin/trips");
    tripsData = res.data.trips || [];
    renderTripsPanelTable(tripsData);
  } catch (e) {
    console.error("Lỗi load chuyến xe:", e);
    showAlert("Lỗi khi tải danh sách chuyến xe", "error");
    const tbody = document.getElementById("tripsPanelBody");
    const info = document.getElementById("tripsPanelInfo");
    if (tbody)
      tbody.innerHTML = `<tr class="loading-row"><td colspan="5" style="color:#ef4444">❌ Không thể tải dữ liệu. Kiểm tra server đang chạy.</td></tr>`;
    if (info) info.textContent = "Lỗi tải dữ liệu";
  }
}

async function loadTripsRoutes() {
  try {
    const res = await adminFetch("/admin/routes");
    tripsRouteList = res.data.routes || [];
  } catch (e) {
    console.error("Lỗi load routes cho trips:", e);
  }
}

async function loadTripsCompanies() {
  try {
    const res = await adminFetch("/admin/companies");
    tripsCompanyList = res.data.companies || [];
  } catch (e) {
    console.error("Lỗi load companies cho trips:", e);
  }
}

async function loadTripsBusTypes() {
  try {
    const res = await adminFetch("/admin/bus-types");
    tripsBusTypeList = res.data.busTypes || [];
  } catch (e) {
    console.error("Lỗi load bus types cho trips:", e);
  }
}

function renderTripsPanelTable(data) {
  const tbody = document.getElementById("tripsPanelBody");
  const info = document.getElementById("tripsPanelInfo");

  if (!data || data.length === 0) {
    tbody.innerHTML =
      '<tr class="loading-row"><td colspan="5">Không có chuyến xe nào</td></tr>';
    info.textContent = "0 chuyến xe";
    return;
  }

  tbody.innerHTML = data
    .map(
      (t) => `
    <tr data-context="trip" data-item="${encodeURIComponent(JSON.stringify(t))}">
      <td>
        <div style="font-weight:600">${t.RouteName || "-"}</div>
        <div style="font-size:12px;color:#888">${t.CompanyName || ""}</div>
      </td>
      <td style="white-space:nowrap">
        <div>${formatDate(t.DepartureDate)}</div>
        <div style="font-size:12px;color:#888">${tripFormatTime(t.DepartureTime)} → ${tripFormatTime(t.ArrivalTime)}</div>
      </td>
      <td><strong style="color:#4CAF50">${formatPrice(t.Price)}</strong></td>
      <td>
        <span class="status-badge ${t.IsActive ? "status-active" : "status-inactive"}">
          ${t.IsActive ? "Hoạt động" : "Tạm ngưng"}
        </span>
      </td>
      <td>
        <div class="btn-group">
          <button class="btn btn-sm btn-secondary" onclick="showTripDetail(${t.TripId})">Chi tiết</button>
          <button class="btn btn-sm btn-warning" onclick="openEditTripModal(${t.TripId})">Sửa</button>
          <button class="btn btn-sm btn-danger" onclick="deleteTripPanel(${t.TripId})">Xóa</button>
        </div>
      </td>
    </tr>
  `,
    )
    .join("");

  info.textContent = `Tổng: ${data.length} chuyến xe`;
}

function showTripDetail(tripId) {
  const t = tripsData.find((x) => x.TripId === tripId);
  if (!t) return;
  const html = `
    <table style="width:100%;border-collapse:collapse;font-size:14px">
      <tr><td style="padding:10px 0;color:#888;width:40%;border-bottom:1px solid #f0f0f0">Tuyến Đường</td><td style="padding:10px 0;border-bottom:1px solid #f0f0f0"><strong>${t.RouteName || "--"}</strong></td></tr>
      <tr><td style="padding:10px 0;color:#888;border-bottom:1px solid #f0f0f0">Hành Trình</td><td style="padding:10px 0;border-bottom:1px solid #f0f0f0">${t.FromCity || ""} → ${t.ToCity || ""}</td></tr>
      <tr><td style="padding:10px 0;color:#888;border-bottom:1px solid #f0f0f0">Nhà Xe</td><td style="padding:10px 0;border-bottom:1px solid #f0f0f0">${t.CompanyName || "--"}</td></tr>
      <tr><td style="padding:10px 0;color:#888;border-bottom:1px solid #f0f0f0">Loại Xe</td><td style="padding:10px 0;border-bottom:1px solid #f0f0f0">${t.BusType || "--"} (${t.TotalSeats || 0} chỗ)</td></tr>
      <tr><td style="padding:10px 0;color:#888;border-bottom:1px solid #f0f0f0">Ngày Khởi Hành</td><td style="padding:10px 0;border-bottom:1px solid #f0f0f0">${formatDate(t.DepartureDate)}</td></tr>
      <tr><td style="padding:10px 0;color:#888;border-bottom:1px solid #f0f0f0">Giờ Khởi Hành</td><td style="padding:10px 0;border-bottom:1px solid #f0f0f0">${tripFormatTime(t.DepartureTime)}</td></tr>
      <tr><td style="padding:10px 0;color:#888;border-bottom:1px solid #f0f0f0">Giờ Đến</td><td style="padding:10px 0;border-bottom:1px solid #f0f0f0">${tripFormatTime(t.ArrivalTime)}</td></tr>
      <tr><td style="padding:10px 0;color:#888;border-bottom:1px solid #f0f0f0">Giá Vé</td><td style="padding:10px 0;border-bottom:1px solid #f0f0f0"><strong style="color:#4CAF50">${formatPrice(t.Price)}</strong></td></tr>
      <tr><td style="padding:10px 0;color:#888">Trạng Thái</td><td style="padding:10px 0">${t.IsActive ? '<span class="status-badge status-active">Hoạt động</span>' : '<span class="status-badge status-inactive">Tạm ngưng</span>'}</td></tr>
    </table>
    <div class="form-actions" style="margin-top:16px">
      <button class="btn btn-secondary" onclick="closeGlobalModal()">Đóng</button>
      <button class="btn btn-warning" onclick="closeGlobalModal(); openEditTripModal(${t.TripId})">Chỉnh Sửa</button>
    </div>
  `;
  openGlobalModal("Chi Tiết Chuyến Xe", html);
}

/** Format thời gian cho trips (xử lý ISO datetime và HH:mm:ss) */
function tripFormatTime(timeString) {
  if (!timeString) return "";
  // Nếu là ISO datetime string (VD: 1970-01-01T07:30:00.000Z)
  if (timeString.includes("T")) {
    const date = new Date(timeString);
    const hours = date.getUTCHours().toString().padStart(2, "0");
    const minutes = date.getUTCMinutes().toString().padStart(2, "0");
    return `${hours}:${minutes}`;
  }
  // Nếu đã là HH:mm:ss hoặc HH:mm
  return timeString.substring(0, 5);
}

function filterTripsPanel() {
  const search = document.getElementById("tripSearchInput").value.toLowerCase();
  const filtered = tripsData.filter((t) => {
    return (
      (t.RouteName || "").toLowerCase().includes(search) ||
      (t.CompanyName || "").toLowerCase().includes(search) ||
      (t.FromCity || "").toLowerCase().includes(search) ||
      (t.ToCity || "").toLowerCase().includes(search) ||
      (t.BusType || "").toLowerCase().includes(search)
    );
  });
  renderTripsPanelTable(filtered);
}

function buildTripFormHTML(trip) {
  const isEdit = !!trip;
  const today = new Date().toISOString().split("T")[0];

  // Build route options
  const routeOpts = tripsRouteList
    .map((r) => {
      const id = r.route_id || r.id;
      const selected = isEdit && id == trip.RouteId ? "selected" : "";
      return `<option value="${id}" ${selected}>${r.route_name || r.name} (${r.departure_city || r.departureCity} → ${r.arrival_city || r.arrivalCity})</option>`;
    })
    .join("");

  // Build company options
  const companyOpts = tripsCompanyList
    .map((c) => {
      const selected =
        isEdit && c.CompanyID == trip.CompanyId ? "selected" : "";
      return `<option value="${c.CompanyID}" ${selected}>${c.CompanyName}</option>`;
    })
    .join("");

  // Build bus type options
  const busTypeOpts = tripsBusTypeList
    .map((b) => {
      const selected = isEdit && b.Id == trip.BusTypeId ? "selected" : "";
      return `<option value="${b.Id}" ${selected}>${b.Name} (${b.Seats} chỗ)</option>`;
    })
    .join("");

  const depDate = isEdit ? (trip.DepartureDate || "").split("T")[0] : today;
  const depTime = isEdit ? tripFormatTime(trip.DepartureTime) : "";
  const arrTime = isEdit ? tripFormatTime(trip.ArrivalTime) : "";
  const price = isEdit ? trip.Price : "";
  const isActive = isEdit ? trip.IsActive.toString() : "true";
  const tripId = isEdit ? trip.TripId : "";

  return `
    <form onsubmit="submitTripPanel(event, ${isEdit}, ${tripId || 0})">
      <div class="form-group">
        <label>Tuyến Đường *</label>
        <select id="trpRouteId" required>
          <option value="">-- Chọn tuyến --</option>
          ${routeOpts}
        </select>
      </div>
      <div class="form-row">
        <div class="form-group">
          <label>Nhà Xe *</label>
          <select id="trpCompanyId" required>
            <option value="">-- Chọn nhà xe --</option>
            ${companyOpts}
          </select>
        </div>
        <div class="form-group">
          <label>Loại Xe *</label>
          <select id="trpBusTypeId" required>
            <option value="">-- Chọn loại xe --</option>
            ${busTypeOpts}
          </select>
        </div>
      </div>
      <div class="form-group">
        <label>Ngày Khởi Hành *</label>
        <input type="date" id="trpDepartureDate" required value="${depDate}" min="${today}" />
      </div>
      <div class="form-row">
        <div class="form-group">
          <label>Giờ Khởi Hành *</label>
          <input type="time" id="trpDepartureTime" required value="${depTime}" />
        </div>
        <div class="form-group">
          <label>Giờ Đến *</label>
          <input type="time" id="trpArrivalTime" required value="${arrTime}" />
        </div>
      </div>
      <div class="form-row">
        <div class="form-group">
          <label>Giá Vé (VNĐ) *</label>
          <input type="number" id="trpPrice" required min="0" step="1000" value="${price}" placeholder="VD: 300000" />
        </div>
        <div class="form-group">
          <label>Trạng Thái</label>
          <select id="trpIsActive">
            <option value="true" ${isActive === "true" ? "selected" : ""}>Hoạt động</option>
            <option value="false" ${isActive === "false" ? "selected" : ""}>Tạm ngưng</option>
          </select>
        </div>
      </div>
      <div class="form-actions">
        <button type="button" class="btn btn-secondary" onclick="closeGlobalModal()">Hủy</button>
        <button type="submit" class="btn btn-primary">${isEdit ? "Cập Nhật" : "Lưu"}</button>
      </div>
    </form>
  `;
}

function openAddTripModal() {
  const html = buildTripFormHTML(null);
  openGlobalModal("Thêm Chuyến Xe Mới", html);
}

function openEditTripModal(tripId) {
  const trip = tripsData.find((t) => t.TripId === tripId);
  if (!trip) return;
  const html = buildTripFormHTML(trip);
  openGlobalModal("Chỉnh Sửa Chuyến Xe", html);
}

async function submitTripPanel(e, isEdit, tripId) {
  e.preventDefault();

  // Lấy giá trị time
  const departureTimeValue = document
    .getElementById("trpDepartureTime")
    .value.trim();
  const arrivalTimeValue = document
    .getElementById("trpArrivalTime")
    .value.trim();

  // Validate time format
  if (!departureTimeValue || !departureTimeValue.match(/^\d{2}:\d{2}$/)) {
    showAlert("Giờ khởi hành không đúng định dạng HH:mm", "error");
    return;
  }
  if (!arrivalTimeValue || !arrivalTimeValue.match(/^\d{2}:\d{2}$/)) {
    showAlert("Giờ đến không đúng định dạng HH:mm", "error");
    return;
  }

  const data = {
    routeId: parseInt(document.getElementById("trpRouteId").value),
    companyId: parseInt(document.getElementById("trpCompanyId").value),
    busTypeId: parseInt(document.getElementById("trpBusTypeId").value),
    departureDate: document.getElementById("trpDepartureDate").value,
    departureTime: departureTimeValue + ":00",
    arrivalTime: arrivalTimeValue + ":00",
    price: parseFloat(document.getElementById("trpPrice").value),
    isActive: document.getElementById("trpIsActive").value === "true",
  };

  try {
    if (isEdit) {
      await adminFetch(`/admin/trips/${tripId}`, {
        method: "PUT",
        body: JSON.stringify(data),
      });
      showAlert("Cập nhật chuyến xe thành công!", "success");
    } else {
      await adminFetch("/admin/trips", {
        method: "POST",
        body: JSON.stringify(data),
      });
      showAlert("Thêm chuyến xe thành công!", "success");
    }
    closeGlobalModal();
    await loadTripsData();
  } catch (error) {
    showAlert(error.message || "Lỗi khi lưu chuyến xe", "error");
  }
}

async function deleteTripPanel(tripId) {
  const trip = tripsData.find((t) => t.TripId === tripId);
  if (!trip) return;

  if (
    !confirm(
      `Bạn có chắc muốn xóa chuyến xe:\n${trip.RouteName} - ${formatDate(trip.DepartureDate)} ${tripFormatTime(trip.DepartureTime)}?`,
    )
  )
    return;

  try {
    await adminFetch(`/admin/trips/${tripId}`, { method: "DELETE" });
    showAlert("Đã xóa chuyến xe thành công!", "success");
    await loadTripsData();
  } catch (error) {
    showAlert(error.message || "Lỗi khi xóa chuyến xe", "error");
  }
}
