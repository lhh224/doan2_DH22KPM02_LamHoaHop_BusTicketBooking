/**
 * File: admin-dashboard.js
 * Mục đích: Render và quản lý Dashboard cho admin panel
 * Hiển thị: Doanh thu, Vé bán ra, Sắp chạy, Tỉ lệ lấp đầy
 */

// ========================================
// RENDER DASHBOARD
// ========================================
async function renderDashboard() {
  const contentArea = document.getElementById("contentArea");

  contentArea.innerHTML = `
    <!-- Stat Cards -->
    <div class="stats-grid" id="dashboardStats">
      <div class="stat-card revenue">

        <div class="stat-card-label">Doanh Thu Tháng</div>
        <div class="stat-card-value" id="statMonthRevenue">--</div>
        <div class="stat-card-sub" id="statTodayRevenue">Hôm nay: --</div>
      </div>
      <div class="stat-card tickets">

        <div class="stat-card-label">Vé Bán Ra</div>
        <div class="stat-card-value" id="statTotalPaid">--</div>
        <div class="stat-card-sub" id="statTodayPaid">Hôm nay: --</div>
      </div>
      <div class="stat-card upcoming">

        <div class="stat-card-label">Sắp Khởi Hành</div>
        <div class="stat-card-value" id="statUpcoming">--</div>
        <div class="stat-card-sub">Chuyến xe trong 24h tới</div>
      </div>
      <div class="stat-card fill-rate">

        <div class="stat-card-label">Tỉ Lệ Lấp Đầy</div>
        <div class="stat-card-value" id="statFillRate">--%</div>
        <div class="stat-card-sub" id="statFillSub">-- / -- ghế</div>
      </div>
    </div>

    <!-- Charts Row -->
    <div class="charts-grid">
      <div class="chart-card">
        <h3>Doanh Thu Theo Tháng ${new Date().getFullYear()}</h3>
        <div class="chart-container">
          <canvas id="dashRevenueChart"></canvas>
        </div>
      </div>
      <div class="chart-card">
        <h3>Tuyến Đường Phổ Biến</h3>
        <div class="chart-container">
          <canvas id="dashTopRoutesChart"></canvas>
        </div>
      </div>
    </div>

    <!-- Upcoming Trips -->
    <div class="card">
      <div class="card-header">
        <h3>Chuyến Xe Sắp Khởi Hành</h3>
      </div>
      <div class="card-body no-padding">
        <div class="table-responsive">
          <table class="data-table">
            <thead>
              <tr>
                <th>Tuyến</th>
                <th>Nhà Xe</th>
                <th>Loại Xe</th>
                <th>Ngày Khởi Hành</th>
                <th>Giờ KH</th>
                <th>Lấp Đầy</th>
              </tr>
            </thead>
            <tbody id="upcomingTripsBody">
              <tr class="loading-row"><td colspan="6"><span class="spinner"></span> Đang tải...</td></tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `;

  // Load dữ liệu song song
  await Promise.all([
    loadDashboardRevenue(),
    loadDashboardPaidBookings(),
    loadDashboardUpcomingTrips(),
    loadDashboardFillRate(),
    loadDashboardRevenueChart(),
    loadDashboardTopRoutes(),
  ]);
}

// ========================================
// LOAD DỮ LIỆU DASHBOARD
// ========================================

/**
 * Doanh thu từ bảng Payments
 */
async function loadDashboardRevenue() {
  try {
    const res = await adminFetch("/admin/dashboard/revenue-payments");
    const d = res.data;
    document.getElementById("statMonthRevenue").textContent = formatCurrency(
      d.MonthRevenue,
    );
    document.getElementById("statTodayRevenue").textContent =
      `Hôm nay: ${formatCurrency(d.TodayRevenue)}`;
  } catch (e) {
    console.error("Lỗi load doanh thu:", e);
    document.getElementById("statMonthRevenue").textContent = "Lỗi";
  }
}

/**
 * Vé bán ra
 */
async function loadDashboardPaidBookings() {
  try {
    const res = await adminFetch("/admin/dashboard/paid-bookings");
    const d = res.data;
    document.getElementById("statTotalPaid").textContent = d.TotalPaid || 0;
    document.getElementById("statTodayPaid").textContent =
      `Hôm nay: ${d.TodayPaid || 0} | Tháng: ${d.MonthPaid || 0}`;
  } catch (e) {
    console.error("Lỗi load vé bán ra:", e);
  }
}

/**
 * Chuyến xe sắp chạy
 */
