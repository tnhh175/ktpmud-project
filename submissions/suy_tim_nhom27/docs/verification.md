# Kiểm chứng bộ bàn giao tuần 3

Rà soát lại ngày 28/09/2026, Python 3.12 trên môi trường tạo bộ bàn giao.

## Đã thực hiện trên bộ đã ghép vào repository

| Kiểm tra | Kết quả |
|---|---|
| pytest — luồng chuẩn | Tạo ca/lượt khám → bốn kết quả stub → quyết định → lịch sử/export/audit đạt |
| pytest — phân quyền | Thiếu token 401; sai vai trò 403; dược sĩ chỉ gọi MedSafety đạt |
| pytest — validation và revision | EF không hợp lệ 422; snapshot không đổi; xác nhận kết quả cũ 409 đạt |
| pytest — quyết định | Thiếu lý do 422; quyết định trùng 409; dược sĩ xác nhận 403 đạt |
| pytest — rule | Test cấu trúc ghi chưa thẩm định lâm sàng; activate bị chặn 409 đạt |
| pytest — dữ liệu/phiên | Trường ngoài schema bị từ chối; unknown không thay bằng 0; token hết hạn 401 đạt |
| pytest — hợp đồng/DDL | OpenAPI 3.0.3 hợp lệ; YAML bằng contract runtime; SQL schema và seed qua parser PostgreSQL đạt |
| pytest — ID và mã synthetic | API tự sinh mã `SYN-...` khi thiếu; giữ nguyên khi sửa; từ chối trùng mã; ID chủ ca, bác sĩ xác nhận và audit là UUID đạt |
| HTTP smoke | Khởi chạy Uvicorn thực tại localhost, gọi qua HTTP: đăng nhập → ca → lượt khám → bốn stub → quyết định đạt |
| Sơ đồ | 18 tệp `.drawio` phân tích XML được (gồm tệp gộp 11 trang và sơ đồ tuần 2); 17 PNG có chữ ký và phần kết hợp lệ; kiểm tra bố cục trước đó cho 11 hình tuần 3 |
| Thư mục nộp bài | `python scripts/validate_submission.py submissions/suy_tim_nhom27` từ gốc repo đạt; các liên kết Markdown tương đối đều trỏ đến tệp đang có |

Tổng: **8 test functions passed** sau khi ghép vào repo ngày 28/09. TestClient có một cảnh báo deprecation từ Starlette/httpx; không gây lỗi kiểm thử. HTTP smoke đã lặp lại qua socket trên phiên bản đã ghép.

## Chưa thực hiện / không suy ra từ kết quả trên

- Chưa thực thi schema/seed trên PostgreSQL thật: parser chỉ xác nhận cú pháp, chưa xác nhận toàn bộ trigger khi chạy. Nhóm cần chạy các lệnh trong README trên DB rỗng.
- Chưa chạy Docker Compose trong môi trường này.
- Chưa triển khai mạng giữa Gateway–Core–bốn dịch vụ, chưa nối persistence thật.
- Không kiểm chứng độ đúng y khoa, độ nhạy/đặc hiệu, gold labels, thời gian phản hồi khi chịu tải, 99,9% uptime hoặc khả năng phát hiện mọi PII.
- GitHub Actions sẵn có chỉ chạy khi mở PR vào `main` và kiểm tra cách ly thư mục/manifest/secret. Chưa có job tự động chạy pytest, kiểm tra OpenAPI và DDL; không ghi nhận các bước này là CI đã hoàn thành.

Lệnh tái lập: `python scripts/export_openapi.py`, `python -m pytest -q`. Khi server đang chạy và DEMO_PASSWORD khớp, chạy `python scripts/demo_flow.py` để thử HTTP.
