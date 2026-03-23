/**
 * File: tracking.service.js
 * Mục đích: Xử lý logic theo dõi hành trình xe khách
 * Bao gồm: lấy thông tin tracking, điểm dừng, giả lập vị trí xe
 */

const { getPool, sql } = require("../config/db");

/**
 * Tọa độ các thành phố/tỉnh Việt Nam (dùng cho giả lập GPS)
 * Trong thực tế, dữ liệu này sẽ đến từ thiết bị GPS trên xe
 */
const CITY_COORDINATES = {
  "TP.HCM": { lat: 10.7769, lng: 106.7009 },
  "Hồ Chí Minh": { lat: 10.7769, lng: 106.7009 },
  "Đà Lạt": { lat: 11.9404, lng: 108.4583 },
  "Nha Trang": { lat: 12.2388, lng: 109.1967 },
  "Đà Nẵng": { lat: 16.0471, lng: 108.2068 },
  Huế: { lat: 16.4637, lng: 107.5909 },
  "Hà Nội": { lat: 21.0285, lng: 105.8542 },
  "Vũng Tàu": { lat: 10.346, lng: 107.0843 },
  "Cần Thơ": { lat: 10.0452, lng: 105.7469 },
  "Phan Thiết": { lat: 10.9289, lng: 108.1002 },
  "Buôn Ma Thuột": { lat: 12.6814, lng: 108.0378 },
  "Quy Nhơn": { lat: 13.776, lng: 109.2237 },
  "Hải Phòng": { lat: 20.8449, lng: 106.6881 },
  "Bình Dương": { lat: 11.0254, lng: 106.6534 },
};

