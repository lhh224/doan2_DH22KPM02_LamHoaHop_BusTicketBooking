-- ================================================================
-- File: db.sql
-- Mục đích: Database schema + Stored Procedures + Dữ liệu mẫu
-- Database: BusTicketBooking
-- Mô tả: Hệ thống đặt vé xe khách trực tuyến
-- Ngôn ngữ: Tên bảng/cột tiếng Anh, dữ liệu mẫu tiếng Việt
-- ================================================================

-- Tạo database nếu chưa tồn tại
IF NOT EXISTS (SELECT name FROM sys.databases WHERE name = 'BusTicketBooking')
BEGIN
    CREATE DATABASE BusTicketBooking;
END
GO

-- Sử dụng database
USE BusTicketBooking;
GO

-- ================================================================
-- PHẦN 1: XÓA BẢNG CŨ (nếu tồn tại) - theo thứ tự phụ thuộc
-- ================================================================
IF OBJECT_ID('dbo.Reviews', 'U') IS NOT NULL DROP TABLE dbo.Reviews;
IF OBJECT_ID('dbo.Transactions', 'U') IS NOT NULL DROP TABLE dbo.Transactions;
IF OBJECT_ID('dbo.Notifications', 'U') IS NOT NULL DROP TABLE dbo.Notifications;
IF OBJECT_ID('dbo.Sessions', 'U') IS NOT NULL DROP TABLE dbo.Sessions;
IF OBJECT_ID('dbo.Payments', 'U') IS NOT NULL DROP TABLE dbo.Payments;
IF OBJECT_ID('dbo.BookingDetails', 'U') IS NOT NULL DROP TABLE dbo.BookingDetails;
IF OBJECT_ID('dbo.Bookings', 'U') IS NOT NULL DROP TABLE dbo.Bookings;
IF OBJECT_ID('dbo.Seats', 'U') IS NOT NULL DROP TABLE dbo.Seats;
IF OBJECT_ID('dbo.Trips', 'U') IS NOT NULL DROP TABLE dbo.Trips;
IF OBJECT_ID('dbo.Stops', 'U') IS NOT NULL DROP TABLE dbo.Stops;
IF OBJECT_ID('dbo.Routes', 'U') IS NOT NULL DROP TABLE dbo.Routes;
IF OBJECT_ID('dbo.BusTypes', 'U') IS NOT NULL DROP TABLE dbo.BusTypes;
IF OBJECT_ID('dbo.Users', 'U') IS NOT NULL DROP TABLE dbo.Users;
IF OBJECT_ID('dbo.Companies', 'U') IS NOT NULL DROP TABLE dbo.Companies;

-- Xóa bảng cũ tiếng Việt (nếu còn tồn tại)
IF OBJECT_ID('dbo.DanhGia', 'U') IS NOT NULL DROP TABLE dbo.DanhGia;
IF OBJECT_ID('dbo.LichSuGiaoDich', 'U') IS NOT NULL DROP TABLE dbo.LichSuGiaoDich;
IF OBJECT_ID('dbo.ThongBao', 'U') IS NOT NULL DROP TABLE dbo.ThongBao;
IF OBJECT_ID('dbo.PhienDangNhap', 'U') IS NOT NULL DROP TABLE dbo.PhienDangNhap;
IF OBJECT_ID('dbo.ThanhToan', 'U') IS NOT NULL DROP TABLE dbo.ThanhToan;
IF OBJECT_ID('dbo.ChiTietDatVe', 'U') IS NOT NULL DROP TABLE dbo.ChiTietDatVe;
IF OBJECT_ID('dbo.DatVe', 'U') IS NOT NULL DROP TABLE dbo.DatVe;
IF OBJECT_ID('dbo.GheNgoi', 'U') IS NOT NULL DROP TABLE dbo.GheNgoi;
IF OBJECT_ID('dbo.ChuyenXe', 'U') IS NOT NULL DROP TABLE dbo.ChuyenXe;
IF OBJECT_ID('dbo.DiemDung', 'U') IS NOT NULL DROP TABLE dbo.DiemDung;
IF OBJECT_ID('dbo.TuyenDuong', 'U') IS NOT NULL DROP TABLE dbo.TuyenDuong;
IF OBJECT_ID('dbo.LoaiXe', 'U') IS NOT NULL DROP TABLE dbo.LoaiXe;
IF OBJECT_ID('dbo.NguoiDung', 'U') IS NOT NULL DROP TABLE dbo.NguoiDung;
IF OBJECT_ID('dbo.NhaXe', 'U') IS NOT NULL DROP TABLE dbo.NhaXe;

-- Xóa stored procedures cũ
IF OBJECT_ID('dbo.sp_LockSeats', 'P') IS NOT NULL DROP PROCEDURE dbo.sp_LockSeats;
IF OBJECT_ID('dbo.sp_ConfirmPayment', 'P') IS NOT NULL DROP PROCEDURE dbo.sp_ConfirmPayment;
GO

-- ================================================================
-- PHẦN 2: TẠO BẢNG MỚI (English names)
-- ================================================================

-- Bảng 1: Companies (Nhà xe)
CREATE TABLE Companies (
  CompanyId INT IDENTITY(1,1) PRIMARY KEY,
  CompanyName NVARCHAR(200) NOT NULL,
  Phone NVARCHAR(20),
  Email NVARCHAR(100),
  Address NVARCHAR(500),
  Description NVARCHAR(MAX),
  Rating DECIMAL(3,2) DEFAULT 5.0,
  CustomerHotline NVARCHAR(20),
  IsActive BIT DEFAULT 1,
  CreatedAt DATETIME DEFAULT GETDATE(),
  UpdatedAt DATETIME DEFAULT GETDATE()
);
GO

