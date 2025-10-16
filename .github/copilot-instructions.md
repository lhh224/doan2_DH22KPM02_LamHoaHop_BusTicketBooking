# Repository Instructions for Bus Ticket Booking System (Đồ án tốt nghiệp chạy local)

## 1. Mục đích

Hướng dẫn cho GitHub Copilot về ngữ cảnh dự án **đặt vé xe khách trực tuyến** để Copilot sinh code, API, comment, và test case phù hợp với đồ án tốt nghiệp **chạy local** (HTML/CSS/JS + Node.js + SQL Server).

---

## 2. Ngôn ngữ & Phong cách phản hồi

- Luôn **trả lời và sinh code bằng tiếng Việt**.
- Mọi đoạn code phải có **comment tiếng Việt rõ ràng** giải thích mục đích, tham số, và luồng xử lý.
- Khi gợi ý HTML/CSS, ưu tiên **giao diện sáng, dễ nhìn, phù hợp trình chiếu đồ án**.
- Khi sinh API hoặc stored procedure, luôn **mô tả input/output bằng tiếng Việt**.

---

## 3. Tổng quan dự án

### Mô tả

- Hệ thống **đặt vé xe khách trực tuyến** tương tự Vexere.com, chạy demo local.
- Gồm 3 đối tượng sử dụng:
  1. **Khách vãng lai (Guest):** tìm tuyến, xem chuyến, xem ghế.
  2. **Khách hàng (Customer):** đặt ghế, thanh toán qua QR giả lập, tải vé PDF.
  3. **Nhà xe/Admin:** quản lý tuyến, chuyến, ghế, xác nhận thanh toán, phát hành vé PDF.

### Tính năng chính

- Tìm kiếm chuyến theo tuyến, ngày, loại xe.
- Quản lý ghế theo **chặng giữa**.
- Đặt vé và **khóa ghế tạm thời** qua stored procedure `sp_LockSeats`.
- Xác nhận thanh toán qua stored procedure `sp_ConfirmPayment`.
- Sinh **QR thanh toán giả lập** bằng thư viện `qrcode`.
- Xuất **vé PDF có mã QR vé** bằng `pdfkit`.

---

## 4. Công nghệ

| Thành phần      | Công nghệ                             |
| --------------- | ------------------------------------- |
| Frontend        | HTML, CSS, JavaScript thuần           |
| Backend         | Node.js (Express)                     |
| Cơ sở dữ liệu   | SQL Server (sử dụng thư viện `mssql`) |
| PDF & QR        | `pdfkit`, `qrcode`                    |
| Giao tiếp       | RESTful API                           |
| Chạy môi trường | Local, không cần deploy hay CI/CD     |

---

## 5. Quy tắc code

- Viết backend theo mẫu **route → controller → service → database**.
- Đảm bảo các API RESTful, có cấu trúc response:
  ```json
  { "success": true, "data": { ... } }
  ```

## 6. Cấu trúc thư mục chuẩn

bus-ticket-booking/
├─ frontend/
│ ├─ index.html
│ ├─ search.html
│ ├─ seat-map.html
│ ├─ checkout.html
│ ├─ ticket.html
│ ├─ admin.html
│ └─ assets/
│ ├─ css/
│ ├─ js/
│ └─ img/
│
└─ backend/
├─ server.js
├─ config/
│ ├─ env.js
│ └─ db.js
├─ routes/
├─ controllers/
├─ services/
│ ├─ seat.service.js # gọi sp_LockSeats
│ ├─ booking.service.js # gọi sp_ConfirmPayment
│ ├─ payment.service.js # tạo QR giả lập
│ └─ ticket.service.js # sinh vé PDF
├─ db/
│ ├─ schema.sql
│ ├─ seed.sql
│ ├─ sp_LockSeats.sql
│ └─ sp_ConfirmPayment.sql
├─ libs/
│ ├─ pdf.js
│ └─ qr.js
├─ utils/response.js
└─ generated_tickets/
