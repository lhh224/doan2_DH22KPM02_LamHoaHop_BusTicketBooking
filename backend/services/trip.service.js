/**
 * File: trip.service.js
 * Mục đích: Xử lý logic liên quan đến tìm kiếm và quản lý chuyến xe
 */

const { getPool, sql } = require("../config/db");
const seatTemplateService = require("./seat-template.service");

/**
 * Tìm kiếm chuyến xe theo điều kiện
 * @param {string} fromCity - Thành phố đi
 * @param {string} toCity - Thành phố đến
 * @param {string} date - Ngày đi (YYYY-MM-DD)
 * @returns {Promise<Array>} - Danh sách chuyến xe
 */
const searchTrips = async (fromCity, toCity, date) => {
  try {
    const pool = await getPool();

    let dateCondition = "AND t.DepartureDate = @date";
    if (date === "all") {
      dateCondition = `
        AND (
          t.DepartureDate > CAST(GETDATE() AS DATE) 
          OR (
            t.DepartureDate = CAST(GETDATE() AS DATE) 
            AND t.DepartureTime >= CONVERT(VARCHAR(5), GETDATE(), 108)
          )
        )
      `;
    }

    const request = pool.request()
      .input("fromCity", sql.NVarChar, fromCity)
      .input("toCity", sql.NVarChar, toCity);

    if (date !== "all") {
      request.input("date", sql.Date, date);
    }

    const result = await request.query(`
        SELECT 
          t.TripId,
          t.DepartureTime,
          t.ArrivalTime,
          t.DepartureDate,
          t.Price as BasePrice,
          r.RouteName,
          r.DepartureCity as FromCity,
          r.ArrivalCity as ToCity,
          r.Distance,
          r.EstimatedDuration,
          r.ImageUrl,
          c.CompanyName,
          c.Rating,
          bt.BusTypeName as BusType,
          bt.TotalSeats,
          -- Đếm số ghế còn trống (toàn tuyến)
          (SELECT COUNT(*) 
           FROM Seats s 
           WHERE s.TripId = t.TripId 
             AND s.Status = 'AVAILABLE'
             AND NOT EXISTS (
               SELECT 1 FROM BookingDetails bd
               INNER JOIN Bookings b ON bd.BookingId = b.BookingId
               WHERE bd.SeatCode = s.SeatCode 
                 AND b.TripId = t.TripId
                 AND b.Status IN ('PENDING', 'PAID')
             )
          ) as AvailableSeats
        FROM Trips t
        INNER JOIN Routes r ON t.RouteId = r.RouteId
        INNER JOIN Companies c ON t.CompanyId = c.CompanyId
        INNER JOIN BusTypes bt ON t.BusTypeId = bt.BusTypeId
        WHERE r.DepartureCity LIKE '%' + @fromCity + '%'
          AND r.ArrivalCity LIKE '%' + @toCity + '%'
          ${dateCondition}
          AND t.IsActive = 1
          AND r.IsActive = 1
        ORDER BY t.DepartureDate ASC, t.DepartureTime ASC
      `);

    return result.recordset;
  } catch (error) {
    console.error("❌ Lỗi tìm kiếm chuyến:", error);
    throw error;
  }
};

/**
 * Lấy thông tin chi tiết chuyến xe
 * @param {number} tripId - ID chuyến xe
 * @returns {Promise<object>} - Thông tin chuyến xe
 */
const getTripDetail = async (tripId) => {
  try {
    const pool = await getPool();
    const result = await pool.request().input("tripId", sql.Int, tripId).query(`
        SELECT 
          t.TripId,
          t.DepartureTime,
          t.ArrivalTime,
          t.DepartureDate,
          t.Price as BasePrice,
          r.RouteId,
          r.RouteName,
          r.DepartureCity as FromCity,
          r.ArrivalCity as ToCity,
          r.Distance,
          r.EstimatedDuration,
          c.CompanyId,
          c.CompanyName,
          c.Phone as CompanyPhone,
          c.Rating,
          bt.BusTypeId,
          bt.BusTypeName as BusType,
          bt.TotalSeats,
          bt.SeatLayout
        FROM Trips t
        INNER JOIN Routes r ON t.RouteId = r.RouteId
        INNER JOIN Companies c ON t.CompanyId = c.CompanyId
        INNER JOIN BusTypes bt ON t.BusTypeId = bt.BusTypeId
        WHERE t.TripId = @tripId AND t.IsActive = 1
      `);

    if (result.recordset.length === 0) {
      return null;
    }

    return result.recordset[0];
  } catch (error) {
    console.error("❌ Lỗi lấy thông tin chuyến:", error);
    throw error;
  }
};