-- Bảng 2: BusTypes (Loại xe)
CREATE TABLE BusTypes (
  BusTypeId INT IDENTITY(1,1) PRIMARY KEY,
  BusTypeName NVARCHAR(100) NOT NULL,
  TotalSeats INT NOT NULL,
  SeatLayout NVARCHAR(50),
  Amenities NVARCHAR(500)
);
GO

-- Bảng 3: Routes (Tuyến đường)
CREATE TABLE Routes (
  RouteId INT IDENTITY(1,1) PRIMARY KEY,
  RouteName NVARCHAR(200) NOT NULL,
  DepartureCity NVARCHAR(100) NOT NULL,
  ArrivalCity NVARCHAR(100) NOT NULL,
  Distance INT DEFAULT 0,
  EstimatedDuration FLOAT DEFAULT 0,
  ImageUrl NVARCHAR(500),
  IsActive BIT DEFAULT 1,
  CreatedAt DATETIME DEFAULT GETDATE()
);
GO

-- Bảng 4: Stops (Điểm dừng)
CREATE TABLE Stops (
  StopId INT IDENTITY(1,1) PRIMARY KEY,
  RouteId INT NOT NULL,
  StopOrder INT NOT NULL,
  StopName NVARCHAR(200) NOT NULL,
  StopAddress NVARCHAR(500),
  DistanceFromStart INT DEFAULT 0,
  Longitude FLOAT,
  Latitude FLOAT,
  IsActive BIT DEFAULT 1,
  CreatedAt DATETIME DEFAULT GETDATE(),
  FOREIGN KEY (RouteId) REFERENCES Routes(RouteId)
);
GO

-- Bảng 5: Trips (Chuyến xe)
CREATE TABLE Trips (
  TripId INT IDENTITY(1,1) PRIMARY KEY,
  RouteId INT NOT NULL,
  CompanyId INT NOT NULL,
  BusTypeId INT NOT NULL,
  DepartureTime VARCHAR(8),
  ArrivalTime VARCHAR(8),
  DepartureDate DATE NOT NULL,
  Price DECIMAL(10,2) NOT NULL,
  IsActive BIT DEFAULT 1,
  CreatedAt DATETIME DEFAULT GETDATE(),
  UpdatedAt DATETIME DEFAULT GETDATE(),
  FOREIGN KEY (RouteId) REFERENCES Routes(RouteId),
  FOREIGN KEY (CompanyId) REFERENCES Companies(CompanyId),
  FOREIGN KEY (BusTypeId) REFERENCES BusTypes(BusTypeId)
);
GO

-- Bảng 6: Seats (Ghế ngồi)
CREATE TABLE Seats (
  SeatId INT IDENTITY(1,1) PRIMARY KEY,
  TripId INT NOT NULL,
  SeatCode NVARCHAR(10) NOT NULL,
  SeatType NVARCHAR(50) DEFAULT N'Thường',
  Status VARCHAR(20) DEFAULT 'AVAILABLE',
  FOREIGN KEY (TripId) REFERENCES Trips(TripId)
);
GO

-- Bảng 7: Users (Người dùng)
CREATE TABLE Users (
  UserId INT IDENTITY(1,1) PRIMARY KEY,
  Username NVARCHAR(50) NOT NULL UNIQUE,
  Email NVARCHAR(100) NOT NULL UNIQUE,
  Password NVARCHAR(255) NOT NULL,
  FullName NVARCHAR(100) NOT NULL,
  Phone NVARCHAR(20),
  Address NVARCHAR(500),
  Role VARCHAR(20) DEFAULT 'CUSTOMER',
  Status BIT DEFAULT 1,
  EmailVerified BIT DEFAULT 0,
  CreatedAt DATETIME DEFAULT GETDATE(),
  UpdatedAt DATETIME DEFAULT GETDATE(),
  LastLoginAt DATETIME
);
GO

-- Bảng 8: Bookings (Đặt vé)
CREATE TABLE Bookings (
  BookingId INT IDENTITY(1,1) PRIMARY KEY,
  TripId INT NOT NULL,
  UserId INT,
  TicketCode NVARCHAR(50),
  CustomerName NVARCHAR(100) NOT NULL,
  CustomerPhone NVARCHAR(20) NOT NULL,
  CustomerEmail NVARCHAR(100),
  PickupStopOrder INT,
  DropoffStopOrder INT,
  SeatCount INT DEFAULT 1,
  TotalAmount DECIMAL(10,2) NOT NULL,
  Status VARCHAR(20) DEFAULT 'PENDING',
  BookingDate DATETIME DEFAULT GETDATE(),
  UpdatedAt DATETIME DEFAULT GETDATE(),
  FOREIGN KEY (TripId) REFERENCES Trips(TripId),
  FOREIGN KEY (UserId) REFERENCES Users(UserId)
);
GO

-- Bảng 9: BookingDetails (Chi tiết đặt vé)
CREATE TABLE BookingDetails (
  BookingDetailId INT IDENTITY(1,1) PRIMARY KEY,
  BookingId INT NOT NULL,
  SeatCode NVARCHAR(10) NOT NULL,
  Price DECIMAL(10,2) DEFAULT 0,
  FOREIGN KEY (BookingId) REFERENCES Bookings(BookingId)
);
GO

-- Bảng 10: Payments (Thanh toán)
CREATE TABLE Payments (
  PaymentId INT IDENTITY(1,1) PRIMARY KEY,
  BookingId INT NOT NULL,
  Amount DECIMAL(10,2) NOT NULL,
  PaymentMethod NVARCHAR(50),
  Status VARCHAR(20) DEFAULT 'PENDING',
  TransactionId NVARCHAR(100),
  PaymentDate DATETIME DEFAULT GETDATE(),
  FOREIGN KEY (BookingId) REFERENCES Bookings(BookingId)
);
GO

