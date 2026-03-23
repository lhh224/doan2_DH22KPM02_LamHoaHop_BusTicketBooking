/**
 * File: chat.service.js
 * Mục đích: Xử lý chatbot AI sử dụng Google Gemini API
 * Nâng cấp: Hỗ trợ lịch sử hội thoại, ngữ cảnh chi tiết, phản hồi markdown
 */

const { GoogleGenerativeAI } = require("@google/generative-ai");
const config = require("../config/env");

// Khởi tạo Gemini AI
const genAI = new GoogleGenerativeAI(config.GEMINI_API_KEY);

// ============================================================
//  CÂU HỎI THƯỜNG GẶP (FAQ) - TRẢ LỜI NHANH KHÔNG CẦN AI
//  Mở rộng toàn bộ các trường hợp có thể hỏi về hệ thống
// ============================================================
const FAQ_DATABASE = {
  // ===== CHÀO HỎI & GIAO TIẾP CƠ BẢN =====
  "xin chào|chào bạn|chào|hi|hello|hey|alo": {
    priority: 10,
    answers: [
      "Xin chào! Tôi là trợ lý AI của BusTicket. Hôm nay bạn cần hỗ trợ gì?\n\n Bạn có thể hỏi tôi về:\n- Cách đặt vé xe\n- Theo dõi hành trình\n- Thanh toán\n- Các tuyến xe phổ biến\n- Hủy vé & hoàn tiền",
    ],
  },

  "cảm ơn|cám ơn|thanks|thank you|tks": {
    priority: 10,
    answers: [
      "Không có gì nè! Rất vui được hỗ trợ bạn. Nếu còn thắc mắc gì, cứ hỏi tôi nhé!",
    ],
  },

  "tạm biệt|bye|goodbye|bái bai": {
    priority: 10,
    answers: ["Tạm biệt bạn! Chúc bạn một ngày tốt lành. Hẹn gặp lại!"],
  },

  "bạn là ai|tên gì|bạn tên gì|who are you": {
    priority: 10,
    answers: [
      "Tôi là Trợ lý AI BusTicket!\n\nTôi được tạo ra để hỗ trợ bạn 24/7 về:\n• Tìm kiếm và đặt vé xe khách\n• Theo dõi hành trình trực tiếp trên bản đồ\n• Hướng dẫn thanh toán QR\n• Hủy vé, hoàn tiền\n• Tư vấn tuyến xe, giá vé, loại xe\n\nBạn cần tôi giúp gì hôm nay?",
    ],
  },

  "khỏe không|khoẻ không|bạn có khỏe không": {
    priority: 10,
    answers: [
      "Tôi là AI nên lúc nào cũng tràn đầy năng lượng 100% pin! Còn bạn hôm nay thế nào? Có dự định đi chơi đâu không? Tôi tìm vé giúp nha!",
    ],
  },

  // ===== ĐẶT VÉ =====
  "đặt vé|hướng dẫn đặt vé|cách đặt vé|book vé|mua vé|làm sao đặt vé|đặt vé chi tiết|hướng dẫn đặt vé chi tiết": {
    priority: 9,
    answers: [
      "HƯỚNG DẪN ĐẶT VÉ CHI TIẾT:\n\nBước 1: Vào Trang chủ\n→ Nhập điểm đi, điểm đến, ngày khởi hành\n→ Nhấn \"Tìm chuyến\"\n\nBước 2: Chọn chuyến xe phù hợp\n→ So sánh giá, giờ, loại xe, nhà xe\n\nBước 3: Chọn ghế trên sơ đồ\n→ Xanh = còn trống\n→ Đỏ = đã đặt\n→ Xám = đang giữ tạm\n\nBước 4: Điền thông tin hành khách\n→ Họ tên, Số điện thoại, Email\n\nBước 5: Thanh toán qua mã QR\n→ Mở app ngân hàng → Quét QR → Chuyển khoản\n\nBước 6: Nhận vé điện tử\n→ Xem thông tin vé ngay trên website hoặc email thông báo.\n\nLưu ý: Ghế được khóa tạm 10 phút sau khi chọn. Hãy thanh toán nhanh nhé!",
    ],
  },

  // ===== THANH TOÁN =====
  "thanh toán|cách thanh toán|hướng dẫn thanh toán|qr code|quét qr|chuyển khoản|trả tiền|payment": {
    priority: 9,
    answers: [
      "HƯỚNG DẪN THANH TOÁN:\n\n1. Sau khi chọn ghế và điền thông tin → Nhấn \"Đặt vé\"\n2. Hệ thống tạo mã QR thanh toán\n3. Mở ứng dụng ngân hàng (VietcomBank, MoMo, ZaloPay...)\n4. Chọn \"Quét mã QR\" → Quét mã trên màn hình\n5. Kiểm tra số tiền → Xác nhận chuyển khoản\n6. Hệ thống xác nhận tự động → Đặt vé thành công!\n\nThời gian thanh toán: 10 phút kể từ khi chọn ghế\nLưu ý: Nếu quá 10 phút, ghế sẽ được mở khóa cho người khác\n\nMẹo: Chuẩn bị sẵn app ngân hàng trước khi đặt vé!",
    ],
  },

  // ===== HỦY VÉ & HOÀN TIỀN =====
  "hủy vé|huỷ vé|hoàn tiền|chính sách hủy|cancel|refund|đổi vé|chính sách hủy vé và hoàn tiền": {
    priority: 9,
    answers: [
      "CHÍNH SÁCH HỦY VÉ & HOÀN TIỀN:\n\nMiễn phí 100%: Hủy trước giờ khởi hành > 24 tiếng\nLưu ý: Phí 30%: Hủy từ 12 - 24 tiếng trước giờ khởi hành\nLưu ý: Không hoàn tiền: Hủy trong vòng 12 tiếng trước giờ khởi hành\n\nĐổi chuyến: Liên hệ tổng đài trước 6 tiếng\n\nCách hủy vé:\n1. Vào mục \"Vé Của Tôi\"\n2. Chọn vé cần hủy\n3. Nhấn \"Hủy vé\" → Xác nhận\n4. Hoàn tiền qua tài khoản ngân hàng (1-3 ngày làm việc)\n\nHotline hỗ trợ: 1900-xxxx (7:00 - 22:00)",
    ],
  },

  // ===== THEO DÕI HÀNH TRÌNH =====
  "theo dõi|tracking|vị trí xe|xe đang ở đâu|bản đồ|theo dõi hành trình|cách theo dõi hành trình xe|track": {
    priority: 9,
    answers: [
      "THEO DÕI HÀNH TRÌNH TRỰC TIẾP:\n\nCách sử dụng:\n1. Vào menu \"Theo Dõi\" trên thanh điều hướng\n2. Chọn chuyến xe cần theo dõi\n3. Xem trực tiếp trên bản đồ!\n\nThông tin hiển thị:\n• Vị trí xe realtime trên bản đồ\n• Thời gian đến dự kiến (ETA)\n• Khoảng cách còn lại (km)\n• Tốc độ hiện tại\n• Các trạm dừng đã qua và sắp tới\n• Chi tiết hành trình (có thể thu gọn/mở rộng)\n\nMẹo: Tuyến đường được hiển thị theo đường bộ thực tế nhờ công nghệ OSRM!",
    ],
  },

  // ===== LOẠI XE & TIỆN ÍCH =====
  "loại xe|loại xe nào|giường nằm|limousine|ghế ngồi|xe vip|tiện ích|wifi|điều hòa|loại xe và tiện ích trên xe": {
    priority: 8,
    answers: [
      "CÁC LOẠI XE & TIỆN ÍCH:\n\n1. Xe ghế ngồi 45 chỗ:\n• Giá rẻ nhất, phổ thông\n• Phù hợp quãng đường ngắn\n\n2. Xe giường nằm 40 chỗ:\n• Thoải mái, có giường nằm riêng\n• Phù hợp đường dài (qua đêm)\n\n3. Xe Limousine 34 chỗ VIP:\n• Cao cấp nhất, ghế massage\n• Không gian rộng rãi, riêng tư\n\n4. Xe VIP Cabin 22 chỗ:\n• Cabin riêng biệt\n• Tiện nghi như phòng mini\n\nTiện ích chung:\n• WiFi miễn phí\n• Điều hòa 2 chiều\n• Ổ cắm sạc điện\n• Nước uống miễn phí\n• WC trên xe (xe giường nằm)\n\nBạn muốn đặt loại xe nào?",
    ],
  },

  // ===== GHẾ & SƠ ĐỒ GHẾ =====
  "sơ đồ ghế|chọn ghế|ghế trống|ghế nào|cách chọn ghế|ghế còn trống": {
    priority: 8,
    answers: [
      "HƯỚNG DẪN CHỌN GHẾ:\n\nMàu sắc trên sơ đồ ghế:\n• Xanh lá = Ghế còn trống → Click để chọn\n• Đỏ = Ghế đã có người đặt\n• Xám = Đang được giữ tạm (10 phút)\n• Vàng = Ghế bạn đang chọn\n\nMẹo chọn ghế:\n• Ghế gần cửa: Tiện lên xuống\n• Ghế cạnh cửa sổ: Ngắm cảnh\n• Ghế giữa: Ít ồn, êm hơn\n• Tầng trên (giường nằm): Riêng tư hơn\n\nLưu ý: Sau khi chọn, ghế được khóa tạm 10 phút để bạn thanh toán.\n\nBạn muốn tìm chuyến xe nào?",
    ],
  },

  // ===== TUYẾN XE PHỔ BIẾN =====
  "tuyến xe|tuyến đường|đi đâu|route|chuyến xe|tuyến phổ biến|các tuyến xe phổ biến và giá vé": {
    priority: 8,
    answers: [
      "CÁC TUYẾN XE PHỔ BIẾN:\n\nTừ TP.HCM:\n• Đà Lạt: 310km, 7-8h, giá 250-350k\n• Nha Trang: 435km, 8-9h, giá 280-400k\n• Vũng Tàu: 125km, 2-3h, giá 80-120k\n• Cần Thơ: 170km, 3-4h, giá 120-180k\n• Đà Nẵng: 960km, 17-18h, giá 400-600k\n\nTừ Hà Nội:\n• Sa Pa: 320km, 5-6h, giá 200-350k\n• Hải Phòng: 120km, 2-3h, giá 80-120k\n\nLưu ý: Giá thay đổi theo loại xe:\n• Ghế ngồi: rẻ nhất\n• Giường nằm: trung bình\n• Limousine VIP: cao nhất\n\nBạn muốn đi tuyến nào? Tôi giúp tìm chuyến nhé!",
    ],
  },

  // ===== GIÁ VÉ =====
  "giá vé|bao nhiêu tiền|giá bao nhiêu|chi phí|phí vé|giá xe": {
    priority: 8,
    answers: [
      "BẢNG GIÁ VÉ THAM KHẢO (từ TP.HCM):\n\nĐà Lạt: 250.000đ - 350.000đ\nNha Trang: 280.000đ - 400.000đ\nVũng Tàu: 80.000đ - 120.000đ\nCần Thơ: 120.000đ - 180.000đ\nĐà Nẵng: 400.000đ - 600.000đ\n\nGiá phụ thuộc vào:\n• Loại xe (ghế ngồi < giường nằm < limousine)\n• Nhà xe\n• Ngày lễ/cuối tuần có thể có phụ thu\n\nMẹo: Đặt vé sớm, chọn giờ ít khách và so sánh nhiều nhà xe trên hệ thống.\n\nBạn muốn tìm vé đi đâu?",
    ],
  },

  // ===== VÉ PDF / VÉ ĐIỆN TỬ =====
  "vé điện tử|nhận vé|check-in|checkin": {
    priority: 8,
    answers: [
      "VÉ ĐIỆN TỬ:\n\nSau khi thanh toán thành công:\n1. Hệ thống tự động xác nhận đơn hàng\n2. Cung cấp mã vé (Ticket Code) duy nhất\n3. Bạn có thể xem vé bất cứ lúc nào trong mục \"Vé Của Tôi\"\n\nThông tin trên vé:\n• Tên hành khách\n• Mã booking\n• Tuyến đường & giờ khởi hành\n• Số ghế\n• Mã vạch (Barcode)\n\nKhi lên xe:\n• Xuất trình thông tin vé trên điện thoại\n• HOẶC đọc mã booking cho tài xế\n\nMẹo: Chụp ảnh màn hình vé để xuất trình nhanh hơn!",
    ],
  },

  // ===== TÀI KHOẢN & ĐĂNG NHẬP =====
  "đăng nhập|đăng ký|tài khoản|login|register|tạo tài khoản|quên mật khẩu": {
    priority: 8,
    answers: [
      "TÀI KHOẢN & ĐĂNG NHẬP:\n\nĐăng ký tài khoản mới:\n1. Nhấn \"Đăng Ký\" trên thanh menu\n2. Điền: Họ tên, Email, Mật khẩu\n3. Xác nhận → Đăng nhập\n\nĐăng nhập:\n1. Nhấn \"Đăng Nhập\" trên thanh menu\n2. Nhập Email + Mật khẩu\n3. Nhấn \"Đăng nhập\" → Sử dụng hệ thống\n\nQuên mật khẩu:\n→ Liên hệ tổng đài 1900-xxxx để được hỗ trợ\n\nLợi ích khi có tài khoản:\n• Lưu lịch sử đặt vé\n• Quản lý vé đã đặt\n• Đặt vé nhanh hơn lần sau",
    ],
  },

  // ===== XEM VÉ ĐÃ ĐẶT =====
  "vé của tôi|lịch sử đặt vé|xem vé|quản lý vé|booking|mã đặt vé": {
    priority: 8,
    answers: [
      "XEM VÉ ĐÃ ĐẶT:\n\n1. Đăng nhập vào tài khoản\n2. Nhấn \"Vé Của Tôi\" trên thanh menu\n3. Xem danh sách tất cả vé đã đặt\n\nThông tin hiển thị:\n• Mã booking\n• Tuyến đường\n• Ngày giờ khởi hành\n• Số ghế\n• Trạng thái vé (đã thanh toán / chờ thanh toán / đã hủy)\n\nTừ đây bạn có thể:\n• Tải vé PDF\n• Hủy vé (nếu đủ điều kiện)\n• Xem chi tiết chuyến xe",
    ],
  },

  // ===== HOTLINE & LIÊN HỆ =====
  "hotline|liên hệ|số điện thoại|tổng đài|support|hỗ trợ|gọi điện|liên hệ tổng đài hỗ trợ": {
    priority: 9,
    answers: [
      "THÔNG TIN LIÊN HỆ HỖ TRỢ:\n\nTổng đài: 1900-xxxx\nGiờ làm việc: 7:00 - 22:00 hàng ngày\nEmail: support@busticket.vn\nZalo: BusTicket Official\nFacebook: fb.com/BusTicket\n\nChatbot AI: Hoạt động 24/7 (chính là tôi đây!)\n\nCác vấn đề hỗ trợ:\n• Đặt vé, hủy vé, đổi vé\n• Sự cố thanh toán\n• Khiếu nại dịch vụ\n• Tư vấn tuyến xe\n\nĐội ngũ hỗ trợ luôn sẵn sàng phục vụ bạn!",
    ],
  },

  // ===== THỜI GIAN / LỊCH TRÌNH =====
  "giờ khởi hành|mấy giờ|lịch trình|thời gian|bao lâu|mất bao lâu": {
    priority: 7,
    answers: [
      "LỊCH TRÌNH KHỞI HÀNH:\n\nCác khung giờ phổ biến:\n• Sáng sớm: 5:00 - 8:00\n• Buổi sáng: 8:00 - 12:00\n• Buổi chiều: 13:00 - 17:00\n• Buổi tối: 19:00 - 23:00\n\nThời gian di chuyển tham khảo:\n• Vũng Tàu: 2-3 tiếng\n• Cần Thơ: 3-4 tiếng\n• Đà Lạt: 7-8 tiếng\n• Nha Trang: 8-9 tiếng\n• Đà Nẵng: 17-18 tiếng\n\nĐể xem giờ cụ thể:\nVào Trang chủ → Nhập điểm đi/đến → Chọn ngày → Tìm chuyến\n\nBạn muốn đi tuyến nào?",
    ],
  },

  // ===== MỘT SỐ ĐỊA ĐIỂM CỤ THỂ =====
  "đà lạt|da lat|dalat": {
    priority: 7,
    answers: [
      "XE ĐI ĐÀ LẠT:\n\nTừ TP.HCM → Đà Lạt:\n• Khoảng cách: ~310km\n• Thời gian: 7-8 tiếng\n• Giá vé: 250.000đ - 350.000đ\n\nLoại xe có sẵn:\n• Ghế ngồi 45 chỗ\n• Giường nằm 40 chỗ\n• Limousine VIP 34 chỗ\n\nĐà Lạt - Thành phố ngàn hoa:\n• Khí hậu mát mẻ quanh năm (15-25°C)\n• Thác Datanla, Hồ Xuân Hương\n• Chợ đêm Đà Lạt\n\nBạn muốn đặt vé đi ngày nào? Vào Trang chủ để tìm chuyến nhé!",
    ],
  },

  "nha trang": {
    priority: 7,
    answers: [
      "XE ĐI NHA TRANG:\n\nTừ TP.HCM → Nha Trang:\n• Khoảng cách: ~435km\n• Thời gian: 8-9 tiếng\n• Giá vé: 280.000đ - 400.000đ\n\nNha Trang - Thành phố biển:\n• Bãi biển tuyệt đẹp\n• Vinpearl Land\n• Tháp Bà Ponagar\n\nBạn muốn đi ngày nào? Vào Trang chủ để tìm chuyến!",
    ],
  },

  "vũng tàu|vung tau": {
    priority: 7,
    answers: [
      "XE ĐI VŨNG TÀU:\n\nTừ TP.HCM → Vũng Tàu:\n• Khoảng cách: ~125km\n• Thời gian: 2-3 tiếng\n• Giá vé: 80.000đ - 120.000đ\n\nGần nhất từ TP.HCM, phù hợp đi về trong ngày!\n\nVào Trang chủ để tìm chuyến nhé!",
    ],
  },

  "cần thơ|can tho": {
    priority: 7,
    answers: [
      "XE ĐI CẦN THƠ:\n\nTừ TP.HCM → Cần Thơ:\n• Khoảng cách: ~170km\n• Thời gian: 3-4 tiếng\n• Giá vé: 120.000đ - 180.000đ\n\nThủ phủ miền Tây sông nước!\n\nVào Trang chủ để tìm chuyến nhé!",
    ],
  },

  "đà nẵng|da nang": {
    priority: 7,
    answers: [
      "XE ĐI ĐÀ NẴNG:\n\nTừ TP.HCM → Đà Nẵng:\n• Khoảng cách: ~960km\n• Thời gian: 17-18 tiếng\n• Giá vé: 400.000đ - 600.000đ\n\nThành phố đáng sống nhất VN!\n• Cầu Rồng, Bà Nà Hills\n• Bãi biển Mỹ Khê\n\nVào Trang chủ để tìm chuyến nhé!",
    ],
  },

  "sa pa|sapa": {
    priority: 7,
    answers: [
      "XE ĐI SA PA:\n\nTừ Hà Nội → Sa Pa:\n• Khoảng cách: ~320km\n• Thời gian: 5-6 tiếng\n• Giá vé: 200.000đ - 350.000đ\n\nThiên đường mây!\n• Fansipan - Nóc nhà Đông Dương\n• Ruộng bậc thang tuyệt đẹp\n\nVào Trang chủ để tìm chuyến nhé!",
    ],
  },

  // ===== LỖI & SỰ CỐ =====
  "lỗi|sự cố|không được|bị lỗi|error|bug|không thanh toán được|không đặt được": {
    priority: 9,
    answers: [
      "XỬ LÝ SỰ CỐ:\n\nNếu gặp lỗi khi sử dụng, bạn thử các bước sau:\n\n1. Tải lại trang (F5 hoặc Ctrl+R)\n2. Xóa cache trình duyệt\n3. Kiểm tra kết nối internet\n4. Thử trình duyệt khác (Chrome, Firefox)\n\nCác lỗi thường gặp:\n• Không đặt được vé → Kiểm tra đã đăng nhập chưa\n• Lỗi thanh toán → Kiểm tra số dư, thử lại QR\n• Ghế bị khóa → Ghế đang được người khác giữ, chọn ghế khác\n• Hết thời gian → Ghế bị mở khóa sau 10 phút, đặt lại\n\nVẫn gặp lỗi? Gọi hotline: 1900-xxxx (7:00 - 22:00)",
    ],
  },

  // ===== BẢO MẬT & AN TOÀN =====
  "bảo mật|an toàn|thông tin cá nhân|privacy|bảo vệ": {
    priority: 7,
    answers: [
      "BẢO MẬT & AN TOÀN:\n\n• Thông tin cá nhân được mã hóa SSL 256-bit\n• Thanh toán qua QR code an toàn, không lưu thông tin thẻ\n• Mật khẩu được hash, không ai có thể xem\n• Email chỉ dùng để gửi vé, không spam\n• SĐT chỉ dùng liên hệ vé, không chia sẻ\n\nBạn hoàn toàn yên tâm khi sử dụng BusTicket!",
    ],
  },

  // ===== NHÀ XE =====
  "nhà xe|hãng xe|công ty xe|xe nào tốt": {
    priority: 7,
    answers: [
      "NHÀ XE TRÊN HỆ THỐNG:\n\nBusTicket liên kết với nhiều nhà xe uy tín:\n• Có đánh giá từ hành khách thực tế\n• Thông tin minh bạch về loại xe, tiện ích\n• So sánh giá dễ dàng\n\nCách chọn nhà xe tốt:\n1. Xem đánh giá (từ 4.0 sao trở lên)\n2. Kiểm tra loại xe và tiện ích\n3. So sánh giá với các nhà xe khác\n4. Đọc nhận xét từ hành khách\n\nVào Trang chủ → Tìm chuyến → Bộ lọc \"Nhà xe\" để so sánh nhé!",
    ],
  },

  // ===== KHUYẾN MÃI =====
  "khuyến mãi|giảm giá|mã giảm giá|voucher|coupon|ưu đãi|sale": {
    priority: 7,
    answers: [
      "KHUYẾN MÃI & ƯU ĐÃI:\n\nHiện tại hệ thống chưa có chương trình khuyến mãi đặc biệt.\n\nMẹo tiết kiệm:\n• Đặt vé sớm để có giá tốt nhất\n• Chọn giờ ít khách (sáng sớm, giữa tuần)\n• So sánh giá giữa các nhà xe\n• Chọn ghế ngồi nếu muốn tiết kiệm nhất\n\nTheo dõi fanpage BusTicket để cập nhật ưu đãi mới nhất!\n\nHotline: 1900-xxxx",
    ],
  },

  // ===== HÀNH LÝ =====
  "hành lý|bao nhiêu kg|mang theo|đồ đạc|ký gửi": {
    priority: 7,
    answers: [
      "QUY ĐỊNH HÀNH LÝ:\n\nHành lý xách tay:\n• Miễn phí: 1 túi/ba lô nhỏ mang theo\n• Để dưới gầm ghế hoặc kệ hành lý\n\nHành lý ký gửi (gầm xe):\n• Miễn phí: Dưới 20kg\n• Phụ thu: Trên 20kg (tùy nhà xe)\n\nKhông được mang:\n• Chất cháy nổ, chất lỏng dễ cháy\n• Vật sắc nhọn nguy hiểm\n• Động vật (trừ trường hợp đặc biệt)\n\nNếu có hành lý lớn, liên hệ nhà xe trước để sắp xếp!",
    ],
  },

  // ===== TRẺ EM & NGƯỜI GIÀ =====
  "trẻ em|em bé|người già|người lớn tuổi|trẻ nhỏ|giá trẻ em": {
    priority: 7,
    answers: [
      " CHÍNH SÁCH TRẺ EM & NGƯỜI CAO TUỔI:\n\n Trẻ em dưới 6 tuổi:\n• Miễn phí nếu ngồi cùng người lớn\n• Không có ghế riêng\n\n Trẻ em 6-11 tuổi:\n• Giá vé bằng 75% người lớn\n• Có ghế riêng\n\n Từ 12 tuổi trở lên:\n• Giá vé như người lớn\n\n Người cao tuổi / Khuyết tật:\n• Liên hệ tổng đài để được hỗ trợ đặc biệt\n• Một số nhà xe có chính sách ưu tiên\n\n Hotline: 1900-xxxx",
    ],
  },

  // ===== QUY TRÌNH LÊN XE =====
  "lên xe|check in|checkin|đón xe|điểm đón|lên ở đâu": {
    priority: 7,
    answers: [
      "QUY TRÌNH LÊN XE:\n\n1. Đến bến xe/điểm đón trước 15-30 phút\n2. Xuất trình vé (1 trong các cách):\n• Vé PDF trên điện thoại\n• Mã QR trên vé\n• Đọc mã booking\n3. Tài xế xác nhận → Lên xe\n4. Ngồi đúng số ghế trên vé\n\nLưu ý quan trọng:\n• Đến sớm 15-30 phút\n• Lưu sẵn vé PDF trên điện thoại\n• Ghi nhớ mã booking phòng trường hợp mất mạng\n• Liên hệ nhà xe nếu cần thay đổi điểm đón",
    ],
  },
};