/**
 * Lấy danh sách điểm dừng của chuyến xe
 * @param {number} tripId - ID chuyến xe
 * @returns {Promise<Array>} - Danh sách điểm dừng
 */
const getTripStops = async (tripId) => {
  try {
    const pool = await getPool();

    // Lấy RouteId từ TripId
    const tripResult = await pool
      .request()
      .input("tripId", sql.Int, tripId)
      .query("SELECT RouteId FROM Trips WHERE TripId = @tripId");

    if (tripResult.recordset.length === 0) {
      return [];
    }

    const routeId = tripResult.recordset[0].RouteId;

    // Lấy danh sách điểm dừng
    const stopsResult = await pool.request().input("routeId", sql.Int, routeId)
      .query(`
        SELECT 
          StopId,
          StopOrder,
          StopName,
          StopAddress,
          DistanceFromStart
        FROM Stops
        WHERE RouteId = @routeId
        ORDER BY StopOrder ASC
      `);

    return stopsResult.recordset;
  } catch (error) {
    console.error("❌ Lỗi lấy điểm dừng:", error);
    throw error;
  }
};

/**
 * Lấy danh sách điểm đi và điểm đến từ database
 * @returns {Promise<{fromCities: string[], toCities: string[]}>}
 */
const getCityOptions = async () => {
  try {
    const pool = await getPool();
    const result = await pool.request().query(`
        SELECT DISTINCT DepartureCity AS City
        FROM Routes
        WHERE IsActive = 1;

        SELECT DISTINCT ArrivalCity AS City
        FROM Routes
        WHERE IsActive = 1;
      `);

    const fromCities = (result.recordsets?.[0] || []).map((row) => row.City);
    const toCities = (result.recordsets?.[1] || []).map((row) => row.City);

    return {
      fromCities,
      toCities,
    };
  } catch (error) {
    console.error("❌ Lỗi lấy danh sách điểm đi/đến:", error);
    throw error;
  }
};

/**
 * Lấy danh sách tuyến đường phổ biến từ bảng Routes
 * @returns {Promise<Array>} - Danh sách tuyến đường
 */
const getPopularRoutes = async () => {
  try {
    const pool = await getPool();
    const result = await pool.request().query(`
      SELECT 
        r.RouteId,
        r.RouteName,
        r.DepartureCity,
        r.ArrivalCity,
        r.Distance,
        r.EstimatedDuration,
        r.ImageUrl,
        -- Lấy giá vé thấp nhất từ các chuyến xe trên tuyến này
        (SELECT MIN(t.Price) 
         FROM Trips t 
         WHERE t.RouteId = r.RouteId AND t.IsActive = 1
        ) as BasePrice
      FROM Routes r
      WHERE r.IsActive = 1
      ORDER BY r.RouteId ASC
    `);

    return result.recordset;
  } catch (error) {
    console.error("❌ Lỗi lấy danh sách tuyến đường:", error);
    throw error;
  }
};

/**
 * Lấy tất cả chuyến xe (cho admin)
 * @returns {Promise<Array>} - Danh sách tất cả chuyến xe
 */
const getAllTrips = async () => {
  try {
    const pool = await getPool();
    const result = await pool.request().query(`
      SELECT 
        t.TripId,
        t.RouteId,
        t.CompanyId,
        t.BusTypeId,
        t.DepartureTime,
        t.ArrivalTime,
        t.DepartureDate,
        t.Price,
        t.IsActive,
        t.CreatedAt,
        r.RouteName,
        r.DepartureCity as FromCity,
        r.ArrivalCity as ToCity,
        c.CompanyName,
        bt.BusTypeName as BusType,
        bt.TotalSeats
      FROM Trips t
      INNER JOIN Routes r ON t.RouteId = r.RouteId
      INNER JOIN Companies c ON t.CompanyId = c.CompanyId
      INNER JOIN BusTypes bt ON t.BusTypeId = bt.BusTypeId
      WHERE t.IsActive = 1
      ORDER BY t.DepartureDate DESC, t.DepartureTime ASC
    `);
    return result.recordset;
  } catch (error) {
    console.error("Lỗi lấy danh sách chuyến!!!", error);
    throw error;
  }
};

