# Kiến trúc & Hợp đồng REST API Chặng C — Hệ thống Thu thập và Xác nhận Dữ liệu Lâm sàng Suy tim Trước AI

**Phiên bản đặc tả:** `1.0.0` (OpenAPI `3.1.0`)  
**Tệp đặc tả chính:** [`openapi.yaml`](./openapi.yaml)  
**Tài liệu căn cứ:**
- Hợp đồng kiến trúc Chặng C: `CONTRACT.md` (Mục 1, 3, 4)
- Bản bàn giao gốc: `BAN-GIAO-DEV-web-suy-tim-hai-luong-2026-11-19.md` (Mục 3.2, 4, 6.2)
- Ma trận màn hình – thao tác – dữ liệu Chặng B: `02-ma-tran-man-hinh-thao-tac-du-lieu.md`

Đặc tả `api/openapi.yaml` được giữ trong mã nguồn để phát triển và kiểm thử backend. Bản web public không xuất tệp này hay trang tài liệu API. Backend mặc định không phục vụ `/docs`, `/redoc` và các URL OpenAPI. Khi cần xem tài liệu trong môi trường nội bộ, đặt `MVP_ENABLE_API_DOCS=1` và chỉ chạy server trên `127.0.0.1`; tắt cấu hình này trước khi chạy trên địa chỉ public.

---

## 1. Tổng quan Kiến trúc API & Quy ước Đặt tên

Hệ thống cung cấp REST API có tiền tố chung **`/api/v1`**, phục vụ phạm vi **MVP gồm 3 nhóm chức năng**:
1. **Nhóm 1 — Hồ sơ bệnh án & Lượt khám:** Định danh bệnh nhân `BN-xxxxx` (Tầng 1) tách biệt với các lượt khám độc lập theo thời gian.
2. **Nhóm 2 — Tiếp nhận & Tiền xử lý dữ liệu nhập tay:** Biểu mẫu điều khiển bằng metadata (`FormTemplate` → `FormVersion` → `FormSection` → `FormField` → `FieldDefinition` / `FieldOption`), lưu nháp (Tầng 2), xem lại & kiểm tra điều kiện xác nhận (Tầng 3), tạo bản sửa sau xác nhận (`VisitRevision`), và xuất hợp đồng đầu vào chuẩn `AiInputPayload` kèm đánh giá sẵn sàng từng module AI (Tầng 4).
3. **Nhóm 6 — Quản trị hệ thống & Dữ liệu dùng chung:** Quản lý tài khoản Bác sĩ/Admin có bước xem trước quyền, quản lý vòng đời phiên bản biểu mẫu bất biến khi đã phát hành, và tra cứu nhật ký kiểm toán hệ thống (`AuditLog`).

### Quy ước đồng bộ 100% với Database & UML (`CONTRACT.md` Mục 4)
| Tầng thiết kế | Quy ước đặt tên | Ví dụ minh họa |
|---|---|---|
| **Bảng & Cột CSDL** | `snake_case` tiếng Anh, số ít | `app_user`, `form_version`, `visit_orthostatic_bp`, `row_version` |
| **OpenAPI Schema & UML Class** | `PascalCase` | `AppUser`, `FormVersion`, `OrthostaticBpMeasurement`, `VisitLabResult`, `VisitRevision`, `AiInputPayload` |
| **Thuộc tính JSON Payload** | `camelCase` | `patientCode`, `formVersionId`, `requiredForConfirm`, `rowVersion` |
| **Giá trị Enum** | `snake_case` | `patient_created`, `draft_saved`, `confirmed`, `ai_ready`, `can_xac_nhan` |
| **Mã 8 nhóm biểu mẫu (`SectionCode`)** | Tiếng Việt không dấu `snake_case` | `hanh_chinh`, `trieu_chung_dien_bien`, `sinh_ton_kham`, `benh_su_dong_mac`, `thuoc_di_ung`, `can_lam_sang`, `lao_khoa`, `ghi_chu` |

---

## 2. Xác thực (Authentication) & Quản lý Phiên (`M1`)