// System context ngắn gọn và hiệu quả cho chatbot
const SYSTEM_CONTEXT = `
Bạn là TRỢ LÝ AI DATVENHANH - chatbot thân thiện và thông minh của hệ thống đặt vé xe khách trực tuyến.

CHỨC NĂNG CHÍNH:
- Hướng dẫn đặt vé xe trực tuyến
- Giải đáp thắc mắc về thanh toán, hủy vé, theo dõi chuyến xe
- Tư vấn về các tuyến xe, giá vé, loại xe
- Trò chuyện tự nhiên về du lịch, các địa điểm

 PHONG CÁCH TRẢ LỜI:
- Thân thiện, vui vẻ, nhiệt tình, luôn lịch sự
- Ngắn gọn nhưng đầy đủ thông tin
- Tuyệt đối không sử dụng bất kỳ biểu tượng cảm xúc (emoji) nào trong câu trả lời.
- Luôn nói tiếng Việt, xưng hô "tôi" và "bạn"
- Sẵn sàng trò chuyện cơ bản (chào hỏi, hỏi thăm sức khỏe, nói về thời tiết, trêu đùa nhẹ nhàng)
- Dù trò chuyện linh tinh nhưng vẫn khéo léo giới thiệu dịch vụ đặt vé xe nếu phù hợp
- Thể hiện cảm xúc (vui vẻ, tiếc nuối khi nghe tin buồn, đồng cảm)
- Đặt câu hỏi mở để duy trì cuộc trò chuyện.

 **NHIỆM VỤ CHÍNH:**
Làm một người bạn trò chuyện thú vị, đồng thời hỗ trợ khách hàng 24/7 về đặt vé, theo dõi hành trình và dịch vụ xe khách.


CÁC CHỨC NĂNG CHÍNH CỦA HỆ THỐNG:


1. **Tìm kiếm chuyến xe:**
   - Tìm theo điểm đi, điểm đến, ngày khởi hành
   - Lọc theo loại xe (giường nằm, limousine, ghế ngồi), nhà xe, giá
   - Sắp xếp theo giờ khởi hành, giá vé, đánh giá

2. **Xem sơ đồ ghế thông minh:**
   - Hiển thị ghế còn trống/đã đặt theo sơ đồ xe thực tế
   - Hỗ trợ chọn ghế theo chặng (ghế có thể trống ở chặng này nhưng đã đặt ở chặng khác)
   - 3 loại sơ đồ: ghế ngồi 45 chỗ, giường nằm 40 chỗ, limousine 34 chỗ

3. **Đặt vé và khóa ghế:**
   - Chọn ghế → Hệ thống khóa ghế tạm thời 10 phút
   - Điền thông tin: Họ tên, Số điện thoại, Email
   - Xác nhận đặt vé

4. **Thanh toán:**
   - Thanh toán qua QR code (giả lập demo)
   - Quét QR → Xác nhận → Hoàn tất

5. **Xác nhận đặt vé:**
   - Sau thanh toán thành công, hệ thống tự động xác nhận
   - Bạn nhận được mã vé điện tử để check-in tại xe
   - Tải vé về máy

6. **Theo dõi hành trình trực tiếp:**
   - Xem vị trí xe trên bản đồ thời gian thực (tuyến đường OSRM)
   - Thông tin: ETA, khoảng cách còn lại, tốc độ, các điểm dừng
   - Bản đồ hiển thị tuyến đường thực tế theo đường bộ

7. **Quản lý booking:**
   - Xem lịch sử đặt vé
   - Hủy vé (nếu chưa thanh toán)


QUY TRÌNH ĐẶT VÉ CHI TIẾT:

- **Bước 1:** Truy cập trang chủ → Nhập điểm đi, điểm đến, ngày → Nhấn "Tìm chuyến"
- **Bước 2:** Xem kết quả → Chọn chuyến phù hợp → Nhấn "Chọn chuyến"
- **Bước 3:** Xem sơ đồ ghế → Click chọn ghế muốn ngồi (ghế xanh = còn trống, đỏ = đã đặt)
- **Bước 4:** Điền thông tin khách hàng (tên, SĐT, email) → Nhấn "Đặt vé"
- **Bước 5:** Hệ thống tạo mã QR thanh toán → Quét QR để thanh toán
- **Bước 6:** Thanh toán thành công → Nhận vé điện tử


CÁC TUYẾN XE PHỔ BIẾN:

- TP.HCM ↔ Đà Lạt (~300km, 7-8 tiếng)
- TP.HCM ↔ Nha Trang (~440km, 8-9 tiếng)
- TP.HCM ↔ Cần Thơ (~170km, 3-4 tiếng)
- TP.HCM ↔ Vũng Tàu (~125km, 2-3 tiếng)
- TP.HCM ↔ Đà Nẵng (~960km, 17-18 tiếng)
- Hà Nội ↔ Sa Pa (~320km, 5-6 tiếng)
- Hà Nội ↔ Hải Phòng (~120km, 2-3 tiếng)


CHÍNH SÁCH:

- **Hủy vé miễn phí:** Trước giờ khởi hành 24 tiếng
- **Hủy vé phí 30%:** Từ 12-24 tiếng trước giờ khởi hành
- **Không hoàn tiền:** Trong vòng 12 tiếng trước giờ khởi hành
- **Đổi chuyến:** Liên hệ tổng đài trước 6 tiếng


HOTLINE HỖ TRỢ:

- Tổng đài: **1900-xxxx** (7:00 - 22:00 hàng ngày)
- Email: support@datvenhanh.vn
- Zalo/Facebook: DatVeNhanh Official


QUY TẮC TRẢ LỜI:

- Luôn trả lời bằng **tiếng Việt**, thân thiện, như một người tư vấn tận tâm.
- Sử dụng **markdown** (bold, bullet points) để định dạng.
- Trả lời nhanh gọn, rõ ràng. Khuyến khích small talk, giao tiếp cơ bản tự nhiên.
- Dù trả lời câu hỏi ngoài lề (hỏi thăm, tán gẫu), hãy luôn thân thiện và sáng tạo.
- Tuyệt đối không từ chối giao tiếp cơ bản (ví dụ không nói: "Tôi chỉ có thể trả lời về đặt vé xe"). Hãy trả lời câu hỏi trước rồi mới lèo lái về dịch vụ phòng vé.
- Khi không biết câu trả lời chính xác về chuyên môn, hướng dẫn khách liên hệ tổng đài.


VÍ DỤ TRÒ CHUYỆN TỰ NHIÊN:

**User:** "Hôm nay trời đẹp quá!"
**Bot:** "Đúng vậy!  Thời tiết đẹp thế này rất phù hợp để đi du lịch. Bạn có kế hoạch đi chơi không? Tôi có thể giúp bạn đặt vé xe đi bất cứ đâu đó! "

**User:** "Tôi đang buồn"
**Bot:** "Ồ, tôi rất tiếc khi nghe điều đó  Đôi khi một chuyến đi ngắn sẽ giúp bạn thư giãn hơn. Có muốn tìm hiểu về các tuyến xe đi biển hoặc núi không? "

**User:** "Bạn là ai?"
**Bot:** "Tôi là trợ lý AI của BusTicket!  Tôi ở đây để giúp bạn đặt vé xe, theo dõi hành trình, và trả lời mọi thắc mắc. Bạn cần tôi hỗ trợ gì không?"

**User:** "Xe đi Đà Lạt có wifi không?"
**Bot:** "Phần lớn các xe đi Đà Lạt hiện nay đều có **WiFi miễn phí** nhé!  Ngoài ra còn có:\n-  Điều hòa 2 chiều\n-  Ghế massage\n-  Màn hình giải trí\n\nBạn muốn tìm xe đi Đà Lạt ngày nào? Tôi sẽ tìm cho bạn những chuyến tốt nhất!"

**User:** "Cho tôi xem xe đi Nha Trang"
**Bot:** "Được rồi!  Để tìm xe đi **Nha Trang**, bạn làm theo các bước sau:\n\n1. Vào **Trang chủ**\n2. Chọn: Điểm đi (VD: TP.HCM), Điểm đến: Nha Trang\n3. Chọn **ngày khởi hành**\n4. Nhấn **Tìm chuyến** \n\nHoặc bạn muốn tôi gợi ý thông tin: Bạn xuất phát từ đâu và muốn đi ngày nào?"


LƯU Ý QUAN TRỌNG:

- Đừng bịa đặt thông tin không có trong hệ thống
- Luôn gợi ý **hành động tiếp theo** cho người dùng
- Kết thúc câu trả lời bằng **câu hỏi mở** để tiếp tục cuộc trò chuyện
- Tuyệt đối không sử dụng emoji trong bất kỳ hoàn cảnh nào.
`;

