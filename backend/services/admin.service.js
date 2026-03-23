/**
 * File: services/admin.service.js
 * Mục đích: Admin service - Quản lý hệ thống
 */

const sql = require("mssql");
const { getPool } = require("../config/db");
const bookingService = require("./booking.service");

/**
 * Lấy thống kê tổng quan
 */
const getDashboardStats = async () => {
  const pool = await getPool();

  // Tổng số booking
  const bookingResult = await pool.query(`
    SELECT 
      COUNT(*) as TotalBookings,
      COUNT(CASE WHEN Status = 'PAID' THEN 1 END) as PaidBookings,
      COUNT(CASE WHEN Status = 'PENDING' THEN 1 END) as PendingBookings,
      COUNT(CASE WHEN Status = 'CANCELLED' THEN 1 END) as CancelledBookings
    FROM Bookings
  `);

  // Doanh thu
  const revenueResult = await pool.query(`
    SELECT 
      SUM(CASE WHEN Status = 'PAID' THEN TotalAmount ELSE 0 END) as TotalRevenue,
      SUM(CASE WHEN Status = 'PAID' AND CAST(BookingDate AS DATE) = CAST(GETDATE() AS DATE) THEN TotalAmount ELSE 0 END) as TodayRevenue,
      SUM(CASE WHEN Status = 'PAID' AND YEAR(BookingDate) = YEAR(GETDATE()) AND MONTH(BookingDate) = MONTH(GETDATE()) THEN TotalAmount ELSE 0 END) as MonthRevenue
    FROM Bookings
  `);

  // Tổng user
  const userResult = await pool.query(`
    SELECT 
      COUNT(*) as TotalUsers,
      COUNT(CASE WHEN Role = 'CUSTOMER' THEN 1 END) as Customers,
      COUNT(CASE WHEN Role = 'ADMIN' THEN 1 END) as Admins
    FROM Users
  `);

  // Tổng chuyến xe
  const tripResult = await pool.query(`
    SELECT 
      COUNT(*) as TotalTrips,
      COUNT(CASE WHEN DepartureDate >= CAST(GETDATE() AS DATE) THEN 1 END) as UpcomingTrips
    FROM Trips
  `);

  return {
    booking: bookingResult.recordset[0],
    revenue: revenueResult.recordset[0],
    user: userResult.recordset[0],
    trip: tripResult.recordset[0],
  };
};

/**
 * Lấy biểu đồ doanh thu theo tháng
 */
const getRevenueChart = async (year) => {
  const pool = await getPool();

  const result = await pool
    .request()
    .input("Year", sql.Int, year || new Date().getFullYear()).query(`
      SELECT 
        MONTH(BookingDate) as Month,
        SUM(TotalAmount) as Revenue,
        COUNT(*) as BookingCount
      FROM Bookings
      WHERE YEAR(BookingDate) = @Year AND Status = 'PAID'
      GROUP BY MONTH(BookingDate)
      ORDER BY MONTH(BookingDate)
    `);

  return result.recordset;
};

/**
 * Lấy top tuyến xe phổ biến
 */
const getTopRoutes = async (limit = 10) => {
  const pool = await getPool();

  const result = await pool.request().input("Limit", sql.Int, limit).query(`
      SELECT TOP (@Limit)
        r.RouteName,
        r.DepartureCity,
        r.ArrivalCity,
        COUNT(b.BookingId) as BookingCount,
        SUM(b.TotalAmount) as Revenue
      FROM Bookings b
      INNER JOIN Trips t ON b.TripId = t.TripId
      INNER JOIN Routes r ON t.RouteId = r.RouteId
      WHERE b.Status = 'PAID'
      GROUP BY r.RouteName, r.DepartureCity, r.ArrivalCity
      ORDER BY BookingCount DESC
    `);

  return result.recordset;
};

/**
 * Quản lý nhà xe
 */
const getAllCompanies = async () => {
  const pool = await getPool();

  const result = await pool.query(`
    SELECT 
      c.CompanyId as CompanyID,
      c.CompanyName,
      c.Phone,
      c.Email,
      c.Address,
      c.Description,
      COUNT(DISTINCT t.TripId) as TotalTrips,
      COUNT(b.BookingId) as TotalBookings,
      ISNULL(AVG(CAST(rv.Rating AS FLOAT)), 0) as Rating,
      c.IsActive
    FROM Companies c
    LEFT JOIN Trips t ON c.CompanyId = t.CompanyId
    LEFT JOIN Bookings b ON t.TripId = b.TripId AND b.Status = 'PAID'
    LEFT JOIN Reviews rv ON c.CompanyId = rv.CompanyId AND rv.Status = 'APPROVED'
    WHERE c.IsActive = 1
    GROUP BY c.CompanyId, c.CompanyName, c.Phone, c.Email, c.Address, c.Description, c.IsActive
    ORDER BY c.CompanyName
  `);

  return result.recordset;
};

