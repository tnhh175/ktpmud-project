# Thiết kế API MVP

## Mục lục

1. [Phạm vi và nguồn](#1-phạm-vi-và-nguồn)
2. [Hợp đồng và nhóm endpoint](#2-hợp-đồng-và-nhóm-endpoint)
3. [Dữ liệu, quyền và lỗi](#3-dữ-liệu-quyền-và-lỗi)
4. [Chạy và kiểm tra](#4-chạy-và-kiểm-tra)
5. [Giới hạn và bước tiếp](#5-giới-hạn-và-bước-tiếp)

## 1 Phạm vi và nguồn

`openapi.yaml` là hợp đồng OpenAPI 3.0.3 cho MVP **nhóm 1 (hồ sơ/lượt khám), nhóm 2 (tiếp nhận dữ liệu), nhóm 6 (quản trị)**; có lịch khám/khung giờ vì đây là dữ liệu liên quan trong schema. Căn cứ: [SRS](../docs/SRS-v1.0.md), [Use Case](<../docs/Đặc tả usecase đầy đủ.md>), [thiết kế dữ liệu](../docs/thiet-ke-du-lieu.md), [DDL](../database/mvp/schema.sql) và sơ đồ UML ở PR công việc 3.3. Bốn module AI, cổng bệnh nhân và kết nối trực tiếp HIS/LIS/PACS chưa thuộc hợp đồng MVP này. HIS là nguồn dữ liệu **qua file do bác sĩ nhập**; API không gọi HIS và không ghi trả bệnh viện.

`openapi-week3.yaml` và `src/gateway/` giữ lại bài thử tuần 3 để kiểm thử cũ tiếp tục chạy. Chúng dùng mô hình dữ liệu khác, không là chuẩn API MVP.

## 2 Hợp đồng và nhóm endpoint

| Nhóm | Đường dẫn chính | Vai trò | Bảng dữ liệu đích | Khung chạy hiện tại |
| --- | --- | --- | --- | --- |
| Đăng nhập | `/auth/token`, `/auth/me` | Bác sĩ, admin | `app_user`, `app_role`, `user_role` | Token giả lập, chưa kiểm tra mật khẩu thật |
| Hồ sơ và lượt khám | `/patients`, `/patients/{id}/encounters`, `/encounters/{id}` | Bác sĩ tạo/sửa; cả hai xem | `patient`, `encounter`, bảng định danh | Dữ liệu RAM; mã `BN-xxxxx`, `LK-xxxxx` |
| Biểu mẫu | `/form-versions`, `/form-versions/{id}/publish` | Admin quản lý; bác sĩ xem | `form_template`, `form_version`, `form_section`, `form_field`, `field_option` | Bản mẫu giả lập; khóa bản đã phát hành/dùng |
| Khám và thuốc | `/encounters/{id}/observations/...`, `/medications` | Bác sĩ ghi; cả hai xem | `observation`, `observation_version`, `medication_entry` | Ghi RAM, kiểm tra loại/phiên bản cơ bản |
| Nhập file | `/mapping-profiles`, `/imports/preview`, `/imports/{id}/apply` | Admin cấu hình; bác sĩ gửi/đối chiếu | `mapping_profile`, `mapping_rule`, `import_batch`, `import_item`, `import_application` | Chỉ nhận request, **chưa phân tích file**; apply trả 409 |
| Lịch khám | `/clinic-slots`, `/appointments` | Admin tạo khung; bác sĩ đặt lịch | `clinic_slot`, `appointment` | Kiểm tra sức chứa trong RAM |
| Quản trị | `/admin/users`, `/admin/audit-events`, `/admin/backups` | Admin | `app_user`, `audit_event` | Tài khoản giả lập; nhật ký trống; sao lưu trả 501 |

Tiền tố endpoint nghiệp vụ là `/api/v1`. Mỗi method, tham số, request body và response code ở [openapi.yaml](openapi.yaml). Swagger UI khi chạy khung API: `http://127.0.0.1:8003/docs`.

## 3 Dữ liệu, quyền và lỗi

- Mỗi bệnh nhân có mã `BN-xxxxx`; mỗi lượt khám gắn đúng một bệnh nhân và một phiên bản biểu mẫu đã phát hành. Stub chỉ có hai trường minh họa; **66 trường** thật ở seed thiết kế dữ liệu, chưa nạp vào RAM.
- `observation` dùng `field_id` và `event_key` cho nhiều lần đo. Giá trị gồm `known`, `unknown`, `not_applicable`; `known` phải có đúng một giá trị đúng kiểu. `unknown` không biến thành số 0. Số 0 do bác sĩ tự xác nhận có thể hợp lệ; số 0 từ file cần chờ đối chiếu khi triển khai parser.
- File nhập dùng `application/octet-stream` và metadata trong query. Tài liệu kỹ thuật giả định file mẫu Excel. `preview` chỉ kiểm tra bệnh nhân/lượt/phiên bản, trả `stub_unparsed` và không lưu byte file. `apply` luôn trả 409. Frontend không được hiển thị “đã nhập thành công”.
- `BearerAuth` áp dụng cho mọi endpoint nghiệp vụ trừ lấy token. Lỗi `{code, message}`; mã 401 chưa đăng nhập, 403 thiếu quyền, 404 không tìm thấy, 409 xung đột, 422 sai dữ liệu, 501 chưa triển khai.
- Thuộc tính `x-implementation-status` trong hợp đồng phân biệt `in-memory-mock` và `placeholder`. Endpoint placeholder trả 501, riêng xác nhận nhập file trả 409 để ngăn báo ghi thành công. API cho chỉ định cận lâm sàng cũng là placeholder vì DDL MVP hiện chưa có bảng chỉ định riêng; cần xử lý khoảng trống này ở vòng thiết kế dữ liệu tiếp theo.
- API thật phải kiểm tra quyền theo bản ghi, giao dịch và ràng buộc PostgreSQL. Kiểm tra RAM không bảo đảm đồng thời, lịch sử phiên bản bền vững hay an toàn triển khai.

## 4 Chạy và kiểm tra

Từ `submissions/suy_tim_nhom27`:

```powershell
python -m pip install -r requirements-dev.txt
python -m uvicorn src.mvp_gateway.main:app --host 127.0.0.1 --port 8003
```

Hai tài khoản **chỉ dùng local**: `doctor_demo` và `admin_demo`, mật khẩu `demo-only`. Stub không kết nối database. Sau khi sửa route/model:

```powershell
python scripts/export_mvp_openapi.py
python -m pytest tests/test_mvp_gateway.py tests/test_gateway.py -q
```

Kiểm thử mới xác thực OpenAPI 3.0.3 khớp route, quyền, phiên bản biểu mẫu, giá trị thiếu/số 0, giới hạn nhập file và sức chứa lịch.

## 5 Giới hạn và bước tiếp

Đây là **skeleton/stub** của công việc 3.4. Trước khi dùng với dữ liệu bệnh viện cần nối PostgreSQL và seed biểu mẫu, xác thực thật, lịch sử quan sát không sửa bản cũ, parser và ánh xạ Excel, đối chiếu số 0/NULL, quản lý tài khoản đầy đủ, ghi audit, sao lưu/khôi phục, giao dịch đồng thời và kiểm thử quyền. `database/mvp/schema.sql` tạo CSDL mới, không phải migration từ demo. Không dùng token và mật khẩu thử nghiệm khi triển khai.
