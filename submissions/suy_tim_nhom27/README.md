# HFCARE · MVP thu thập dữ liệu suy tim · Nhóm 27

HFCARE hỗ trợ bác sĩ nhập, kiểm tra và xác nhận dữ liệu lượt khám. Quản trị viên quản lý tài khoản, phiên bản biểu mẫu và nhật ký kiểm toán. Backend FastAPI lưu dữ liệu vào PostgreSQL. Bản MVP chuẩn hóa dữ liệu đầu vào cho AI và dùng dữ liệu tổng hợp để minh họa.

## Tài liệu MVP

| Tài liệu | Nội dung |
| --- | --- |
| [Đặc tả yêu cầu phần mềm (SRS)](docs/SRS.md) | Yêu cầu chức năng, phi chức năng và quy tắc nghiệp vụ |
| [Phạm vi sản phẩm](docs/MVP_Scope.md) | Phạm vi của phiên bản MVP |
| [User Stories và Use Cases](docs/Use_Cases.md) | Luồng bác sĩ, quản trị và tiêu chí nghiệm thu |
| [Ma trận truy vết (RTM)](docs/RTM.md) · [Excel](docs/RTM.xlsx) | Liên kết yêu cầu, API, dữ liệu và ca kiểm thử |
| [Kiến trúc phần mềm và UML](docs/architecture/Software_Architecture.md) | Kiến trúc phân lớp, ERD, sơ đồ lớp và sơ đồ tuần tự |
| [ERD](database/erd.md) · [Từ điển dữ liệu](database/data_dictionary.md) · [Ánh xạ nguồn](database/source_mapping.md) | Mô hình PostgreSQL và nguồn dữ liệu |
| [Hợp đồng REST API](api/README.md) · [OpenAPI](api/openapi.yaml) | Endpoint, phân quyền và cấu trúc dữ liệu |

## Chạy trên máy

Từ thư mục `submissions/suy_tim_nhom27`, tạo database PostgreSQL 16 trở lên để thử, ví dụ `hfcare_mvp`. Nạp ba tệp theo thứ tự dưới đây vào database mới tạo.

```powershell
python -m pip install -r requirements.txt
psql -h 127.0.0.1 -p 5432 -U postgres -d hfcare_mvp -v ON_ERROR_STOP=1 `
  -f database/schema.sql -f database/seed.sql `
  -f database/migrations/005_visit_amendment_reopen.sql
```

Đặt `MVP_DATABASE_URL` trong phiên terminal theo host, cổng, database và tài khoản PostgreSQL của máy, rồi chạy `python scripts/run_mvp.py`. Nếu dùng PowerShell 7 và PostgreSQL yêu cầu mật khẩu, có thể nhập qua `Read-Host -MaskInput`.

```powershell
$env:MVP_DATABASE_URL = 'host=127.0.0.1 port=5432 dbname=hfcare_mvp user=postgres'
$env:PGPASSWORD = Read-Host 'Mật khẩu PostgreSQL local' -MaskInput
python scripts/run_mvp.py
```

Mở [HFCARE local](http://127.0.0.1:8000/) và kiểm tra [kết nối PostgreSQL](http://127.0.0.1:8000/health). Sau khi dừng app, đóng phiên terminal hoặc chạy `Remove-Item Env:PGPASSWORD` để xóa mật khẩu khỏi phiên.

## SQL dùng cho bản deploy

- [`schema.sql`](database/schema.sql) dựng lược đồ MVP. [`seed.sql`](database/seed.sql) nạp danh mục biểu mẫu và hai tài khoản demo.
- [Migration 005](database/migrations/005_visit_amendment_reopen.sql) cập nhật quy tắc mở lại lượt khám đã xác nhận.
- Railway khởi tạo database mới qua [`bootstrap_hosted_mvp.py`](scripts/bootstrap_hosted_mvp.py). Web kết nối qua `MVP_DATABASE_URL` bằng vai trò database giới hạn quyền.
- Migration 001–004 và [`portal_permissions.sql`](database/portal_permissions.sql) còn được dùng bởi các script và kiểm thử Gateway cũ. Bộ khởi tạo MVP trên Railway áp dụng ba tệp nêu trên.

Từ gốc repository, chạy `python scripts/validate_submission.py submissions/suy_tim_nhom27` để kiểm tra cấu trúc bài nộp.
