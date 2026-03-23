/**
 * File: admin-bookings-panel.js
 * Mục đích: Quản lý Đặt Vé trong admin panel
 * Chức năng: Xem danh sách, lọc, xác nhận thanh toán, hủy đặt vé, xem chi tiết
 */

let bookingsData = [];

// ========================================
// RENDER SECTION ĐẶT VÉ
// ========================================
async function renderBookingsSection() {
  const contentArea = document.getElementById("contentArea");

  contentArea.innerHTML = `
    <div class="toolbar">
      <div class="toolbar-left" style="display: flex; flex-wrap: wrap; gap: 12px; align-items: center;">
        <input type="text" class="search-input" id="bookingSearchInput"
          placeholder="Tìm theo tên, SĐT, email..."
          oninput="filterBookingsPanel()" style="max-width: 300px;" />
        <select class="filter-select" id="bookingStatusFilter" onchange="filterBookingsPanel()" style="max-width: 200px;">
          <option value="">Tất cả trạng thái</option>
          <option value="PENDING">Chờ thanh toán</option>
          <option value="PAID">Đã thanh toán</option>
          <option value="CANCELLED">Đã hủy</option>
        </select>
        <div class="toolbar-info" id="bookingsPanelInfo"
          style="display: flex; gap: 8px; align-items: center;">Đang tải...</div>
      </div>
      <div class="toolbar-right">
        <button class="btn btn-primary" onclick="openCreateBookingModal()">+ Tạo vé mới</button>
      </div>
    </div>

    <div class="card">
      <div class="card-body no-padding">
        <div class="table-responsive">
          <table class="data-table">
            <thead>
              <tr>
                <th>Khách Hàng</th>
                <th>Tuyến & Chuyến</th>
                <th>Ghế</th>
                <th>Tổng Tiền</th>
                <th>Trạng Thái</th>
                <th>Thao Tác</th>
              </tr>
            </thead>
            <tbody id="bookingsPanelBody">
              <tr class="loading-row"><td colspan="6"><span class="spinner"></span> Đang tải...</td></tr>
            </tbody>
          </table>
        </div>
      </div>
      <div class="table-footer" style="display:none;"></div>
    </div>
  `;

  await loadBookingsData();
}

/**
 * Tải danh sách đặt vé từ server
 */
async function loadBookingsData() {
  try {
    const res = await adminFetch("/admin/bookings");
    bookingsData = res.data || [];
    renderBookingsPanelTable(bookingsData);
  } catch (e) {
    console.error("Lỗi load đặt vé:", e);
    showAlert("Lỗi khi tải danh sách đặt vé", "error");
    const tbody = document.getElementById("bookingsPanelBody");
    const info = document.getElementById("bookingsPanelInfo");
    if (tbody)
      tbody.innerHTML = `<tr class="loading-row"><td colspan="6" style="color:#ef4444">❌ Không thể tải dữ liệu. Kiểm tra server đang chạy.</td></tr>`;
    if (info) info.textContent = "Lỗi tải dữ liệu";
  }
}

/**
 * Render bảng đặt vé
 */
function renderBookingsPanelTable(data) {
  const tbody = document.getElementById("bookingsPanelBody");
  const info = document.getElementById("bookingsPanelInfo");

  if (!data || data.length === 0) {
    tbody.innerHTML =
      '<tr class="loading-row"><td colspan="6">Không có đặt vé nào</td></tr>';
    info.textContent = "0 đặt vé";
    return;
  }

  const statusMap = {
    PENDING: { label: "Chờ TT", cls: "status-pending" },
    PAID: { label: "Đã TT", cls: "status-active" },
    CANCELLED: { label: "Đã hủy", cls: "status-inactive" },
  };

  tbody.innerHTML = data
    .map((b) => {
      const st = statusMap[b.Status] || { label: b.Status, cls: "" };
      const isPending = b.Status === "PENDING";
      return `
      <tr data-context="booking" data-item="${encodeURIComponent(JSON.stringify(b))}">
        <td>
          <div style="font-weight:600">${b.CustomerName}</div>
          <div style="font-size:12px;color:#888">${b.CustomerPhone || ""}</div>
        </td>
        <td>
          <div style="font-weight:600">${b.RouteName || "-"}</div>
          <div style="font-size:12px;color:#888">${b.DepartureCity || ""} → ${b.ArrivalCity || ""}</div>
          <div style="font-size:12px;color:#888">${formatDate(b.DepartureDate)}</div>
        </td>
        <td><span style="font-family:monospace">${b.SeatList || "-"}</span></td>
        <td><strong style="color:#4CAF50">${formatPrice(b.TotalAmount)}</strong></td>
        <td><span class="status-badge ${st.cls}">${st.label}</span></td>
        <td>
          <div class="btn-group">
            <button class="btn btn-sm btn-secondary" onclick="showBookingDetail(${b.BookingId})">Chi tiết</button>
          </div>
        </td>
      </tr>`;
    })
    .join("");

  // Đếm theo trạng thái
  const paid = data.filter((b) => b.Status === "PAID").length;
  const pending = data.filter((b) => b.Status === "PENDING").length;

  info.innerHTML = `
    <span style="color: #000; font-weight: 600;">Tổng: ${data.length}</span>
    <span style="color: #000; font-weight: 500; margin-left: 16px;">Đã thanh toán: ${paid}</span>
    <span style="color: #000; font-weight: 500; margin-left: 16px;">Chờ thanh toán: ${pending}</span>
  `;
}