-- Bảng 11: Sessions (Phiên đăng nhập)
CREATE TABLE Sessions (
  SessionId INT IDENTITY(1,1) PRIMARY KEY,
  UserId INT NOT NULL,
  Token NVARCHAR(500),
  RefreshToken NVARCHAR(500),
  ExpiresAt DATETIME,
  CreatedAt DATETIME DEFAULT GETDATE(),
  FOREIGN KEY (UserId) REFERENCES Users(UserId)
);
GO

-- Bảng 12: Notifications (Thông báo)
CREATE TABLE Notifications (
  NotificationId INT IDENTITY(1,1) PRIMARY KEY,
  UserId INT NOT NULL,
  Title NVARCHAR(200),
  Content NVARCHAR(MAX),
  Type VARCHAR(20) DEFAULT 'SYSTEM',
  IsRead BIT DEFAULT 0,
  CreatedAt DATETIME DEFAULT GETDATE(),
  ReadAt DATETIME,
  FOREIGN KEY (UserId) REFERENCES Users(UserId)
);
GO

-- Bảng 13: Transactions (Lịch sử giao dịch)
CREATE TABLE Transactions (
  TransactionId INT IDENTITY(1,1) PRIMARY KEY,
  BookingId INT NOT NULL,
  Amount DECIMAL(10,2) NOT NULL,
  PaymentMethod NVARCHAR(50),
  Status VARCHAR(20) DEFAULT 'PENDING',
  ExternalTransactionId NVARCHAR(100),
  Note NVARCHAR(500),
  CreatedAt DATETIME DEFAULT GETDATE(),
  FOREIGN KEY (BookingId) REFERENCES Bookings(BookingId)
);
GO

-- Bảng 14: Reviews (Đánh giá)
CREATE TABLE Reviews (
  ReviewId INT IDENTITY(1,1) PRIMARY KEY,
  BookingId INT,
  UserId INT,
  TripId INT NOT NULL,
  CompanyId INT NOT NULL,
  Rating INT NOT NULL CHECK (Rating >= 1 AND Rating <= 5),
  Title NVARCHAR(200),
  Content NVARCHAR(MAX),
  Status VARCHAR(20) DEFAULT 'PENDING',
  CreatedAt DATETIME DEFAULT GETDATE(),
  ApprovedAt DATETIME,
  FOREIGN KEY (BookingId) REFERENCES Bookings(BookingId),
  FOREIGN KEY (UserId) REFERENCES Users(UserId),
  FOREIGN KEY (TripId) REFERENCES Trips(TripId),
  FOREIGN KEY (CompanyId) REFERENCES Companies(CompanyId)
);
GO

-- ================================================================
-- PHẦN 3: TẠO INDEXES
-- ================================================================

CREATE INDEX IX_Trips_RouteId ON Trips(RouteId);
CREATE INDEX IX_Trips_CompanyId ON Trips(CompanyId);
CREATE INDEX IX_Trips_BusTypeId ON Trips(BusTypeId);
CREATE INDEX IX_Trips_DepartureDate ON Trips(DepartureDate);
CREATE INDEX IX_Seats_TripId ON Seats(TripId);
CREATE INDEX IX_Seats_SeatCode ON Seats(SeatCode);
CREATE INDEX IX_Bookings_TripId ON Bookings(TripId);
CREATE INDEX IX_Bookings_UserId ON Bookings(UserId);
CREATE INDEX IX_Bookings_Status ON Bookings(Status);
CREATE INDEX IX_BookingDetails_BookingId ON BookingDetails(BookingId);
CREATE INDEX IX_Stops_RouteId ON Stops(RouteId);
CREATE INDEX IX_Users_Username ON Users(Username);
CREATE INDEX IX_Sessions_UserId ON Sessions(UserId);
CREATE INDEX IX_Notifications_UserId ON Notifications(UserId);
CREATE INDEX IX_Reviews_CompanyId ON Reviews(CompanyId);
GO

-- ================================================================
-- PHẦN 4: STORED PROCEDURES
-- ================================================================

-- SP 1: sp_LockSeats - Khóa ghế tạm thời (tạo booking PENDING)
CREATE PROCEDURE sp_LockSeats
  @TripId INT,
  @UserId INT = NULL,
  @SeatCodes NVARCHAR(500),
  @FromStopOrder INT,
  @ToStopOrder INT,
  @CustomerName NVARCHAR(100),
  @CustomerPhone NVARCHAR(20),
  @CustomerEmail NVARCHAR(100) = NULL,
  @Amount DECIMAL(10,2),
  @BookingId INT OUTPUT