// ============================================================
//  HÀM HỖ TRỢ - KIỂM TRA FAQ
// ============================================================

/**
 * Kiểm tra xem câu hỏi có match với FAQ không
 * CHỈ match khi câu hỏi CHÍNH XÁC về chủ đề đó (dùng word boundary)
 * @param {string} message - Câu hỏi của người dùng
 * @returns {string|null} - Câu trả lời FAQ hoặc null
 */
function checkFAQ(message) {
  const normalizedMessage = message.toLowerCase().trim();

  // Chỉ xử lý các câu hỏi CỰC KỲ phổ biến và ngắn gọn
  // Nếu câu hỏi dài (>15 từ) → Cho Gemini xử lý
  const wordCount = normalizedMessage.split(/\s+/).length;
  if (wordCount > 15) {
    console.log(` Câu hỏi dài (${wordCount} từ) → Gemini xử lý`);
    return null;
  }

  // Tìm kiếm trong FAQ database với EXACT MATCH
  for (const [pattern, faqData] of Object.entries(FAQ_DATABASE)) {
    const keywords = pattern.split("|");

    // Kiểm tra CHÍNH XÁC với word boundary
    const isMatch = keywords.some((keyword) => {
      // Tạo regex với word boundary để tránh false positive
      const regex = new RegExp(`\\b${keyword.toLowerCase()}\\b`, "i");
      return regex.test(normalizedMessage);
    });

    if (isMatch) {
      // Random chọn 1 câu trả lời trong danh sách
      const answers = faqData.answers;
      const randomAnswer = answers[Math.floor(Math.random() * answers.length)];

      console.log(` FAQ Match: "${pattern}" → Trả lời nhanh`);
      return randomAnswer;
    }
  }

  console.log(` Không match FAQ → Gemini AI xử lý`);
  return null; // Không tìm thấy trong FAQ → AI xử lý
}