1. **Một cổng đăng nhập chung (`POST /api/v1/auth/login` — `login`):**
   - Cả Bác sĩ (`doctor`) và Quản trị viên (`admin`) đều đăng nhập bằng `username` và `password` qua cùng một endpoint.
   - Máy chủ tự xác định vai trò từ bản ghi `app_user.role` và trả về trong `AuthTokenResponse.user.role`. Client **không** được gửi tham số chọn hay nâng quyền vai trò.
   - Khi đăng nhập thất bại: trả `401 Unauthorized` với thông điệp chung (*"Tên đăng nhập hoặc mật khẩu không đúng"*), đồng thời ghi `AuditLog` (`action = login_failed`).
   - Khi tài khoản bị khóa (`is_active = false`): trả `403 Forbidden` và hướng dẫn liên hệ Quản trị viên.
2. **Cơ chế Cặp Token (`JWT Access Token` + `Refresh Token`):**
   - `accessToken`: JWT ngắn hạn (mặc định 900 giây / 15 phút), gửi qua header `Authorization: Bearer <accessToken>`, chứa các claim `sub` (`AppUser.id`), `role` (`doctor` | `admin`) và `sid` (`UserSession.id`).
   - `refreshToken`: Chuỗi ngẫu nhiên độ entropy cao, chỉ lưu **mã băm** (`refresh_token_hash`) trong bảng `user_session` kèm `expires_at` và `revoked_at`.
   - `POST /api/v1/auth/refresh` (`refreshToken`): Kiểm tra phiên chưa hết hạn và chưa thu hồi để xoay vòng token mới.
   - `POST /api/v1/auth/logout` (`logout`): Đánh dấu `revoked_at = NOW()` trên `user_session` và ghi `AuditLog` (`action = logout`).
3. **Bác sĩ tự đổi mật khẩu (`POST /api/v1/auth/change-password` — `changePassword`):** Chỉ tài khoản `doctor` đang đăng nhập được gửi `currentPassword` và `newPassword` (8–128 ký tự). Sai mật khẩu hiện tại trả `422 CURRENT_PASSWORD_INCORRECT` tại `currentPassword`; mật khẩu mới trùng mật khẩu cũ trả `422 FIELD_VALIDATION_FAILED` tại `newPassword`. Thành công trả `AppUser`, giữ phiên hiện tại, thu hồi mọi phiên khác của cùng tài khoản và ghi `user_update` không chứa giá trị mật khẩu.

---

## 3. Phân quyền RBAC & Ranh giới Tách biệt Dữ liệu Lâm sàng (Chốt `K8`)

Hệ thống áp dụng nguyên tắc **Tách quyền Quản trị khỏi Dữ liệu Lâm sàng** ở mọi endpoint:

| Nhóm Endpoint | Đường dẫn (`/api/v1/...`) | Bác sĩ (`doctor`) | Quản trị viên (`admin`) | Chính sách kiểm soát & Kiểm toán |
|---|---|:---:|:---:|---|
| **Phiên xác thực (M1)** | `/auth/login`, `/auth/refresh`, `/auth/logout`, `/auth/me` | Cho phép | Cho phép | Xác thực danh tính và định tuyến giao diện theo `role` từ server. |
| **Đổi mật khẩu (M1)** | `/auth/change-password` | **Cho phép, chỉ đổi cho mình** | **`403 Forbidden`** | Giữ phiên hiện tại; thu hồi các phiên khác sau khi đổi thành công. |
| **Hồ sơ bệnh nhân (M2, M3)** | `/patients`, `/patients/{patientId}` | **Cho phép** | **`403 Forbidden`** | `admin` không có quyền đọc hay chỉnh sửa hồ sơ bệnh nhân. |
| **Lượt khám & Lâm sàng (M3, M4, M5)** | `/patients/{patientId}/visits`, `/visits/{visitId}`, `/visits/{visitId}/form`, `/visits/{visitId}/draft`, `/visits/{visitId}/review`, `/visits/{visitId}/confirm`, `/visits/{visitId}/revisions`, `/visits/{visitId}/ai-input` | **Cho phép** | **`403 Forbidden`** | `admin` tuyệt đối không được đọc `visit`, `visit_value`, `visit_orthostatic_bp`, `visit_medication`, `visit_allergy`, `visit_lab_result`, `visit_revision` hay `AiInputPayload`. Mọi truy cập trái phép trả `403`. |
| **Quản trị tài khoản & Quyền (M6)** | `/admin/users`, `/admin/users/{userId}`, `/admin/users/permission-preview` | **`403 Forbidden`** | **Cho phép** | `doctor` gọi trực tiếp URL quản trị trả `403`. Không bao giờ lộ `password_hash`. |
| **Quản trị biểu mẫu & Phiên bản (M7)** | `/admin/field-definitions`, `/admin/forms`, `/admin/forms/{formId}/versions`, `/admin/form-versions/{versionId}*` | **`403 Forbidden`** *(chỉ đọc cấu trúc qua `getVisitForm`)* | **Cho phép** | Phiên bản `published` và `retired` khóa sửa trực tiếp ở cả hai vai trò (`409 Conflict`). |
| **Nhật ký kiểm toán (M8)** | `/admin/audit-logs` | **`403 Forbidden`** | **Cho phép** *(chỉ siêu dữ liệu)* | Trường `AuditLog.detail` chỉ lưu siêu dữ liệu (`requestId`, diff quyền, diff cấu trúc form, lý do khóa), **ẩn tuyệt đối mật khẩu và giá trị bệnh án lâm sàng**. |