async function loadDashboardUpcomingTrips() {
  try {
    const res = await adminFetch("/admin/dashboard/upcoming-trips");
    const trips = res.data || [];
    document.getElementById("statUpcoming").textContent = trips.length;

    const tbody = document.getElementById("upcomingTripsBody");
    if (trips.length === 0) {
      tbody.innerHTML =
        '<tr class="loading-row"><td colspan="6">Không có chuyến xe sắp chạy</td></tr>';
      return;
    }

    tbody.innerHTML = trips
      .map((trip) => {
        const fillPercent =
          trip.TotalSeats > 0
            ? Math.round((trip.BookedSeats / trip.TotalSeats) * 100)
            : 0;
        const fillClass =
          fillPercent < 50 ? "low" : fillPercent < 80 ? "medium" : "high";

        return `
        <tr>
          <td><strong>${trip.RouteName}</strong><br><small style="color:var(--text-secondary)">${trip.DepartureCity} → ${trip.ArrivalCity}</small></td>
          <td>${trip.CompanyName}</td>
          <td>${trip.BusTypeName}</td>
          <td>${formatDate(trip.DepartureDate)}</td>
          <td><strong style="color:var(--primary)">${trip.DepartureTime}</strong></td>
          <td>
            <div>${trip.BookedSeats}/${trip.TotalSeats} <small>(${fillPercent}%)</small></div>
            <div class="progress-bar"><div class="progress-bar-fill ${fillClass}" style="width:${fillPercent}%"></div></div>
          </td>
        </tr>
      `;
      })
      .join("");
  } catch (e) {
    console.error("Lỗi load chuyến xe sắp chạy:", e);
    document.getElementById("upcomingTripsBody").innerHTML =
      '<tr class="loading-row"><td colspan="6">Lỗi khi tải dữ liệu</td></tr>';
  }
}

/**
 * Tỉ lệ lấp đầy
 */
async function loadDashboardFillRate() {
  try {
    const res = await adminFetch("/admin/dashboard/fill-rate");
    const d = res.data;
    document.getElementById("statFillRate").textContent = `${d.fillRate}%`;
    document.getElementById("statFillSub").textContent =
      `${d.bookedSeats} / ${d.totalSeats} ghế`;
  } catch (e) {
    console.error("Lỗi load tỉ lệ lấp đầy:", e);
  }
}

/**
 * Biểu đồ doanh thu theo tháng
 */
async function loadDashboardRevenueChart() {
  try {
    const year = new Date().getFullYear();
    const res = await adminFetch(`/admin/dashboard/revenue-chart?year=${year}`);
    const data = res.data || [];

    const labels = [];
    const values = [];
    for (let i = 1; i <= 12; i++) {
      labels.push(`T${i}`);
      const found = data.find((d) => d.Month === i);
      values.push(found ? found.Revenue : 0);
    }

    const ctx = document.getElementById("dashRevenueChart");
    if (ctx) {
      new Chart(ctx, {
        type: "bar",
        data: {
          labels: labels,
          datasets: [
            {
              label: "Doanh thu (VNĐ)",
              data: values,
              backgroundColor: "rgba(79, 70, 229, 0.6)",
              borderColor: "#4f46e5",
              borderWidth: 1,
              borderRadius: 4,
            },
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { display: false },
          },
          scales: {
            y: {
              beginAtZero: true,
              ticks: {
                callback: (val) => formatCurrency(val),
              },
            },
          },
        },
      });
    }
  } catch (e) {
    console.error("Lỗi load chart doanh thu:", e);
  }
}

/**
 * Biểu đồ top tuyến xe
 */
async function loadDashboardTopRoutes() {
  try {
    const res = await adminFetch("/admin/dashboard/top-routes?limit=5");
    const data = res.data || [];

    const labels = data.map((d) => d.RouteName);
    const values = data.map((d) => d.BookingCount);
    const colors = ["#4f46e5", "#06b6d4", "#10b981", "#f59e0b", "#ef4444"];

    const ctx = document.getElementById("dashTopRoutesChart");
    if (ctx) {
      new Chart(ctx, {
        type: "doughnut",
        data: {
          labels: labels,
          datasets: [
            {
              data: values,
              backgroundColor: colors.slice(0, labels.length),
              borderWidth: 2,
              borderColor: "#fff",
            },
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              position: "right",
              labels: { font: { size: 12 } },
            },
          },
        },
      });
    }
  } catch (e) {
    console.error("Lỗi load top tuyến:", e);
  }
}