/**
 * Tạo chuyến xe mới
 * @param {object} tripData - Dữ liệu chuyến xe
 * @returns {Promise<number>} - ID chuyến xe mới
 */
const createTrip = async (tripData) => {
  try {
    const pool = await getPool();
    const result = await pool
      .request()
      .input("routeId", sql.Int, tripData.routeId)
      .input("companyId", sql.Int, tripData.companyId)
      .input("busTypeId", sql.Int, tripData.busTypeId)
      .input("departureTime", sql.VarChar(8), tripData.departureTime)
      .input("arrivalTime", sql.VarChar(8), tripData.arrivalTime)
      .input("departureDate", sql.Date, tripData.departureDate)
      .input("price", sql.Decimal(10, 2), tripData.price)
      .input("isActive", sql.Bit, tripData.isActive !== false).query(`
        INSERT INTO Trips (
          RouteId, CompanyId, BusTypeId, DepartureTime, ArrivalTime, 
          DepartureDate, Price, IsActive, CreatedAt, UpdatedAt
        )
        VALUES (
          @routeId, @companyId, @busTypeId, @departureTime, @arrivalTime,
          @departureDate, @price, @isActive, GETDATE(), GETDATE()
        );
        SELECT SCOPE_IDENTITY() as TripId;
      `);

    const tripId = result.recordset[0].TripId;

    // Lấy tên loại xe để xác định template sơ đồ ghế
    const busTypeResult = await pool
      .request()
      .input("busTypeId", sql.Int, tripData.busTypeId)
      .query(`SELECT BusTypeName FROM BusTypes WHERE BusTypeId = @busTypeId`);

    const busTypeName = busTypeResult.recordset[0]?.BusTypeName || "";
    console.log(`🪑 Tạo ghế cho loại xe: ${busTypeName}`);

    // Sinh danh sách mã ghế từ template
    const template =
      await seatTemplateService.getTemplateByBusType(busTypeName);
    const seatCodes = seatTemplateService.generateSeatsFromTemplate(template);
    console.log(`🪑 Số ghế tạo: ${seatCodes.length}`);

    // Tạo ghế theo template
    for (const seatCode of seatCodes) {
      await pool
        .request()
        .input("tripId", sql.Int, tripId)
        .input("seatCode", sql.NVarChar, seatCode).query(`
          INSERT INTO Seats (TripId, SeatCode, SeatType, Status)
          VALUES (@tripId, @seatCode, N'Thường', 'AVAILABLE')
        `);
    }

    return tripId;
  } catch (error) {
    console.error("Lỗi tạo chuyến xe!!!", error);
    throw error;
  }
};

/**
 * Cập nhật chuyến xe
 * @param {number} tripId - ID chuyến xe
 * @param {object} tripData - Dữ liệu cập nhật
 * @returns {Promise<boolean>} - Kết quả cập nhật
 */