> [!IMPORTANT]
> **Bảo vệ chống IDOR / Mass Assignment:**
> - Mã hồ sơ `patientCode` (`BN-\d{5}`) do server sinh tự động khi tạo (`createPatient`), đánh dấu `readOnly: true` và không thể sửa qua `updatePatient`.
> - Khi lưu nháp (`saveVisitDraft`) hoặc xác nhận (`confirmVisit`), máy chủ lấy `visitId` từ đường dẫn và kiểm tra ràng buộc khóa ngoại thực tế trên CSDL, không cho phép đổi `patientId` hoặc `formVersionId` của lượt khám.

---

## 4. Kiểm soát Đồng thời Lạc quan (`ETag` / `If-Match` / `rowVersion`) & Tính Bất biến

Mọi tài nguyên có trạng thái thay đổi (`Patient`, `Visit`, `FormVersion`, `AppUser`) đều mang trường số nguyên **`rowVersion`** (bắt đầu từ `1`, tự động tăng thêm `1` sau mỗi lần ghi thành công) và trả kèm header HTTP **`ETag: "<rowVersion>"`**.

1. **Yêu cầu khi Ghi (`PATCH`, `PUT`, `POST /confirm`, `POST /revisions`, `POST /publish`):**
   - Client bắt buộc gửi header **`If-Match: "<rowVersion>"`** cùng trường `rowVersion` trong body.
   - Nếu `rowVersion` của client nhỏ hơn hoặc khác `row_version` hiện tại trong CSDL (do một phiên làm việc khác vừa cập nhật), máy chủ từ chối ghi và trả về **`409 Conflict`** (`application/problem+json`) kèm trường `currentRowVersion` để giao diện hiển thị banner so sánh / tải lại bản mới nhất.