/**
 * Quản lý tuyến đường
 */
const getAllRoutes = async () => {
  const pool = await getPool();

  const result = await pool.query(`
    SELECT 
      r.RouteId as route_id,
      r.RouteId as id,
      r.RouteName as route_name,
      r.RouteName as name,
      r.DepartureCity as departure_city,
      r.DepartureCity as departureCity,
      r.ArrivalCity as arrival_city,
      r.ArrivalCity as arrivalCity,
      r.Distance as distance,
      r.EstimatedDuration as estimated_time,
      r.IsActive as is_active,
      r.ImageUrl as image_url,
      COUNT(DISTINCT t.TripId) as total_trips,
      COUNT(b.BookingId) as total_bookings
    FROM Routes r
    LEFT JOIN Trips t ON r.RouteId = t.RouteId
    LEFT JOIN Bookings b ON t.TripId = b.TripId AND b.Status = 'PAID'
    GROUP BY r.RouteId, r.RouteName, r.DepartureCity, r.ArrivalCity, r.Distance, r.EstimatedDuration, r.IsActive, r.ImageUrl
    ORDER BY r.RouteName
  `);

  return result.recordset;
};

/**
 * Quản lý chuyến xe (với filter)
 */
const getTripsAdmin = async (filters = {}) => {
  const pool = await getPool();

  let query = `
    SELECT 
      t.TripId,
      t.RouteId,
      t.CompanyId,
      t.BusTypeId,
      t.DepartureDate,
      t.DepartureTime,
      t.ArrivalTime,
      t.Price,
      t.IsActive,
      t.CreatedAt,
      r.RouteName,
      r.DepartureCity as FromCity,
      r.ArrivalCity as ToCity,
      c.CompanyName,
      bt.BusTypeName as BusType,
      bt.TotalSeats,
      (
        SELECT COUNT(DISTINCT bd.SeatCode)
        FROM BookingDetails bd
        INNER JOIN Bookings b ON bd.BookingId = b.BookingId
        WHERE b.TripId = t.TripId AND b.Status IN ('PAID', 'PENDING')
      ) as BookedSeats
    FROM Trips t
    INNER JOIN Routes r ON t.RouteId = r.RouteId
    INNER JOIN Companies c ON t.CompanyId = c.CompanyId
    INNER JOIN BusTypes bt ON t.BusTypeId = bt.BusTypeId
    WHERE t.IsActive = 1
  `;

  const request = pool.request();

  if (filters.fromDate) {
    query += " AND t.DepartureDate >= @FromDate";
    request.input("FromDate", sql.Date, filters.fromDate);
  }

  if (filters.toDate) {
    query += " AND t.DepartureDate <= @ToDate";
    request.input("ToDate", sql.Date, filters.toDate);
  }

  if (filters.companyId) {
    query += " AND t.CompanyId = @CompanyId";
    request.input("CompanyId", sql.Int, filters.companyId);
  }

  if (filters.routeId) {
    query += " AND t.RouteId = @RouteId";
    request.input("RouteId", sql.Int, filters.routeId);
  }

  query += " ORDER BY t.DepartureDate DESC, t.DepartureTime";

  const result = await request.query(query);

  return result.recordset;
};

/**
 * Quản lý bookings (tất cả)
 */
const getAllBookings = async (filters = {}) => {
  const pool = await getPool();

  let query = `
    SELECT 
      b.BookingId,
      b.TripId,
      b.TicketCode,
      b.CustomerName,
      b.CustomerPhone,
      b.CustomerEmail,
      b.TotalAmount,
      b.Status,
      b.BookingDate,
      t.DepartureDate,
      t.DepartureTime,
      r.RouteName,
      r.DepartureCity,
      r.ArrivalCity,
      c.CompanyName,
      (
        SELECT STRING_AGG(bd.SeatCode, ', ')
        FROM BookingDetails bd
        WHERE bd.BookingId = b.BookingId
      ) as SeatList
    FROM Bookings b
    INNER JOIN Trips t ON b.TripId = t.TripId
    INNER JOIN Routes r ON t.RouteId = r.RouteId
    INNER JOIN Companies c ON t.CompanyId = c.CompanyId
    WHERE 1=1
  `;

  const request = pool.request();

  if (filters.status) {
    query += " AND b.Status = @Status";
    request.input("Status", sql.NVarChar, filters.status);
  }

  if (filters.fromDate) {
    query += " AND b.BookingDate >= @FromDate";
    request.input("FromDate", sql.Date, filters.fromDate);
  }

  if (filters.toDate) {
    query += " AND b.BookingDate <= @ToDate";
    request.input("ToDate", sql.Date, filters.toDate);
  }

  if (filters.search) {
    query +=
      " AND (b.CustomerName LIKE @Search OR b.CustomerPhone LIKE @Search OR b.CustomerEmail LIKE @Search)";
    request.input("Search", sql.NVarChar, `%${filters.search}%`);
  }

  query += " ORDER BY b.BookingDate DESC";

  const result = await request.query(query);

  return result.recordset;
};

