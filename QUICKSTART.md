# 🚀 HƯỚNG DẪN NHANH - SETUP AUTHENTICATION

## ⚡ QUICK START (3 bước)

### Bước 1: Chạy Database Schema

1. Mở **SQL Server Management Studio (SSMS)**
2. Kết nối đến SQL Server
3. Mở file: `backend/db/schema_v2_simple.sql`
4. Chọn database `BusTicketBooking`
5. Nhấn **Execute** (F5)

✅ Kết quả: 6 bảng mới được tạo + 2 tài khoản mẫu + 3 mã giảm giá

### Bước 2: Cài Dependencies

```bash
cd backend
npm install
```

Đã có sẵn: bcrypt, jsonwebtoken

### Bước 3: Khởi động Server

```bash
npm run dev
```

## 🎯 KIỂM TRA

### 1. Verify Database

```sql
USE BusTicketBooking;

-- Kiểm tra bảng mới
SELECT name FROM sys.tables
WHERE name IN ('NguoiDung', 'PhienDangNhap', 'MaGiamGia', 'DanhGia', 'ThongBao', 'LichSuGiaoDich');

-- Kiểm tra tài khoản
SELECT * FROM NguoiDung;

-- Kiểm tra mã giảm giá
SELECT * FROM MaGiamGia;
```

### 2. Test Login Frontend

- Mở: http://localhost:3000/login
- Email: `admin@busticket.vn`
- Password: `Admin@123`

### 3. Test API

```bash
# Đăng nhập
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"admin@busticket.vn\",\"password\":\"Admin@123\"}"
```

## 🔐 TÀI KHOẢN MẪU

| Email              | Password  | Role     |
| ------------------ | --------- | -------- |
| admin@busticket.vn | Admin@123 | ADMIN    |
| customer@test.com  | Admin@123 | CUSTOMER |

## 📊 TÍNH NĂNG MỚI

✅ **Authentication:**

- `/login` - Trang đăng nhập
- `/register` - Trang đăng ký
- API: `/api/v1/auth/*`

✅ **User Dashboard:**

- Lịch sử đặt vé
- Quản lý profile
- Đánh giá chuyến đi
- API: `/api/v1/users/*`

✅ **Admin Dashboard:**

- Thống kê doanh thu
- Quản lý users
- Quản lý bookings
- Duyệt đánh giá
- API: `/api/v1/admin/*`

## ❓ TROUBLESHOOTING

**Q: Lỗi "Invalid object name 'NguoiDung'"**
A: Chưa chạy schema_v2_simple.sql. Mở SSMS và execute file.

**Q: Lỗi "Login failed"**
A: Password mặc định là `Admin@123` (có chữ A và @ viết hoa)

**Q: Frontend không hiện login button**
A: Thêm link vào navigation trong index.html

## 🎉 HOÀN TẤT!

Sau khi setup xong:

- ✅ Đăng nhập/đăng ký hoạt động
- ✅ User có thể xem lịch sử booking
- ✅ Admin có thể truy cập dashboard
- ✅ Reviews & ratings hoạt động
- ✅ Notifications hoạt động

**Dự án sẵn sàng demo! 🚀**