/**
 * Gửi câu hỏi đến Gemini AI với lịch sử hội thoại
 * @param {string} userMessage - Câu hỏi của người dùng
 * @param {Array} chatHistory - Lịch sử hội thoại [{role: "user"/"assistant", content: "..."}]
 * @returns {Promise<string>} - Câu trả lời từ AI
 */
const getChatResponse = async (userMessage, chatHistory = []) => {
  try {
    // BƯỚC 1: Kiểm tra FAQ trước (trả lời nhanh, không tốn API)
    const faqAnswer = checkFAQ(userMessage);
    if (faqAnswer) {
      return faqAnswer;
    }

    // BƯỚC 2: Nếu không có trong FAQ, gọi AI
    console.log(" Không tìm thấy FAQ, gọi Gemini AI...");

    // Kiểm tra API key
    if (
      !config.GEMINI_API_KEY ||
      config.GEMINI_API_KEY === "your_gemini_key_here" ||
      config.GEMINI_API_KEY.length < 20
    ) {
      console.log(" API key không hợp lệ, dùng fallback response");
      return generateFallbackResponse(userMessage);
    }

    // Lấy model Gemini
    const model = genAI.getGenerativeModel({
      model: config.GEMINI_MODEL,
      systemInstruction: SYSTEM_CONTEXT,
    });

    // Xây dựng lịch sử hội thoại cho Gemini Chat API
    const history = chatHistory
      .filter((msg) => msg.role && msg.content)
      .map((msg) => ({
        role: msg.role === "assistant" ? "model" : "user",
        parts: [{ text: msg.content }],
      }));

    // Sử dụng Gemini Chat API (hỗ trợ lịch sử hội thoại)
    const chat = model.startChat({
      history: history.slice(0, -1), // Bỏ tin nhắn cuối (sẽ gửi riêng)
      generationConfig: {
        maxOutputTokens: 1024,
        temperature: 0.7,
        topP: 0.9,
      },
    });

    // Gửi tin nhắn mới
    const result = await chat.sendMessage(userMessage);
    const response = await result.response;
    const text = response.text();

    console.log(
      ` Chatbot: User hỏi: "${userMessage.substring(0, 50)}..." → Trả lời: ${text.substring(0, 80)}...`,
    );

    return text;
  } catch (error) {
    console.error(" Lỗi gọi Gemini API:", error);

    // Fallback: Trả lời thông minh khi API lỗi
    return generateFallbackResponse(userMessage);
  }
};