/**
 * Quản lý users
 */
const getAllUsers = async (filters = {}) => {
  const pool = await getPool();

  let query = `
    SELECT 
      UserId,
      Email,
      FullName,
      Phone,
      Role,
      Status,
      EmailVerified,
      CreatedAt,
      LastLoginAt
    FROM Users
    WHERE 1=1
  `;

  const request = pool.request();

  if (filters.role) {
    query += " AND Role = @Role";
    request.input("Role", sql.NVarChar, filters.role);
  }

  if (filters.status !== undefined && filters.status !== "") {
    query += " AND Status = @Status";
    request.input("Status", sql.Bit, filters.status === "1" ? 1 : 0);
  }

  if (filters.search) {
    query +=
      " AND (FullName LIKE @Search OR Email LIKE @Search OR Phone LIKE @Search)";
    request.input("Search", sql.NVarChar, `%${filters.search}%`);
  }

  query += " ORDER BY CreatedAt DESC";

  const result = await request.query(query);

  return result.recordset;
};

/**
 * Update user status
 */
const updateUserStatus = async (userId, status) => {
  const pool = await getPool();

  await pool
    .request()
    .input("UserId", sql.Int, userId)
    .input("Status", sql.Bit, status ? 1 : 0).query(`
      UPDATE Users
      SET Status = @Status, UpdatedAt = GETDATE()
      WHERE UserId = @UserId
    `);

  return true;
};

/**
 * Quản lý đánh giá
 */
const getAllReviews = async (filters = {}) => {
  const pool = await getPool();

  let query = `
    SELECT 
      rv.ReviewId,
      rv.Rating,
      rv.Title,
      rv.Content,
      rv.Status,
      rv.CreatedAt,
      u.FullName as UserName,
      u.Email,
      c.CompanyName,
      r.RouteName
    FROM Reviews rv
    LEFT JOIN Users u ON rv.UserId = u.UserId
    INNER JOIN Companies c ON rv.CompanyId = c.CompanyId
    INNER JOIN Trips t ON rv.TripId = t.TripId
    INNER JOIN Routes r ON t.RouteId = r.RouteId
    WHERE 1=1
  `;

  const request = pool.request();

  if (filters.status) {
    query += " AND rv.Status = @Status";
    request.input("Status", sql.NVarChar, filters.status);
  }

  query += " ORDER BY rv.CreatedAt DESC";

  const result = await request.query(query);

  return result.recordset;
};

/**
 * Duyệt/Từ chối đánh giá
 */
const updateReviewStatus = async (reviewId, status) => {
  const pool = await getPool();

  await pool
    .request()
    .input("ReviewId", sql.Int, reviewId)
    .input("Status", sql.NVarChar, status).query(`
      UPDATE Reviews
      SET Status = @Status, ApprovedAt = GETDATE()
      WHERE ReviewId = @ReviewId
    `);

  return true;
};

/**
 * Xóa nhà xe (soft delete)
 */
const deleteCompany = async (companyId) => {
  const pool = await getPool();

  await pool.request().input("CompanyId", sql.Int, companyId).query(`
      UPDATE Companies
      SET IsActive = 0, UpdatedAt = GETDATE()
      WHERE CompanyId = @CompanyId
    `);

  return true;
};

/**
 * Tạo nhà xe mới
 */
const createCompany = async (companyData) => {
  const pool = await getPool();

  const result = await pool
    .request()
    .input("CompanyName", sql.NVarChar, companyData.tenNhaXe)
    .input("Phone", sql.NVarChar, companyData.soDienThoai || null)
    .input("Email", sql.NVarChar, companyData.email || null)
    .input("Address", sql.NVarChar, companyData.diaChi || null)
    .input("Description", sql.NVarChar, companyData.moTa || null)
    .input("CustomerHotline", sql.NVarChar, companyData.hotline || null)
    .input(
      "IsActive",
      sql.Bit,
      companyData.hoatDong !== undefined ? (companyData.hoatDong ? 1 : 0) : 1,
    ).query(`
      INSERT INTO Companies (CompanyName, Phone, Email, Address, Description, CustomerHotline, Rating, IsActive, CreatedAt, UpdatedAt)
      OUTPUT INSERTED.CompanyId
      VALUES (@CompanyName, @Phone, @Email, @Address, @Description, @CustomerHotline, 5.0, @IsActive, GETDATE(), GETDATE())
    `);

  return result.recordset[0].CompanyId;
};

/**
 * Cập nhật nhà xe
 */