AS
BEGIN
  SET NOCOUNT ON;
  SET XACT_ABORT ON;
 
  -- Sử dụng SERIALIZABLE để tránh xung đột đặt chỗ
  SET TRANSACTION ISOLATION LEVEL SERIALIZABLE;
  BEGIN TRANSACTION;
 
  BEGIN TRY
    -- 1. Kiểm tra chuyến xe tồn tại và đang hoạt động
    IF NOT EXISTS (
      SELECT 1 FROM Trips 
      WHERE TripId = @TripId AND IsActive = 1
    )
    BEGIN
      RAISERROR(N'Chuyến xe không tồn tại hoặc không hoạt động', 16, 1);
      RETURN;
    END
 
    -- 2. Kiểm tra tất cả ghế tồn tại trong chuyến
    DECLARE @SeatCount INT;
    SELECT @SeatCount = COUNT(*)
    FROM Seats s
    INNER JOIN STRING_SPLIT(@SeatCodes, ',') ss ON s.SeatCode = LTRIM(RTRIM(ss.value))
    WHERE s.TripId = @TripId;
 
    DECLARE @RequestedSeats INT;
    SELECT @RequestedSeats = COUNT(*) FROM STRING_SPLIT(@SeatCodes, ',');
 
    IF @SeatCount != @RequestedSeats
    BEGIN
      RAISERROR(N'Một số ghế không tồn tại trong chuyến xe này', 16, 1);
      RETURN;
    END
 
    -- 3. Kiểm tra xung đột chặng (segment overlap)
    -- Xung đột khi: NOT (toStopOrder <= PickupStopOrder OR fromStopOrder >= DropoffStopOrder)
    IF EXISTS (
      SELECT 1
      FROM BookingDetails bd
      INNER JOIN Bookings b ON bd.BookingId = b.BookingId
      INNER JOIN STRING_SPLIT(@SeatCodes, ',') ss ON bd.SeatCode = LTRIM(RTRIM(ss.value))
      WHERE b.TripId = @TripId
        AND b.Status IN ('PENDING', 'PAID')
        AND NOT (
          @ToStopOrder <= b.PickupStopOrder 
          OR @FromStopOrder >= b.DropoffStopOrder
        )
    )
    BEGIN
      RAISERROR(N'Một số ghế đã được đặt trong chặng này', 16, 1);
      RETURN;
    END
 
    -- 4. Tạo mã vé unique
    DECLARE @TicketCode NVARCHAR(50);
    SET @TicketCode = 'VE-' + FORMAT(GETDATE(), 'yyyyMMdd') + '-' + CAST(ABS(CHECKSUM(NEWID())) % 100000 AS VARCHAR);
 
    -- 5. Tạo booking
    INSERT INTO Bookings (
      TripId, UserId, TicketCode, CustomerName, CustomerPhone, CustomerEmail,
      PickupStopOrder, DropoffStopOrder, SeatCount,
      TotalAmount, Status, BookingDate, UpdatedAt
    )
    VALUES (
      @TripId, @UserId, @TicketCode, @CustomerName, @CustomerPhone, @CustomerEmail,
      @FromStopOrder, @ToStopOrder, @RequestedSeats,
      @Amount, 'PENDING', GETDATE(), GETDATE()
    );
 
    SET @BookingId = SCOPE_IDENTITY();

    -- 6. Tạo chi tiết đặt vé cho từng ghế
    INSERT INTO BookingDetails (BookingId, SeatCode, Price)
    SELECT @BookingId, LTRIM(RTRIM(ss.value)), @Amount / @RequestedSeats
    FROM STRING_SPLIT(@SeatCodes, ',') ss;

    COMMIT TRANSACTION;

    -- 7. Trả về thông tin booking
    SELECT 
      b.BookingId,
      b.TicketCode,
      b.CustomerName,
      b.CustomerPhone,
      b.TotalAmount,
      b.Status,
      b.BookingDate
    FROM Bookings b
    WHERE b.BookingId = @BookingId;

  END TRY
  BEGIN CATCH
    IF @@TRANCOUNT > 0
      ROLLBACK TRANSACTION;
    THROW;
  END CATCH
END;
GO

-- SP 2: sp_ConfirmPayment - Xác nhận thanh toán
CREATE PROCEDURE sp_ConfirmPayment
  @BookingId INT,
  @PaymentMethod NVARCHAR(50) = 'QR',
  @TransactionId NVARCHAR(100) = NULL
AS
BEGIN
  SET NOCOUNT ON;
  SET XACT_ABORT ON;
  BEGIN TRANSACTION;

  BEGIN TRY
    -- 1. Kiểm tra booking tồn tại và đang PENDING
    DECLARE @CurrentStatus VARCHAR(20);
    DECLARE @TotalAmount DECIMAL(10,2);

    SELECT @CurrentStatus = Status, @TotalAmount = TotalAmount
    FROM Bookings
    WHERE BookingId = @BookingId;

    IF @CurrentStatus IS NULL
    BEGIN
      RAISERROR(N'Không tìm thấy đơn đặt vé', 16, 1);
      RETURN;
    END

    IF @CurrentStatus != 'PENDING'
    BEGIN
      RAISERROR(N'Đơn đặt vé không ở trạng thái chờ thanh toán', 16, 1);
      RETURN;
    END

    -- 2. Cập nhật trạng thái booking → PAID
    UPDATE Bookings
    SET Status = 'PAID', UpdatedAt = GETDATE()
    WHERE BookingId = @BookingId;

    -- 3. Thêm bản ghi thanh toán
    INSERT INTO Payments (BookingId, Amount, PaymentMethod, Status, TransactionId, PaymentDate)
    VALUES (@BookingId, @TotalAmount, @PaymentMethod, 'COMPLETED', @TransactionId, GETDATE());

    -- 4. Thêm lịch sử giao dịch
    INSERT INTO Transactions (BookingId, Amount, PaymentMethod, Status, ExternalTransactionId, Note, CreatedAt)
    VALUES (@BookingId, @TotalAmount, @PaymentMethod, 'SUCCESS', @TransactionId, N'Thanh toán thành công', GETDATE());

    COMMIT TRANSACTION;

    -- 5. Trả về thông tin
    SELECT 
      b.BookingId,
      b.TicketCode,
      b.CustomerName,
      b.TotalAmount,
      b.Status,
      p.PaymentMethod,
      p.PaymentDate
    FROM Bookings b
    INNER JOIN Payments p ON b.BookingId = p.BookingId
    WHERE b.BookingId = @BookingId;

  END TRY
  BEGIN CATCH
    IF @@TRANCOUNT > 0
      ROLLBACK TRANSACTION;
    THROW;
  END CATCH
END;
GO

-- ================================================================
-- PHẦN 5: DỮ LIỆU MẪU (Tiếng Việt có dấu)
-- ================================================================

