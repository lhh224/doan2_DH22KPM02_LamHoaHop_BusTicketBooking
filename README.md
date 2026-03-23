# He Thong Dat Ve Xe Khach Truc Tuyen

## Tong Quan

Day la du an web dat ve xe khach full-stack chay local, gom frontend tinh gon bang HTML/CSS/JavaScript va backend REST API bang Node.js/Express ket noi SQL Server.

He thong ho tro cac nghiep vu chinh:

- Tim kiem chuyen xe theo tuyen va ngay di
- Chon ghe theo chang
- Tao booking va xac nhan thanh toan QR gia lap
- Theo doi hanh trinh xe theo thoi gian thuc (mo phong)
- Quan ly nguoi dung va dashboard quan tri
- Chatbot ho tro hoi dap

---

## Cong Nghe Su Dung

- Frontend: HTML, CSS, JavaScript thuan
- Backend: Node.js, Express
- Xac thuc: JWT + bcrypt
- Database: SQL Server
- Thu vien chinh: mssql, jsonwebtoken, cors, qrcode, @google/generative-ai

---

## Cau Truc Thu Muc

```text
BusTicketBooking/
├─ frontend/
│  ├─ index.html
│  ├─ login.html
│  ├─ register.html
│  ├─ seat-map.html
│  ├─ checkout.html
│  ├─ ticket.html
│  ├─ trip-tracking.html
│  ├─ admin.html
│  └─ assets/
│     ├─ css/
│     ├─ js/
│     └─ img/
│
├─ backend/
│  ├─ server.js
│  ├─ package.json
│  ├─ config/
│  │  ├─ env.js
│  │  └─ db.js
│  ├─ routes/
│  ├─ controllers/
│  ├─ services/
│  ├─ middleware/
│  ├─ libs/
│  ├─ utils/
│  └─ db/
│     └─ db.sql
│
├─ README.md
└─ HUONG_DAN_QUAN_LY_CHUYEN_XE.md
```

---

## Tinh Nang Theo Vai Tro

### Khach Vang Lai

- Tim kiem chuyen xe
- Xem danh sach tuyen pho bien
- Xem thong tin ghe trong theo chang

### Nguoi Dung Da Dang Nhap

- Dang ky, dang nhap, doi mat khau
- Dat cho, khoa ghe tam thoi, xac nhan thanh toan
- Xem va huy booking theo dieu kien
- Quan ly profile
- Xem thong bao
- Gui va quan ly danh gia

### Quan Tri Vien

- Dashboard thong ke doanh thu, booking, top tuyen
- Quan ly nha xe, tuyen duong, diem dung, chuyen xe
- Quan ly nguoi dung va danh gia
- Xem log giao dich va log dang nhap
- Tao tai khoan nhan vien

---

## Cai Dat Nhanh

### 1. Yeu Cau Moi Truong

- Node.js 18+
- SQL Server (Express/Developer)
- SQL Server Management Studio (SSMS)

### 2. Khoi Tao Database

1. Mo SSMS va ket noi SQL Server.
2. Chay file sau:

```text
backend/db/db.sql
```

### 3. Cai Dat Backend

Di chuyen vao thu muc backend va cai dependencies:

```bash
cd backend
npm install
```

Tao file .env trong thu muc backend:

```env
PORT=3000
SQL_SERVER=localhost
SQL_DATABASE=BusBookingDemo
SQL_USER=sa
SQL_PASSWORD=YourStrong!Passw0rd
SQL_ENCRYPT=false
SQL_TRUST_SERVER_CERTIFICATE=true
GEMINI_API_KEY=
GEMINI_MODEL=gemini-1.5-flash
```

Chay server:

```bash
npm run dev
```

Server mac dinh:

```text
http://localhost:3000
```

### 4. Truy Cap Frontend

Backend dang phuc vu static frontend, ban co the vao truc tiep:

- http://localhost:3000/
- http://localhost:3000/login
- http://localhost:3000/register
- http://localhost:3000/seat-map
- http://localhost:3000/checkout
- http://localhost:3000/ticket
- http://localhost:3000/trip-tracking
- http://localhost:3000/admin

---

## Bien Moi Truong

| Bien                         | Bat buoc | Mo ta                                   |
| ---------------------------- | -------- | --------------------------------------- |
| PORT                         | Khong    | Port chay backend, mac dinh 3000        |
| SQL_SERVER                   | Co       | Host SQL Server                         |
| SQL_DATABASE                 | Co       | Ten database                            |
| SQL_USER                     | Co       | User SQL                                |
| SQL_PASSWORD                 | Co       | Password SQL                            |
| SQL_ENCRYPT                  | Khong    | Bat ma hoa ket noi SQL (true/false)     |
| SQL_TRUST_SERVER_CERTIFICATE | Khong    | Cho phep tin chung chi self-signed      |
| GEMINI_API_KEY               | Khong    | API key cho chatbot                     |
| GEMINI_MODEL                 | Khong    | Model Gemini, mac dinh gemini-1.5-flash |