const updateCompany = async (companyId, companyData) => {
  const pool = await getPool();

  await pool
    .request()
    .input("CompanyId", sql.Int, companyId)
    .input("CompanyName", sql.NVarChar, companyData.tenNhaXe)
    .input("Phone", sql.NVarChar, companyData.soDienThoai)
    .input("Email", sql.NVarChar, companyData.email)
    .input("Address", sql.NVarChar, companyData.diaChi)
    .input("Description", sql.NVarChar, companyData.moTa || null)
    .input("CustomerHotline", sql.NVarChar, companyData.hotline || null)
    .input(
      "IsActive",
      sql.Bit,
      companyData.hoatDong !== undefined ? (companyData.hoatDong ? 1 : 0) : 1,
    ).query(`
      UPDATE Companies
      SET 
        CompanyName = @CompanyName,
        Phone = @Phone,
        Email = @Email,
        Address = @Address,
        Description = @Description,
        CustomerHotline = @CustomerHotline,
        IsActive = @IsActive,
        UpdatedAt = GETDATE()
      WHERE CompanyId = @CompanyId
    `);

  return true;
};

/**
 * Xóa tuyến đường (soft delete)
 */
const deleteRoute = async (routeId) => {
  const pool = await getPool();

  await pool.request().input("RouteId", sql.Int, routeId).query(`
      UPDATE Routes
      SET IsActive = 0
      WHERE RouteId = @RouteId
    `);

  return true;
};

/**
 * Tạo tuyến đường mới
 */
const createRoute = async (routeData) => {
  const pool = await getPool();

  const result = await pool
    .request()
    .input("RouteName", sql.NVarChar, routeData.tenTuyen)
    .input("DepartureCity", sql.NVarChar, routeData.diemDi)
    .input("ArrivalCity", sql.NVarChar, routeData.diemDen)
    .input("Distance", sql.Int, routeData.khoangCach || 0)
    .input("EstimatedDuration", sql.Int, routeData.thoiGianUocTinh || 0)
    .input("IsActive", sql.Bit, routeData.hoatDong ? 1 : 0)
    .input("ImageUrl", sql.NVarChar, routeData.hinhAnh || null).query(`
      INSERT INTO Routes (RouteName, DepartureCity, ArrivalCity, Distance, EstimatedDuration, IsActive, ImageUrl)
      OUTPUT INSERTED.RouteId
      VALUES (@RouteName, @DepartureCity, @ArrivalCity, @Distance, @EstimatedDuration, @IsActive, @ImageUrl)
    `);

  return result.recordset[0].RouteId;
};

/**
 * Cập nhật tuyến đường
 */
const updateRoute = async (routeId, routeData) => {
  const pool = await getPool();

  await pool
    .request()
    .input("RouteId", sql.Int, routeId)
    .input("RouteName", sql.NVarChar, routeData.tenTuyen)
    .input("DepartureCity", sql.NVarChar, routeData.diemDi)
    .input("ArrivalCity", sql.NVarChar, routeData.diemDen)
    .input("Distance", sql.Int, routeData.khoangCach)
    .input("EstimatedDuration", sql.Int, routeData.thoiGianUocTinh)
    .input("ImageUrl", sql.NVarChar, routeData.hinhAnh || null).query(`
      UPDATE Routes
      SET 
        RouteName = @RouteName,
        DepartureCity = @DepartureCity,
        ArrivalCity = @ArrivalCity,
        Distance = @Distance,
        EstimatedDuration = @EstimatedDuration,
        ImageUrl = @ImageUrl
      WHERE RouteId = @RouteId
    `);

  return true;
};

// ========================================
// QUẢN LÝ ĐIỂM DỪNG (STOPS)
// ========================================

/**
 * Lấy danh sách điểm dừng theo tuyến đường
 */
const getStopsByRoute = async (routeId) => {
  const pool = await getPool();

  const result = await pool.request().input("RouteId", sql.Int, routeId).query(`
    SELECT 
      StopId,
      RouteId,
      StopOrder,
      StopName,
      StopAddress,
      DistanceFromStart,
      IsActive,
      CreatedAt
    FROM Stops
    WHERE RouteId = @RouteId AND IsActive = 1
    ORDER BY StopOrder ASC
  `);

  return result.recordset;
};

/**
 * Tạo điểm dừng mới
 */
const createStop = async (stopData) => {
  const pool = await getPool();

  const result = await pool
    .request()
    .input("RouteId", sql.Int, stopData.maTuyen)
    .input("StopOrder", sql.Int, stopData.thuTu)
    .input("StopName", sql.NVarChar, stopData.tenDiemDung)
    .input("StopAddress", sql.NVarChar, stopData.diaChiDiemDung || null)
    .input("DistanceFromStart", sql.Int, stopData.khoangCachTuDiemDau || 0)
    .input("Longitude", sql.Float, stopData.kinhDo || null)
    .input("Latitude", sql.Float, stopData.viDo || null).query(`
      INSERT INTO Stops (RouteId, StopOrder, StopName, StopAddress, DistanceFromStart, Longitude, Latitude, IsActive, CreatedAt)
      OUTPUT INSERTED.StopId
      VALUES (@RouteId, @StopOrder, @StopName, @StopAddress, @DistanceFromStart, @Longitude, @Latitude, 1, GETDATE())
    `);

  return result.recordset[0].StopId;
};