const updateTrip = async (tripId, tripData) => {
  try {
    const pool = await getPool();

    console.log("🔄 Updating trip:", tripId, tripData);

    // Kiểm tra loại xe hiện tại để xác định có cần tái tạo ghế không
    const currentTrip = await pool
      .request()
      .input("tripId", sql.Int, tripId)
      .query(`SELECT BusTypeId FROM Trips WHERE TripId = @tripId`);

    const oldBusTypeId = currentTrip.recordset[0]?.BusTypeId;
    const busTypeChanged = oldBusTypeId !== tripData.busTypeId;

    // Nếu loại xe thay đổi, kiểm tra có booking đang active không
    if (busTypeChanged) {
      const bookingCheck = await pool
        .request()
        .input("tripId2", sql.Int, tripId).query(`
          SELECT COUNT(*) as Count FROM Bookings 
          WHERE TripId = @tripId2 AND Status IN ('PENDING', 'PAID')
        `);

      if (bookingCheck.recordset[0].Count > 0) {
        throw new Error(
          "Không thể đổi loại xe khi còn vé đã đặt hoặc đã thanh toán",
        );
      }
    }

    // Cập nhật thông tin chuyến xe
    await pool
      .request()
      .input("tripId", sql.Int, tripId)
      .input("routeId", sql.Int, tripData.routeId)
      .input("companyId", sql.Int, tripData.companyId)
      .input("busTypeId", sql.Int, tripData.busTypeId)
      .input("departureTime", sql.VarChar(8), tripData.departureTime)
      .input("arrivalTime", sql.VarChar(8), tripData.arrivalTime)
      .input("departureDate", sql.Date, tripData.departureDate)
      .input("price", sql.Decimal(10, 2), tripData.price)
      .input("isActive", sql.Bit, tripData.isActive).query(`
        UPDATE Trips
        SET 
          RouteId = @routeId,
          CompanyId = @companyId,
          BusTypeId = @busTypeId,
          DepartureTime = @departureTime,
          ArrivalTime = @arrivalTime,
          DepartureDate = @departureDate,
          Price = @price,
          IsActive = @isActive,
          UpdatedAt = GETDATE()
        WHERE TripId = @tripId
      `);

    // Nếu loại xe thay đổi → tái tạo sơ đồ ghế theo template mới
    if (busTypeChanged) {
      console.log(
        `🪑 Loại xe thay đổi (${oldBusTypeId} → ${tripData.busTypeId}), tái tạo ghế...`,
      );

      // Xóa ghế cũ
      await pool
        .request()
        .input("tripId3", sql.Int, tripId)
        .query(`DELETE FROM Seats WHERE TripId = @tripId3`);

      // Lấy tên loại xe mới
      const busTypeResult = await pool
        .request()
        .input("busTypeId2", sql.Int, tripData.busTypeId)
        .query(
          `SELECT BusTypeName FROM BusTypes WHERE BusTypeId = @busTypeId2`,
        );

      const busTypeName = busTypeResult.recordset[0]?.BusTypeName || "";

      // Sinh ghế mới từ template
      const template =
        await seatTemplateService.getTemplateByBusType(busTypeName);
      const seatCodes = seatTemplateService.generateSeatsFromTemplate(template);
      console.log(
        `🪑 Tạo ${seatCodes.length} ghế mới cho loại xe: ${busTypeName}`,
      );

      for (const seatCode of seatCodes) {
        await pool
          .request()
          .input("tripId4", sql.Int, tripId)
          .input("seatCode", sql.NVarChar, seatCode).query(`
            INSERT INTO Seats (TripId, SeatCode, SeatType, Status)
            VALUES (@tripId4, @seatCode, N'Thường', 'AVAILABLE')
          `);
      }
    }

    console.log("✅ Trip updated successfully");
    return true;
  } catch (error) {
    console.error("Lỗi cập nhật chuyến xe!!!", error);
    throw error;
  }
};

/**
 * Xóa chuyến xe (soft delete - luôn đặt IsActive = 0)
 * @param {number} tripId - ID chuyến xe
 * @returns {Promise<boolean>} - Kết quả xóa
 */
const deleteTrip = async (tripId) => {
  try {
    const pool = await getPool();

    console.log(`🗑️ Đang ẩn chuyến xe #${tripId} (soft delete)...`);

    // Luôn soft delete - chỉ đặt IsActive = 0
    await pool.request().input("tripId", sql.Int, tripId).query(`
      UPDATE Trips 
      SET IsActive = 0, UpdatedAt = GETDATE()
      WHERE TripId = @tripId
    `);

    console.log(`✅ Đã ẩn chuyến xe #${tripId} (IsActive = 0)`);
    return true;
  } catch (error) {
    console.error("❌ Lỗi ẩn chuyến xe:", error);
    throw error;
  }
};

/**
 * Lấy danh sách nhà xe
 * @returns {Promise<Array>}
 */
const getCompanies = async () => {
  try {
    const pool = await getPool();
    const result = await pool.request().query(`
      SELECT CompanyId as Id, CompanyName as Name
      FROM Companies
      ORDER BY CompanyName
    `);
    return result.recordset;
  } catch (error) {
    console.error("❌ Lỗi lấy danh sách nhà xe:", error);
    throw error;
  }
};

/**
 * Lấy danh sách loại xe
 * @returns {Promise<Array>}
 */
const getBusTypes = async () => {
  try {
    const pool = await getPool();
    const result = await pool.request().query(`
      SELECT BusTypeId as Id, BusTypeName as Name, TotalSeats as Seats
      FROM BusTypes
      ORDER BY BusTypeName
    `);
    return result.recordset;
  } catch (error) {
    console.error("❌ Lỗi lấy danh sách loại xe:", error);
    throw error;
  }
};