-- 5.1: Nhà xe (Companies)
SET IDENTITY_INSERT Companies ON;
INSERT INTO Companies (CompanyId, CompanyName, Phone, Email, Address, Description, Rating, CustomerHotline, IsActive) VALUES
(1, N'Phương Trang (FUTA Bus Lines)', '02838309309', 'contact@futabus.vn', N'Số 1 Trần Nhân Tôn, Quận 10, TP.HCM', N'Nhà xe lớn nhất Việt Nam với hệ thống xe chất lượng cao, phục vụ hơn 100 tuyến đường trên toàn quốc. Dịch vụ chuyên nghiệp, đúng giờ.', 4.5, '1900 6067', 1),
(2, N'Thành Bưởi', '02838397397', 'info@thanhbuoi.vn', N'Số 266 Lê Hồng Phong, Quận 10, TP.HCM', N'Nhà xe uy tín hàng đầu tuyến TP.HCM - Đà Lạt - Nha Trang. Xe giường nằm và limousine cao cấp, wifi miễn phí.', 4.3, '1900 1977', 1),
(3, N'Hoàng Long', '02439424929', 'contact@hoanglong.vn', N'Số 28 Trần Nhật Duật, Quận 1, Hà Nội', N'Nhà xe chuyên tuyến Bắc - Trung, phục vụ chuyên nghiệp với đội ngũ tài xế kinh nghiệm lâu năm.', 4.2, '1900 6898', 1),
(4, N'Kumho Samco', '02838466666', 'kumho@samco.com.vn', N'Số 1014 Lê Hồng Phong, Quận 10, TP.HCM', N'Liên doanh Hàn Quốc - Việt Nam, xe chất lượng theo tiêu chuẩn quốc tế. Phục vụ tuyến miền Đông và miền Tây.', 4.4, '1900 6036', 1),
(5, N'Hải Vân', '02363821821', 'info@haivan.vn', N'Số 10 Điện Biên Phủ, TP Đà Nẵng', N'Nhà xe chuyên tuyến miền Trung, dịch vụ tận tâm, giá cả hợp lý cho mọi đối tượng hành khách.', 4.1, '1900 2233', 1);
SET IDENTITY_INSERT Companies OFF;
GO

-- 5.2: Loại xe (BusTypes)
SET IDENTITY_INSERT BusTypes ON;
INSERT INTO BusTypes (BusTypeId, BusTypeName, TotalSeats, SeatLayout, Amenities) VALUES
(1, N'Ghế ngồi 45 chỗ', 45, 'standard-45', N'Điều hòa, TV, nước uống miễn phí'),
(2, N'Giường nằm 40 chỗ', 40, 'sleeper-40', N'Điều hòa, wifi, chăn gối, nước uống, bánh ngọt'),
(3, N'Limousine 34 chỗ', 34, 'limousine-34', N'Điều hòa, wifi, ghế massage, USB sạc, nước uống, bánh ngọt, khăn lạnh'),
(4, N'VIP Cabin 22 chỗ', 22, 'vip-cabin-22', N'Cabin riêng, điều hòa riêng, TV riêng, wifi, minibar, nước uống, bánh ngọt');
SET IDENTITY_INSERT BusTypes OFF;
GO

-- 5.3: Tuyến đường (Routes)
SET IDENTITY_INSERT Routes ON;
INSERT INTO Routes (RouteId, RouteName, DepartureCity, ArrivalCity, Distance, EstimatedDuration, ImageUrl, IsActive) VALUES
(1, N'TP.HCM - Đà Lạt', N'TP.HCM', N'Đà Lạt', 300, 7.0, 'https://images.unsplash.com/photo-1582218109194-3528b17a1262?w=800', 1),
(2, N'TP.HCM - Nha Trang', N'TP.HCM', N'Nha Trang', 450, 9.5, 'https://images.unsplash.com/photo-1506461883276-594a12b11cf3?w=800', 1),
(3, N'TP.HCM - Vũng Tàu', N'TP.HCM', N'Vũng Tàu', 100, 2.5, 'https://images.unsplash.com/photo-1579710385551-789bc72d689b?w=800', 1),
(4, N'Đà Nẵng - Hội An', N'Đà Nẵng', N'Hội An', 30, 1.0, 'https://images.unsplash.com/photo-1555581908-173fd21dfc5b?w=800', 1),
(5, N'Hà Nội - Sa Pa', N'Hà Nội', N'Sa Pa', 320, 6.0, 'https://images.unsplash.com/photo-1528127269322-539801943592?w=800', 1),
(6, N'Hà Nội - Hải Phòng', N'Hà Nội', N'Hải Phòng', 120, 2.0, 'hanoi-haiphong.jpg', 1),
(7, N'TP.HCM - Cần Thơ', N'TP.HCM', N'Cần Thơ', 170, 3.5, 'tphcm-cantho.jpg', 1),
(8, N'TP.HCM - Buôn Ma Thuột', N'TP.HCM', N'Buôn Ma Thuột', 350, 8.0, 'tphcm-bmt.jpg', 1);
SET IDENTITY_INSERT Routes OFF;
GO