2. **Bảo vệ Tính Bất biến bằng `409 Conflict` (Chốt `K4`, `K5`):**
   - **Bất biến Phiên bản Biểu mẫu (`K4`):** Gọi `PATCH /api/v1/admin/form-versions/{versionId}` (`updateFormVersion`) trên phiên bản có `status = published` hoặc `retired` sẽ trả ngay **`409 Conflict`** (đồng thời CSDL có trigger chặn `UPDATE`/`DELETE`). Muốn thay đổi biểu mẫu, Admin bắt buộc gọi `createFormVersionDraft` để tạo bản nháp mới.
   - **Xóa bản nháp biểu mẫu:** `DELETE /api/v1/admin/form-versions/{versionId}` (`deleteFormVersionDraft`) chỉ dành cho Admin và chỉ xóa phiên bản còn `draft`, chưa gắn lượt khám. `If-Match` là tùy chọn ở endpoint này; nếu gửi thì phải khớp `rowVersion` hiện tại. Xóa thành công trả `200` với `deleted`, `versionId`, `versionLabel`; bản không tồn tại trả `404`, bản không được xóa hoặc lệch `If-Match` trả `409`, còn `If-Match` sai định dạng trả `422`.
   - **Khóa Lượt khám Đã xác nhận (`K5`):** Gọi `PUT /api/v1/visits/{visitId}/draft` (`saveVisitDraft`) hoặc gọi lại `confirmVisit` trên lượt khám đã có `status = confirmed` sẽ trả **`409 Conflict`**.
   - **Sửa/Bổ sung sau Xác nhận có Kiểm toán (`createVisitRevision`):** Khi cần bổ sung kết quả cận lâm sàng hoặc hiệu chỉnh sau khi đã xác nhận, bác sĩ gọi `POST /api/v1/visits/{visitId}/revisions` kèm `reason` (lý do bắt buộc). Hệ thống giữ nguyên bản chụp `VisitRevision` cũ đã xác nhận (không ghi đè lịch sử) và mở `revisionNo` kế tiếp. (Trong trường hợp hệ thống cấu hình khóa cứng tuyệt đối theo mặc định Q3, endpoint này trả `409 Conflict` với mã `VISIT_CONFIRMED_LOCKED`).

---

## 5. Chuẩn hóa Phản hồi Lỗi (`RFC 9457 ProblemDetails`) & Phân trang

### 5.1. Phản hồi lỗi `application/problem+json`
Tất cả các mã lỗi **`401`**, **`403`**, **`404`**, **`409`**, **`422`** trên toàn bộ 34 endpoint đều trả về cùng cấu trúc `ProblemDetails`:

| Mã HTTP | Tình huống nghiệp vụ điển hình | Mã `code` chuẩn hóa | Trường mở rộng trong `ProblemDetails` |
|---|---|---|---|
| **`401 Unauthorized`** | Sai tên đăng nhập/mật khẩu; thiếu JWT; JWT hết hạn hoặc phiên `UserSession` đã bị thu hồi | `AUTH_INVALID_CREDENTIALS`, `AUTH_TOKEN_EXPIRED`, `AUTH_SESSION_REVOKED` | `correlationId` (giữ nguyên bản nháp đang nhập trên client để đăng nhập lại tại chỗ) |
| **`403 Forbidden`** | Bác sĩ gọi `/admin/*`; Admin cố truy cập `/patients*` hoặc `/visits*`; tài khoản bị khóa (`is_active = false`) | `RBAC_ROLE_FORBIDDEN`, `CLINICAL_DATA_SEPARATION_ENFORCED`, `ACCOUNT_DEACTIVATED` | `correlationId` (mọi sự kiện `403` đều được ghi vào bảng `audit_log`) |
| **`404 Not Found`** | Không tồn tại `patientId`, `visitId`, `userId`, `formId` hoặc `versionId` | `RESOURCE_NOT_FOUND` | `instance`, `correlationId` |
| **`409 Conflict`** | Lệch `If-Match`/`rowVersion`; sửa `form_version` đã `published`; xóa `form_version` không còn là `draft` hoặc đang có lượt khám; sửa `visit` đã `confirmed`; gọi `getVisitAiInput` trên lượt `draft`; trùng `username`; tự khóa Admin cuối cùng | `CONCURRENCY_ROW_VERSION_MISMATCH`, `FORM_VERSION_IMMUTABLE`, `FORM_VERSION_NOT_DRAFT`, `FORM_VERSION_IN_USE`, `VISIT_ALREADY_CONFIRMED`, `VISIT_NOT_CONFIRMED_FOR_AI_INPUT`, `DUPLICATE_USERNAME` | `currentRowVersion` (số nguyên `rowVersion` hiện có trên máy chủ) |
| **`422 Unprocessable Entity`** | Giá trị trường sai kiểu hoặc vượt miền kỹ thuật (`SpO2 > 100`, `LVEF < 0`, `diastolic >= systolic`, `fromDate > toDate`); thiếu trường Tầng 3 khi gọi `confirmVisit`; mật khẩu hiện tại sai khi bác sĩ tự đổi; `If-Match` của lệnh xóa bản nháp sai định dạng | `FIELD_VALIDATION_FAILED`, `CURRENT_PASSWORD_INCORRECT`, `TIER3_CONFIRM_REQUIREMENTS_UNMET`, `INVALID_IF_MATCH` | `errors[]`: mảng `{ fieldCode, sectionCode, message, rejectedValue }` để UI tô đỏ và nhảy tới đúng ô |

