/**
 * File: admin-statistics.js
 * Mục đích: Render phần Thống kê nâng cao với biểu đồ
 * Bao gồm: Doanh thu theo thời gian, theo nhà xe, theo tuyến, phương thức thanh toán
 */

let statsCharts = {}; // Lưu trữ các instance Chart.js để destroy khi re-render

// ========================================
// RENDER SECTION THỐNG KÊ
// ========================================
async function renderStatisticsSection() {
  const contentArea = document.getElementById("contentArea");
  const currentYear = new Date().getFullYear();

  contentArea.innerHTML = `
    <!-- Toolbar -->
    <div class="toolbar">
      <div class="toolbar-left">
        <label style="font-weight:600; margin-right:8px;">Năm:</label>
        <select class="filter-select" id="statsYear" onchange="reloadStatistics()">
          ${[currentYear, currentYear - 1, currentYear - 2].map((y) => `<option value="${y}" ${y === currentYear ? "selected" : ""}>${y}</option>`).join("")}
        </select>
      </div>
    </div>

    <!-- Tổng doanh thu -->
    <div class="stats-grid" id="statsSummary">
      <div class="stat-card revenue">

        <div class="stat-card-label">Tổng Doanh Thu (Payments COMPLETED)</div>
        <div class="stat-card-value" id="statsTotalRevenue">--</div>
      </div>
      <div class="stat-card tickets">

        <div class="stat-card-label">Tổng Giao Dịch</div>
        <div class="stat-card-value" id="statsTotalTransactions">--</div>
      </div>
    </div>

    <!-- Biểu đồ doanh thu theo thời gian -->
    <div class="card" style="margin-bottom:24px">
      <div class="card-header">
        <h3>Doanh Thu Theo Thời Gian</h3>
        <div class="time-filter" id="timePeriodFilter">
          <button class="active" data-period="day" onclick="changeTimePeriod('day')">Ngày</button>
          <button data-period="week" onclick="changeTimePeriod('week')">Tuần</button>
          <button data-period="month" onclick="changeTimePeriod('month')">Tháng</button>
          <button data-period="year" onclick="changeTimePeriod('year')">Năm</button>
        </div>
      </div>
      <div class="card-body">
        <div class="chart-container">
          <canvas id="revenueTimeChart"></canvas>
        </div>
      </div>
    </div>

    <!-- Biểu đồ doanh thu theo nhà xe & theo tuyến -->
    <div class="charts-grid">
      <div class="chart-card">
        <h3>Doanh Thu Theo Nhà Xe</h3>
        <div class="chart-container">
          <canvas id="revenueCompanyChart"></canvas>
        </div>
      </div>
      <div class="chart-card">
        <h3>Doanh Thu Theo Tuyến Đường</h3>
        <div class="chart-container">
          <canvas id="revenueRouteChart"></canvas>
        </div>
      </div>
    </div>

    <!-- Phương thức thanh toán -->
    <div class="charts-grid">
      <div class="chart-card">
        <h3>Phương Thức Thanh Toán</h3>
        <div class="chart-container">
          <canvas id="paymentMethodChart"></canvas>
        </div>
      </div>
      <div class="chart-card">
        <h3>Chi Tiết Phương Thức Thanh Toán</h3>
        <div id="paymentMethodTable" style="padding:10px">
          <div class="section-loading"><span class="spinner"></span> Đang tải...</div>
        </div>
      </div>
    </div>
  `;

  await reloadStatistics();
}

/**
 * Reload tất cả thống kê
 */
async function reloadStatistics() {
  // Destroy các chart cũ
  Object.values(statsCharts).forEach((chart) => {
    if (chart && chart.destroy) chart.destroy();
  });
  statsCharts = {};

  await Promise.all([
    loadStatsTotalRevenue(),
    loadRevenueByTime("day"),
    loadRevenueByCompany(),
    loadRevenueByRoute(),
    loadPaymentMethods(),
  ]);
}

/**
 * Đổi khoảng thời gian biểu đồ doanh thu
 */
