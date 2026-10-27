# fe_clinic_ad

## Deploy Vercel khi backend đang dùng HTTP

Trình duyệt gọi `/api/v1` cùng tên miền HTTPS của admin. Next.js chuyển tiếp
request, cookie đăng nhập và phản hồi API tới backend qua external rewrites.
`/uploads` và `/imageapi` cũng được chuyển tiếp để tránh Mixed Content với ảnh.

Trên Vercel, đặt biến môi trường server `BACKEND_API_URL` thành địa chỉ backend,
ví dụ `http://3.0.207.60:8011`, rồi redeploy. Có thể giữ nguyên
`NEXT_PUBLIC_API_URL=http://3.0.207.60:8011/api/v1` hiện tại: cấu hình proxy dùng
biến này làm phương án dự phòng nếu chưa có `BACKEND_API_URL`.
Backend phải truy cập được từ server Vercel. Không đặt upstream trỏ về admin.

Proxy này áp dụng cho HTTP API và ảnh; Socket.io/WebRTC signaling vẫn cần backend
HTTPS/WSS hoặc một proxy hỗ trợ WebSocket riêng. Kết nối từ Vercel tới backend
HTTP chưa được mã hóa. Không cache phản hồi `/api/v1`.
