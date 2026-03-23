# Luồng Hoạt Động Hệ Thống Đặt Vé Xe Khách

## 📋 Tổng Quan Liên Kết Các Trang

### 1. **Trang Chủ (index.html)**

**Mục đích**: Tìm kiếm chuyến xe theo tuyến và ngày

**Chức năng**:

- Tìm kiếm chuyến xe (điểm đi, điểm đến, ngày đi)
- Hiển thị danh sách chuyến xe phù hợp
- Chatbot hỗ trợ 24/7
- Navigation bar với đăng nhập/đăng ký

**Liên kết đến**:

- `seat-map.html?tripId={id}` - Khi click "Xem sơ đồ ghế" hoặc "Đặt vé ngay"
- `login.html` - Click "Đăng Nhập" trên nav
- `register.html` - Click "Đăng Ký" trên nav
- `ticket.html` - Click "Vé Của Tôi" trên nav
- `admin-trips.html` - Nếu đăng nhập với vai trò ADMIN

**File JavaScript**: `assets/js/main.js`, `assets/js/auth-nav.js`

---

### 2. **Đăng Nhập (login.html)**

**Mục đích**: Xác thực người dùng

**Chức năng**:

- Form đăng nhập (email + password)
- Lưu JWT token vào localStorage
- Phân quyền theo vai trò (ADMIN/CUSTOMER)

**Liên kết đến**:

- `index.html` - Click "Quay lại" hoặc sau khi đăng nhập (role CUSTOMER)
- `admin-trips.html` - Sau khi đăng nhập thành công (role ADMIN)
- `register.html` - Link "Chưa có tài khoản?"

**File JavaScript**: `assets/js/login.js`

---

### 3. **Đăng Ký (register.html)**

**Mục đích**: Tạo tài khoản mới

**Chức năng**:

- Form đăng ký (họ tên, email, SĐT, mật khẩu)
- Validation phía client
- Tự động đăng nhập sau khi đăng ký thành công

**Liên kết đến**:

- `index.html` - Click "Quay lại" hoặc sau khi đăng ký thành công
- `login.html` - Link "Đã có tài khoản?"

**File JavaScript**: `assets/js/register.js`

---

### 4. **Sơ Đồ Ghế (seat-map.html)**

**Mục đích**: Chọn ghế và tạo booking

**Chức năng**:

- Hiển thị sơ đồ ghế của chuyến xe
- Chọn điểm đón và điểm trả
- Chọn ghế (kiểm tra ghế trống theo chặng)
- Nhập thông tin khách hàng
- Tạo booking tạm (gọi `sp_LockSeats`)

**Liên kết đến**:

- `checkout.html?bookingId={id}` - Sau khi đặt ghế thành công
- `index.html` - Click "Trang Chủ" trên nav
- `ticket.html` - Click "Vé Của Tôi" trên nav

**Nhận tham số**: `?tripId={id}` từ index.html

**File JavaScript**: `assets/js/seat-map.js`, `assets/js/auth-nav.js`

---

### 5. **Thanh Toán (checkout.html)**

**Mục đích**: Xác nhận thanh toán qua QR

**Chức năng**:

- Hiển thị thông tin booking
- Tạo mã QR thanh toán (giả lập)
- Xác nhận đã thanh toán (gọi `sp_ConfirmPayment`)
- Hủy booking nếu không muốn thanh toán

**Liên kết đến**:

- `ticket.html?bookingId={id}` - Sau khi thanh toán thành công
- `index.html` - Nếu hủy booking

**Nhận tham số**: `?bookingId={id}` từ seat-map.html

**File JavaScript**: `assets/js/checkout.js`, `assets/js/auth-nav.js`

---

### 6. **Vé Của Tôi (ticket.html)**

**Mục đích**: Hiển thị vé đã đặt

**Chức năng**:

- Hiển thị thông tin vé chi tiết
- Tạo mã QR vé
- Tải vé PDF
- In vé
- Chia sẻ vé

**Liên kết đến**:

- `index.html` - Click "Về Trang Chủ"
- Download file PDF vé

**Nhận tham số**: `?bookingId={id}` từ checkout.html

**File JavaScript**: `assets/js/ticket.js`, `assets/js/auth-nav.js`

---

### 7. **Quản Trị Chuyến Xe (admin-trips.html)**

**Mục đích**: CRUD chuyến xe (chỉ dành cho ADMIN)

**Chức năng**:

- Xem danh sách chuyến xe
- Thêm chuyến xe mới (tự động tạo 20 ghế)
- Sửa thông tin chuyến xe
- Xóa chuyến xe
- Tìm kiếm và lọc chuyến

**Liên kết đến**:

- `index.html` - Click "Trang Chủ"
- `index.html` - Đăng xuất

**Yêu cầu**: Phải đăng nhập với vai trò ADMIN

**File JavaScript**: Inline JavaScript trong file HTML

---

## 🔄 Luồng Người Dùng Chính

### A. Khách Hàng Đặt Vé (Customer Journey)

```
1. index.html
   ↓ (Tìm kiếm chuyến xe)
   ↓ (Click "Xem sơ đồ ghế" hoặc "Đặt vé ngay")

2. seat-map.html?tripId=123
   ↓ (Chọn điểm đón/trả)
   ↓ (Chọn ghế)
   ↓ (Nhập thông tin)
   ↓ (Click "Đặt Vé")
   ↓ (API: POST /api/v1/bookings/lock - Gọi sp_LockSeats)

3. checkout.html?bookingId=456
   ↓ (Hiển thị QR thanh toán)
   ↓ (Click "Xác Nhận Đã Thanh Toán")
   ↓ (API: POST /api/v1/bookings/confirm - Gọi sp_ConfirmPayment)

4. ticket.html?bookingId=456
   ↓ (Hiển thị vé)
   ↓ (Tải PDF hoặc In vé)
   ↓ (API: POST /api/v1/tickets/issue)

5. ✅ Hoàn tất!
```

### B. Quản Trị Viên (Admin Journey)

```
1. login.html
   ↓ (Email: admin@bla.vn, Password: lhh123)
   ↓ (API: POST /api/v1/auth/login)

2. admin-trips.html
   ↓ (Thêm/Sửa/Xóa chuyến xe)
   ↓ (API: POST/PUT/DELETE /api/v1/admin/trips)

3. ✅ Quản lý hoàn tất!
```

### C. Đăng Ký & Đăng Nhập

```
Lần đầu:
register.html → index.html (tự động đăng nhập)

Lần sau:
login.html → index.html (hoặc admin-trips.html nếu là ADMIN)
```

---

## 📡 API Endpoints Chính

### 1. Tìm kiếm & Xem chuyến

```
GET /api/v1/trips/search?from={city}&to={city}&date={date}
GET /api/v1/trips/{tripId}
GET /api/v1/trips/cities
```

### 2. Quản lý ghế

```
GET /api/v1/seats?tripId={id}&fromStopOrder={n}&toStopOrder={m}
```

### 3. Đặt vé

```
POST /api/v1/bookings/lock      # Gọi sp_LockSeats
POST /api/v1/bookings/confirm   # Gọi sp_ConfirmPayment
DELETE /api/v1/bookings/{id}    # Hủy booking
GET /api/v1/bookings/{id}       # Xem thông tin booking
```

### 4. Thanh toán & Vé

```
POST /api/v1/payments/qr        # Tạo QR thanh toán
POST /api/v1/tickets/issue      # Phát hành vé PDF
```

### 5. Admin

```
GET /api/v1/admin/trips
POST /api/v1/admin/trips
PUT /api/v1/admin/trips/{id}
DELETE /api/v1/admin/trips/{id}
```

### 6. Authentication

```
POST /api/v1/auth/register
POST /api/v1/auth/login
POST /api/v1/auth/logout
GET /api/v1/auth/me
```

### 7. Chatbot

```
POST /api/v1/chat/ask
```

---

## 🔐 Xác Thực & Phân Quyền

### LocalStorage Keys

- `token`: JWT access token
- `refreshToken`: JWT refresh token
- `user`: JSON object chứa thông tin user (HoTen, Email, VaiTro)

### Vai Trò (Roles)

1. **GUEST**: Chưa đăng nhập (chỉ xem chuyến)
2. **CUSTOMER**: Đã đăng nhập (đặt vé, xem vé)
3. **ADMIN**: Quản trị viên (full quyền + quản lý chuyến)

### Navigation Bar Động

- **Chưa đăng nhập**: Hiển thị "Đăng Nhập" + "Đăng Ký"
- **Đã đăng nhập**: Hiển thị tên user + "Đăng Xuất"
- **Admin**: Thêm link "Quản Trị"

File xử lý: `assets/js/auth-nav.js`

---

## 📦 Stored Procedures Quan Trọng

### 1. sp_LockSeats

**Mục đích**: Khóa ghế tạm thời khi đặt vé

**Tham số**:

- `@TripId`: ID chuyến xe
- `@SeatCodes`: Danh sách mã ghế (JSON array)
- `@FromStopOrder`: Thứ tự điểm đón
- `@ToStopOrder`: Thứ tự điểm trả
- `@CustomerName`, `@CustomerPhone`, `@CustomerEmail`
- `@Amount`: Tổng tiền

**Xử lý**:

1. Kiểm tra xung đột chặng (SERIALIZABLE)
2. Tạo booking với status = 'PENDING'
3. Tạo BookingSeats
4. Trả về BookingId

### 2. sp_ConfirmPayment

**Mục đích**: Xác nhận thanh toán và phát hành vé

**Tham số**:

- `@BookingId`: ID booking cần xác nhận

**Xử lý**:

1. Cập nhật status booking = 'PAID'
2. Tạo ThanhToan với status = 'SUCCESS'
3. Cập nhật TrangThai ghế = 'BOOKED'

---

## 🎨 Cải Tiến UI/UX Đã Thực Hiện

### 1. Navigation Bar Thống Nhất

- ✅ Logo + Menu items trên tất cả trang
- ✅ Icons FontAwesome 6.4.0
- ✅ Google Fonts Inter
- ✅ Highlight trang hiện tại (.active)

### 2. Hiển thị Trạng Thái Đăng Nhập

- ✅ Ẩn/hiện menu dựa vào token
- ✅ Hiển thị tên người dùng
- ✅ Link "Quản Trị" cho Admin
- ✅ Nút "Đăng Xuất"

### 3. Liên Kết Giữa Các Trang

- ✅ Tất cả link dùng relative path (index.html thay vì /)
- ✅ Truyền tham số qua query string (?tripId=123)
- ✅ Nút "Quay lại" trên mọi trang
- ✅ Nút "Về Trang Chủ" sau khi hoàn tất

### 4. Breadcrumb Steps

- ✅ Hiển thị bước hiện tại: "Chọn ghế → Thanh toán → Nhận vé"
- ✅ Visual feedback cho user

---

## 🚀 Hướng Dẫn Chạy & Test

### Khởi động hệ thống:

```bash
cd backend
npm run dev
```

### Test luồng đầy đủ:

1. **Mở trình duyệt**: http://localhost:3000/index.html

2. **Tìm chuyến xe**:

   - Chọn điểm đi: TP.HCM
   - Chọn điểm đến: Đà Lạt
   - Chọn ngày: hôm nay
   - Click "Tìm Chuyến"

3. **Đặt vé**:

   - Click "Xem sơ đồ ghế" trên chuyến bất kỳ
   - Chọn điểm đón và điểm trả
   - Click chọn ghế (vd: A01, A02)
   - Nhập thông tin khách hàng
   - Click "Đặt Vé"

4. **Thanh toán**:

   - Xem QR code (giả lập)
   - Click "Xác Nhận Đã Thanh Toán"

5. **Xem vé**:

   - Xem thông tin vé
   - Click "Tải Vé PDF"
   - File PDF được tải về thư mục `backend/generated_tickets/`

6. **Test Admin**:
   - Đăng xuất (nếu đã login)
   - Vào http://localhost:3000/login.html
   - Email: `admin@bla.vn`
   - Password: `lhh123`
   - Tự động redirect đến admin-trips.html
   - Thêm/Sửa/Xóa chuyến xe

---

## 📝 Ghi Chú Kỹ Thuật

### Xử Lý Ghế Theo Chặng

- Ghế có thể đặt nhiều lần cho các chặng không chồng lấp
- Ví dụ: Ghế A01 từ TP.HCM → Phan Thiết (điểm 1→2) và từ Phan Thiết → Đà Lạt (điểm 2→4) OK
- SP `sp_LockSeats` dùng SERIALIZABLE để tránh race condition

### Thời Gian Khóa Ghế

- Status PENDING timeout sau 15 phút
- Có thể thêm cron job để tự động hủy booking quá hạn

### QR Code

- **QR Thanh toán**: Dùng thư viện `qrcode` tạo base64
- **QR Vé**: Nhúng vào PDF bằng `pdfkit`

### PDF Generation

- File lưu tại: `backend/generated_tickets/VE-{bookingId}.pdf`
- Chứa: Thông tin vé + Mã QR + Điều khoản

---

## ✅ Checklist Hoàn Thành

- [x] Navigation bar thống nhất trên tất cả trang
- [x] Hiển thị trạng thái đăng nhập động
- [x] Liên kết tất cả các trang với nhau
- [x] Luồng đặt vé: index → seat-map → checkout → ticket
- [x] Luồng admin: login → admin-trips
- [x] Đăng ký/Đăng nhập/Đăng xuất
- [x] Truyền tham số giữa các trang (query string)
- [x] Xử lý lỗi và redirect
- [x] File `auth-nav.js` xử lý authentication UI
- [x] Cập nhật tất cả redirect paths (bỏ "/", dùng "index.html")

---

**🎉 Hệ thống đã được liên kết hoàn chỉnh!**