### 5.2. Chuẩn Phân trang (`PaginationMeta`)
Các endpoint danh sách (`listPatients`, `listPatientVisits`, `listUsers`, `listAuditLogs`) sử dụng chung bộ tham số query `page` (mặc định `1`, `>= 1`) và `pageSize` (mặc định `20`, `1..100`), trả về đối tượng `pagination`:
```json
{
  "page": 1,
  "pageSize": 20,
  "totalItems": 42,
  "totalPages": 3
}
```

---

## 6. Hợp đồng Dữ liệu Đầu ra Chuẩn `AiInputPayload` (`getVisitAiInput`)

Endpoint **`GET /api/v1/visits/{visitId}/ai-input`** (`operationId: getVisitAiInput`) là điểm giao tiếp dữ liệu chuẩn hóa duy nhất để tầng tích hợp AI (4 module `ai_diagnosis`, `ai_lab_test`, `ai_treatment`, `ai_medsafety`) tiêu thụ ở giai đoạn sau.

### Các Quy tắc Nghiệp vụ Bắt buộc trên `AiInputPayload`
1. **Chỉ xuất dữ liệu đã xác nhận (Tầng 3 `confirmed`):**
   - Nếu lượt khám đang ở trạng thái `draft`, endpoint bắt buộc trả **`409 Conflict`** (`code: "VISIT_NOT_CONFIRMED_FOR_AI_INPUT"`).
2. **Bảo toàn 3 trạng thái câu trả lời (Chốt `K2`):**
   - **Trường chưa điền (`unfilled`):** Không có dòng trong `visit_value` và **không xuất hiện** trong bản đồ `values` của `AiInputPayload`.
   - **Trường bác sĩ chọn "Chưa rõ" (`unknown`):** Xuất hiện trong `values` với `state: "unknown"` và `value: null`.
   - **Trường đã có câu trả lời (`answered`):** Xuất hiện trong `values` với `state: "answered"`, kèm `value` đúng kiểu (`number`, `integer`, `string`, `boolean`, `array`) và `unit` chuẩn. Giá trị số `0` (ví dụ `so_lan_cap_cuu_nhap_vien = 0`) hoặc `false` được giữ nguyên chính xác, không bị biến thành `null`.
3. **Đính kèm đầy đủ các cấu trúc bản ghi lặp (Chốt `K6`, `K7`):**
   - `orthostaticBp[]`: Danh sách các lần đo huyết áp theo tư thế (`supine`, `sitting`, `standing`), thời gian sau thay đổi tư thế (`minuteAfter`), tâm thu, tâm trương, nhịp tim.
   - `medications[]`: Danh sách thuốc đang dùng / OTC / TPCN / YHCT kèm liều, đơn vị, tần suất, đường dùng, mức tuân thủ.
   - `allergies[]`: Danh sách dị ứng và phản ứng có hại (`allergy` / `adr`), bao gồm dị ứng thuốc cản quang.
   - `labResults[]`: Danh sách kết quả xét nghiệm và thăm dò cận lâm sàng có thời điểm đo (`measuredAt`) và đơn vị (`unit`), tách bạch hoàn toàn các mã `cls_bnp` vs `cls_nt_probnp`, `cls_creatinin` vs `cls_egfr`, `cls_lvef` vs `cls_sieu_am_tim_ket_luan`.
4. **Đánh giá độ sẵn sàng Tầng 4 cho từng Module AI (`modules[]` — Chốt `K1`):**
   - Mỗi phần tử `{ aiModuleCode, ready, missingFieldCodes[] }` được tính từ bảng `field_ai_module`.
   - Việc một module AI có `ready: false` (do bệnh nhân chưa làm xét nghiệm chuyên sâu) **không** ngăn cản bác sĩ xác nhận lượt khám ở Tầng 3, mà giúp tầng AI biết chính xác module nào đủ đầu vào và module nào đang thiếu trường nào.

---