-- 5.4: Điểm dừng (Stops) - 4~5 điểm mỗi tuyến
SET IDENTITY_INSERT Stops ON;
INSERT INTO Stops (StopId, RouteId, StopOrder, StopName, StopAddress, DistanceFromStart, Longitude, Latitude, IsActive) VALUES
-- Tuyến 1: TP.HCM - Đà Lạt
(1,  1, 1, N'Bến xe Miền Đông', N'292 Đinh Bộ Lĩnh, Bình Thạnh, TP.HCM', 0, 106.7139, 10.8148, 1),
(2,  1, 2, N'Ngã ba Dầu Giây', N'Quốc lộ 1A, Thống Nhất, Đồng Nai', 70, 107.1844, 10.9016, 1),
(3,  1, 3, N'Bảo Lộc', N'TP. Bảo Lộc, Lâm Đồng', 180, 107.8117, 11.5481, 1),
(4,  1, 4, N'Đức Trọng', N'Huyện Đức Trọng, Lâm Đồng', 250, 108.3653, 11.7271, 1),
(5,  1, 5, N'Bến xe Đà Lạt', N'01 Tô Hiến Thành, Phường 3, Đà Lạt', 300, 108.4483, 11.9404, 1),
-- Tuyến 2: TP.HCM - Nha Trang
(6,  2, 1, N'Bến xe Miền Đông', N'292 Đinh Bộ Lĩnh, Bình Thạnh, TP.HCM', 0, 106.7139, 10.8148, 1),
(7,  2, 2, N'Phan Thiết', N'TP. Phan Thiết, Bình Thuận', 200, 108.1002, 10.9289, 1),
(8,  2, 3, N'Cam Ranh', N'TP. Cam Ranh, Khánh Hòa', 380, 109.1442, 11.9214, 1),
(9,  2, 4, N'Bến xe Nha Trang', N'58 Vùng Trung, Nha Trang, Khánh Hòa', 430, 109.1967, 12.2388, 1),
-- Tuyến 3: TP.HCM - Đà Nẵng
(10, 3, 1, N'Bến xe Miền Đông', N'292 Đinh Bộ Lĩnh, Bình Thạnh, TP.HCM', 0, 106.7139, 10.8148, 1),
(11, 3, 2, N'Nha Trang', N'TP. Nha Trang, Khánh Hòa', 430, 109.1967, 12.2388, 1),
(12, 3, 3, N'Quy Nhơn', N'TP. Quy Nhơn, Bình Định', 680, 109.2237, 13.7760, 1),
(13, 3, 4, N'Quảng Ngãi', N'TP. Quảng Ngãi, Quảng Ngãi', 830, 108.8004, 15.1206, 1),
(14, 3, 5, N'Bến xe Đà Nẵng', N'33 Điện Biên Phủ, Thanh Khê, Đà Nẵng', 960, 108.2068, 16.0471, 1),
-- Tuyến 4: TP.HCM - Vũng Tàu
(15, 4, 1, N'Bến xe Miền Đông', N'292 Đinh Bộ Lĩnh, Bình Thạnh, TP.HCM', 0, 106.7139, 10.8148, 1),
(16, 4, 2, N'Long Thành', N'Huyện Long Thành, Đồng Nai', 50, 106.9504, 10.7849, 1),
(17, 4, 3, N'Bà Rịa', N'TP. Bà Rịa, Bà Rịa - Vũng Tàu', 90, 107.1685, 10.4960, 1),
(18, 4, 4, N'Bến xe Vũng Tàu', N'192 Nam Kỳ Khởi Nghĩa, Vũng Tàu', 125, 107.0843, 10.3460, 1),
-- Tuyến 5: Hà Nội - Đà Nẵng
(19, 5, 1, N'Bến xe Giáp Bát', N'Giải Phóng, Hoàng Mai, Hà Nội', 0, 105.8411, 20.9809, 1),
(20, 5, 2, N'Vinh', N'TP. Vinh, Nghệ An', 290, 105.6894, 18.6790, 1),
(21, 5, 3, N'Huế', N'TP. Huế, Thừa Thiên Huế', 660, 107.5909, 16.4637, 1),
(22, 5, 4, N'Bến xe Đà Nẵng', N'33 Điện Biên Phủ, Thanh Khê, Đà Nẵng', 770, 108.2068, 16.0471, 1),
-- Tuyến 6: Hà Nội - Hải Phòng
(23, 6, 1, N'Bến xe Giáp Bát', N'Giải Phóng, Hoàng Mai, Hà Nội', 0, 105.8411, 20.9809, 1),
(24, 6, 2, N'Hải Dương', N'TP. Hải Dương, Hải Dương', 60, 106.3134, 20.9397, 1),
(25, 6, 3, N'Bến xe Hải Phòng', N'Lạch Tray, Ngô Quyền, Hải Phòng', 120, 106.6881, 20.8449, 1),
-- Tuyến 7: TP.HCM - Cần Thơ
(26, 7, 1, N'Bến xe Miền Tây', N'395 Kinh Dương Vương, Bình Tân, TP.HCM', 0, 106.6174, 10.7379, 1),
(27, 7, 2, N'Mỹ Tho', N'TP. Mỹ Tho, Tiền Giang', 70, 106.3653, 10.3550, 1),
(28, 7, 3, N'Vĩnh Long', N'TP. Vĩnh Long, Vĩnh Long', 120, 105.9733, 10.2518, 1),
(29, 7, 4, N'Bến xe Cần Thơ', N'91B Nguyễn Văn Linh, Ninh Kiều, Cần Thơ', 170, 105.7469, 10.0452, 1),
-- Tuyến 8: TP.HCM - Buôn Ma Thuột
(30, 8, 1, N'Bến xe Miền Đông', N'292 Đinh Bộ Lĩnh, Bình Thạnh, TP.HCM', 0, 106.7139, 10.8148, 1),
(31, 8, 2, N'Ngã ba Dầu Giây', N'Quốc lộ 1A, Thống Nhất, Đồng Nai', 70, 107.1844, 10.9016, 1),
(32, 8, 3, N'Gia Nghĩa', N'TP. Gia Nghĩa, Đắk Nông', 230, 107.6881, 11.9781, 1),
(33, 8, 4, N'Bến xe Buôn Ma Thuột', N'TP. Buôn Ma Thuột, Đắk Lắk', 350, 108.0378, 12.6814, 1);
SET IDENTITY_INSERT Stops OFF;
GO