async function changeTimePeriod(period) {
  // Cập nhật active button
  document.querySelectorAll("#timePeriodFilter button").forEach((btn) => {
    btn.classList.toggle("active", btn.getAttribute("data-period") === period);
  });

  // Reload chart
  if (statsCharts.revenueTime) {
    statsCharts.revenueTime.destroy();
    delete statsCharts.revenueTime;
  }
  await loadRevenueByTime(period);
}

// ========================================
// LOAD DỮ LIỆU THỐNG KÊ
// ========================================

/**
 * Tổng doanh thu
 */
async function loadStatsTotalRevenue() {
  try {
    const year =
      document.getElementById("statsYear")?.value || new Date().getFullYear();
    const res = await adminFetch(
      `/admin/stats/revenue-by-time?period=year&year=${year}`,
    );
    const data = res.data || [];

    let totalRevenue = 0;
    let totalTransactions = 0;
    data.forEach((d) => {
      totalRevenue += d.Revenue || 0;
      totalTransactions += d.TransactionCount || 0;
    });

    document.getElementById("statsTotalRevenue").textContent =
      formatCurrency(totalRevenue);
    document.getElementById("statsTotalTransactions").textContent =
      totalTransactions;
  } catch (e) {
    console.error("Lỗi load tổng doanh thu:", e);
  }
}

/**
 * Biểu đồ Line - Doanh thu theo thời gian
 */
async function loadRevenueByTime(period) {
  try {
    const year =
      document.getElementById("statsYear")?.value || new Date().getFullYear();
    const res = await adminFetch(
      `/admin/stats/revenue-by-time?period=${period}&year=${year}`,
    );
    const data = res.data || [];

    let labels = [];
    let values = [];

    if (period === "day") {
      labels = data.map((d) => formatDate(d.Label));
      values = data.map((d) => d.Revenue || 0);
    } else if (period === "week") {
      labels = data.map((d) => `Tuần ${d.WeekNum}`);
      values = data.map((d) => d.Revenue || 0);
    } else if (period === "month") {
      // Tạo đủ 12 tháng
      for (let i = 1; i <= 12; i++) {
        labels.push(`Tháng ${i}`);
        const found = data.find((d) => d.MonthNum === i);
        values.push(found ? found.Revenue : 0);
      }
    } else {
      labels = data.map((d) => `${d.YearNum}`);
      values = data.map((d) => d.Revenue || 0);
    }

    const ctx = document.getElementById("revenueTimeChart");
    if (!ctx) return;

    statsCharts.revenueTime = new Chart(ctx, {
      type: "line",
      data: {
        labels: labels,
        datasets: [
          {
            label: "Doanh thu (VNĐ)",
            data: values,
            borderColor: "#4f46e5",
            backgroundColor: "rgba(79, 70, 229, 0.1)",
            fill: true,
            tension: 0.4,
            pointBackgroundColor: "#4f46e5",
            pointRadius: 4,
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
            ticks: { callback: (val) => formatCurrency(val) },
          },
        },
      },
    });
  } catch (e) {
    console.error("Lỗi load doanh thu theo thời gian:", e);
  }
}

/**
 * Biểu đồ Bar - Doanh thu theo nhà xe
 */