## 7. Danh mục 34 Endpoint MVP theo 8 Màn hình (M1–M8)

| Màn hình | HTTP Method & Đường dẫn (`/api/v1`) | `operationId` | Vai trò được phép | Kiểm soát đồng thời |
|---|---|---|---|---|
| **M1** | `POST /auth/login` | `login` | Công khai (`doctor`, `admin`) | — |
| **M1** | `POST /auth/refresh` | `refreshToken` | `doctor`, `admin` | — |
| **M1** | `POST /auth/change-password` | `changePassword` | `doctor` (`admin` → `403`) | Khóa tài khoản, giữ phiên hiện tại, thu hồi phiên khác |
| **M1** | `POST /auth/logout` | `logout` | `doctor`, `admin` | — |
| **M1** | `GET /auth/me` | `getCurrentUser` | `doctor`, `admin` | — |
| **M2** | `GET /patients` | `listPatients` | `doctor` (`admin` → `403`) | — |
| **M2** | `POST /patients` | `createPatient` | `doctor` (`admin` → `403`) | Sinh `ETag` (`rowVersion = 1`) |
| **M3** | `GET /patients/{patientId}` | `getPatient` | `doctor` (`admin` → `403`) | Trả `ETag` |
| **M3** | `PATCH /patients/{patientId}` | `updatePatient` | `doctor` (`admin` → `403`) | Bắt buộc `If-Match` → `409` |
| **M3** | `GET /patients/{patientId}/visits` | `listPatientVisits` | `doctor` (`admin` → `403`) | — |
| **M4** | `POST /patients/{patientId}/visits` | `createVisit` | `doctor` (`admin` → `403`) | Sinh `ETag` (`rowVersion = 1`) |
| **M4** | `GET /visits/{visitId}` | `getVisit` | `doctor` (`admin` → `403`) | Trả `ETag` |
| **M4** | `GET /visits/{visitId}/form` | `getVisitForm` | `doctor` (`admin` → `403`) | — |
| **M4** | `PUT /visits/{visitId}/draft` | `saveVisitDraft` | `doctor` (`admin` → `403`) | Bắt buộc `If-Match` → `409` |
| **M5** | `GET /visits/{visitId}/review` | `getVisitReview` | `doctor` (`admin` → `403`) | — |
| **M5** | `POST /visits/{visitId}/confirm` | `confirmVisit` | `doctor` (`admin` → `403`) | Bắt buộc `If-Match` → `409` |
| **M5** | `POST /visits/{visitId}/revisions` | `createVisitRevision` | `doctor` (`admin` → `403`) | Bắt buộc `If-Match` → `409` |
| **M5** | `GET /visits/{visitId}/ai-input` | `getVisitAiInput` | `doctor` (`admin` → `403`) | Trả `409` nếu lượt khám còn `draft` |
| **M6** | `GET /admin/users` | `listUsers` | `admin` (`doctor` → `403`) | — |
| **M6** | `POST /admin/users` | `createUser` | `admin` (`doctor` → `403`) | Sinh `ETag`, trả `409` nếu trùng `username` |
| **M6** | `GET /admin/users/{userId}` | `getUser` | `admin` (`doctor` → `403`) | Trả `ETag` |
| **M6** | `PATCH /admin/users/{userId}` | `updateUser` | `admin` (`doctor` → `403`) | Bắt buộc `If-Match` → `409` |
| **M6** | `POST /admin/users/permission-preview` | `previewUserPermissions` | `admin` (`doctor` → `403`) | — |
| **M7** | `GET /admin/field-definitions` | `listFieldDefinitions` | `admin` (`doctor` → `403`) | — |
| **M7** | `GET /admin/forms` | `listForms` | `admin` (`doctor` → `403`) | — |
| **M7** | `GET /admin/forms/{formId}/versions` | `listFormVersions` | `admin` (`doctor` → `403`) | — |
| **M7** | `POST /admin/forms/{formId}/versions` | `createFormVersionDraft` | `admin` (`doctor` → `403`) | Sinh `ETag`, trả `409` nếu đã có bản `draft` |
| **M7** | `GET /admin/form-versions/{versionId}` | `getFormVersion` | `admin` (`doctor` → `403`) | Trả `ETag` |
| **M7** | `PATCH /admin/form-versions/{versionId}` | `updateFormVersion` | `admin` (`doctor` → `403`) | Bắt buộc `If-Match`; trả `409` nếu đã `published` |
| **M7** | `DELETE /admin/form-versions/{versionId}` | `deleteFormVersionDraft` | `admin` (`doctor` → `403`) | `If-Match` tùy chọn; nếu gửi mà lệch thì `409` |
| **M7** | `GET /admin/form-versions/{versionId}/preview` | `previewFormVersion` | `admin` (`doctor` → `403`) | Tính khi gọi (không lưu bảng) |
| **M7** | `GET /admin/form-versions/{versionId}/diff` | `diffFormVersion` | `admin` (`doctor` → `403`) | Tính khi gọi (không lưu bảng) |
| **M7** | `POST /admin/form-versions/{versionId}/publish` | `publishFormVersion` | `admin` (`doctor` → `403`) | Bắt buộc `If-Match` → `409` |
| **M8** | `GET /admin/audit-logs` | `listAuditLogs` | `admin` (`doctor` → `403`) | — |

