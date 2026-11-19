# Nhóm 27 — Hệ thống quản lý bệnh nhân suy tim

Tài liệu hiện hành mô tả hệ thống web suy tim. MVP ưu tiên nhóm chức năng **1. Hồ sơ và lượt khám**, **2. Tiếp nhận và tiền xử lý dữ liệu**, **6. Quản trị hệ thống**. Các nhóm chức năng còn lại thuộc lộ trình tiếp theo. Mã Gateway tuần 3 là bản thử độc lập, chưa được nối với cơ sở dữ liệu MVP.

## Tài liệu và vị trí tệp

| Nội dung | Vị trí | Trạng thái |
|---|---|---|
| Yêu cầu và truy vết | [SRS](docs/SRS-v1.0.md), [Use Case](<docs/Đặc tả usecase đầy đủ.md>), [User Story](docs/User-Stories.md), [RTM](docs/RTM.md) | RTM đã liên kết FR với UC và nhóm bảng dự kiến; cần đối chiếu lại với DDL MVP trước khi kết luận độ phủ schema. |
| C4 C1/C2 | [Thuyết minh kiến trúc](docs/architecture/architecture.md), [ảnh và nguồn](docs/architecture/) | Có ảnh và tệp `.drawio` riêng cho C1, C2. |
| ERD | [Thiết kế dữ liệu](docs/thiet-ke-du-lieu.md), [ảnh và nguồn](docs/architecture/) | Bốn cặp ảnh và tệp `.drawio`. |
| Thiết kế UML Class và Sequence | [Thiết kế hướng đối tượng](docs/thiet-ke-UML.md), [ảnh và nguồn](docs/architecture/) | Hai Class Diagram và ba Sequence Diagram cho MVP nhóm 1, 2, 6; là thiết kế, chưa phải mã đã triển khai. DFD hiện hành chưa bổ sung vào bộ này. |
| Cơ sở dữ liệu MVP | [Hướng dẫn database](database/README.md), [DDL](database/mvp/schema.sql), [seed biểu mẫu](database/mvp/seed-form-v1.sql) | Tạo CSDL PostgreSQL mới; chưa phải migration từ bản demo. |
| OpenAPI và Gateway MVP | [Đặc tả OpenAPI](api/openapi.yaml), [hướng dẫn API](api/README.md), [khung API](src/mvp_gateway/) | Hợp đồng nhóm 1, 2, 6 và stub RAM cho frontend; chưa kết nối CSDL hay xử lý file thật. |
| Gateway tuần 3 lưu tham khảo | [Đặc tả cũ](api/openapi-week3.yaml), [mã cũ](src/gateway/) | Bài thử độc lập, tiếp tục được kiểm thử; không là hợp đồng MVP. |

`database/schema.sql` và `database/seed.sql` là bộ SQL tuần 3 được `compose.yaml` và kiểm thử Gateway tham chiếu. Không chạy chung với bộ SQL trong `database/mvp/` trên cùng một CSDL.

## Kiểm tra bài nộp

Từ gốc repository, chạy `python scripts/validate_submission.py submissions/suy_tim_nhom27`. Workflow `validate-nhom27-submit.yml` kiểm tra các PR vào nhánh `submit/suy_tim-nhom27`: giới hạn tệp nộp, mã Python, OpenAPI, JSON, sơ đồ draw.io, liên kết trong tài liệu được sửa, kiểm thử Gateway và các schema PostgreSQL hiện có. Kết quả kiểm thử CSDL MVP được ghi trong [tài liệu kiểm thử](docs/internal/kiem-thu-co-so-du-lieu-MVP.md).
