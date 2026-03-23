# 🚌 HƯỚNG DẪN SỬ DỤNG TRANG QUẢN LÝ CHUYẾN XE

## 📋 Tổng quan

Trang quản lý chuyến xe cho phép Admin thực hiện đầy đủ các thao tác CRUD (Create, Read, Update, Delete) trên dữ liệu chuyến xe trong SQL Server Management Studio.

## 🔐 Đăng nhập Admin

### Tài khoản Admin mặc định:

```
Email: admin@busticket.vn
Password: Admin@123
```

### Cách đăng nhập:

1. Mở trình duyệt và truy cập: `http://localhost:3000/login.html`
2. Nhập email và password
3. Nhấn "Đăng nhập"
4. Sau khi đăng nhập thành công, truy cập: `http://localhost:3000/admin-trips.html`

## ✨ Các chức năng

### 1. 📊 XEM DANH SÁCH CHUYẾN XE

- Tự động load tất cả chuyến xe từ database
- Hiển thị đầy đủ thông tin:
  - ID chuyến xe
  - Tuyến đường (điểm đi → điểm đến)
  - Nhà xe
  - Loại xe (số chỗ)
  - Ngày và giờ khởi hành
  - Giá vé
  - Trạng thái (Hoạt động/Tạm ngưng)

### 2. 🔍 TÌM KIẾM

- Thanh tìm kiếm realtime
- Tìm theo:
  - Tên tuyến đường
  - Nhà xe
  - Điểm đi
  - Điểm đến

### 3. ➕ THÊM CHUYẾN XE MỚI

**Bước thực hiện:**

1. Nhấn nút "➕ Thêm Chuyến Xe"
2. Điền thông tin:
   - **Tuyến đường:** Chọn từ danh sách có sẵn
   - **Nhà xe:** Chọn nhà xe vận hành
   - **Loại xe:** Chọn loại xe (số chỗ tự động)
   - **Ngày khởi hành:** Chọn ngày (không được chọn ngày quá khứ)
   - **Giờ khởi hành:** VD: 07:00
   - **Giờ đến:** VD: 14:00
   - **Giá vé:** Nhập giá bằng VNĐ (VD: 280000)
   - **Trạng thái:** Hoạt động hoặc Tạm ngưng
3. Nhấn "Lưu"

**Kết quả:**

- ✅ Chuyến xe được tạo trong bảng `ChuyenXe`
- ✅ Tự động tạo 20 ghế ngồi (A01-D05) trong bảng `GheNgoi`
- ✅ Thông báo thành công
- ✅ Danh sách tự động refresh

**Kiểm tra trong SSMS:**

```sql
-- Xem chuyến xe vừa tạo
SELECT TOP 1 * FROM ChuyenXe ORDER BY MaChuyenXe DESC;

-- Xem ghế ngồi được tạo
SELECT * FROM GheNgoi WHERE MaChuyenXe = (SELECT MAX(MaChuyenXe) FROM ChuyenXe);
```

### 4. ✏️ SỬA CHUYẾN XE

**Bước thực hiện:**

1. Tìm chuyến xe cần sửa trong danh sách
2. Nhấn nút "✏️ Sửa"
3. Form sẽ tự động điền thông tin hiện tại
4. Chỉnh sửa các trường cần thiết
5. Nhấn "Lưu"

**Kết quả:**

- ✅ Dữ liệu được cập nhật trong bảng `ChuyenXe`
- ✅ Cột `NgayCapNhat` tự động cập nhật thành thời gian hiện tại
- ✅ Thông báo thành công

**Kiểm tra trong SSMS:**

```sql
-- Xem thông tin chuyến xe đã sửa
SELECT * FROM ChuyenXe WHERE MaChuyenXe = <ID_vua_sua>;
```

### 5. 🗑️ XÓA CHUYẾN XE

**Bước thực hiện:**

1. Tìm chuyến xe cần xóa
2. Nhấn nút "🗑️ Xóa"
3. Xác nhận xóa trong popup

**Lưu ý:**

- ⚠️ **KHÔNG THỂ XÓA** chuyến xe đã có booking (trạng thái PENDING hoặc PAID)
- ✅ Chỉ xóa được chuyến xe chưa có ai đặt

**Kết quả khi xóa thành công:**

- ✅ Xóa tất cả ghế ngồi trong bảng `GheNgoi`
- ✅ Xóa chuyến xe trong bảng `ChuyenXe`
- ✅ Thông báo thành công

**Kiểm tra trong SSMS:**

```sql
-- Kiểm tra chuyến xe đã bị xóa
SELECT * FROM ChuyenXe WHERE MaChuyenXe = <ID_vua_xoa>;
-- Kết quả: 0 rows (đã xóa thành công)

-- Kiểm tra ghế ngồi cũng đã xóa
SELECT * FROM GheNgoi WHERE MaChuyenXe = <ID_vua_xoa>;
-- Kết quả: 0 rows (đã xóa thành công)
```

## 🔒 Bảo mật

- ✅ Chỉ Admin mới truy cập được trang này
- ✅ Sử dụng JWT Token để xác thực
- ✅ Token được kiểm tra với mỗi API request
- ✅ Tự động redirect về trang login nếu chưa đăng nhập hoặc không phải admin

## 📱 API Endpoints

### Admin Trip Management APIs:

```
GET    /api/v1/admin/trips          - Lấy tất cả chuyến xe
POST   /api/v1/admin/trips          - Tạo chuyến xe mới
PUT    /api/v1/admin/trips/:id      - Cập nhật chuyến xe
DELETE /api/v1/admin/trips/:id      - Xóa chuyến xe

GET    /api/v1/admin/routes         - Lấy danh sách tuyến đường
GET    /api/v1/admin/companies      - Lấy danh sách nhà xe
GET    /api/v1/admin/bus-types      - Lấy danh sách loại xe
```