async function loadRevenueByCompany() {
  try {
    const year =
      document.getElementById("statsYear")?.value || new Date().getFullYear();
    const res = await adminFetch(
      `/admin/stats/revenue-by-company?year=${year}`,
    );
    const data = res.data || [];

    const labels = data.map((d) => d.CompanyName);
    const values = data.map((d) => d.Revenue || 0);
    const colors = [
      "#4f46e5",
      "#06b6d4",
      "#10b981",
      "#f59e0b",
      "#ef4444",
      "#8b5cf6",
      "#ec4899",
    ];

    const ctx = document.getElementById("revenueCompanyChart");
    if (!ctx) return;

    statsCharts.revenueCompany = new Chart(ctx, {
      type: "bar",
      data: {
        labels: labels,
        datasets: [
          {
            label: "Doanh thu (VNĐ)",
            data: values,
            backgroundColor: colors.slice(0, labels.length),
            borderRadius: 6,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        indexAxis: "y",
        plugins: {
          legend: { display: false },
        },
        scales: {
          x: {
            beginAtZero: true,
            ticks: { callback: (val) => formatCurrency(val) },
          },
        },
      },
    });
  } catch (e) {
    console.error("Lỗi load doanh thu theo nhà xe:", e);
  }
}

/**
 * Biểu đồ Bar - Doanh thu theo tuyến đường
 */
async function loadRevenueByRoute() {
  try {
    const year =
      document.getElementById("statsYear")?.value || new Date().getFullYear();
    const res = await adminFetch(`/admin/stats/revenue-by-route?year=${year}`);
    const data = res.data || [];

    const labels = data.map((d) => d.RouteName);
    const values = data.map((d) => d.Revenue || 0);
    const colors = [
      "#10b981",
      "#06b6d4",
      "#4f46e5",
      "#f59e0b",
      "#ef4444",
      "#8b5cf6",
      "#ec4899",
      "#14b8a6",
    ];

    const ctx = document.getElementById("revenueRouteChart");
    if (!ctx) return;

    statsCharts.revenueRoute = new Chart(ctx, {
      type: "bar",
      data: {
        labels: labels,
        datasets: [
          {
            label: "Doanh thu (VNĐ)",
            data: values,
            backgroundColor: colors.slice(0, labels.length),
            borderRadius: 6,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        indexAxis: "y",
        plugins: {
          legend: { display: false },
        },
        scales: {
          x: {
            beginAtZero: true,
            ticks: { callback: (val) => formatCurrency(val) },
          },
        },
      },
    });
  } catch (e) {
    console.error("Lỗi load doanh thu theo tuyến:", e);
  }
}

/**
 * Biểu đồ Pie + Bảng - Phương thức thanh toán
 */
async function loadPaymentMethods() {
  try {
    const year =
      document.getElementById("statsYear")?.value || new Date().getFullYear();
    const res = await adminFetch(`/admin/stats/payment-methods?year=${year}`);
    const data = res.data || [];

    // Pie chart
    const labels = data.map((d) => d.PaymentMethod);
    const values = data.map((d) => d.Count || 0);
    const amounts = data.map((d) => d.TotalAmount || 0);
    const total = values.reduce((a, b) => a + b, 0);
    const colors = ["#4f46e5", "#10b981", "#f59e0b", "#ef4444", "#06b6d4"];

    const ctx = document.getElementById("paymentMethodChart");
    if (ctx) {
      statsCharts.paymentMethod = new Chart(ctx, {
        type: "pie",
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
              position: "bottom",
              labels: { font: { size: 13 } },
            },
            tooltip: {
              callbacks: {
                label: function (context) {
                  const pct =
                    total > 0 ? Math.round((context.parsed / total) * 100) : 0;
                  return `${context.label}: ${context.parsed} (${pct}%)`;
                },
              },
            },
          },
        },
      });
    }

    // Bảng chi tiết
    const tableEl = document.getElementById("paymentMethodTable");
    if (tableEl) {
      if (data.length === 0) {
        tableEl.innerHTML =
          '<div class="empty-state"><div class="empty-state-text">Chưa có dữ liệu thanh toán</div></div>';
        return;
      }
      tableEl.innerHTML = `
        <table class="data-table">
          <thead>
            <tr>
              <th>Phương Thức</th>
              <th>Số Lượng</th>
              <th>Tỷ Lệ</th>
              <th>Tổng Tiền</th>
            </tr>
          </thead>
          <tbody>
            ${data
              .map((d) => {
                const pct = total > 0 ? Math.round((d.Count / total) * 100) : 0;
                return `
                <tr>
                  <td><strong>${d.PaymentMethod}</strong></td>
                  <td>${d.Count}</td>
                  <td>
                    <div style="display:flex;align-items:center;gap:8px">
                      <div class="progress-bar" style="width:100px"><div class="progress-bar-fill low" style="width:${pct}%"></div></div>
                      <span>${pct}%</span>
                    </div>
                  </td>
                  <td>${formatCurrency(d.TotalAmount)}</td>
                </tr>
              `;
              })
              .join("")}
          </tbody>
        </table>
      `;
    }
  } catch (e) {
    console.error("Lỗi load phương thức thanh toán:", e);
  }
}