/**
 * Lọc danh sách đặt vé
 */
function filterBookingsPanel() {
  const search = document
    .getElementById("bookingSearchInput")
    .value.toLowerCase();
  const status = document.getElementById("bookingStatusFilter").value;

  let filtered = bookingsData;
  if (search) {
    filtered = filtered.filter(
      (b) =>
        (b.CustomerName && b.CustomerName.toLowerCase().includes(search)) ||
        (b.CustomerPhone && b.CustomerPhone.includes(search)) ||
        (b.CustomerEmail && b.CustomerEmail.toLowerCase().includes(search)),
    );
  }
  if (status) {
    filtered = filtered.filter((b) => b.Status === status);
  }
  renderBookingsPanelTable(filtered);
}

/**
 * Xem chi tiết đặt vé
 */
function showBookingDetail(bookingId) {
  const b = bookingsData.find((x) => x.BookingId === bookingId);
  if (!b) return;

  const statusMap = {
    PENDING: '<span class="status-badge status-pending">Chờ thanh toán</span>',
    PAID: '<span class="status-badge status-active">Đã thanh toán</span>',
    CANCELLED: '<span class="status-badge status-inactive">Đã hủy</span>',
  };

  const html = `
    <table style="width:100%;border-collapse:collapse;font-size:14px">
      <tr><td style="padding:10px 0;color:#888;width:40%;border-bottom:1px solid #f0f0f0">Mã Vé</td><td style="padding:10px 0;border-bottom:1px solid #f0f0f0"><strong>${b.TicketCode || "--"}</strong></td></tr>
      <tr><td style="padding:10px 0;color:#888;border-bottom:1px solid #f0f0f0">Khách Hàng</td><td style="padding:10px 0;border-bottom:1px solid #f0f0f0"><strong>${b.CustomerName}</strong></td></tr>
      <tr><td style="padding:10px 0;color:#888;border-bottom:1px solid #f0f0f0">Số Điện Thoại</td><td style="padding:10px 0;border-bottom:1px solid #f0f0f0">${b.CustomerPhone || "--"}</td></tr>
      <tr><td style="padding:10px 0;color:#888;border-bottom:1px solid #f0f0f0">Email</td><td style="padding:10px 0;border-bottom:1px solid #f0f0f0">${b.CustomerEmail || "--"}</td></tr>
      <tr><td style="padding:10px 0;color:#888;border-bottom:1px solid #f0f0f0">Tuyến Đường</td><td style="padding:10px 0;border-bottom:1px solid #f0f0f0">${b.RouteName || "--"}</td></tr>
      <tr><td style="padding:10px 0;color:#888;border-bottom:1px solid #f0f0f0">Hành Trình</td><td style="padding:10px 0;border-bottom:1px solid #f0f0f0">${b.DepartureCity || ""} → ${b.ArrivalCity || ""}</td></tr>
      <tr><td style="padding:10px 0;color:#888;border-bottom:1px solid #f0f0f0">Nhà Xe</td><td style="padding:10px 0;border-bottom:1px solid #f0f0f0">${b.CompanyName || "--"}</td></tr>
      <tr><td style="padding:10px 0;color:#888;border-bottom:1px solid #f0f0f0">Ngày Khởi Hành</td><td style="padding:10px 0;border-bottom:1px solid #f0f0f0">${formatDate(b.DepartureDate)}</td></tr>
      <tr><td style="padding:10px 0;color:#888;border-bottom:1px solid #f0f0f0">Ghế Đã Đặt</td><td style="padding:10px 0;border-bottom:1px solid #f0f0f0"><span style="font-family:monospace">${b.SeatList || "--"}</span></td></tr>
      <tr><td style="padding:10px 0;color:#888;border-bottom:1px solid #f0f0f0">Tổng Tiền</td><td style="padding:10px 0;border-bottom:1px solid #f0f0f0"><strong style="color:#4CAF50">${formatPrice(b.TotalAmount)}</strong></td></tr>
      <tr><td style="padding:10px 0;color:#888;border-bottom:1px solid #f0f0f0">Ngày Đặt</td><td style="padding:10px 0;border-bottom:1px solid #f0f0f0">${formatDateTime ? formatDateTime(b.BookingDate) : formatDate(b.BookingDate)}</td></tr>
      <tr><td style="padding:10px 0;color:#888">Trạng Thái</td><td style="padding:10px 0">${statusMap[b.Status] || b.Status}</td></tr>
    </table>
    <div class="form-actions" style="margin-top:16px">
      ${b.Status === "PENDING" ? `<button class="btn btn-primary" onclick="closeGlobalModal(); confirmBookingPayment(${b.BookingId})">Xác Nhận Thanh Toán</button>` : ""}
      ${b.Status === "PENDING" ? `<button class="btn btn-danger" onclick="closeGlobalModal(); cancelBooking(${b.BookingId})">Hủy Đặt Vé</button>` : ""}
    </div>
  `;
  openGlobalModal(`Chi Tiết Đặt Vé`, html);
}