-- 5.5: Chuyến xe (Trips) - sử dụng ngày tương đối so với hôm nay
INSERT INTO Trips (RouteId, CompanyId, BusTypeId, DepartureTime, ArrivalTime, DepartureDate, Price, IsActive) VALUES
-- Chuyến 1: TPHCM → Đà Lạt, Phương Trang, Limousine, ngày mai
(1, 1, 3, '07:00', '14:00', DATEADD(day, 1, CAST(GETDATE() AS DATE)), 350000, 1),
-- Chuyến 2: TPHCM → Đà Lạt, Thành Bưởi, Giường nằm, ngày kia
(1, 2, 2, '22:00', '05:00', DATEADD(day, 2, CAST(GETDATE() AS DATE)), 280000, 1),
-- Chuyến 3: TPHCM → Nha Trang, Phương Trang, Ghế ngồi, ngày mai
(2, 1, 1, '20:00', '04:30', DATEADD(day, 1, CAST(GETDATE() AS DATE)), 250000, 1),
-- Chuyến 4: TPHCM → Đà Nẵng, Hoàng Long, Giường nằm, +3 ngày
(3, 3, 2, '18:00', '11:00', DATEADD(day, 3, CAST(GETDATE() AS DATE)), 550000, 1),
-- Chuyến 5: TPHCM → Vũng Tàu, Kumho Samco, Ghế ngồi, ngày mai
(4, 4, 1, '08:00', '10:30', DATEADD(day, 1, CAST(GETDATE() AS DATE)), 120000, 1),
-- Chuyến 6: HN → Đà Nẵng, Hoàng Long, Limousine, +2 ngày
(5, 3, 3, '19:00', '09:00', DATEADD(day, 2, CAST(GETDATE() AS DATE)), 600000, 1),
-- Chuyến 7: HN → Hải Phòng, Hải Vân, Ghế ngồi, ngày mai
(6, 5, 1, '07:00', '09:00', DATEADD(day, 1, CAST(GETDATE() AS DATE)), 100000, 1),
-- Chuyến 8: TPHCM → Cần Thơ, Phương Trang, Ghế ngồi, +2 ngày
(7, 1, 1, '06:00', '09:30', DATEADD(day, 2, CAST(GETDATE() AS DATE)), 150000, 1),
-- Chuyến 9: TPHCM → BMT, Thành Bưởi, Giường nằm, +3 ngày
(8, 2, 2, '21:00', '05:00', DATEADD(day, 3, CAST(GETDATE() AS DATE)), 320000, 1),
-- Chuyến 10: TPHCM → BMT, Kumho Samco, VIP Cabin, +4 ngày
(8, 4, 4, '20:00', '04:00', DATEADD(day, 4, CAST(GETDATE() AS DATE)), 500000, 1);
GO

-- 5.6: Tự động tạo ghế cho tất cả chuyến xe dựa trên loại xe
DECLARE @TripId INT, @TotalSeats INT;
DECLARE trip_cursor CURSOR FOR
  SELECT t.TripId, bt.TotalSeats
  FROM Trips t INNER JOIN BusTypes bt ON t.BusTypeId = bt.BusTypeId;

OPEN trip_cursor;
FETCH NEXT FROM trip_cursor INTO @TripId, @TotalSeats;

WHILE @@FETCH_STATUS = 0
BEGIN
  DECLARE @i INT = 1;
  DECLARE @row CHAR(1);
  DECLARE @col INT;
  
  WHILE @i <= @TotalSeats
  BEGIN
    -- Tạo mã ghế dạng A01, A02, ..., B01, B02, ... (mỗi hàng 10 ghế)
    SET @row = CHAR(64 + ((@i - 1) / 10) + 1);
    SET @col = ((@i - 1) % 10) + 1;
    
    INSERT INTO Seats (TripId, SeatCode, SeatType, Status)
    VALUES (@TripId, @row + RIGHT('0' + CAST(@col AS VARCHAR), 2), N'Thường', 'AVAILABLE');
    
    SET @i = @i + 1;
  END
  
  FETCH NEXT FROM trip_cursor INTO @TripId, @TotalSeats;
END

CLOSE trip_cursor;
DEALLOCATE trip_cursor;
GO

-- 5.7: Người dùng (Users) - Mật khẩu cần được hash qua bcrypt
-- Admin: username=admin, password=lhh123 | Staff: password=Admin@123 | Customer: password=User@123
INSERT INTO Users (Username, Email, Password, FullName, Phone, Address, Role, Status, EmailVerified) VALUES
('admin', N'admin@datvenhanh.vn', N'$2b$10$AoivP.zpBLCVWwJgoFmoouqGa4LdmPAdNjhuAcgeTrvN.S9kB/S7C', N'Quản Trị Viên', '0900000001', N'TP. Hồ Chí Minh', 'ADMIN', 1, 1),
('staff', N'staff@datvenhanh.vn', N'$2b$10$mjBBS5.kgn/rH9PJyKU17.bAC/Dm0ATr2KXFZpfc2zgvYyQTOnTeW', N'Nhân Viên Hỗ Trợ', '0900000002', N'TP. Hồ Chí Minh', 'STAFF', 1, 1),
('nguyenvana', N'nguyenvana@gmail.com', N'$2b$10$ZnDnk7OeWufoktlCfKq75.b8tD0/y9grpE2JS5pdNkShMYhuhmzqm', N'Nguyễn Văn An', '0912345678', N'Quận 1, TP. Hồ Chí Minh', 'CUSTOMER', 1, 1),
('tranthib', N'tranthib@gmail.com', N'$2b$10$ZnDnk7OeWufoktlCfKq75.b8tD0/y9grpE2JS5pdNkShMYhuhmzqm', N'Trần Thị Bình', '0987654321', N'Quận Đống Đa, Hà Nội', 'CUSTOMER', 1, 1);
GO

