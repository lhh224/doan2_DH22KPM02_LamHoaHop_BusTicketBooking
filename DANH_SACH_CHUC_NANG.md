# BẢNG PHÂN RÃ CHỨC NĂNG HỆ THỐNG ĐẶT VÉ XE KHÁCH TRỰC TUYẾN

## Bảng Danh Sách Chức Năng

| STT | F0 (Đối tượng) | F1 (Nhóm chức năng)  | F2 (Chức năng chi tiết)           |
| --- | -------------- | -------------------- | --------------------------------- |
| 1   |                |                      | Tìm chuyến xe theo tuyến          |
| 2   |                | Tìm kiếm chuyến xe   | Tìm chuyến xe theo ngày khởi hành |
| 3   |                |                      | Tìm chuyến xe theo loại xe        |
| 4   |                |                      | Xem danh sách chuyến xe           |
| 5   | Khách vãng lai |                      | Xem chi tiết chuyến xe            |
| 6   | (Guest)        | Xem thông tin chuyến | Xem thông tin nhà xe              |
| 7   |                |                      | Xem giá vé                        |
| 8   |                |                      | Xem sơ đồ ghế                     |
| 9   |                | Xem sơ đồ ghế        | Xem trạng thái ghế (trống/đã đặt) |
| 10  |                |                      | Xem ghế theo chặng                |
| 11  |                |                      | Xem định vị chuyến xe đang chạy   |
| 12  |                | Theo dõi hành trình  | Xem tiến độ chuyến xe             |
| 13  |                |                      | Xem vị trí điểm dừng trên bản đồ  |
| 14  |                | Hỗ trợ trực tuyến    | Chat với trợ lý AI                |
| 15  |                |                      | Đăng ký tài khoản mới             |
| 16  |                | Quản lý tài khoản    | Đăng nhập hệ thống                |
| 17  |                |                      | Đăng xuất hệ thống                |
| 18  |                |                      | Xem thông tin cá nhân             |
| 19  |                |                      | Cập nhật thông tin cá nhân        |
| 20  |                |                      | Chọn ghế trên sơ đồ               |
| 21  |                | Đặt vé               | Khóa ghế tạm thời                 |
| 22  |                |                      | Nhập thông tin hành khách         |
| 23  |                |                      | Xác nhận đặt vé                   |
| 24  | Khách hàng     |                      | Hủy đặt vé                        |
| 25  | (Customer)     |                      | Tạo mã QR thanh toán              |
| 26  |                | Thanh toán           | Xác nhận thanh toán               |
| 27  |                |                      | Xem trạng thái thanh toán         |
| 28  |                |                      | Xem vé đã đặt                     |
| 29  |                | Quản lý vé           | Tải vé PDF                        |
| 30  |                |                      | Xem mã QR vé                      |
| 31  |                | Lịch sử đặt vé       | Xem lịch sử đặt vé                |
| 32  |                |                      | Xem chi tiết booking              |
| 33  |                |                      | Thêm tuyến xe mới                 |
| 34  |                | Quản lý tuyến xe     | Sửa thông tin tuyến xe            |
| 35  |                |                      | Xóa tuyến xe                      |
| 36  |                |                      | Xem danh sách tuyến xe            |
| 37  |                |                      | Thêm điểm dừng mới                |
| 38  |                | Quản lý điểm dừng    | Sửa thông tin điểm dừng           |
| 39  |                |                      | Xóa điểm dừng                     |
| 40  |                |                      | Xem danh sách điểm dừng           |
| 41  |                |                      | Thêm chuyến xe mới                |
| 42  |                | Quản lý chuyến xe    | Sửa thông tin chuyến xe           |
| 43  | Admin/         |                      | Xóa chuyến xe                     |
| 44  | Nhà xe         |                      | Xem danh sách chuyến xe           |
| 45  |                |                      | Lọc chuyến theo trạng thái        |
| 46  |                |                      | Thêm nhà xe mới                   |
| 47  |                | Quản lý nhà xe       | Sửa thông tin nhà xe              |
| 48  |                |                      | Xóa nhà xe                        |
| 49  |                |                      | Xem danh sách nhà xe              |
| 50  |                |                      | Xem danh sách đặt vé              |
| 51  |                | Quản lý đặt vé       | Xác nhận thanh toán khách hàng    |
| 52  |                |                      | Phát hành vé PDF                  |
| 53  |                |                      | Xem chi tiết đặt vé               |
| 54  |                | Quản lý ghế          | Xem sơ đồ ghế chuyến xe           |
| 55  |                |                      | Quản lý trạng thái ghế            |
| 56  |                |                      | Xem số liệu tổng quát             |
| 57  |                | Dashboard & Thống kê | Thống kê doanh thu theo thời gian |
| 58  |                |                      | Thống kê theo nhà xe/tuyến đường  |
| 59  |                |                      | Phân tích phương thức thanh toán  |
| 60  |                | Quản lý đánh giá     | Xem danh sách đánh giá            |
| 61  |                |                      | Duyệt/ẩn hiển thị đánh giá        |
| 62  |                | Nhật ký hệ thống     | Xem nhật ký truy cập (đăng nhập)  |
| 63  |                |                      | Xem nhật ký giao dịch             |
| 64  |                | Quản lý tài khoản    | Xem danh sách tài khoản           |
| 65  |                |                      | Quản lý khóa mở/thêm tài khoản    |