/**
 * Xác nhận thanh toán
 */
async function confirmBookingPayment(bookingId) {
  if (!confirm(`Xác nhận thanh toán cho đặt vé #${bookingId}?`)) return;
  try {
    await adminFetch(`/admin/bookings/${bookingId}/status`, {
      method: "PUT",
      body: JSON.stringify({ status: "PAID" }),
    });
    showAlert("Xác nhận thanh toán thành công!", "success");
    await loadBookingsData();
  } catch (e) {
    showAlert(e.message || "Lỗi khi xác nhận thanh toán", "error");
  }
}

/**
 * Hủy đặt vé
 */
async function cancelBooking(bookingId) {
  if (!confirm(`Hủy đặt vé #${bookingId}? Thao tác này không thể hoàn tác.`))
    return;
  try {
    await adminFetch(`/admin/bookings/${bookingId}/status`, {
      method: "PUT",
      body: JSON.stringify({ status: "CANCELLED" }),
    });
    showAlert("Hủy đặt vé thành công!", "success");
    await loadBookingsData();
  } catch (e) {
    showAlert(e.message || "Lỗi khi hủy đặt vé", "error");
  }
}

/**
 * Mở modal tạo vé mới (đặt hộ qua điện thoại)
 */
async function openCreateBookingModal() {
  try {
    const tripRes = await adminFetch("/admin/trips");
    const trips = tripRes?.data?.trips || [];

    const tripOptions = trips
      .filter((t) => t.IsActive !== false)
      .map((t) => {
        const route = (t.RouteName || "-").padEnd(35, " ");
        const dateTime = `${formatDate(t.DepartureDate)} ${t.DepartureTime || ""}`;
        const label = `${route}  ${dateTime}`;
        return `<option value="${t.TripId}">${label.replace(/ /g, "\u00A0")}</option>`;
      })
      .join("");

    const html = `
      <form id="createManualBookingForm" onsubmit="submitCreateBooking(event)">
        <div class="form-grid" style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">
          <div class="form-group" style="grid-column:1 / -1">
            <label>Chuyến xe</label>
            <select id="manualTripId" required style="font-family: monospace;" onchange="onManualTripChange()">
              <option value="">-- Chọn chuyến xe --</option>
              ${tripOptions}
            </select>
          </div>
          <div class="form-group">
            <label>Tên khách hàng</label>
            <input type="text" id="manualCustomerName" required placeholder="Nguyễn Văn A" />
          </div>
          <div class="form-group">
            <label>Số điện thoại</label>
            <input type="text" id="manualCustomerPhone" required placeholder="09xxxxxxxx" />
          </div>
          <div class="form-group" style="grid-column:1 / -1">
            <label>Email (tùy chọn)</label>
            <input type="email" id="manualCustomerEmail" placeholder="email@khach.com" />
          </div>
          <div class="form-group" style="grid-column:1 / -1">
            <label>Ghế (cách nhau dấu phẩy)</label>
            <input type="text" id="manualSeatCodes" required placeholder="A01, A02" oninput="updateManualBookingPrice()" />
          </div>
          <div class="form-group" style="grid-column:1 / -1">
            <label>Tổng tiền</label>
            <div id="manualTotalPrice" style="font-weight:700; color:var(--success); font-size:18px;">0 ₫</div>
          </div>
          <div class="form-group">
            <label>Điểm đón</label>
            <select id="manualFromStopOrder" required>
              <option value="">-- Chọn điểm đón --</option>
            </select>
          </div>
          <div class="form-group">
            <label>Điểm trả</label>
            <select id="manualToStopOrder" required>
              <option value="">-- Chọn điểm trả --</option>
            </select>
          </div>
          <div class="form-group" style="grid-column:1 / -1">
            <label>Phương thức thanh toán</label>
            <select id="manualPaymentMethod">
              <option value="OFFLINE">Thu tiền mặt tại quầy</option>
              <option value="QR">QR</option>
              <option value="BANKING">Chuyển khoản</option>
            </select>
          </div>
        </div>
        <div class="form-actions" style="margin-top:16px;display:flex;justify-content:flex-end;gap:10px;">
          <button type="button" class="btn btn-secondary" onclick="closeGlobalModal()">Hủy</button>
          <button type="submit" class="btn btn-primary">Tạo vé</button>
        </div>
      </form>
    `;

    openGlobalModal("Tạo vé mới", html);

    // Lưu trips vào window để dùng cho hàm tính tiền và load stops
    window._manualBookingTrips = trips;
  } catch (e) {
    showAlert(e.message || "Không thể mở form tạo vé", "error");
  }
}