/**
 * Lấy danh sách tuyến đường
 * @returns {Promise<Array>}
 */
const getRoutes = async () => {
  try {
    const pool = await getPool();
    const result = await pool.request().query(`
      SELECT 
        RouteId as Id, 
        RouteName as Name,
        DepartureCity as FromCity,
        ArrivalCity as ToCity,
        Distance,
        EstimatedDuration as Duration
      FROM Routes
      ORDER BY RouteName
    `);
    return result.recordset;
  } catch (error) {
    console.error("❌ Lỗi lấy danh sách tuyến:", error);
    throw error;
  }
};

/**
 * Tạo nhà xe mới
 */
const createCompany = async (companyData) => {
  try {
    const pool = await getPool();
    const { tenNhaXe, soDienThoai, email, diaChi, moTa, hotline } = companyData;

    const result = await pool
      .request()
      .input("CompanyName", sql.NVarChar, tenNhaXe)
      .input("Phone", sql.NVarChar, soDienThoai || null)
      .input("Email", sql.NVarChar, email || null)
      .input("Address", sql.NVarChar, diaChi || null)
      .input("Description", sql.NVarChar, moTa || null)
      .input("CustomerHotline", sql.NVarChar, hotline || null).query(`
        INSERT INTO Companies (CompanyName, Phone, Email, Address, Description, CustomerHotline, Rating, IsActive, CreatedAt, UpdatedAt)
        OUTPUT INSERTED.*
        VALUES (@CompanyName, @Phone, @Email, @Address, @Description, @CustomerHotline, 5.0, 1, GETDATE(), GETDATE())
      `);

    return result.recordset[0];
  } catch (error) {
    console.error("❌ Lỗi tạo nhà xe:", error);
    throw new Error("Không thể tạo nhà xe: " + error.message);
  }
};

/**
 * Cập nhật nhà xe
 */
const updateCompany = async (id, companyData) => {
  try {
    const pool = await getPool();
    const { tenNhaXe, soDienThoai, email, diaChi, moTa, hotline, trangThai } =
      companyData;

    const result = await pool
      .request()
      .input("CompanyId", sql.Int, id)
      .input("CompanyName", sql.NVarChar, tenNhaXe)
      .input("Phone", sql.NVarChar, soDienThoai)
      .input("Email", sql.NVarChar, email)
      .input("Address", sql.NVarChar, diaChi)
      .input("Description", sql.NVarChar, moTa || null)
      .input("CustomerHotline", sql.NVarChar, hotline || null)
      .input("IsActive", sql.Bit, trangThai !== undefined ? trangThai : 1)
      .query(`
        UPDATE Companies
        SET CompanyName = @CompanyName,
            Phone = @Phone,
            Email = @Email,
            Address = @Address,
            Description = @Description,
            CustomerHotline = @CustomerHotline,
            IsActive = @IsActive,
            UpdatedAt = GETDATE()
        OUTPUT INSERTED.*
        WHERE CompanyId = @CompanyId
      `);

    if (result.recordset.length === 0) {
      throw new Error("Không tìm thấy nhà xe");
    }

    return result.recordset[0];
  } catch (error) {
    console.error("❌ Lỗi cập nhật nhà xe:", error);
    throw new Error("Không thể cập nhật nhà xe: " + error.message);
  }
};

/**
 * Xóa nhà xe
 */
const deleteCompany = async (id) => {
  try {
    const pool = await getPool();

    // Kiểm tra xem có chuyến xe nào đang sử dụng nhà xe này không
    const checkResult = await pool.request().input("CompanyId", sql.Int, id)
      .query(`
        SELECT COUNT(*) as Count
        FROM Trips
        WHERE CompanyId = @CompanyId
      `);

    if (checkResult.recordset[0].Count > 0) {
      throw new Error(
        "Không thể xóa nhà xe này vì đang có chuyến xe liên quan",
      );
    }

    await pool.request().input("CompanyId", sql.Int, id).query(`
        DELETE FROM Companies
        WHERE CompanyId = @CompanyId
      `);

    return true;
  } catch (error) {
    console.error("❌ Lỗi xóa nhà xe:", error);
    throw error;
  }
};