---

## Bảng Tóm Tắt Theo Đối Tượng

### 1. Khách vãng lai (Guest)

| STT | F1                   | F2                                |
| --- | -------------------- | --------------------------------- |
| 1   | Tìm kiếm chuyến xe   | Tìm chuyến xe theo tuyến          |
| 2   |                      | Tìm chuyến xe theo ngày khởi hành |
| 3   |                      | Tìm chuyến xe theo loại xe        |
| 4   |                      | Xem danh sách chuyến xe           |
| 5   | Xem thông tin chuyến | Xem chi tiết chuyến xe            |
| 6   |                      | Xem thông tin nhà xe              |
| 7   |                      | Xem giá vé                        |
| 8   | Xem sơ đồ ghế        | Xem sơ đồ ghế                     |
| 9   |                      | Xem trạng thái ghế (trống/đã đặt) |
| 10  |                      | Xem ghế theo chặng                |
| 11  | Theo dõi hành trình  | Xem định vị chuyến xe đang chạy   |
| 12  |                      | Xem tiến độ chuyến xe             |
| 13  |                      | Xem vị trí điểm dừng trên bản đồ  |
| 14  | Hỗ trợ trực tuyến    | Chat với trợ lý AI                |

### 2. Khách hàng (Customer)

| STT | F1                | F2                         |
| --- | ----------------- | -------------------------- |
| 1   | Quản lý tài khoản | Đăng ký tài khoản mới      |
| 2   |                   | Đăng nhập hệ thống         |
| 3   |                   | Đăng xuất hệ thống         |
| 4   |                   | Xem thông tin cá nhân      |
| 5   |                   | Cập nhật thông tin cá nhân |
| 6   | Đặt vé            | Chọn ghế trên sơ đồ        |
| 7   |                   | Khóa ghế tạm thời          |
| 8   |                   | Nhập thông tin hành khách  |
| 9   |                   | Xác nhận đặt vé            |
| 10  |                   | Hủy đặt vé                 |
| 11  | Thanh toán        | Tạo mã QR thanh toán       |
| 12  |                   | Xác nhận thanh toán        |
| 13  |                   | Xem trạng thái thanh toán  |
| 14  | Quản lý vé        | Xem vé đã đặt              |
| 15  |                   | Tải vé PDF                 |
| 16  |                   | Xem mã QR vé               |
| 17  | Lịch sử đặt vé    | Xem lịch sử đặt vé         |
| 18  |                   | Xem chi tiết booking       |

### 3. Admin / Nhà xe

| STT | F1                     | F2                             |
| --- | ---------------------- | ------------------------------ |
| 1   | Quản lý tuyến xe       | Thêm tuyến xe mới              |
| 2   |                        | Sửa thông tin tuyến xe         |
| 3   |                        | Xóa tuyến xe                   |
| 4   |                        | Xem danh sách tuyến xe         |
| 5   | Quản lý điểm dừng      | Thêm điểm dừng mới             |
| 6   |                        | Sửa thông tin điểm dừng        |
| 7   |                        | Xóa điểm dừng                  |
| 8   |                        | Xem danh sách điểm dừng        |
| 9   | Quản lý chuyến xe      | Thêm chuyến xe mới             |
| 10  |                        | Sửa thông tin chuyến xe        |
| 11  |                        | Xóa chuyến xe                  |
| 12  |                        | Xem danh sách chuyến xe        |
| 13  |                        | Lọc chuyến theo trạng thái     |
| 14  | Quản lý nhà xe         | Thêm nhà xe mới                |
| 15  |                        | Sửa thông tin nhà xe           |
| 16  |                        | Xóa nhà xe                     |
| 17  |                        | Xem danh sách nhà xe           |
| 18  | Quản lý đặt vé         | Xem danh sách đặt vé           |
| 19  |                        | Xác nhận thanh toán khách hàng |
| 20  |                        | Phát hành vé PDF               |
| 21  |                        | Xem chi tiết đặt vé            |
| 22  | Quản lý ghế            | Xem sơ đồ ghế chuyến xe        |
| 23  |                        | Quản lý trạng thái ghế         |
| 24  | Dashboard & Thống kê   | Xem số liệu tổng quát          |
| 25  |                        | Thống kê doanh thu theo thời gian |
| 26  |                        | Thống kê theo nhà xe/tuyến     |
| 27  |                        | Phân tích phương thức thanh toán|
| 28  | Quản lý đánh giá       | Xem danh sách đánh giá         |
| 29  |                        | Duyệt/ẩn hiển thị đánh giá     |
| 30  | Nhật ký hệ thống       | Xem nhật ký truy cập (đăng nhập) |
| 31  |                        | Xem nhật ký giao dịch          |
| 32  | Quản lý tài khoản      | Xem danh sách tài khoản        |
| 33  |                        | Quản lý khóa mở/thêm tài khoản |
