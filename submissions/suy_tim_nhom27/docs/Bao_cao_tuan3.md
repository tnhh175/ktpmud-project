# Báo cáo tuần 3 — Nhóm 27

**Đề tài:** Hệ thống hỗ trợ quyết định suy tim ở người cao tuổi.

**Mục tiêu tuần:** Chuyển yêu cầu tuần 2 thành kiến trúc, mô hình dữ liệu và hợp đồng API để nhóm bắt đầu lập trình song song.

## Kết quả

| Công việc | Kết quả bàn giao |
|---|---|
| 3.1 | C4 C1 xác định ba vai trò và các nguồn HIS/EMR, LIS, PACS/RIS mô phỏng. C2 đề xuất Web App, Gateway, Core, bốn dịch vụ lâm sàng và PostgreSQL, ghi rõ giao thức. |
| 3.2 | ERD 18 bảng; từ điển từng trường, PK/FK, CHECK, index; DDL PostgreSQL và catalog seed synthetic. |
| 3.3 | Class Diagram nghiệp vụ và dịch vụ dự kiến; Class Diagram đối chiếu mã stub đang chạy; ba Sequence của luồng đánh giá, quyết định và quản trị rule trên Gateway hiện tại. Có nguồn draw.io. |
| 3.4 | OpenAPI 3.0.3 và Gateway FastAPI chạy stub. Frontend có thể gọi thử tạo ca, nhập dữ liệu, xem kết quả mẫu và ghi phản hồi. |

## Quyết định chính

Nhóm giữ ba vai trò đã thống nhất. Bác sĩ là người quyết định; dược sĩ dùng MedSafety; quản trị không tự duyệt quy tắc lâm sàng. API lưu phiên bản dữ liệu và chặn xác nhận đánh giá cũ. Các kết quả tuần 3 ghi rõ `stub`, chưa cung cấp chẩn đoán hoặc liều thuốc thực.

CSDL tách ca, lượt khám, chỉ số, thuốc, kết quả và quyết định để tránh dữ liệu lặp. Snapshot JSON chỉ dùng tái hiện căn cứ tại thời điểm đánh giá. C2 là kiến trúc **dự kiến** có các dịch vụ riêng. Mã bàn giao tuần 3 thực hiện khung API với các route, kiểm quyền và adapter stub trong một tiến trình FastAPI, lưu RAM. Việc gộp chỉ phục vụ thử hợp đồng API và giao diện ở Sprint 1; chưa coi như đã xây xong Core, bốn service hay lớp lưu trữ.

## Kiểm chứng và giới hạn

Đã chạy kiểm thử API cho luồng chuẩn, phân quyền, dữ liệu sai/thiếu, revision cũ, quyết định trùng và chặn rule chưa duyệt. Đã kiểm tra OpenAPI 3.0.3, đồng bộ hợp đồng với routing, phân tích cú pháp DDL PostgreSQL. Chi tiết và lệnh chạy nằm trong verification.md.

Rà soát với SRS mới: API đã tự sinh mã ca và thống nhất UUID với khóa ngoại DB; `case_access` cho phép nhiều phạm vi trên cùng ca. Từ điển dữ liệu đã sửa định dạng bảng Markdown, sơ đồ ERD được xuất lại từ metadata. Đây là kiểm tra **tính nhất quán của thiết kế và stub**, chưa nghiệm thu FR lâm sàng.

Chưa chạy DDL trên PostgreSQL thật trong môi trường tạo tài liệu; chưa kết nối HIS hoặc triển khai các dịch vụ độc lập. Chưa đánh giá độ đúng lâm sàng, hiệu năng tải, độ sẵn sàng hoặc bảo mật triển khai. Đây là các bước tiếp theo, không ghi nhận là đã hoàn thành.

## Việc tiếp theo

Đối chiếu các câu hỏi đang mở ở mục 12 SRS với thầy, đặc biệt danh mục dữ liệu và quyền duyệt chuyên môn; nối PostgreSQL vào Gateway; thay stub bằng module theo quy tắc/thuật toán đã được xác nhận; đối chiếu bộ điều chỉnh đầu ra mới. Bảng [đối chiếu SRS ↔ tuần 3](consistency_review.md) ghi rõ phần đã có và phần chưa có. Phân công cá nhân do nhóm điền theo người thực hiện thực tế.