/**
 * Tạo tuyến đường mới
 */
const createRoute = async (routeData) => {
  try {
    const pool = await getPool();
    const { tenTuyen, diemDi, diemDen, khoangCach, thoiGianUocTinh } =
      routeData;

    const result = await pool
      .request()
      .input("RouteName", sql.NVarChar, tenTuyen)
      .input("DepartureCity", sql.NVarChar, diemDi)
      .input("ArrivalCity", sql.NVarChar, diemDen)
      .input("Distance", sql.Int, khoangCach || 0)
      .input("EstimatedDuration", sql.Float, thoiGianUocTinh || 0).query(`
        INSERT INTO Routes (RouteName, DepartureCity, ArrivalCity, Distance, EstimatedDuration, IsActive)
        OUTPUT INSERTED.*
        VALUES (@RouteName, @DepartureCity, @ArrivalCity, @Distance, @EstimatedDuration, 1)
      `);

    return result.recordset[0];
  } catch (error) {
    console.error("❌ Lỗi tạo tuyến đường:", error);
    throw new Error("Không thể tạo tuyến đường: " + error.message);
  }
};

/**
 * Cập nhật tuyến đường
 */
const updateRoute = async (id, routeData) => {
  try {
    const pool = await getPool();
    const {
      tenTuyen,
      diemDi,
      diemDen,
      khoangCach,
      thoiGianUocTinh,
      trangThai,
    } = routeData;

    const result = await pool
      .request()
      .input("RouteId", sql.Int, id)
      .input("RouteName", sql.NVarChar, tenTuyen)
      .input("DepartureCity", sql.NVarChar, diemDi)
      .input("ArrivalCity", sql.NVarChar, diemDen)
      .input("Distance", sql.Int, khoangCach)
      .input("EstimatedDuration", sql.Float, thoiGianUocTinh)
      .input("IsActive", sql.Bit, trangThai !== undefined ? trangThai : 1)
      .query(`
        UPDATE Routes
        SET RouteName = @RouteName,
            DepartureCity = @DepartureCity,
            ArrivalCity = @ArrivalCity,
            Distance = @Distance,
            EstimatedDuration = @EstimatedDuration,
            IsActive = @IsActive
        OUTPUT INSERTED.*
        WHERE RouteId = @RouteId
      `);

    if (result.recordset.length === 0) {
      throw new Error("Không tìm thấy tuyến đường");
    }

    return result.recordset[0];
  } catch (error) {
    console.error("❌ Lỗi cập nhật tuyến đường:", error);
    throw new Error("Không thể cập nhật tuyến đường: " + error.message);
  }
};

/**
 * Xóa tuyến đường
 */
const deleteRoute = async (id) => {
  try {
    const pool = await getPool();

    // Kiểm tra xem có chuyến xe nào đang sử dụng tuyến này không
    const checkResult = await pool.request().input("RouteId", sql.Int, id)
      .query(`
        SELECT COUNT(*) as Count
        FROM Trips
        WHERE RouteId = @RouteId
      `);

    if (checkResult.recordset[0].Count > 0) {
      throw new Error(
        "Không thể xóa tuyến đường này vì đang có chuyến xe liên quan",
      );
    }

    // Xóa các điểm dừng liên quan
    await pool.request().input("RouteId", sql.Int, id).query(`
        DELETE FROM Stops
        WHERE RouteId = @RouteId
      `);

    // Xóa tuyến đường
    await pool.request().input("RouteId", sql.Int, id).query(`
        DELETE FROM Routes
        WHERE RouteId = @RouteId
      `);

    return true;
  } catch (error) {
    console.error("❌ Lỗi xóa tuyến đường:", error);
    throw error;
  }
};

/**
 * Lấy danh sách điểm dừng của tuyến
 */
const getRouteStops = async (routeId) => {
  try {
    const pool = await getPool();

    const result = await pool.request().input("RouteId", sql.Int, routeId)
      .query(`
        SELECT 
          StopId as Id,
          StopName as Name,
          StopAddress as Address,
          Longitude,
          Latitude,
          StopOrder as OrderIndex
        FROM Stops
        WHERE RouteId = @RouteId
        ORDER BY StopOrder
      `);

    return result.recordset;
  } catch (error) {
    console.error("❌ Lỗi lấy điểm dừng:", error);
    throw error;
  }
};