/**
 * Cập nhật điểm dừng
 */
const updateStop = async (stopId, stopData) => {
  const pool = await getPool();

  await pool
    .request()
    .input("StopId", sql.Int, stopId)
    .input("StopOrder", sql.Int, stopData.thuTu)
    .input("StopName", sql.NVarChar, stopData.tenDiemDung)
    .input("StopAddress", sql.NVarChar, stopData.diaChiDiemDung || null)
    .input("DistanceFromStart", sql.Int, stopData.khoangCachTuDiemDau || 0)
    .query(`
      UPDATE Stops
      SET 
        StopOrder = @StopOrder,
        StopName = @StopName,
        StopAddress = @StopAddress,
        DistanceFromStart = @DistanceFromStart
      WHERE StopId = @StopId
    `);

  return true;
};

/**
 * Xóa điểm dừng (Soft Delete - chuyển IsActive = 0)
 */
const deleteStop = async (stopId) => {
  const pool = await getPool();

  await pool.request().input("StopId", sql.Int, stopId).query(`
    UPDATE Stops SET IsActive = 0 WHERE StopId = @StopId
  `);

  return true;
};

// ========================================
// DASHBOARD NÂNG CAO
// ========================================

/**
 * Lấy danh sách chuyến xe sắp chạy (trong 24h tới)
 */
const getUpcomingTrips = async () => {
  const pool = await getPool();
  const result = await pool.query(`
    SELECT TOP 10
      t.TripId, t.DepartureTime, t.ArrivalTime, t.DepartureDate, t.Price,
      r.RouteName, r.DepartureCity, r.ArrivalCity,
      c.CompanyName,
      bt.BusTypeName, bt.TotalSeats,
      (SELECT COUNT(DISTINCT bd.SeatCode)
       FROM BookingDetails bd
       INNER JOIN Bookings b ON bd.BookingId = b.BookingId
       WHERE b.TripId = t.TripId AND b.Status IN ('PAID', 'PENDING')
      ) as BookedSeats
    FROM Trips t
    INNER JOIN Routes r ON t.RouteId = r.RouteId
    INNER JOIN Companies c ON t.CompanyId = c.CompanyId
    INNER JOIN BusTypes bt ON t.BusTypeId = bt.BusTypeId
    WHERE t.IsActive = 1
      AND (
        t.DepartureDate > CAST(GETDATE() AS DATE)
        OR (t.DepartureDate = CAST(GETDATE() AS DATE) AND t.DepartureTime >= FORMAT(GETDATE(), 'HH:mm'))
      )
    ORDER BY t.DepartureDate ASC, t.DepartureTime ASC
  `);
  return result.recordset;
};

/**
 * Tính tỉ lệ lấp đầy ghế tổng thể
 */
const getFillRate = async () => {
  const pool = await getPool();
  const result = await pool.query(`
    SELECT 
      SUM(bt.TotalSeats) as TotalSeats,
      SUM(sub.BookedSeats) as BookedSeats
    FROM Trips t
    INNER JOIN BusTypes bt ON t.BusTypeId = bt.BusTypeId
    LEFT JOIN (
      SELECT b.TripId, COUNT(DISTINCT bd.SeatCode) as BookedSeats
      FROM BookingDetails bd
      INNER JOIN Bookings b ON bd.BookingId = b.BookingId
      WHERE b.Status IN ('PAID', 'PENDING')
      GROUP BY b.TripId
    ) sub ON t.TripId = sub.TripId
    WHERE t.IsActive = 1
      AND t.DepartureDate >= CAST(GETDATE() AS DATE)
  `);
  const row = result.recordset[0];
  const totalSeats = row.TotalSeats || 0;
  const bookedSeats = row.BookedSeats || 0;
  return {
    totalSeats,
    bookedSeats,
    fillRate:
      totalSeats > 0
        ? Math.round((bookedSeats / totalSeats) * 100 * 100) / 100
        : 0,
  };
};

/**
 * Lấy doanh thu từ bảng Payments theo ngày/tháng
 */
const getRevenueFromPayments = async () => {
  const pool = await getPool();
  const result = await pool.query(`
    SELECT
      ISNULL(SUM(Amount), 0) as TotalRevenue,
      ISNULL(SUM(CASE WHEN CAST(PaymentDate AS DATE) = CAST(GETDATE() AS DATE) THEN Amount ELSE 0 END), 0) as TodayRevenue,
      ISNULL(SUM(CASE WHEN YEAR(PaymentDate) = YEAR(GETDATE()) AND MONTH(PaymentDate) = MONTH(GETDATE()) THEN Amount ELSE 0 END), 0) as MonthRevenue
    FROM Payments
    WHERE Status = 'COMPLETED'
  `);
  return result.recordset[0];
};