---

## API Endpoints Chi Tiet

Base URL:

```text
http://localhost:3000/api/v1
```

### Auth

- POST /auth/register
- POST /auth/login
- POST /auth/logout (can token)
- GET /auth/me (can token)
- PUT /auth/change-password (can token)

### Users (can token)

- GET /users/bookings
- GET /users/bookings/:id
- POST /users/bookings/:id/cancel
- PUT /users/profile
- GET /users/notifications
- PUT /users/notifications/:id/read
- GET /users/reviews
- POST /users/reviews

### Trips

- GET /trips/cities
- GET /trips/routes
- GET /trips/active
- GET /trips/search?from=...&to=...&date=...
- GET /trips/:tripId

### Seats

- GET /seats?tripId=...&fromStopOrder=...&toStopOrder=...

### Seat Templates

- GET /seat-templates
- GET /seat-templates/by-bus-type/:busType
- GET /seat-templates/:templateId

### Bookings

- POST /bookings/lock
- POST /bookings/confirm
- GET /bookings/latest/:userId
- GET /bookings/phone/:phone
- GET /bookings/:bookingId
- POST /bookings/:bookingId/cancel

### Payments

- POST /payments/qr

### Tracking

- GET /tracking/trip/:tripId
- GET /tracking/trip/:tripId/stops
- GET /tracking/trip/:tripId/position
- GET /tracking/routes
- GET /tracking/trips/active

### Chat

- POST /chat/ask

### Admin (can token va quyen staff/admin)

Staff tro len:

- GET /admin/bookings
- PUT /admin/bookings/:id/status
- POST /admin/bookings/manual

Admin:

- GET /admin/dashboard/stats
- GET /admin/dashboard/revenue-chart
- GET /admin/dashboard/top-routes
- GET /admin/dashboard/upcoming-trips
- GET /admin/dashboard/fill-rate
- GET /admin/dashboard/revenue-payments
- GET /admin/dashboard/paid-bookings
- CRUD nha xe: /admin/companies
- CRUD tuyen: /admin/routes
- CRUD diem dung: /admin/stops
- CRUD chuyen xe: /admin/trips
- GET /admin/bus-types
- GET /admin/users
- PUT /admin/users/:id/status
- GET /admin/reviews
- PUT /admin/reviews/:id/status
- GET /admin/stats/revenue-by-time
- GET /admin/stats/revenue-by-company
- GET /admin/stats/revenue-by-route
- GET /admin/stats/payment-methods
- POST /admin/accounts/create-staff
- PUT /admin/accounts/:id/toggle-lock
- GET /admin/logs/transactions
- GET /admin/logs/logins

---

## Kiem Tra Nhanh

### Kiem tra server

```bash
curl http://localhost:3000/health
```

### Kiem tra tim chuyen

```bash
curl "http://localhost:3000/api/v1/trips/search?from=Ho%20Chi%20Minh&to=Da%20Lat&date=2026-03-24"
```

### Kiem tra database

```sql
USE BusBookingDemo;
SELECT COUNT(*) AS TotalTrips FROM Trips;
SELECT COUNT(*) AS TotalBookings FROM Bookings;
SELECT COUNT(*) AS TotalUsers FROM Users;
```

---

## Luong Nghiep Vu De Xuat

1. Dang ky hoac dang nhap.
2. Tim chuyen tren trang chu.
3. Chon chuyen va chon ghe theo chang.
4. Tao booking lock ghe.
5. Tao QR thanh toan va xac nhan.
6. Xem trang ticket.
7. Theo doi chuyen o trang tracking.

---

## Troubleshooting

### Khong ket noi duoc SQL Server

- Kiem tra SQL Server service dang chay
- Kiem tra host, user, password trong .env
- Kiem tra port SQL (thuong la 1433)
- Thu ket noi bang SSMS truoc

### Loi CORS khi mo file frontend truc tiep

- Nen truy cap qua http://localhost:3000 thay vi mo file html truc tiep
- Dam bao backend dang chay

### Loi 401 hoac 403 o API bao mat

- Kiem tra Authorization header dang dung Bearer token
- Kiem tra token con han
- Kiem tra role nguoi dung (admin/staff)

### Chatbot khong phan hoi

- Kiem tra GEMINI_API_KEY trong .env
- Kiem tra ket noi internet
- Kiem tra log backend de xem loi tra ve tu model

---

## Thong Tin Du An

- Loai: Do an tot nghiep
- Linh vuc: Dat ve xe khach truc tuyen
- Nam: 2025
- Nhom cong nghe: Node.js, Express, SQL Server, HTML, CSS, JavaScript