/**
 * Khi thay đổi chuyến xe: Cập nhật giá và Load danh sách điểm dừng
 */
async function onManualTripChange() {
  updateManualBookingPrice();
  const tripId = parseInt(document.getElementById("manualTripId").value, 10);
  const fromSelect = document.getElementById("manualFromStopOrder");
  const toSelect = document.getElementById("manualToStopOrder");

  if (!tripId || !fromSelect || !toSelect) return;

  const trip = (window._manualBookingTrips || []).find((t) => t.TripId === tripId);
  if (!trip || !trip.RouteId) return;

  try {
    fromSelect.innerHTML = '<option value="">Đang tải...</option>';
    toSelect.innerHTML = '<option value="">Đang tải...</option>';

    const res = await adminFetch(`/admin/stops?routeId=${trip.RouteId}`);
    const stops = res.data.stops || [];

    let fromHtml = '<option value="">-- Chọn điểm đón --</option>';
    let toHtml = '<option value="">-- Chọn điểm trả --</option>';

    stops.forEach((s) => {
      const label = `${s.StopOrder}. ${s.StopName}`;
      fromHtml += `<option value="${s.StopOrder}">${label}</option>`;
      toHtml += `<option value="${s.StopOrder}">${label}</option>`;
    });

    fromSelect.innerHTML = fromHtml;
    toSelect.innerHTML = toHtml;

    // Default chọn điểm đầu và điểm cuối
    if (stops.length >= 2) {
      fromSelect.value = stops[0].StopOrder;
      toSelect.value = stops[stops.length - 1].StopOrder;
    }
  } catch (e) {
    console.error("Lỗi load stops cho manual booking:", e);
    fromSelect.innerHTML = '<option value="">Lỗi tải dữ liệu</option>';
    toSelect.innerHTML = '<option value="">Lỗi tải dữ liệu</option>';
  }
}

/**
 * Cập nhật giá vé dự kiến khi user chọn chuyến hoặc nhập ghế
 */
function updateManualBookingPrice() {
  const tripId = parseInt(document.getElementById("manualTripId").value, 10);
  const seatCodes = document.getElementById("manualSeatCodes").value.trim();
  const priceEl = document.getElementById("manualTotalPrice");
  if (!priceEl) return;

  if (!tripId || !seatCodes) {
    priceEl.textContent = "0 ₫";
    return;
  }

  const trip = (window._manualBookingTrips || []).find((t) => t.TripId === tripId);
  if (!trip) {
    priceEl.textContent = "0 ₫";
    return;
  }

  const numSeats = seatCodes.split(",").filter((s) => s.trim()).length;
  priceEl.textContent = formatPrice(trip.Price * numSeats);
}

/**
 * Gửi request tạo vé mới
 */
async function submitCreateBooking(event) {
  event.preventDefault();

  const payload = {
    tripId: parseInt(document.getElementById("manualTripId").value, 10),
    customerName: document.getElementById("manualCustomerName").value.trim(),
    customerPhone: document.getElementById("manualCustomerPhone").value.trim(),
    customerEmail:
      document.getElementById("manualCustomerEmail").value.trim() || null,
    seatCodes: document.getElementById("manualSeatCodes").value.trim(),
    fromStopOrder: parseInt(
      document.getElementById("manualFromStopOrder").value,
      10,
    ),
    toStopOrder: parseInt(
      document.getElementById("manualToStopOrder").value,
      10,
    ),
    paymentMethod: document.getElementById("manualPaymentMethod").value,
    autoConfirm: true,
  };

  if (
    !payload.tripId ||
    !payload.customerName ||
    !payload.customerPhone ||
    !payload.seatCodes
  ) {
    showAlert("Vui lòng nhập đủ thông tin bắt buộc", "error");
    return;
  }

  try {
    const result = await adminFetch("/admin/bookings/manual", {
      method: "POST",
      body: JSON.stringify(payload),
    });

    closeGlobalModal();
    showAlert(
      `Tạo vé thành công: ${result?.data?.booking?.TicketCode || "(chưa có mã)"}`,
      "success",
    );
    await loadBookingsData();
  } catch (e) {
    showAlert(e.message || "Lỗi khi tạo vé mới", "error");
  }
}