/**
 * Đếm vé bán ra (Bookings có Status = 'PAID')
 */
const getPaidBookingsCount = async () => {
  const pool = await getPool();
  const result = await pool.query(`
    SELECT 
      COUNT(*) as TotalPaid,
      COUNT(CASE WHEN CAST(BookingDate AS DATE) = CAST(GETDATE() AS DATE) THEN 1 END) as TodayPaid,
      COUNT(CASE WHEN YEAR(BookingDate) = YEAR(GETDATE()) AND MONTH(BookingDate) = MONTH(GETDATE()) THEN 1 END) as MonthPaid
    FROM Bookings
    WHERE Status = 'PAID'
  `);
  return result.recordset[0];
};

// ========================================
// THỐNG KÊ NÂNG CAO
// ========================================

/**
 * Doanh thu theo thời gian (ngày/tuần/tháng/năm)
 */
const getRevenueByTime = async (period = "month", year = null) => {
  const pool = await getPool();
  const currentYear = year || new Date().getFullYear();
  const request = pool.request().input("Year", sql.Int, currentYear);

  let query = "";
  if (period === "day") {
    query = `
      SELECT 
        CAST(PaymentDate AS DATE) as Label,
        SUM(Amount) as Revenue,
        COUNT(*) as TransactionCount
      FROM Payments
      WHERE Status = 'COMPLETED'
        AND YEAR(PaymentDate) = @Year
      GROUP BY CAST(PaymentDate AS DATE)
      ORDER BY Label
    `;
  } else if (period === "week") {
    query = `
      SELECT 
        DATEPART(WEEK, PaymentDate) as WeekNum,
        MIN(CAST(PaymentDate AS DATE)) as Label,
        SUM(Amount) as Revenue,
        COUNT(*) as TransactionCount
      FROM Payments
      WHERE Status = 'COMPLETED'
        AND YEAR(PaymentDate) = @Year
      GROUP BY DATEPART(WEEK, PaymentDate)
      ORDER BY WeekNum
    `;
  } else if (period === "month") {
    query = `
      SELECT 
        MONTH(PaymentDate) as MonthNum,
        SUM(Amount) as Revenue,
        COUNT(*) as TransactionCount
      FROM Payments
      WHERE Status = 'COMPLETED'
        AND YEAR(PaymentDate) = @Year
      GROUP BY MONTH(PaymentDate)
      ORDER BY MonthNum
    `;
  } else {
    query = `
      SELECT 
        YEAR(PaymentDate) as YearNum,
        SUM(Amount) as Revenue,
        COUNT(*) as TransactionCount
      FROM Payments
      WHERE Status = 'COMPLETED'
      GROUP BY YEAR(PaymentDate)
      ORDER BY YearNum
    `;
  }

  const result = await request.query(query);
  return result.recordset;
};

/**
 * Doanh thu theo nhà xe
 */
const getRevenueByCompany = async (year = null) => {
  const pool = await getPool();
  const currentYear = year || new Date().getFullYear();

  const result = await pool.request().input("Year", sql.Int, currentYear)
    .query(`
      SELECT 
        c.CompanyId, c.CompanyName,
        ISNULL(SUM(p.Amount), 0) as Revenue,
        COUNT(p.PaymentId) as TransactionCount,
        COUNT(DISTINCT b.BookingId) as BookingCount
      FROM Companies c
      LEFT JOIN Trips t ON c.CompanyId = t.CompanyId
      LEFT JOIN Bookings b ON t.TripId = b.TripId AND b.Status = 'PAID'
      LEFT JOIN Payments p ON b.BookingId = p.BookingId AND p.Status = 'COMPLETED'
        AND YEAR(p.PaymentDate) = @Year
      WHERE c.IsActive = 1
      GROUP BY c.CompanyId, c.CompanyName
      ORDER BY Revenue DESC
    `);
  return result.recordset;
};

/**
 * Doanh thu theo tuyến đường
 */
const getRevenueByRoute = async (year = null) => {
  const pool = await getPool();
  const currentYear = year || new Date().getFullYear();

  const result = await pool.request().input("Year", sql.Int, currentYear)
    .query(`
      SELECT 
        r.RouteId, r.RouteName, r.DepartureCity, r.ArrivalCity,
        ISNULL(SUM(p.Amount), 0) as Revenue,
        COUNT(p.PaymentId) as TransactionCount,
        COUNT(DISTINCT b.BookingId) as BookingCount
      FROM Routes r
      LEFT JOIN Trips t ON r.RouteId = t.RouteId
      LEFT JOIN Bookings b ON t.TripId = b.TripId AND b.Status = 'PAID'
      LEFT JOIN Payments p ON b.BookingId = p.BookingId AND p.Status = 'COMPLETED'
        AND YEAR(p.PaymentDate) = @Year
      WHERE r.IsActive = 1
      GROUP BY r.RouteId, r.RouteName, r.DepartureCity, r.ArrivalCity
      ORDER BY Revenue DESC
    `);
  return result.recordset;
};