**Headers required:**

```
Authorization: Bearer <JWT_TOKEN>
Content-Type: application/json
```

## 🧪 Test các chức năng

### Test 1: Thêm chuyến xe mới

```
1. Đăng nhập admin
2. Truy cập http://localhost:3000/admin-trips.html
3. Nhấn "Thêm Chuyến Xe"
4. Điền thông tin:
   - Tuyến: TP.HCM - Đà Lạt
   - Nhà xe: Phương Trang
   - Loại xe: Limousine 24 chỗ
   - Ngày: Ngày mai
   - Giờ KH: 08:00
   - Giờ đến: 15:00
   - Giá: 300000
   - Trạng thái: Hoạt động
5. Nhấn "Lưu"
6. Kiểm tra SSMS: SELECT * FROM ChuyenXe ORDER BY MaChuyenXe DESC
```

### Test 2: Sửa chuyến xe

```
1. Chọn 1 chuyến xe trong danh sách
2. Nhấn "Sửa"
3. Thay đổi giá vé: 350000
4. Thay đổi trạng thái: Tạm ngưng
5. Nhấn "Lưu"
6. Kiểm tra SSMS: SELECT GiaVe, HoatDong FROM ChuyenXe WHERE MaChuyenXe = <ID>
```

### Test 3: Xóa chuyến xe

```
1. Chọn 1 chuyến xe CHƯA có booking
2. Nhấn "Xóa"
3. Xác nhận xóa
4. Kiểm tra SSMS: SELECT * FROM ChuyenXe WHERE MaChuyenXe = <ID>
   → Kết quả: 0 rows
```

### Test 4: Tìm kiếm

```
1. Nhập "Đà Lạt" vào ô tìm kiếm
2. Danh sách hiển thị chỉ các chuyến đến Đà Lạt
3. Xóa từ khóa → Hiển thị lại tất cả
```

## 📊 Kiểm tra Database trong SSMS

### Xem tất cả chuyến xe với đầy đủ thông tin:

```sql
SELECT
    cx.MaChuyenXe,
    td.TenTuyen,
    nx.TenNhaXe,
    lx.TenLoaiXe,
    cx.NgayKhoiHanh,
    cx.GioKhoiHanh,
    cx.GiaVe,
    cx.HoatDong,
    cx.NgayTao,
    cx.NgayCapNhat,
    (SELECT COUNT(*) FROM GheNgoi WHERE MaChuyenXe = cx.MaChuyenXe) as SoGhe
FROM ChuyenXe cx
INNER JOIN TuyenDuong td ON cx.MaTuyen = td.MaTuyen
INNER JOIN NhaXe nx ON cx.MaNhaXe = nx.MaNhaXe
INNER JOIN LoaiXe lx ON cx.MaLoaiXe = lx.MaLoaiXe
ORDER BY cx.NgayKhoiHanh DESC, cx.GioKhoiHanh ASC;
```

### Kiểm tra chuyến xe mới nhất:

```sql
SELECT TOP 1 * FROM ChuyenXe ORDER BY MaChuyenXe DESC;
```

### Kiểm tra ghế ngồi của chuyến xe:

```sql
SELECT * FROM GheNgoi WHERE MaChuyenXe = <ID_chuyen_xe>;
```

### Kiểm tra chuyến xe có booking không (trước khi xóa):

```sql
SELECT
    cx.MaChuyenXe,
    cx.NgayKhoiHanh,
    COUNT(dv.MaDatVe) as SoBooking
FROM ChuyenXe cx
LEFT JOIN DatVe dv ON cx.MaChuyenXe = dv.MaChuyenXe
    AND dv.TrangThai IN ('PENDING', 'PAID')
WHERE cx.MaChuyenXe = <ID_chuyen_xe>
GROUP BY cx.MaChuyenXe, cx.NgayKhoiHanh;
```

## ⚠️ Lưu ý quan trọng

1. **Không thể xóa chuyến đã có booking:** Hệ thống sẽ từ chối xóa chuyến xe đã có người đặt
2. **Tự động tạo ghế:** Khi tạo chuyến mới, 20 ghế ngồi (A01-D05) được tạo tự động
3. **Ngày khởi hành:** Không thể chọn ngày trong quá khứ
4. **Giá vé:** Nhập số nguyên, không có dấu phẩy (VD: 280000 thay vì 280,000)
5. **Token hết hạn:** Sau 7 ngày cần đăng nhập lại

## 🐛 Troubleshooting

### Lỗi: "Chưa đăng nhập"

- **Nguyên nhân:** Token hết hạn hoặc không có token
- **Giải pháp:** Đăng nhập lại tại `/login.html`

### Lỗi: "Bạn không có quyền"

- **Nguyên nhân:** Tài khoản không phải Admin
- **Giải pháp:** Đăng nhập bằng tài khoản admin

### Lỗi: "Không thể xóa chuyến xe đã có booking"

- **Nguyên nhân:** Chuyến xe có booking đang chờ hoặc đã thanh toán
- **Giải pháp:** Chỉ xóa được chuyến xe chưa có booking

### Không load được dữ liệu

- **Kiểm tra:** Server đã chạy chưa (`npm run dev`)
- **Kiểm tra:** Database có dữ liệu chưa
- **Kiểm tra:** Console browser có lỗi gì không (F12)

## 🎯 Kết luận

Trang quản lý chuyến xe cung cấp giao diện trực quan để Admin quản lý toàn bộ chuyến xe với đầy đủ chức năng CRUD. Mọi thao tác đều được đồng bộ realtime với SQL Server Management Studio 20.

**Chúc bạn sử dụng hiệu quả! 🚀**