-- 5.8: Đặt vé mẫu (Bookings) - sử dụng UserId từ bảng Users
-- Booking đã thanh toán
INSERT INTO Bookings (TripId, UserId, TicketCode, CustomerName, CustomerPhone, CustomerEmail, PickupStopOrder, DropoffStopOrder, SeatCount, TotalAmount, Status, BookingDate) VALUES
(1, 3, 'VE-20250701-00001', N'Nguyễn Văn An', '0912345678', 'nguyenvana@gmail.com', 1, 5, 2, 700000, 'PAID', DATEADD(day, -1, GETDATE())),
(3, 4, 'VE-20250701-00002', N'Trần Thị Bình', '0987654321', 'tranthib@gmail.com', 1, 4, 1, 250000, 'PAID', DATEADD(day, -1, GETDATE()));

-- Booking đang chờ thanh toán
INSERT INTO Bookings (TripId, UserId, TicketCode, CustomerName, CustomerPhone, CustomerEmail, PickupStopOrder, DropoffStopOrder, SeatCount, TotalAmount, Status, BookingDate) VALUES
(5, 3, 'VE-20250702-00001', N'Nguyễn Văn An', '0912345678', 'nguyenvana@gmail.com', 1, 4, 1, 120000, 'PENDING', GETDATE());
GO

-- 5.9: Chi tiết đặt vé (BookingDetails)
INSERT INTO BookingDetails (BookingId, SeatCode, Price) VALUES
(1, 'A01', 350000),
(1, 'A02', 350000),
(2, 'A05', 250000),
(3, 'B01', 120000);
GO

-- 5.10: Thanh toán (Payments)
INSERT INTO Payments (BookingId, Amount, PaymentMethod, Status, TransactionId, PaymentDate) VALUES
(1, 700000, N'QR', 'COMPLETED', 'TXN-20250701-001', DATEADD(day, -1, GETDATE())),
(2, 250000, N'QR', 'COMPLETED', 'TXN-20250701-002', DATEADD(day, -1, GETDATE()));
GO

-- 5.11: Lịch sử giao dịch (Transactions)
INSERT INTO Transactions (BookingId, Amount, PaymentMethod, Status, ExternalTransactionId, Note) VALUES
(1, 700000, N'QR', 'SUCCESS', 'TXN-20250701-001', N'Thanh toán qua QR Code - Chuyến TP.HCM → Đà Lạt'),
(2, 250000, N'QR', 'SUCCESS', 'TXN-20250701-002', N'Thanh toán qua QR Code - Chuyến TP.HCM → Nha Trang');
GO

-- 5.12: Đánh giá (Reviews)
INSERT INTO Reviews (BookingId, UserId, TripId, CompanyId, Rating, Title, Content, Status) VALUES
(1, 3, 1, 1, 5, N'Dịch vụ xuất sắc!', N'Xe Phương Trang đi Đà Lạt rất thoải mái, tài xế lái cẩn thận, nhân viên phục vụ nhiệt tình. Xe sạch sẽ, đúng giờ. Rất hài lòng!', 'APPROVED'),
(2, 4, 3, 1, 4, N'Tốt nhưng hơi chậm', N'Xe Phương Trang chất lượng tốt, ghế ngồi thoải mái. Tuy nhiên xe đến trễ hơn 30 phút so với lịch trình. Nhìn chung vẫn hài lòng.', 'APPROVED');
GO

-- 5.13: Thông báo (Notifications)
INSERT INTO Notifications (UserId, Title, Content, Type, IsRead) VALUES
(3, N'Đặt vé thành công', N'Bạn đã đặt vé thành công chuyến TP.HCM → Đà Lạt ngày mai. Mã vé: VE-20250701-00001. Chúc bạn có chuyến đi vui vẻ!', 'BOOKING', 1),
(3, N'Thanh toán thành công', N'Đơn đặt vé #1 đã được thanh toán thành công. Số tiền: 700,000 VNĐ. Vui lòng xuất trình mã QR khi lên xe.', 'PAYMENT', 0),
(4, N'Chào mừng bạn đến với DatVeNhanh!', N'Cảm ơn bạn đã đăng ký tài khoản. Khám phá ngay các chuyến xe giá tốt và đặt vé dễ dàng chỉ với vài bước đơn giản!', 'SYSTEM', 0);
GO

-- ================================================================
-- HOÀN TẤT - TÓM TẮT BẢNG
-- ================================================================
-- 1.  Companies     - Nhà xe (5 bản ghi)
-- 2.  BusTypes      - Loại xe (4 bản ghi)
-- 3.  Routes        - Tuyến đường (8 bản ghi)
-- 4.  Stops         - Điểm dừng (33 bản ghi)
-- 5.  Trips         - Chuyến xe (10 bản ghi)
-- 6.  Seats         - Ghế ngồi (tự động sinh ~370 bản ghi)
-- 7.  Users         - Người dùng (4 bản ghi)
-- 8.  Bookings      - Đặt vé (3 bản ghi)
-- 9.  BookingDetails - Chi tiết đặt vé (4 bản ghi)
-- 10. Payments      - Thanh toán (2 bản ghi)
-- 11. Sessions      - Phiên đăng nhập
-- 12. Notifications - Thông báo (3 bản ghi)
-- 13. Transactions  - Lịch sử giao dịch (2 bản ghi)
-- 14. Reviews       - Đánh giá (2 bản ghi)
-- ================================================================
-- LƯU Ý: Tài khoản mặc định:
--   Admin: admin@busticket.vn / Admin@123
--   Staff: staff@busticket.vn / Admin@123
--   Customer: nguyenvana@gmail.com / User@123
--   Customer: tranthib@gmail.com / User@123
-- ================================================================
PRINT N'✅ Database đã được tạo thành công với dữ liệu mẫu tiếng Việt!';
GO