/**
 * Thêm điểm dừng vào tuyến
 */
const addRouteStop = async (routeId, stopData) => {
  try {
    const pool = await getPool();
    const { tenDiemDung, diaChi, kinhDo, viDo, thuTu } = stopData;

    const result = await pool
      .request()
      .input("RouteId", sql.Int, routeId)
      .input("StopName", sql.NVarChar, tenDiemDung)
      .input("StopAddress", sql.NVarChar, diaChi || null)
      .input("Longitude", sql.Float, kinhDo || null)
      .input("Latitude", sql.Float, viDo || null)
      .input("StopOrder", sql.Int, thuTu).query(`
        INSERT INTO Stops (RouteId, StopName, StopAddress, Longitude, Latitude, StopOrder)
        OUTPUT INSERTED.*
        VALUES (@RouteId, @StopName, @StopAddress, @Longitude, @Latitude, @StopOrder)
      `);

    return result.recordset[0];
  } catch (error) {
    console.error("❌ Lỗi thêm điểm dừng:", error);
    throw new Error("Không thể thêm điểm dừng: " + error.message);
  }
};

/**
 * Xóa điểm dừng
 */
const deleteRouteStop = async (stopId) => {
  try {
    const pool = await getPool();

    await pool.request().input("StopId", sql.Int, stopId).query(`
        DELETE FROM Stops
        WHERE StopId = @StopId
      `);

    return true;
  } catch (error) {
    console.error("❌ Lỗi xóa điểm dừng:", error);
    throw error;
  }
};

/**
 * Lấy danh sách chuyến xe đang hoạt động (hôm nay)
 * @returns {Promise<Array>} - Danh sách chuyến xe đang chạy
 */
const getActiveTrips = async () => {
  try {
    const pool = await getPool();
    const today = new Date().toISOString().split("T")[0];
    const result = await pool.request().input("today", sql.Date, today).query(`
        SELECT TOP 8
          t.TripId,
          t.DepartureTime,
          t.ArrivalTime,
          t.DepartureDate,
          t.Price as BasePrice,
          r.RouteName,
          r.DepartureCity as FromCity,
          r.ArrivalCity as ToCity,
          r.Distance,
          r.EstimatedDuration,
          c.CompanyName,
          bt.BusTypeName as BusType
        FROM Trips t
        INNER JOIN Routes r ON t.RouteId = r.RouteId
        INNER JOIN Companies c ON t.CompanyId = c.CompanyId
        INNER JOIN BusTypes bt ON t.BusTypeId = bt.BusTypeId
        WHERE t.IsActive = 1 AND t.DepartureDate = @today
        ORDER BY t.DepartureTime ASC
      `);

    // Nếu hôm nay không có, lấy chuyến gần nhất
    if (result.recordset.length === 0) {
      const fallback = await pool.request().query(`
        SELECT TOP 8
          t.TripId,
          t.DepartureTime,
          t.ArrivalTime,
          t.DepartureDate,
          t.Price as BasePrice,
          r.RouteName,
          r.DepartureCity as FromCity,
          r.ArrivalCity as ToCity,
          r.Distance,
          r.EstimatedDuration,
          c.CompanyName,
          bt.BusTypeName as BusType
        FROM Trips t
        INNER JOIN Routes r ON t.RouteId = r.RouteId
        INNER JOIN Companies c ON t.CompanyId = c.CompanyId
        INNER JOIN BusTypes bt ON t.BusTypeId = bt.BusTypeId
        WHERE t.IsActive = 1
        ORDER BY t.DepartureDate DESC, t.DepartureTime ASC
      `);
      return fallback.recordset;
    }

    return result.recordset;
  } catch (error) {
    console.error("❌ Lỗi lấy chuyến xe đang hoạt động:", error);
    throw error;
  }
};

module.exports = {
  searchTrips,
  getTripDetail,
  getTripStops,
  getCityOptions,
  getPopularRoutes,
  getActiveTrips,
  getAllTrips,
  createTrip,
  updateTrip,
  deleteTrip,
  getCompanies,
  getBusTypes,
  getRoutes,
  createCompany,
  updateCompany,
  deleteCompany,
  createRoute,
  updateRoute,
  deleteRoute,
  getRouteStops,
  addRouteStop,
  deleteRouteStop,
};