---

## 8. Danh sách Các Tuyến `future` Ngoài Phạm vi MVP (Đã Loại bỏ Khỏi `openapi.yaml`)

Theo đúng chốt **K9** của `CONTRACT.md` và Mục 6.2 của `BAN-GIAO-DEV-web-suy-tim-hai-luong-2026-11-19.md`, toàn bộ các tuyến dưới đây thuộc tầm nhìn dài hạn (Nhóm chức năng 3, 4, 5 hoặc tích hợp bệnh viện giai đoạn sau) và **đã được xóa sạch 100% khỏi `openapi.yaml`** để frontend tuyệt đối không gọi như chức năng đang chạy:

| Phân nhóm chức năng tương lai (`future`) | Các tuyến cũ đã loại bỏ khỏi OpenAPI MVP | Lý do loại khỏi MVP & Hướng xử lý hiện tại |
|---|---|---|
| **1. Nhập dữ liệu từ tệp bảng tính / Kết nối trực tiếp hệ thống bệnh viện** | *(Đã gỡ toàn bộ các tuyến tải tệp bảng tính và đồng bộ trực tiếp hệ thống thông tin bệnh viện/xét nghiệm từ bản demo cũ)* | MVP ưu tiên **nhập tay có cấu trúc** và kiểm chứng chất lượng dữ liệu lâm sàng. Tệp mẫu của bệnh viện chỉ dùng để đối chiếu từ điển trường ở Chặng A. |
| **2. Thực thi / Mô phỏng kết quả 4 Module AI (Nhóm chức năng 3 & 4)** | *(Đã gỡ toàn bộ các tuyến gọi suy luận/dự đoán giả lập cho 4 module `AI Diagnosis`, `AI Lab/Test`, `AI Treatment`, `AI MedSafety` và phản hồi cảnh báo AI)* | Hệ thống MVP là **web thu thập & xác nhận dữ liệu trước AI**. Không sinh kết quả chẩn đoán/điều trị giả. Điểm nối duy nhất với tầng AI là hợp đồng dữ liệu đầu ra **`GET /api/v1/visits/{visitId}/ai-input`** (`AiInputPayload`). |
| **3. Cổng thông tin bệnh nhân ngoại trú & Tự theo dõi tại nhà (Nhóm chức năng 5)** | *(Đã gỡ toàn bộ các tuyến dành cho bệnh nhân tự đăng nhập, nhật ký triệu chứng tại nhà, nhắc uống thuốc ngoại trú)* | MVP chỉ có 2 vai trò đăng nhập là **Bác sĩ (`doctor`)** và **Quản trị viên (`admin`)**. |
| **4. Khôi phục sao lưu tự động trên giao diện Web (Nhóm chức năng 6 mở rộng)** | *(Không mở endpoint khôi phục CSDL trực tiếp qua giao diện web)* | Tránh rủi ro ghi đè dữ liệu lâm sàng khi chưa có quy trình phê duyệt vận hành và môi trường kiểm thử khôi phục cô lập. |