/**
 * Thống kê phương thức thanh toán
 */
const getPaymentMethodStats = async (year = null) => {
  const pool = await getPool();
  const currentYear = year || new Date().getFullYear();

  const result = await pool.request().input("Year", sql.Int, currentYear)
    .query(`
      SELECT 
        ISNULL(PaymentMethod, N'Không xác định') as PaymentMethod,
        COUNT(*) as Count,
        SUM(Amount) as TotalAmount
      FROM Payments
      WHERE Status = 'COMPLETED'
        AND YEAR(PaymentDate) = @Year
      GROUP BY PaymentMethod
      ORDER BY TotalAmount DESC
    `);
  return result.recordset;
};

// ========================================
// QUẢN LÝ TÀI KHOẢN
// ========================================

/**
 * Tạo tài khoản nhân viên (chỉ admin)
 */
const createStaffAccount = async (userData) => {
  const pool = await getPool();
  const bcrypt = require("bcrypt");

  // Kiểm tra email đã tồn tại
  const check = await pool
    .request()
    .input("Email", sql.NVarChar, userData.email)
    .query("SELECT UserId FROM Users WHERE Email = @Email");

  if (check.recordset.length > 0) {
    throw new Error("Email đã được sử dụng");
  }

  const hashedPassword = await bcrypt.hash(userData.password, 10);

  const result = await pool
    .request()
    .input("Email", sql.NVarChar, userData.email)
    .input("Password", sql.NVarChar, hashedPassword)
    .input("FullName", sql.NVarChar, userData.fullName)
    .input("Phone", sql.NVarChar, userData.phone || null)
    .input("Address", sql.NVarChar, userData.address || null)
    .input("Role", sql.VarChar, userData.role || "STAFF").query(`
      INSERT INTO Users (Email, Password, FullName, Phone, Address, Role, Status, EmailVerified)
      OUTPUT INSERTED.UserId, INSERTED.Email, INSERTED.FullName, INSERTED.Role, INSERTED.Status, INSERTED.CreatedAt
      VALUES (@Email, @Password, @FullName, @Phone, @Address, @Role, 1, 1)
    `);

  return result.recordset[0];
};

/**
 * Khóa/Mở khóa tài khoản
 */
const toggleUserLock = async (userId, action) => {
  const pool = await getPool();
  const status = action === "unlock" ? 1 : 0;

  await pool
    .request()
    .input("UserId", sql.Int, userId)
    .input("Status", sql.Bit, status).query(`
      UPDATE Users
      SET Status = @Status, UpdatedAt = GETDATE()
      WHERE UserId = @UserId
    `);

  return { userId, status };
};

// ========================================
// BOOKINGS & BUS TYPES MANAGEMENT
// ========================================

/**
 * Cập nhật trạng thái booking (xác nhận / hủy)
 */
const updateBookingStatus = async (bookingId, status) => {
  const pool = await getPool();
  await pool
    .request()
    .input("BookingId", sql.Int, bookingId)
    .input("Status", sql.NVarChar, status)
    .query(
      "UPDATE Bookings SET Status = @Status, UpdatedAt = GETDATE() WHERE BookingId = @BookingId",
    );
  return true;
};

/**
 * Tạo vé mới thủ công (đặt hộ khách qua điện thoại)
 */