/**
 * Tạo câu trả lời fallback thông minh khi API lỗi
 * Phân tích ngữ cảnh sâu hơn để trả lời đa dạng
 * @param {string} message - Câu hỏi của người dùng
 * @returns {string} - Câu trả lời thông minh
 */
function generateFallbackResponse(message) {
  const lowerMsg = message.toLowerCase();

  // === GIAO TIẾP CƠ BẢN (SMALL TALK) ===
  if (lowerMsg.includes("chào") || lowerMsg.includes("hello") || lowerMsg.includes("hi")) {
    return "Xin chào! Mình là trợ lý AI BusTicket đây. Hôm nay bạn thấy thế nào? Mình có thể giúp gì cho bạn không?";
  }

  if (lowerMsg.includes("khỏe không") || lowerMsg.includes("khoẻ không") || lowerMsg.includes("thế nào")) {
    return "Mình là AI nên lúc nào cũng tràn đầy năng lượng 100% pin! Còn bạn hôm nay thế nào? Có dự định đi chơi đâu không?";
  }

  if (lowerMsg.includes("làm gì") || lowerMsg.includes("có thể giúp") || lowerMsg.includes("bạn là ai")) {
    return " Mình là trợ lý AI thông minh của BusTicket!\n\nMình có thể:\n•  Trò chuyện tâm sự cùng bạn\n•  Giúp tìm & đặt vé xe siêu tốc\n•  Theo dõi xe chạy trực tiếp trên bản đồ\n•  Hướng dẫn thanh toán QR\n\nBạn cứ hỏi thoải mái nhé, mình sẵn sàng giải đáp! ";
  }

  if (lowerMsg.includes("cảm ơn") || lowerMsg.includes("thanks") || lowerMsg.includes("thank you")) {
    return "Không có gì nè! Cảm ơn bạn đã trò chuyện với mình nhé. Cần hỗ trợ gì cứ gọi mình ngay!";
  }

  if (lowerMsg.includes("tạm biệt") || lowerMsg.includes("bye") || lowerMsg.includes("đi đây")) {
    return "Tạm biệt bạn! Chúc bạn một ngày thật vui vẻ nhé. Mong sớm gặp lại!";
  }

  if (lowerMsg.includes("yêu") || lowerMsg.includes("thích")) {
    return "Hihi, cảm ơn bạn nhiều nha! Mình cũng rất thích nói chuyện với bạn đó. Gửi ngàn tim cho người dùng dễ thương nhất hệ mặt trời!";
  }

  if (lowerMsg.includes("tên gì") || lowerMsg.includes("bạn tên")) {
    return "Mình là Tâm - Trợ lý AI thế hệ mới của BusTicket!  Bạn nhớ tên mình nhé! Bạn muốn đi đâu chơi không để Tâm đặt vé giúp nào?";
  }

  if (lowerMsg.includes("mệt") || lowerMsg.includes("buồn") || lowerMsg.includes("chán")) {
    return "Thương quá. Khi mệt mỏi hay buồn chán, một chuyến đi trốn khỏi thành phố ồn ào sẽ giúp chữa lành tâm hồn đó. \n\nBạn có muốn đi ngắm bình minh trên Đà Lạt hay dạo biển ở Vũng Tàu cùng chuyến xe của BusTicket không? Mình tìm vé đẹp cho nha!";
  }

  // === THANH TOÁN ===
  if (
    lowerMsg.includes("thanh toán") ||
    lowerMsg.includes("qr") ||
    lowerMsg.includes("chuyển khoản") ||
    lowerMsg.includes("trả tiền")
  ) {
    return " Hướng dẫn thanh toán:\n\n1. Chọn ghế và điền thông tin cá nhân\n2. Hệ thống tạo mã QR thanh toán\n3. Mở app ngân hàng → Quét QR\n4. Chuyển khoản theo nội dung\n5. Xác nhận → Đặt vé thành công ngay!\n\n Bạn có 10 phút để thanh toán trước khi ghế bị mở khóa.\n\nBạn cần hỗ trợ gì thêm không?";
  }

  // === HỦY VÉ ===
  if (
    lowerMsg.includes("hủy") ||
    lowerMsg.includes("huỷ") ||
    lowerMsg.includes("hoàn tiền") ||
    lowerMsg.includes("đổi vé")
  ) {
    return " Chính sách hủy/đổi vé:\n\n Miễn phí 100%: Trước >24h\n Phí 30%: Từ 12-24h trước\n Không hoàn tiền: <12h trước\n\n Đổi chuyến: Liên hệ tổng đài trước 6h\n\n Hotline hủy vé: 1900-xxxx\n(7:00 - 22:00 hàng ngày)\n\nBạn muốn hủy vé nào?";
  }

  // === GIÁ VÉ ===
  if (
    lowerMsg.includes("giá") ||
    lowerMsg.includes("bao nhiêu") ||
    lowerMsg.includes("phí") ||
    lowerMsg.includes("chi phí")
  ) {
    return " Bảng giá vé tham khảo từ TP.HCM:\n\n Đà Lạt: 250-350k\n Nha Trang: 280-400k\n Vũng Tàu: 80-120k\n Cần Thơ: 120-180k\n Đà Nẵng: 400-600k\n\nGiá thay đổi theo loại xe:\n• Ghế ngồi: rẻ nhất\n• Giường nằm: trung bình\n• Limousine: cao nhất\n\nBạn muốn tìm chuyến đi đâu?";
  }

  // === TUYẾN XE ===
  if (
    lowerMsg.includes("tuyến") ||
    lowerMsg.includes("đi đâu") ||
    lowerMsg.includes("route") ||
    lowerMsg.includes("chuyến")
  ) {
    return " Các tuyến xe phổ biến:\n\nTừ TP.HCM:\n•  Đà Lạt (310km, 7-8h)\n•  Nha Trang (435km, 8-9h)\n•  Vũng Tàu (125km, 2-3h)\n•  Cần Thơ (170km, 3-4h)\n•  Đà Nẵng (960km, 17-18h)\n\nTừ Hà Nội:\n•  Sa Pa (320km, 5-6h)\n•  Hải Phòng (120km, 2-3h)\n\nBạn xuất phát từ đâu và muốn đi đâu?";
  }

  // === THEO DÕI HÀNH TRÌNH ===
  if (
    lowerMsg.includes("theo dõi") ||
    lowerMsg.includes("vị trí") ||
    lowerMsg.includes("ở đâu") ||
    lowerMsg.includes("tracking") ||
    lowerMsg.includes("bản đồ")
  ) {
    return " Theo dõi hành trình trực tiếp:\n\n1. Vào menu 'Theo Dõi'\n2. Chọn chuyến xe cần theo dõi\n\nBạn sẽ thấy:\n•  Vị trí xe realtime trên bản đồ\n•  Thời gian đến dự kiến (ETA)\n•  Khoảng cách còn lại\n•  Các trạm dừng trên đường\n•  Tốc độ hiện tại\n\nTuyến đường hiển thị theo đường bộ thực tế!";
  }

  // === ĐẶT VÉ (chi tiết hơn FAQ) ===
  if (
    lowerMsg.includes("đặt") ||
    lowerMsg.includes("book") ||
    lowerMsg.includes("mua vé")
  ) {
    return "Hướng dẫn đặt vé nhanh:\n\n1. Vào Trang chủ\n2. Nhập: Điểm đi, điểm đến, ngày\n3. Nhấn 'Tìm chuyến'\n4. Chọn chuyến phù hợp\n5. Chọn ghế trên sơ đồ\n6. Điền: Tên, SĐT, Email\n7. Quét QR để thanh toán\n8. Nhận vé điện tử ngay\n\nLưu ý: Ghế được giữ 10 phút sau khi chọn.\n\nBạn muốn đặt vé đi đâu?";
  }

  // === VÉ ĐIỆN TỬ ===
  if (
    lowerMsg.includes("vé") ||
    lowerMsg.includes("pdf") ||
    lowerMsg.includes("tải")
  ) {
    return " Về vé điện tử:\n\n• Sau khi thanh toán thành công, hệ thống tự động xác nhận đặt vé\n• Bạn sẽ nhận được mã vé điện tử và Barcode trên màn hình\n• Bạn có thể xem vé bất cứ lúc nào trong mục 'Vé Của Tôi'\n• Xuất trình thông tin vé hoặc đọc mã booking khi lên xe\n\nBạn cần hỗ trợ gì thêm không?";
  }

  // === CÂU HỎI VỀ HỆ THỐNG ===
  if (
    lowerMsg.includes("bạn là ai") ||
    lowerMsg.includes("who") ||
    lowerMsg.includes("tên gì")
  ) {
    return " Xin chào! Tôi là trợ lý AI của BusTicket!\n\nTôi được tạo ra để hỗ trợ bạn 24/7 về:\n• Tìm kiếm và đặt vé xe khách\n• Theo dõi hành trình trực tiếp\n• Giải đáp thắc mắc về thanh toán, hủy vé\n• Tư vấn tuyến xe, giá vé\n\nBạn cần tôi giúp gì hôm nay?";
  }

  // === DU LỊCH / ĐỊA ĐIỂM ===
  if (
    lowerMsg.includes("đà lạt") ||
    lowerMsg.includes("nha trang") ||
    lowerMsg.includes("vũng tàu") ||
    lowerMsg.includes("cần thơ") ||
    lowerMsg.includes("đà nẵng") ||
    lowerMsg.includes("sa pa") ||
    lowerMsg.includes("hải phòng")
  ) {
    const destinations = {
      "đà lạt": {
        info: "Thành phố ngàn hoa, khí hậu mát mẻ. Xe từ TP.HCM: 7-8h, giá 250-350k",
      },
      "nha trang": {
        info: "Thành phố biển xinh đẹp. Xe từ TP.HCM: 8-9h, giá 280-400k",
      },
      "vũng tàu": {
        info: "Biển gần TP.HCM nhất. Xe từ TP.HCM: 2-3h, giá 80-120k",
      },
      "cần thơ": {
        info: "Thủ phủ miền Tây. Xe từ TP.HCM: 3-4h, giá 120-180k",
      },
      "đà nẵng": {
        info: "Thành phố đáng sống. Xe từ TP.HCM: 17-18h, giá 400-600k",
      },
      "sa pa": {
        info: "Thiên đường mây. Xe từ Hà Nội: 5-6h, giá 200-350k",
      },
      "hải phòng": {
        info: "Thành phố cảng. Xe từ Hà Nội: 2-3h, giá 80-120k",
      },
    };
    for (const [city, data] of Object.entries(destinations)) {
      if (lowerMsg.includes(city)) {
        return `Thông tin xe đi ${city.charAt(0).toUpperCase() + city.slice(1)}:\n\n${data.info}\n\nCác loại xe:\n• Ghế ngồi 45 chỗ - phổ thông\n• Giường nằm 40 chỗ - thoải mái\n• Limousine 34 chỗ - VIP\n\nBạn muốn đặt vé đi ngày nào? Hãy vào Trang chủ để tìm chuyến nhé!`;
      }
    }
  }

  // === THỜI TIẾT / SMALL TALK ===
  if (
    lowerMsg.includes("thời tiết") ||
    lowerMsg.includes("trời") ||
    lowerMsg.includes("mưa") ||
    lowerMsg.includes("nắng")
  ) {
    return " Thời tiết đẹp là cơ hội tuyệt vời để đi du lịch!\n\nBạn đang muốn đi đâu không? Tôi có thể giúp bạn tìm chuyến xe phù hợp.\n\nMột số gợi ý:\n•  Đà Lạt - mát mẻ quanh năm\n•  Nha Trang - biển đẹp, nắng ấm\n•  Vũng Tàu - gần, tiện đi về trong ngày";
  }

  if (
    lowerMsg.includes("buồn") ||
    lowerMsg.includes("chán") ||
    lowerMsg.includes("mệt")
  ) {
    return "Đôi khi một chuyến đi ngắn sẽ giúp bạn cảm thấy tốt hơn!\n\nGợi ý cho bạn:\n• Vũng Tàu - chỉ 2-3h từ TP.HCM\n• Đà Lạt - không khí trong lành\n• Nha Trang - tắm biển thư giãn\n\nMuốn tôi tìm chuyến xe cho bạn không?";
  }

  // === WIFI / TIỆN ÍCH ===
  if (
    lowerMsg.includes("wifi") ||
    lowerMsg.includes("tiện ích") ||
    lowerMsg.includes("ăn uống") ||
    lowerMsg.includes("wc") ||
    lowerMsg.includes("điều hòa")
  ) {
    return " Tiện ích trên xe:\n\n•  WiFi miễn phí\n•  Điều hòa 2 chiều\n•  Ổ cắm sạc điện\n•  Nước uống miễn phí\n•  WC trên xe (xe giường nằm)\n•  Màn hình giải trí\n\nTùy theo loại xe và nhà xe sẽ có các tiện ích khác nhau.\n\nBạn muốn tìm xe đi đâu?";
  }

  // === GIỜ / LỊCH TRÌNH ===
  if (
    lowerMsg.includes("giờ") ||
    lowerMsg.includes("lịch") ||
    lowerMsg.includes("khởi hành") ||
    lowerMsg.includes("mấy giờ")
  ) {
    return " Lịch trình khởi hành:\n\n• Phần lớn các tuyến có nhiều giờ khởi hành trong ngày\n• Các khung giờ phổ biến: Sáng (6-9h), Trưa (11-14h), Chiều (15-18h), Tối (20-23h)\n\nĐể xem giờ cụ thể:\n1. Vào Trang chủ\n2. Chọn điểm đi - điểm đến\n3. Chọn ngày\n4. Nhấn 'Tìm chuyến'\n\nBạn muốn đi tuyến nào?";
  }

  // Default fallback - gợi ý chức năng
  return " Cảm ơn bạn đã nhắn tin! Tôi có thể giúp bạn về:\n\n•  Đặt vé xe khách\n•  Thanh toán QR code\n•  Theo dõi hành trình\n•  Giá vé & tuyến xe\n•  Hủy vé / đổi vé\n•  Hotline hỗ trợ\n\nHãy hỏi tôi bất cứ điều gì, hoặc gọi hotline 1900-xxxx để được hỗ trợ trực tiếp!";
}

module.exports = {
  getChatResponse,
};