const getTripTrackingData = async (tripId) => {
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
          c.CompanyName,
          c.Rating,
          bt.BusTypeName as BusType,
          bt.TotalSeats
        FROM Trips t
        INNER JOIN Routes r ON t.RouteId = r.RouteId
        INNER JOIN Companies c ON t.CompanyId = c.CompanyId
        INNER JOIN BusTypes bt ON t.BusTypeId = bt.BusTypeId
        WHERE t.TripId = @tripId AND t.IsActive = 1
      `);

    if (result.recordset.length === 0) {
      return null;
    }

    const trip = result.recordset[0];
    const position = calculateSimulatedPosition(trip);

    return {
      ...trip,
      tracking: position,
    };
  } catch (error) {
    console.error("❌ Lỗi lấy tracking data:", error);
    throw error;
  }
};

const getTripStopsWithStatus = async (tripId) => {
  try {
    const pool = await getPool();
    const tripResult = await pool
      .request()
      .input("tripId", sql.Int, tripId)
      .query(
        "SELECT RouteId, DepartureTime, ArrivalTime, DepartureDate FROM Trips WHERE TripId = @tripId",
      );

    if (tripResult.recordset.length === 0) {
      return [];
    }

    const { RouteId } = tripResult.recordset[0];

    const stopsResult = await pool.request().input("routeId", sql.Int, RouteId)
      .query(`
        SELECT 
          StopId,
          StopOrder,
          StopName,
          StopAddress,
          DistanceFromStart
        FROM Stops
        WHERE RouteId = @routeId AND IsActive = 1
        ORDER BY StopOrder ASC
      `);

    const stops = stopsResult.recordset;
    const progress = getSimulatedProgress();
    const passedCount = Math.floor(progress * stops.length);

    return stops.map((stop, index) => ({
      ...stop,
      status:
        index < passedCount
          ? "passed"
          : index === passedCount
            ? "current"
            : "upcoming",
    }));
  } catch (error) {
    console.error("❌ Lỗi lấy điểm dừng:", error);
    throw error;
  }
};

const getSimulatedPosition = async (tripId) => {
  try {
    const pool = await getPool();
    const result = await pool.request().input("tripId", sql.Int, tripId).query(`
        SELECT 
          r.DepartureCity as FromCity,
          r.ArrivalCity as ToCity,
          r.Distance,
          t.DepartureTime,
          t.ArrivalTime
        FROM Trips t
        INNER JOIN Routes r ON t.RouteId = r.RouteId
        WHERE t.TripId = @tripId
      `);

    if (result.recordset.length === 0) {
      return null;
    }

    const trip = result.recordset[0];
    return calculateSimulatedPosition(trip);
  } catch (error) {
    console.error("❌ Lỗi lấy vị trí xe:", error);
    throw error;
  }
};

function calculateSimulatedPosition(trip) {
  const progress = getSimulatedProgress();
  const fromCoords = getCityCoords(trip.FromCity);
  const toCoords = getCityCoords(trip.ToCity);

  const lat = fromCoords.lat + (toCoords.lat - fromCoords.lat) * progress;
  const lng = fromCoords.lng + (toCoords.lng - fromCoords.lng) * progress;
  const speed = Math.round(50 + Math.random() * 30);
  const totalDistance = trip.Distance || 300;
  const remainingDistance = Math.round(totalDistance * (1 - progress));

  return {
    lat,
    lng,
    speed,
    progress: Math.round(progress * 100),
    remainingDistance,
    heading: Math.round(Math.random() * 360),
  };
}

function getSimulatedProgress() {
  const now = new Date();
  const minutesSinceMidnight = now.getHours() * 60 + now.getMinutes();
  const cycleMinutes = minutesSinceMidnight % 180;
  return Math.min(cycleMinutes / 180, 0.95);
}

function getCityCoords(cityName) {
  if (!cityName) return { lat: 10.7769, lng: 106.7009 };
  for (const [key, coords] of Object.entries(CITY_COORDINATES)) {
    if (cityName.includes(key) || key.includes(cityName)) {
      return coords;
    }
  }
  return { lat: 10.7769, lng: 106.7009 };
}

const getAllRoutesWithCoordinates = async () => {
  try {
    const pool = await getPool();

    // Lấy routes kèm tên nhà xe từ Trips → Companies
    const routesResult = await pool.request().query(`
      SELECT 
        r.RouteId as routeId,
        r.RouteName as name,
        r.DepartureCity as fromCity,
        r.ArrivalCity as toCity,
        r.DepartureLat as startLat,
        r.DepartureLng as startLng,
        r.ArrivalLat as endLat,
        r.ArrivalLng as endLng,
        r.Distance as distance,
        r.EstimatedDuration as estimatedDuration,
        (
          SELECT TOP 1 c.CompanyName
          FROM Trips t
          INNER JOIN Companies c ON t.CompanyId = c.CompanyId
          WHERE t.RouteId = r.RouteId AND t.IsActive = 1
          ORDER BY t.CreatedAt DESC
        ) as company
      FROM Routes r
      WHERE r.IsActive = 1 
        AND r.DepartureLat IS NOT NULL 
        AND r.ArrivalLat IS NOT NULL
      ORDER BY r.RouteName
    `);

    // Lấy tất cả stops
    const stopsResult = await pool.request().query(`
      SELECT 
        s.RouteId as routeId,
        s.StopOrder as stopOrder,
        s.StopName as name,
        s.StopAddress as addr,
        s.DistanceFromStart as dist,
        s.Latitude as lat,
        s.Longitude as lng
      FROM Stops s
      WHERE s.IsActive = 1
      ORDER BY s.RouteId, s.StopOrder
    `);

    // Gán stops vào từng route
    const stopsMap = {};
    for (const stop of stopsResult.recordset) {
      if (!stopsMap[stop.routeId]) stopsMap[stop.routeId] = [];
      stopsMap[stop.routeId].push(stop);
    }

    return routesResult.recordset.map((route) => ({
      ...route,
      stops: stopsMap[route.routeId] || [],
    }));
  } catch (error) {
    console.error("❌ Lỗi lấy danh sách routes:", error);
    throw error;
  }
};

const getActiveTrips = async () => {
  try {
    const pool = await getPool();
    const result = await pool.request().query(`
      SELECT 
        t.TripId as tripId,
        t.DepartureTime as departureTime,
        t.ArrivalTime as arrivalTime,
        t.DepartureDate as departureDate,
        r.RouteName as routeName,
        r.DepartureCity as fromCity,
        r.ArrivalCity as toCity,
        r.DepartureLat as startLat,
        r.DepartureLng as startLng,
        r.ArrivalLat as endLat,
        r.ArrivalLng as endLng,
        r.Distance as distance,
        c.CompanyName as companyName,
        bt.BusTypeName as busType
      FROM Trips t
      INNER JOIN Routes r ON t.RouteId = r.RouteId
      INNER JOIN Companies c ON t.CompanyId = c.CompanyId
      INNER JOIN BusTypes bt ON t.BusTypeId = bt.BusTypeId
      WHERE t.IsActive = 1 
        AND t.DepartureDate >= CAST(GETDATE() AS DATE)
        AND t.DepartureDate <= DATEADD(day, 1, CAST(GETDATE() AS DATE))
        AND r.DepartureLat IS NOT NULL 
        AND r.ArrivalLat IS NOT NULL
      ORDER BY t.DepartureDate, t.DepartureTime
    `);
    return result.recordset;
  } catch (error) {
    console.error("❌ Lỗi lấy danh sách trips:", error);
    throw error;
  }
};

module.exports = {
  getTripTrackingData,
  getTripStopsWithStatus,
  getSimulatedPosition,
  getAllRoutesWithCoordinates,
  getActiveTrips,
};