const createManualBooking = async (payload = {}, actor = null) => {
  const {
    tripId,
    seatCodes,
    fromStopOrder,
    toStopOrder,
    customerName,
    customerPhone,
    customerEmail,
    paymentMethod,
    autoConfirm,
  } = payload;

  if (!tripId || !seatCodes || !customerName || !customerPhone) {
    throw new Error("Thiếu thông tin bắt buộc để tạo vé mới");
  }

  const parsedSeats = Array.isArray(seatCodes)
    ? seatCodes
    : String(seatCodes)
        .split(",")
        .map((s) => s.trim().toUpperCase())
        .filter(Boolean);

  if (!Array.isArray(parsedSeats) || parsedSeats.length === 0) {
    throw new Error("Danh sách ghế không hợp lệ");
  }

  const normalizedFrom = parseInt(fromStopOrder || 1, 10);
  const normalizedTo = parseInt(toStopOrder || normalizedFrom + 1, 10);

  if (Number.isNaN(normalizedFrom) || Number.isNaN(normalizedTo)) {
    throw new Error("Điểm đón/trả không hợp lệ");
  }

  if (normalizedTo <= normalizedFrom) {
    throw new Error("Điểm trả phải lớn hơn điểm đón");
  }

  const pool = await getPool();
  const tripResult = await pool
    .request()
    .input("TripId", sql.Int, parseInt(tripId, 10)).query(`
      SELECT t.TripId, t.Price
      FROM Trips t
      WHERE t.TripId = @TripId AND t.IsActive = 1
    `);

  if (tripResult.recordset.length === 0) {
    throw new Error("Không tìm thấy chuyến xe hợp lệ");
  }

  const trip = tripResult.recordset[0];
  const amount = Number(trip.Price) * parsedSeats.length;

  const booking = await bookingService.lockSeats({
    tripId: trip.TripId,
    userId: null,
    seatCodes: parsedSeats,
    fromStopOrder: normalizedFrom,
    toStopOrder: normalizedTo,
    customerName,
    customerPhone,
    customerEmail: customerEmail || null,
    amount,
  });

  const shouldConfirm = autoConfirm !== false;
  if (shouldConfirm) {
    const txId = `OFFLINE-${Date.now()}-${actor?.id || "SYSTEM"}`;
    await bookingService.confirmPayment(
      booking.BookingId,
      paymentMethod || "OFFLINE",
      txId,
    );
  }

  return bookingService.getBookingById(booking.BookingId);
};

// ========================================
// LOG
// ========================================

/**
 * Transaction Logs - Lịch sử giao dịch
 */
const getTransactionLogs = async (filters = {}) => {
  const pool = await getPool();

  let query = `
    SELECT 
      tr.TransactionId, tr.BookingId, tr.Amount, tr.PaymentMethod,
      tr.Status, tr.ExternalTransactionId, tr.Note, tr.CreatedAt,
      b.CustomerName, b.CustomerPhone, b.TicketCode,
      r.RouteName
    FROM Transactions tr
    INNER JOIN Bookings b ON tr.BookingId = b.BookingId
    INNER JOIN Trips t ON b.TripId = t.TripId
    INNER JOIN Routes r ON t.RouteId = r.RouteId
    WHERE 1=1
  `;

  const request = pool.request();

  if (filters.fromDate) {
    query += " AND CAST(tr.CreatedAt AS DATE) >= @FromDate";
    request.input("FromDate", sql.Date, filters.fromDate);
  }
  if (filters.toDate) {
    query += " AND CAST(tr.CreatedAt AS DATE) <= @ToDate";
    request.input("ToDate", sql.Date, filters.toDate);
  }
  if (filters.status) {
    query += " AND tr.Status = @Status";
    request.input("Status", sql.VarChar, filters.status);
  }

  query += " ORDER BY tr.CreatedAt DESC";

  const result = await request.query(query);
  return result.recordset;
};

/**
 * Login Logs - Lịch sử đăng nhập từ bảng Sessions
 */
const getLoginLogs = async (filters = {}) => {
  const pool = await getPool();

  let query = `
    SELECT 
      s.SessionId, s.UserId, s.Status as SessionStatus, s.CreatedAt,
      s.ExpiresAt,
      u.Email, u.FullName, u.Role, u.Status as UserStatus, u.LastLoginAt
    FROM Sessions s
    INNER JOIN Users u ON s.UserId = u.UserId
    WHERE 1=1
  `;

  const request = pool.request();

  if (filters.fromDate) {
    query += " AND CAST(s.CreatedAt AS DATE) >= @FromDate";
    request.input("FromDate", sql.Date, filters.fromDate);
  }
  if (filters.toDate) {
    query += " AND CAST(s.CreatedAt AS DATE) <= @ToDate";
    request.input("ToDate", sql.Date, filters.toDate);
  }
  if (filters.userId) {
    query += " AND s.UserId = @UserId";
    request.input("UserId", sql.Int, filters.userId);
  }

  query += " ORDER BY s.CreatedAt DESC";

  const result = await request.query(query);
  return result.recordset;
};

module.exports = {
  getDashboardStats,
  getRevenueChart,
  getTopRoutes,
  getAllCompanies,
  getAllRoutes,
  getTripsAdmin,
  getAllBookings,
  getAllUsers,
  updateUserStatus,
  getAllReviews,
  updateReviewStatus,
  deleteCompany,
  createCompany,
  updateCompany,
  deleteRoute,
  createRoute,
  updateRoute,
  // Điểm dừng
  getStopsByRoute,
  createStop,
  updateStop,
  deleteStop,
  // Dashboard nâng cao
  getUpcomingTrips,
  getFillRate,
  getRevenueFromPayments,
  getPaidBookingsCount,
  // Thống kê
  getRevenueByTime,
  getRevenueByCompany,
  getRevenueByRoute,
  getPaymentMethodStats,
  // Tài khoản
  createStaffAccount,
  toggleUserLock,
  // Log
  getTransactionLogs,
  getLoginLogs,
  // Bookings
  updateBookingStatus,
  createManualBooking,
};
