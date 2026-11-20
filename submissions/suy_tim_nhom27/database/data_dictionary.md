# Từ điển Dữ liệu CSDL (`data_dictionary.md`)

**Phiên bản schema:** `1.0.0` (PostgreSQL 16+)  
**Nguồn sự thật:** `CONTRACT.md`, `CR-W1-01.md`, [`schema_metadata.json`](./schema_metadata.json), `trace-table.xlsx`.  
**Tổng quan:** `19` bảng quan hệ (`16` bảng hợp đồng + `visit_lab_result`, `visit_revision`, `visit_value_option`), `10` kiểu `ENUM`, `13` hàm PL/pgSQL, `19` trigger, `121` định nghĩa trường trong `field_definition` (`95` `mvp` + `26` `can_xac_nhan`, `0` mã từ `65` dòng đầu ra AI).

---

## 1. Kiểu Enum (`CONTRACT.md` Mục 4.2)

| Enum | Giá trị hợp lệ (`snake_case`) | Mục đích sử dụng |
|---|---|---|
| `user_role` | `doctor`, `admin` | Vai trò tài khoản trong `app_user` (mỗi tài khoản 1 vai trò). |
| `visit_status` | `draft`, `confirmed` | Trạng thái lượt khám trong `visit` (`confirmed` khóa sửa trực tiếp). |
| `value_state` | `answered`, `unknown` | Phân biệt 'Chưa rõ' (`unknown`) với 'Có câu trả lời' (`answered`); chưa điền = không có dòng. |
| `form_version_status` | `draft`, `published`, `retired` | Vòng đời phiên bản biểu mẫu (`published`/`retired` bất biến ở DB). |
| `field_scope_status` | `mvp`, `can_xac_nhan` | Phân tách 95 mã `mvp` với 26 mã `can_xac_nhan`. |
| `field_data_type` | `number`, `integer`, `text`, `boolean`, `date`, `single_choice`, `multi_choice` | 7 kiểu dữ liệu chuẩn của `field_definition`. |
| `section_code` | `hanh_chinh`, `trieu_chung_dien_bien`, `sinh_ton_kham`, `benh_su_dong_mac`, `thuoc_di_ung`, `can_lam_sang`, `lao_khoa`, `ghi_chu` | 8 nhóm biểu mẫu UX giữ nguyên tiếng Việt từ Chặng A. |
| `readiness_tier` | `patient_created`, `draft_saved`, `confirmed`, `ai_ready` | 4 tầng sẵn sàng tách biệt (K1): hồ sơ BN, nháp, xác nhận, đủ đầu vào AI. |
| `bp_position` | `supine`, `sitting`, `standing` | Tư thế đo huyết áp trong `visit_orthostatic_bp` (`supine`, `sitting`, `standing`). |
| `audit_action` | `login`, `logout`, `login_failed`, `user_create`, `user_update`, `form_version_create`, `form_version_update`, `form_version_publish`, `patient_create`, `visit_confirm` | 10 hành động kiểm toán chuẩn trong `audit_log`. |

## 2. Mã 4 Module AI (`field_ai_module` — đối chiếu nguyên văn `TL06`)

| `ai_module_code` | Tên nguyên văn trong `TL06` | Vai trò trong kiến trúc |
|---|---|---|
| `ai_diagnosis` | `Model 1 – AI Diagnosis` | Hợp đồng đầu vào tầng 4 (`ai_ready`); **không** chạy AI giả và **không** chặn xác nhận tầng 3. |
| `ai_lab_test` | `Model 2 – AI Lab/Test` | Hợp đồng đầu vào tầng 4 (`ai_ready`); **không** chạy AI giả và **không** chặn xác nhận tầng 3. |
| `ai_treatment` | `Model 3 – AI Treatment` | Hợp đồng đầu vào tầng 4 (`ai_ready`); **không** chạy AI giả và **không** chặn xác nhận tầng 3. |
| `ai_medsafety` | `Model 4 – AI MedSafety` | Hợp đồng đầu vào tầng 4 (`ai_ready`); **không** chạy AI giả và **không** chặn xác nhận tầng 3. |

---

## 3. Từ điển 19 Bảng Quan hệ & Ràng buộc DDL

### 3.1. `app_user` (`AppUser`)
> Tài khoản người dùng hệ thống (bác sĩ hoặc quản trị viên); không chứa thông tin bệnh nhân.

| Cột | Kiểu dữ liệu | Null | Mặc định | Khóa / Tham chiếu / Ràng buộc | Diễn giải |
|---|---|---|---|---|---|
| `id` | `uuid` | NO | `gen_random_uuid()` | PK; UNIQUE | Khóa nội bộ UUID |
| `username` | `varchar(64)` | NO | — | UNIQUE; CHECK: `length(trim(username)) >= 3 AND username ~ '^[a-zA-Z0-9_.-]+$'` | Tên đăng nhập duy nhất |
| `password_hash` | `text` | NO | — | CHECK: `length(trim(password_hash)) > 0` | Mật khẩu đã băm (Argon2id/bcrypt), không lưu văn bản rõ |
| `full_name` | `varchar(120)` | NO | — | CHECK: `length(trim(full_name)) > 0` | Họ và tên hiển thị |
| `role` | `user_role` | NO | — | — | Vai trò duy nhất của tài khoản: doctor hoặc admin |
| `is_active` | `boolean` | NO | `true` | — | Trạng thái kích hoạt tài khoản |
| `row_version` | `integer` | NO | `1` | CHECK: `row_version > 0` | Phiên bản lạc quan ETag chống ghi đè đồng thời (C4) |
| `created_at` | `timestamptz` | NO | `now()` | — | Thời điểm tạo |
| `updated_at` | `timestamptz` | NO | `now()` | — | Thời điểm cập nhật gần nhất |

- **Ràng buộc bảng (`CHECK`):** `chk_app_user_username_fmt` (`length(trim(username)) >= 3 AND username ~ '^[a-zA-Z0-9_.-]+$'`); `chk_app_user_full_name_nonempty` (`length(trim(full_name)) > 0`); `chk_app_user_password_hash_nonempty` (`length(trim(password_hash)) > 0`); `chk_app_user_row_version_pos` (`row_version > 0`)
- **Khóa duy nhất (`UNIQUE`):** `uq_app_user_username` (username)
- **Chỉ mục (`INDEX`):** `ix_app_user_role_active` trên `(role, is_active)`
- **Trigger bảo toàn:** `trg_app_user_row_version` (BEFORE UPDATE): Tự động tăng `row_version` và chặn giảm `row_version` (C4); `trg_app_user_updated_at` (BEFORE UPDATE): Tự động cập nhật updated_at

### 3.2. `user_session` (`UserSession`)
> Phiên đăng nhập lưu refresh token đã băm, thời hạn và trạng thái thu hồi.

| Cột | Kiểu dữ liệu | Null | Mặc định | Khóa / Tham chiếu / Ràng buộc | Diễn giải |
|---|---|---|---|---|---|
| `id` | `uuid` | NO | `gen_random_uuid()` | PK; UNIQUE | Khóa nội bộ phiên |
| `user_id` | `uuid` | NO | — | FK → `app_user(id)` | Tài khoản sở hữu phiên |
| `refresh_token_hash` | `varchar(128)` | NO | — | UNIQUE; CHECK: `length(trim(refresh_token_hash)) > 0` | Refresh token đã băm SHA-256 |
| `expires_at` | `timestamptz` | NO | — | — | Thời điểm hết hạn |
| `revoked_at` | `timestamptz` | YES | — | — | Thời điểm thu hồi (NULL nếu còn hiệu lực) |
| `ip` | `inet` | YES | — | — | Địa chỉ IP khởi tạo phiên |
| `user_agent` | `varchar(255)` | YES | — | — | Thông tin trình duyệt/thiết bị |
| `created_at` | `timestamptz` | NO | `now()` | — | Thời điểm tạo phiên |

- **Ràng buộc bảng (`CHECK`):** `chk_user_session_hash_nonempty` (`length(trim(refresh_token_hash)) > 0`); `chk_user_session_expires_after_create` (`expires_at > created_at`); `chk_user_session_revoked_after_create` (`revoked_at IS NULL OR revoked_at >= created_at`)
- **Khóa duy nhất (`UNIQUE`):** `uq_user_session_token_hash` (refresh_token_hash)
- **Chỉ mục (`INDEX`):** `ix_user_session_user_active` trên `(user_id, expires_at)` WHERE `revoked_at IS NULL`

### 3.3. `patient` (`Patient`)
> Hồ sơ bệnh nhân hành chính tối thiểu (tầng 1); mã BN-xxxxx bất biến, không ép BHYT/ICD và không bịa ngày sinh 01/01.

| Cột | Kiểu dữ liệu | Null | Mặc định | Khóa / Tham chiếu / Ràng buộc | Diễn giải |
|---|---|---|---|---|---|
| `id` | `uuid` | NO | `gen_random_uuid()` | PK; UNIQUE | Khóa nội bộ UUID |
| `patient_code` | `varchar(16)` | NO | — | UNIQUE; CHECK: `patient_code ~ '^BN-[0-9]{5}$'` | Mã hồ sơ bệnh nhân chuẩn BN-xxxxx do server sinh, bất biến |
| `external_patient_code` | `varchar(64)` | YES | — | — | Mã định danh ngoài / HIS tham chiếu nếu có (tách riêng) |
| `full_name` | `varchar(120)` | NO | — | CHECK: `length(trim(full_name)) >= 2` | Họ tên hoặc ký hiệu hồ sơ giả lập |
| `sex` | `varchar(16)` | NO | — | CHECK: `sex IN ('male', 'female', 'unknown')` | Giới tính sinh học (male, female, unknown) |
| `birth_date` | `date` | YES | — | CHECK: `birth_date IS NULL OR (birth_date >= DATE '1900-01-01' AND birth_date <= CURRENT_DATE)` | Ngày sinh chính xác (NULL nếu chỉ biết năm sinh/tuổi) |
| `birth_year` | `smallint` | YES | — | CHECK: `birth_year IS NULL OR (birth_year BETWEEN 1900 AND 2100)` | Năm sinh khi không biết ngày/tháng |
| `declared_age` | `smallint` | YES | — | CHECK: `declared_age IS NULL OR (declared_age BETWEEN 0 AND 120)` | Tuổi khai báo/ước lượng khi không biết ngày/năm sinh |
| `row_version` | `integer` | NO | `1` | CHECK: `row_version > 0` | Phiên bản lạc quan chống ghi đè đồng thời (ETag) |
| `created_by` | `uuid` | NO | — | FK → `app_user(id)` | Bác sĩ tạo hồ sơ |
| `created_at` | `timestamptz` | NO | `now()` | — | Thời điểm tạo |
| `updated_at` | `timestamptz` | NO | `now()` | — | Thời điểm cập nhật |

- **Ràng buộc bảng (`CHECK`):** `chk_patient_code_fmt` (`patient_code ~ '^BN-[0-9]{5}$'`); `chk_patient_full_name_len` (`length(trim(full_name)) >= 2`); `chk_patient_sex` (`sex IN ('male', 'female', 'unknown')`); `chk_patient_birth_date_range` (`birth_date IS NULL OR (birth_date >= DATE '1900-01-01' AND birth_date <= CURRENT_DATE)`); `chk_patient_birth_year_range` (`birth_year IS NULL OR (birth_year BETWEEN 1900 AND 2100)`); `chk_patient_declared_age_range` (`declared_age IS NULL OR (declared_age BETWEEN 0 AND 120)`); `chk_patient_age_precision_mutex` (`num_nonnulls(birth_date, birth_year, declared_age) <= 1`); `chk_patient_row_version_pos` (`row_version > 0`)
- **Khóa duy nhất (`UNIQUE`):** `uq_patient_code` (patient_code)
- **Chỉ mục (`INDEX`):** `ix_patient_full_name` trên `(full_name)`; `ix_patient_external_code` trên `(external_patient_code)` WHERE `external_patient_code IS NOT NULL`
- **Trigger bảo toàn:** `trg_patient_immutable_code` (BEFORE UPDATE): Chặn sửa patient_code sau khi cấp; `trg_patient_updated_at` (BEFORE UPDATE): Tự động cập nhật updated_at

### 3.4. `field_definition` (`FieldDefinition`)
> Danh mục chuẩn hóa các trường dữ liệu trích từ trace-table.xlsx (95 mã mvp + 26 mã can_xac_nhan, 0 mã đầu ra AI).

| Cột | Kiểu dữ liệu | Null | Mặc định | Khóa / Tham chiếu / Ràng buộc | Diễn giải |
|---|---|---|---|---|---|
| `id` | `uuid` | NO | `gen_random_uuid()` | PK; UNIQUE | Khóa nội bộ UUID |
| `code` | `varchar(80)` | NO | — | UNIQUE; CHECK: `code ~ '^[a-z][a-z0-9_]*$'` | Mã trường ổn định trích từ trace-table.xlsx |
| `label_vi` | `varchar(200)` | NO | — | CHECK: `length(trim(label_vi)) > 0` | Nhãn tiếng Việt hiển thị trên biểu mẫu |
| `section_code` | `section_code` | NO | — | — | Nhóm biểu mẫu mặc định trong 8 nhóm chuẩn |
| `data_type` | `field_data_type` | NO | — | — | Kiểu dữ liệu hợp đồng (7 giá trị enum) |
| `canonical_unit` | `varchar(40)` | YES | — | — | Đơn vị chuẩn của trường (NULL nếu không có đơn vị) |
| `scope_status` | `field_scope_status` | NO | — | — | Phạm vi: mvp hoặc can_xac_nhan |
| `storage_level` | `varchar(24)` | NO | `'visit_value'` | CHECK: `storage_level IN ('patient', 'visit_value', 'computed', 'orthostatic_bp', 'medication', 'allergy', 'lab_result')` | Nơi lưu trữ vật lý trong CSDL chuẩn hóa |
| `is_calculated` | `boolean` | NO | `false` | — | Cờ đánh dấu trường dẫn xuất/tính toán (luot_tuoi, bmi, so_luong_thuoc_dong_thoi...) |
| `min_value` | `numeric` | YES | — | — | Ngưỡng dưới hợp lệ kỹ thuật (cho number/integer) |
| `max_value` | `numeric` | YES | — | — | Ngưỡng trên hợp lệ kỹ thuật (cho number/integer) |
| `validation_rule` | `jsonb` | YES | — | — | Quy tắc kiểm tra bổ sung dạng JSON (đơn vị cho phép, công thức) |
| `help_text` | `text` | YES | — | — | Hướng dẫn nhập liệu cho bác sĩ |
| `source_ref` | `text` | NO | — | CHECK: `length(trim(source_ref)) > 0` | Truy vết nguồn TL01-TL06/XLS |
| `created_at` | `timestamptz` | NO | `now()` | — | Thời điểm tạo |
| `updated_at` | `timestamptz` | NO | `now()` | — | Thời điểm cập nhật |

- **Ràng buộc bảng (`CHECK`):** `chk_field_def_code_fmt` (`code ~ '^[a-z][a-z0-9_]*$'`); `chk_field_def_label_nonempty` (`length(trim(label_vi)) > 0`); `chk_field_def_source_nonempty` (`length(trim(source_ref)) > 0`); `chk_field_def_storage_level` (`storage_level IN ('patient', 'visit_value', 'computed', 'orthostatic_bp', 'medication', 'allergy', 'lab_result')`); `chk_field_def_min_max` (`min_value IS NULL OR max_value IS NULL OR min_value <= max_value`); `chk_field_def_bounds_numeric_only` (`data_type IN ('number', 'integer') OR (min_value IS NULL AND max_value IS NULL)`)
- **Khóa duy nhất (`UNIQUE`):** `uq_field_definition_code` (code)
- **Chỉ mục (`INDEX`):** `ix_field_def_scope_section` trên `(scope_status, section_code)`
- **Trigger bảo toàn:** `trg_field_definition_updated_at` (BEFORE UPDATE): Tự động cập nhật updated_at

### 3.5. `field_option` (`FieldOption`)
> Tập lựa chọn hợp lệ cho các trường kiểu single_choice hoặc multi_choice.

| Cột | Kiểu dữ liệu | Null | Mặc định | Khóa / Tham chiếu / Ràng buộc | Diễn giải |
|---|---|---|---|---|---|
| `id` | `uuid` | NO | `gen_random_uuid()` | PK; UNIQUE | Khóa nội bộ UUID |
| `field_definition_id` | `uuid` | NO | — | FK → `field_definition(id)` | Trường sở hữu lựa chọn |
| `option_code` | `varchar(64)` | NO | — | CHECK: `option_code ~ '^[a-z0-9_]+$'` | Mã lựa chọn snake_case |
| `label_vi` | `varchar(160)` | NO | — | CHECK: `length(trim(label_vi)) > 0` | Nhãn tiếng Việt hiển thị |
| `display_order` | `smallint` | NO | — | CHECK: `display_order > 0` | Thứ tự hiển thị trong trường |
| `is_active` | `boolean` | NO | `true` | — | Trạng thái sử dụng của lựa chọn |

- **Ràng buộc bảng (`CHECK`):** `chk_field_option_code_fmt` (`option_code ~ '^[a-z0-9_]+$'`); `chk_field_option_label_nonempty` (`length(trim(label_vi)) > 0`); `chk_field_option_order_pos` (`display_order > 0`)
- **Khóa duy nhất (`UNIQUE`):** `uq_field_option_code` (field_definition_id, option_code); `uq_field_option_order` (field_definition_id, display_order); `uq_field_option_id_field` (id, field_definition_id)

### 3.6. `field_ai_module` (`FieldAiModule`)
> Bảng nối n-n giữa định nghĩa trường và 4 module AI tương lai (tính sẵn sàng tầng 4, không chặn confirm tầng 3).

| Cột | Kiểu dữ liệu | Null | Mặc định | Khóa / Tham chiếu / Ràng buộc | Diễn giải |
|---|---|---|---|---|---|
| `field_definition_id` | `uuid` | NO | — | PK; FK → `field_definition(id)` | Khóa ngoại tới field_definition |
| `ai_module_code` | `varchar(32)` | NO | — | PK; CHECK: `ai_module_code IN ('ai_diagnosis', 'ai_lab_test', 'ai_treatment', 'ai_medsafety')` | Mã module AI trong 4 module TL06 |
| `is_required` | `boolean` | NO | `false` | — | Mức độ cần thiết cho module AI (chỉ dùng cho tầng 4 ai_ready) |
| `source_stt_refs` | `text` | YES | — | — | Danh sách STT trong TL06 tham chiếu tới module này |

- **Ràng buộc bảng (`CHECK`):** `chk_field_ai_module_code` (`ai_module_code IN ('ai_diagnosis', 'ai_lab_test', 'ai_treatment', 'ai_medsafety')`)
- **Chỉ mục (`INDEX`):** `ix_field_ai_module_code` trên `(ai_module_code)`

### 3.7. `form_template` (`FormTemplate`)
> Biểu mẫu logic ở mức sản phẩm (MVP có 1 biểu mẫu khám suy tim).

| Cột | Kiểu dữ liệu | Null | Mặc định | Khóa / Tham chiếu / Ràng buộc | Diễn giải |
|---|---|---|---|---|---|
| `id` | `uuid` | NO | `gen_random_uuid()` | PK; UNIQUE | Khóa nội bộ UUID |
| `code` | `varchar(64)` | NO | — | UNIQUE; CHECK: `code ~ '^[a-z][a-z0-9_]*$'` | Mã biểu mẫu ổn định |
| `name` | `varchar(160)` | NO | — | CHECK: `length(trim(name)) > 0` | Tên hiển thị của biểu mẫu |
| `description` | `text` | YES | — | — | Mô tả phạm vi biểu mẫu |
| `is_active` | `boolean` | NO | `true` | — | Trạng thái hoạt động |
| `created_at` | `timestamptz` | NO | `now()` | — | Thời điểm tạo |

- **Ràng buộc bảng (`CHECK`):** `chk_form_template_code_fmt` (`code ~ '^[a-z][a-z0-9_]*$'`); `chk_form_template_name_nonempty` (`length(trim(name)) > 0`)
- **Khóa duy nhất (`UNIQUE`):** `uq_form_template_code` (code)

### 3.8. `form_version` (`FormVersion`)
> Phiên bản cụ thể của biểu mẫu; bất biến ở mức DB khi đã published hoặc đã có visit sử dụng.

| Cột | Kiểu dữ liệu | Null | Mặc định | Khóa / Tham chiếu / Ràng buộc | Diễn giải |
|---|---|---|---|---|---|
| `id` | `uuid` | NO | `gen_random_uuid()` | PK; UNIQUE | Khóa nội bộ UUID |
| `form_template_id` | `uuid` | NO | — | FK → `form_template(id)` | Khóa ngoại tới form_template |
| `version_no` | `integer` | NO | — | CHECK: `version_no > 0` | Số thứ tự phiên bản tăng dần (1, 2, 3...) |
| `version_label` | `varchar(32)` | NO | — | CHECK: `length(trim(version_label)) > 0` | Nhãn phiên bản hiển thị (vd: v1.0) |
| `status` | `form_version_status` | NO | `'draft'` | — | Trạng thái: draft, published, retired |
| `based_on_version_id` | `uuid` | YES | — | FK → `form_version(id)` | Phiên bản gốc dùng để sao chép sang bản nháp mới |
| `change_note` | `text` | YES | — | — | Ghi chú thay đổi khi tạo/phát hành phiên bản |
| `created_by` | `uuid` | NO | — | FK → `app_user(id)` | Admin tạo phiên bản |
| `created_at` | `timestamptz` | NO | `now()` | — | Thời điểm tạo |
| `published_at` | `timestamptz` | YES | — | — | Thời điểm phát hành (bắt buộc khi published/retired) |
| `published_by` | `uuid` | YES | — | FK → `app_user(id)` | Admin phát hành phiên bản |
| `row_version` | `integer` | NO | `1` | CHECK: `row_version > 0` | Phiên bản lạc quan ETag cho updateFormVersion |

- **Ràng buộc bảng (`CHECK`):** `chk_form_version_no_pos` (`version_no > 0`); `chk_form_version_label_nonempty` (`length(trim(version_label)) > 0`); `chk_form_version_not_self_based` (`based_on_version_id IS NULL OR based_on_version_id <> id`); `chk_form_version_publish_meta` (`(status = 'draft' AND published_at IS NULL AND published_by IS NULL) OR (status IN ('published', 'retired') AND published_at IS NOT NULL AND published_by IS NOT NULL)`); `chk_form_version_row_version_pos` (`row_version > 0`)
- **Khóa duy nhất (`UNIQUE`):** `uq_form_version_template_no` (form_template_id, version_no)
- **Chỉ mục (`INDEX`):** `ux_form_version_one_published` trên `(form_template_id)` WHERE `status = 'published'`
- **Trigger bảo toàn:** `trg_form_version_immutable` (BEFORE UPDATE/DELETE): Chặn sửa hoặc xóa phiên bản đã published/retired hoặc đã có visit dùng

### 3.9. `form_section` (`FormSection`)
> Nhóm biểu mẫu thuộc một form_version (đủ 8 mã nhóm chuẩn).

| Cột | Kiểu dữ liệu | Null | Mặc định | Khóa / Tham chiếu / Ràng buộc | Diễn giải |
|---|---|---|---|---|---|
| `id` | `uuid` | NO | `gen_random_uuid()` | PK; UNIQUE | Khóa nội bộ UUID |
| `form_version_id` | `uuid` | NO | — | FK → `form_version(id)` | Phiên bản biểu mẫu sở hữu nhóm |
| `section_code` | `section_code` | NO | — | — | Mã nhóm thuộc 8 mã chuẩn |
| `title_vi` | `varchar(160)` | NO | — | CHECK: `length(trim(title_vi)) > 0` | Tiêu đề tiếng Việt hiển thị trên form |
| `description` | `text` | YES | — | — | Mô tả nhóm |
| `display_order` | `smallint` | NO | — | CHECK: `display_order > 0` | Thứ tự hiển thị nhóm trong form_version |

- **Ràng buộc bảng (`CHECK`):** `chk_form_section_title_nonempty` (`length(trim(title_vi)) > 0`); `chk_form_section_order_pos` (`display_order > 0`)
- **Khóa duy nhất (`UNIQUE`):** `uq_form_section_version_code` (form_version_id, section_code); `uq_form_section_version_order` (form_version_id, display_order); `uq_form_section_id_version` (id, form_version_id)
- **Trigger bảo toàn:** `trg_form_section_immutable` (BEFORE INSERT/UPDATE/DELETE): Chặn thay đổi nhóm của form_version không còn ở trạng thái draft hoặc đã có visit

### 3.10. `form_field` (`FormField`)
> Ánh xạ trường từ field_definition vào một form_section cụ thể của một form_version.

| Cột | Kiểu dữ liệu | Null | Mặc định | Khóa / Tham chiếu / Ràng buộc | Diễn giải |
|---|---|---|---|---|---|
| `id` | `uuid` | NO | `gen_random_uuid()` | PK; UNIQUE | Khóa nội bộ UUID |
| `form_version_id` | `uuid` | NO | — | FK → `form_version(id)` | Phiên bản biểu mẫu |
| `form_section_id` | `uuid` | NO | — | FK → `form_section(id)` | Nhóm chứa trường trong cùng form_version |
| `field_definition_id` | `uuid` | NO | — | FK → `field_definition(id)` | Định nghĩa trường gốc |
| `display_order` | `smallint` | NO | — | CHECK: `display_order > 0` | Thứ tự trường trong nhóm |
| `required_for_confirm` | `boolean` | NO | `false` | — | Quy tắc bắt buộc tầng 3 khi confirm (mặc định false cho các trường lâm sàng/can_xac_nhan) |
| `is_visible` | `boolean` | NO | `true` | — | Hiển thị trên biểu mẫu nhập tay (false cho trường can_xac_nhan chưa kích hoạt) |
| `is_readonly` | `boolean` | NO | `false` | — | Chỉ đọc trên giao diện (vd: trường tự tính toán) |
| `custom_label_vi` | `varchar(200)` | YES | — | — | Nhãn tùy chỉnh riêng trong phiên bản này (NULL dùng label_vi gốc) |
| `custom_help_text` | `text` | YES | — | — | Gợi ý tùy chỉnh riêng trong phiên bản này |

- **Ràng buộc bảng (`CHECK`):** `chk_form_field_order_pos` (`display_order > 0`)
- **Khóa duy nhất (`UNIQUE`):** `uq_form_field_version_def` (form_version_id, field_definition_id); `uq_form_field_section_order` (form_section_id, display_order)
- **Chỉ mục (`INDEX`):** `ix_form_field_def` trên `(field_definition_id)`
- **Trigger bảo toàn:** `trg_form_field_immutable` (BEFORE INSERT/UPDATE/DELETE): Chặn thay đổi trường của form_version không còn ở trạng thái draft hoặc đã có visit

### 3.11. `visit` (`Visit`)
> Lượt khám lâm sàng độc lập gắn cứng một patient và một form_version đã published; khóa cứng khi confirmed.

| Cột | Kiểu dữ liệu | Null | Mặc định | Khóa / Tham chiếu / Ràng buộc | Diễn giải |
|---|---|---|---|---|---|
| `id` | `uuid` | NO | `gen_random_uuid()` | PK; UNIQUE | Khóa nội bộ UUID |
| `visit_code` | `varchar(24)` | NO | — | UNIQUE; CHECK: `visit_code ~ '^LK-[A-Z0-9-]+$'` | Mã lượt khám duy nhất (LK-...) |
| `external_visit_code` | `varchar(64)` | YES | — | — | Mã lượt khám ngoài / HIS tham chiếu nếu có |
| `patient_id` | `uuid` | NO | — | FK → `patient(id)` | Bệnh nhân của lượt khám |
| `form_version_id` | `uuid` | NO | — | FK → `form_version(id)` | Phiên bản biểu mẫu gắn cứng lúc tạo lượt |
| `visit_date` | `timestamptz` | NO | — | — | Thời điểm khám / tiếp nhận |
| `visit_type` | `varchar(32)` | NO | `'outpatient_new'` | CHECK: `visit_type IN ('outpatient_new', 'follow_up', 'acute_inpatient')` | Loại lượt khám |
| `chief_complaint` | `text` | YES | — | — | Lý do khám ngắn gọn |
| `clinical_note` | `text` | YES | — | — | Ghi chú lâm sàng của bác sĩ (nhóm 8) |
| `info_source` | `varchar(64)` | YES | — | — | Nguồn thông tin lâm sàng (người bệnh, người nhà, hồ sơ cũ) |
| `status` | `visit_status` | NO | `'draft'` | — | Trạng thái lượt: draft hoặc confirmed |
| `current_revision_no` | `integer` | NO | `1` | CHECK: `current_revision_no > 0` | Số thứ tự bản xác nhận/sửa đổi trong visit_revision |
| `created_by` | `uuid` | NO | — | FK → `app_user(id)` | Bác sĩ tạo và phụ trách lượt khám |
| `created_at` | `timestamptz` | NO | `now()` | — | Thời điểm tạo |
| `updated_at` | `timestamptz` | NO | `now()` | — | Thời điểm cập nhật gần nhất |
| `confirmed_at` | `timestamptz` | YES | — | — | Thời điểm bác sĩ xác nhận dữ liệu |
| `confirmed_by` | `uuid` | YES | — | FK → `app_user(id)` | Bác sĩ xác nhận dữ liệu lượt khám |
| `confirm_note` | `text` | YES | — | — | Ghi chú khi xác nhận dữ liệu |
| `row_version` | `integer` | NO | `1` | CHECK: `row_version > 0` | Phiên bản lạc quan ETag chống ghi đè đồng thời |

- **Ràng buộc bảng (`CHECK`):** `chk_visit_code_fmt` (`visit_code ~ '^LK-[A-Z0-9-]+$'`); `chk_visit_type` (`visit_type IN ('outpatient_new', 'follow_up', 'acute_inpatient')`); `chk_visit_confirm_meta` (`(status = 'draft' AND confirmed_at IS NULL AND confirmed_by IS NULL) OR (status = 'confirmed' AND confirmed_at IS NOT NULL AND confirmed_by IS NOT NULL)`); `chk_visit_revision_pos` (`current_revision_no > 0`); `chk_visit_row_version_pos` (`row_version > 0`)
- **Khóa duy nhất (`UNIQUE`):** `uq_visit_code` (visit_code)
- **Chỉ mục (`INDEX`):** `ix_visit_patient_date` trên `(patient_id, visit_date DESC)`; `ix_visit_form_version` trên `(form_version_id)`; `ix_visit_status` trên `(status)`
- **Trigger bảo toàn:** `trg_visit_lifecycle_guard` (BEFORE INSERT/UPDATE/DELETE): Kiểm tra form_version phải là published khi tạo; chặn sửa/xóa trực tiếp lượt đã confirmed; chặn đổi patient_id/form_version_id/visit_code; `trg_visit_updated_at` (BEFORE UPDATE): Tự động cập nhật updated_at

### 3.12. `visit_value` (`VisitValue`)
> Giá trị trường đơn trong lượt khám; thiếu dòng = chưa điền, value_state='unknown' = Chưa rõ, 'answered' = có giá trị kể cả 0/false.

| Cột | Kiểu dữ liệu | Null | Mặc định | Khóa / Tham chiếu / Ràng buộc | Diễn giải |
|---|---|---|---|---|---|
| `visit_id` | `uuid` | NO | — | PK; FK → `visit(id)` | Khóa ngoại tới visit |
| `field_definition_id` | `uuid` | NO | — | PK; FK → `field_definition(id)` | Khóa ngoại tới field_definition |
| `value_state` | `value_state` | NO | — | — | Trạng thái trả lời: answered hoặc unknown |
| `value_num` | `numeric` | YES | — | — | Giá trị số (number hoặc integer) |
| `value_text` | `text` | YES | — | — | Giá trị văn bản (text) |
| `value_bool` | `boolean` | YES | — | — | Giá trị logic Có/Không (boolean) |
| `value_date` | `date` | YES | — | — | Giá trị ngày (date) |
| `field_option_id` | `uuid` | YES | — | FK → `field_option(id)` | Giá trị lựa chọn đơn (single_choice) |
| `unit` | `varchar(40)` | YES | — | — | Đơn vị đi kèm giá trị số nếu có |
| `updated_at` | `timestamptz` | NO | `now()` | — | Thời điểm cập nhật giá trị |

- **Ràng buộc bảng (`CHECK`):** `chk_visit_value_state_cols` (`(value_state = 'unknown' AND value_num IS NULL AND value_text IS NULL AND value_bool IS NULL AND value_date IS NULL AND field_option_id IS NULL AND unit IS NULL) OR (value_state = 'answered' AND num_nonnulls(value_num, value_text, value_bool, value_date, field_option_id) <= 1)`)
- **Chỉ mục (`INDEX`):** `ix_visit_value_field` trên `(field_definition_id)`
- **Trigger bảo toàn:** `trg_visit_value_guard` (BEFORE INSERT/UPDATE/DELETE): Chặn sửa khi visit đã confirmed; kiểm tra trường thuộc form_version của visit và khớp đúng data_type + min/max; `trg_visit_value_multichoice_deferred` (AFTER (DEFERRABLE) INSERT/UPDATE): Đảm bảo multi_choice ở trạng thái answered có ít nhất 1 lựa chọn trong visit_value_option khi commit; `trg_visit_value_updated_at` (BEFORE UPDATE): Tự động cập nhật updated_at

### 3.13. `visit_value_option` (`VisitValueOption`)
> Bảng con đạt 3NF cho các trường multi_choice trong visit_value (CR-W1-01).

| Cột | Kiểu dữ liệu | Null | Mặc định | Khóa / Tham chiếu / Ràng buộc | Diễn giải |
|---|---|---|---|---|---|
| `visit_id` | `uuid` | NO | — | PK; FK → `visit_value(visit_id)` | Khóa ngoại phần visit_id |
| `field_definition_id` | `uuid` | NO | — | PK; FK → `visit_value(field_definition_id)` | Khóa ngoại phần field_definition_id |
| `field_option_id` | `uuid` | NO | — | PK; FK → `field_option(id)` | Lựa chọn được chọn |
- **Chỉ mục (`INDEX`):** `ix_visit_value_option_opt` trên `(field_option_id)`
- **Trigger bảo toàn:** `trg_visit_value_option_guard` (BEFORE INSERT/UPDATE/DELETE): Chặn sửa khi visit đã confirmed; xác minh trường có data_type='multi_choice' và value_state='answered'

### 3.14. `visit_orthostatic_bp` (`OrthostaticBpMeasurement`)
> Bảng lặp các lần đo huyết áp theo tư thế (nằm/ngồi/đứng) và thời điểm đo.

| Cột | Kiểu dữ liệu | Null | Mặc định | Khóa / Tham chiếu / Ràng buộc | Diễn giải |
|---|---|---|---|---|---|
| `id` | `uuid` | NO | `gen_random_uuid()` | PK; UNIQUE | Khóa nội bộ UUID |
| `visit_id` | `uuid` | NO | — | FK → `visit(id)` | Lượt khám sở hữu lần đo |
| `position` | `bp_position` | NO | — | — | Tư thế đo: supine, sitting hoặc standing |
| `minute_after` | `smallint` | YES | — | CHECK: `minute_after IS NULL OR minute_after BETWEEN 0 AND 60` | Số phút sau khi đổi tư thế (vd: sau đứng 1-3 phút) |
| `systolic` | `smallint` | NO | — | CHECK: `systolic BETWEEN 40 AND 300` | Huyết áp tâm thu (mmHg) |
| `diastolic` | `smallint` | NO | — | CHECK: `diastolic BETWEEN 20 AND 200` | Huyết áp tâm trương (mmHg) |
| `heart_rate` | `smallint` | YES | — | CHECK: `heart_rate IS NULL OR heart_rate BETWEEN 20 AND 300` | Tần số tim đo cùng thời điểm (lần/phút) |
| `measured_at` | `timestamptz` | NO | — | — | Thời điểm đo huyết áp |
| `note` | `text` | YES | — | — | Ghi chú thêm (vd: chóng mặt khi đứng) |
| `created_at` | `timestamptz` | NO | `now()` | — | Thời điểm ghi nhận bản ghi |

- **Ràng buộc bảng (`CHECK`):** `chk_bp_minute_after` (`minute_after IS NULL OR minute_after BETWEEN 0 AND 60`); `chk_bp_systolic_range` (`systolic BETWEEN 40 AND 300`); `chk_bp_diastolic_range` (`diastolic BETWEEN 20 AND 200`); `chk_bp_sys_gt_dia` (`systolic > diastolic`); `chk_bp_hr_range` (`heart_rate IS NULL OR heart_rate BETWEEN 20 AND 300`)
- **Chỉ mục (`INDEX`):** `ix_visit_bp_visit_time` trên `(visit_id, measured_at)`
- **Trigger bảo toàn:** `trg_visit_bp_confirmed_guard` (BEFORE INSERT/UPDATE/DELETE): Chặn thay đổi khi visit đã confirmed

### 3.15. `visit_medication` (`VisitMedication`)
> Bảng lặp thuốc đang dùng (thuốc kê đơn & OTC/TPCN/YHCT) gắn với lượt khám.

| Cột | Kiểu dữ liệu | Null | Mặc định | Khóa / Tham chiếu / Ràng buộc | Diễn giải |
|---|---|---|---|---|---|
| `id` | `uuid` | NO | `gen_random_uuid()` | PK; UNIQUE | Khóa nội bộ UUID |
| `visit_id` | `uuid` | NO | — | FK → `visit(id)` | Lượt khám ghi nhận |
| `medication_group` | `varchar(32)` | NO | `'prescribed'` | CHECK: `medication_group IN ('prescribed', 'otc_supplement_tcm')` | Phân nhóm: thuốc kê đơn hay OTC/TPCN/YHCT |
| `drug_name` | `varchar(160)` | NO | — | CHECK: `length(trim(drug_name)) > 0` | Tên thuốc hoặc chế phẩm |
| `active_ingredient` | `varchar(160)` | YES | — | — | Hoạt chất chính |
| `strength` | `varchar(64)` | YES | — | — | Hàm lượng viên/ống |
| `dose` | `numeric` | YES | — | CHECK: `dose IS NULL OR dose > 0` | Liều mỗi lần dùng |
| `unit` | `varchar(32)` | YES | — | — | Đơn vị liều (mg, mcg, viên, ml...) |
| `frequency` | `varchar(80)` | YES | — | — | Tần suất dùng (vd: 1 lần/ngày) |
| `route` | `varchar(32)` | YES | — | CHECK: `route IS NULL OR route IN ('oral', 'iv', 'subcutaneous', 'inhaled', 'topical', 'other')` | Đường dùng |
| `status` | `varchar(24)` | NO | `'active'` | CHECK: `status IN ('active', 'stopped', 'proposed')` | Tình trạng dùng thuốc |
| `started_at` | `date` | YES | — | — | Ngày bắt đầu dùng nếu biết |
| `note` | `text` | YES | — | — | Ghi chú thêm |
| `created_at` | `timestamptz` | NO | `now()` | — | Thời điểm ghi nhận |

- **Ràng buộc bảng (`CHECK`):** `chk_med_group` (`medication_group IN ('prescribed', 'otc_supplement_tcm')`); `chk_med_drug_name_nonempty` (`length(trim(drug_name)) > 0`); `chk_med_dose_pos` (`dose IS NULL OR dose > 0`); `chk_med_route` (`route IS NULL OR route IN ('oral', 'iv', 'subcutaneous', 'inhaled', 'topical', 'other')`); `chk_med_status` (`status IN ('active', 'stopped', 'proposed')`)
- **Chỉ mục (`INDEX`):** `ix_visit_med_visit_status` trên `(visit_id, status)`
- **Trigger bảo toàn:** `trg_visit_med_confirmed_guard` (BEFORE INSERT/UPDATE/DELETE): Chặn thay đổi khi visit đã confirmed

### 3.16. `visit_allergy` (`VisitAllergy`)
> Bảng lặp dị ứng thuốc (kể cả thuốc cản quang), phản ứng có hại (ADR) và không dung nạp thuốc.

| Cột | Kiểu dữ liệu | Null | Mặc định | Khóa / Tham chiếu / Ràng buộc | Diễn giải |
|---|---|---|---|---|---|
| `id` | `uuid` | NO | `gen_random_uuid()` | PK; UNIQUE | Khóa nội bộ UUID |
| `visit_id` | `uuid` | NO | — | FK → `visit(id)` | Lượt khám ghi nhận |
| `kind` | `varchar(24)` | NO | — | CHECK: `kind IN ('allergy', 'adr', 'intolerance')` | Phân loại phản ứng: allergy, adr, hoặc intolerance |
| `agent_category` | `varchar(32)` | NO | `'therapeutic_drug'` | CHECK: `agent_category IN ('therapeutic_drug', 'contrast_media', 'other')` | Nhóm tác nhân: thuốc điều trị, thuốc cản quang, hoặc khác |
| `allergen` | `varchar(160)` | NO | — | CHECK: `length(trim(allergen)) > 0` | Tên tác nhân / hoạt chất gây phản ứng |
| `reaction` | `text` | YES | — | — | Biểu hiện lâm sàng (phát ban, phù mạch, ho khan, tăng kali...) |
| `severity` | `varchar(24)` | NO | `'unknown'` | CHECK: `severity IN ('mild', 'moderate', 'severe', 'unknown')` | Mức độ nặng |
| `recorded_at` | `timestamptz` | YES | — | — | Thời điểm xảy ra/ghi nhận phản ứng |
| `note` | `text` | YES | — | — | Ghi chú thêm |
| `created_at` | `timestamptz` | NO | `now()` | — | Thời điểm lưu bản ghi |

- **Ràng buộc bảng (`CHECK`):** `chk_allergy_kind` (`kind IN ('allergy', 'adr', 'intolerance')`); `chk_allergy_agent_cat` (`agent_category IN ('therapeutic_drug', 'contrast_media', 'other')`); `chk_allergy_allergen_nonempty` (`length(trim(allergen)) > 0`); `chk_allergy_severity` (`severity IN ('mild', 'moderate', 'severe', 'unknown')`)
- **Chỉ mục (`INDEX`):** `ix_visit_allergy_visit_kind` trên `(visit_id, kind)`
- **Trigger bảo toàn:** `trg_visit_allergy_confirmed_guard` (BEFORE INSERT/UPDATE/DELETE): Chặn thay đổi khi visit đã confirmed

### 3.17. `visit_lab_result` (`VisitLabResult`)
> Bảng lặp kết quả cận lâm sàng & chẩn đoán hình ảnh có loại tách biệt (BNP vs NT-proBNP, Creatinin vs eGFR, LVEF...), đơn vị và thời điểm.

| Cột | Kiểu dữ liệu | Null | Mặc định | Khóa / Tham chiếu / Ràng buộc | Diễn giải |
|---|---|---|---|---|---|
| `id` | `uuid` | NO | `gen_random_uuid()` | PK; UNIQUE | Khóa nội bộ UUID |
| `visit_id` | `uuid` | NO | — | FK → `visit(id)` | Lượt khám sở hữu kết quả |
| `lab_code` | `varchar(80)` | NO | — | FK → `field_definition(code)` | Mã loại xét nghiệm/thăm dò tham chiếu field_definition(code) có storage_level='lab_result' |
| `lab_subtype` | `varchar(64)` | YES | — | — | Phân loại chi tiết (vd: hs_troponin_t, hs_troponin_i) |
| `value_num` | `numeric` | YES | — | CHECK: `value_num IS NULL OR value_num >= 0` | Giá trị định lượng (>= 0) |
| `value_text` | `text` | YES | — | — | Kết luận mô tả (Siêu âm tim, ECG, X-quang) |
| `unit` | `varchar(40)` | YES | — | — | Đơn vị đo (bắt buộc không rỗng khi có value_num) |
| `measured_at` | `timestamptz` | NO | — | — | Thời điểm lấy mẫu hoặc thực hiện thăm dò |
| `note` | `text` | YES | — | — | Ghi chú nguồn phiếu hoặc diễn giải thêm |
| `created_at` | `timestamptz` | NO | `now()` | — | Thời điểm ghi nhận bản ghi |

- **Ràng buộc bảng (`CHECK`):** `chk_lab_has_value` (`value_num IS NOT NULL OR (value_text IS NOT NULL AND length(trim(value_text)) > 0)`); `chk_lab_value_num_nonneg` (`value_num IS NULL OR value_num >= 0`); `chk_lab_unit_required_for_num` (`value_num IS NULL OR (unit IS NOT NULL AND length(trim(unit)) > 0)`)
- **Chỉ mục (`INDEX`):** `ix_visit_lab_visit_code_time` trên `(visit_id, lab_code, measured_at DESC)`
- **Trigger bảo toàn:** `trg_visit_lab_guard` (BEFORE INSERT/UPDATE/DELETE): Chặn thay đổi khi visit đã confirmed; xác minh lab_code thuộc nhóm storage_level='lab_result'

### 3.18. `visit_revision` (`VisitRevision`)
> Lịch sử snapshot bất biến (append-only) của các bản xác nhận và sửa đổi sau xác nhận; bảo đảm không mất bản đã dùng cho AI.

| Cột | Kiểu dữ liệu | Null | Mặc định | Khóa / Tham chiếu / Ràng buộc | Diễn giải |
|---|---|---|---|---|---|
| `id` | `uuid` | NO | `gen_random_uuid()` | PK; UNIQUE | Khóa nội bộ UUID |
| `visit_id` | `uuid` | NO | — | FK → `visit(id)` | Lượt khám tương ứng |
| `revision_no` | `integer` | NO | — | CHECK: `revision_no > 0` | Số thứ tự phiên bản dữ liệu (1, 2...) |
| `form_version_id` | `uuid` | NO | — | FK → `form_version(id)` | Phiên bản biểu mẫu tại thời điểm snapshot |
| `revision_type` | `varchar(32)` | NO | `'confirmed_snapshot'` | CHECK: `revision_type IN ('confirmed_snapshot', 'post_confirm_amendment')` | Loại bản ghi: xác nhận ban đầu hay sửa bổ sung sau xác nhận |
| `change_reason` | `text` | NO | — | CHECK: `length(trim(change_reason)) > 0` | Lý do xác nhận hoặc lý do sửa sau xác nhận |
| `snapshot_data` | `jsonb` | NO | — | CHECK: `jsonb_typeof(snapshot_data) = 'object'` | Ảnh chụp toàn bộ dữ liệu chuẩn hóa của lượt khám tại revision này (tách khỏi audit_log) |
| `created_by` | `uuid` | NO | — | FK → `app_user(id)` | Bác sĩ thực hiện |
| `created_at` | `timestamptz` | NO | `now()` | — | Thời điểm ghi snapshot |

- **Ràng buộc bảng (`CHECK`):** `chk_visit_rev_no_pos` (`revision_no > 0`); `chk_visit_rev_type` (`revision_type IN ('confirmed_snapshot', 'post_confirm_amendment')`); `chk_visit_rev_reason_nonempty` (`length(trim(change_reason)) > 0`); `chk_visit_rev_snapshot_obj` (`jsonb_typeof(snapshot_data) = 'object'`)
- **Khóa duy nhất (`UNIQUE`):** `uq_visit_revision_visit_no` (visit_id, revision_no)
- **Chỉ mục (`INDEX`):** `ix_visit_revision_visit_time` trên `(visit_id, created_at DESC)`
- **Trigger bảo toàn:** `trg_visit_revision_append_only` (BEFORE UPDATE/DELETE): Bảo đảm visit_revision chỉ cho phép INSERT (append-only), cấm UPDATE/DELETE

### 3.19. `audit_log` (`AuditLog`)
> Nhật ký kiểm toán hệ thống (append-only); tuyệt đối không chứa mật khẩu hay nội dung lâm sàng bệnh nhân.

| Cột | Kiểu dữ liệu | Null | Mặc định | Khóa / Tham chiếu / Ràng buộc | Diễn giải |
|---|---|---|---|---|---|
| `id` | `uuid` | NO | `gen_random_uuid()` | PK; UNIQUE | Khóa nội bộ UUID |
| `actor_user_id` | `uuid` | YES | — | FK → `app_user(id)` | Tài khoản thực hiện hành động (NULL chỉ khi login_failed không rõ user) |
| `action` | `audit_action` | NO | — | — | Hành động kiểm toán thuộc enum audit_action |
| `entity_type` | `varchar(64)` | NO | — | CHECK: `length(trim(entity_type)) > 0` | Loại đối tượng tác động (app_user, patient, form_version, visit...) |
| `entity_id` | `uuid` | YES | — | — | ID đối tượng tác động |
| `occurred_at` | `timestamptz` | NO | `now()` | — | Thời điểm phát sinh sự kiện |
| `ip` | `inet` | YES | — | — | Địa chỉ IP nguồn |
| `request_id` | `varchar(64)` | YES | — | — | Mã truy vết request |
| `outcome` | `varchar(16)` | NO | `'success'` | CHECK: `outcome IN ('success', 'denied', 'failure')` | Kết quả thực hiện: success, denied, failure |
| `detail` | `jsonb` | NO | `'{}'::jsonb` | CHECK: `jsonb_typeof(detail) = 'object'` | Siêu dữ liệu kỹ thuật (không chứa dữ liệu lâm sàng hay mật khẩu) |

- **Ràng buộc bảng (`CHECK`):** `chk_audit_entity_type_nonempty` (`length(trim(entity_type)) > 0`); `chk_audit_outcome` (`outcome IN ('success', 'denied', 'failure')`); `chk_audit_detail_object` (`jsonb_typeof(detail) = 'object'`)
- **Chỉ mục (`INDEX`):** `ix_audit_occurred_at` trên `(occurred_at DESC)`; `ix_audit_actor_time` trên `(actor_user_id, occurred_at DESC)`; `ix_audit_entity_time` trên `(entity_type, entity_id, occurred_at DESC)`
- **Trigger bảo toàn:** `trg_audit_log_no_clinical_data` (BEFORE INSERT): Chặn các khóa chứa dữ liệu lâm sàng/mật khẩu lọt vào detail JSONB; `trg_audit_log_append_only` (BEFORE UPDATE/DELETE): Bảo đảm audit_log chỉ ghi nối (append-only), cấm sửa/xóa

---

## 4. Danh mục 121 Trường Cấu hình (`field_definition`: `95` `mvp` + `26` `can_xac_nhan`)

> Ghi chú: Các trường thuộc `storage_level` khác `visit_value` (`patient`, `computed`, `orthostatic_bp`, `medication`, `allergy`, `lab_result`) vẫn nằm trong danh mục `field_definition` và `form_field` để đồng bộ nhãn, đơn vị, kiểm tra và ánh xạ 4 module AI, còn giá trị runtime lưu tại bảng chuẩn hóa tương ứng.

### 4.1. Nhóm `hanh_chinh` — Hành chính và Thông tin nền (`2` `mvp` + `0` `can_xac_nhan`)

| # | `code` | Nhãn tiếng Việt | Phạm vi | Kiểu (`data_type`) | Đơn vị chuẩn | Nơi lưu (`storage_level`) | Miền giá trị / Lựa chọn | Module AI | Nguồn (`source_ref`) |
|---:|---|---|---|---|---|---|---|---|---|
| 1 | `luot_tuoi` | Tuổi tại thời điểm khám | `mvp` | `integer` | tuổi | `computed` | [0 .. 120] | `ai_diagnosis` | TL06 R2/STT 1 (tuoi) |
| 2 | `bn_gioi_tinh` | Giới tính sinh học | `mvp` | `single_choice` | — | `patient` | `male` (Nam), `female` (Nữ), `unknown` (Chưa rõ) | `ai_diagnosis` | TL06 R3/STT 2 (gioi_tinh) |

### 4.2. Nhóm `trieu_chung_dien_bien` — Triệu chứng cơ năng và Diễn biến (`20` `mvp` + `5` `can_xac_nhan`)

| # | `code` | Nhãn tiếng Việt | Phạm vi | Kiểu (`data_type`) | Đơn vị chuẩn | Nơi lưu (`storage_level`) | Miền giá trị / Lựa chọn | Module AI | Nguồn (`source_ref`) |
|---:|---|---|---|---|---|---|---|---|---|
| 1 | `kho_tho_khi_gang_suc` | Khó thở khi gắng sức | `mvp` | `boolean` | — | `visit_value` | — | `ai_diagnosis`, `ai_lab_test` | TL06 R7/STT 6 (kho_tho_khi_gang_suc); TL06 R107/STT 111 (trieu_chung_dau_hieu) |
| 2 | `kho_tho_khi_nam` | Khó thở khi nằm (Orthopnea) | `mvp` | `boolean` | — | `visit_value` | — | `ai_diagnosis` | TL06 R8/STT 7 (kho_tho_khi_nam) |
| 3 | `kho_tho_kich_phat_ve_dem` | Cơn khó thở kịch phát về đêm (PND) | `mvp` | `boolean` | — | `visit_value` | — | `ai_diagnosis` | TL06 R9/STT 8 (kho_tho_kich_phat_ve_dem) |
| 4 | `met_moi` | Mệt mỏi | `mvp` | `boolean` | — | `visit_value` | — | `ai_diagnosis` | TL06 R10/STT 9 (met_moi) |
| 5 | `giam_kha_nang_gang_suc` | Giảm khả năng gắng sức | `mvp` | `boolean` | — | `visit_value` | — | `ai_diagnosis` | TL06 R11/STT 10 (giam_kha_nang_gang_suc) |
| 6 | `phu_hai_chi_duoi` | Phù hai chi dưới (cơ năng) | `mvp` | `boolean` | — | `visit_value` | — | `ai_diagnosis` | TL06 R12/STT 11 (phu_hai_chi_duoi) |
| 7 | `tang_can_nhanh` | Tăng cân nhanh | `mvp` | `boolean` | — | `visit_value` | — | `ai_diagnosis` | TL06 R13/STT 12 (tang_can_nhanh) |
| 8 | `dau_nguc` | Đau ngực | `mvp` | `boolean` | — | `visit_value` | — | `ai_diagnosis` | TL06 R14/STT 13 (dau_nguc) |
| 9 | `hoi_hop` | Hồi hộp, đánh trống ngực | `mvp` | `boolean` | — | `visit_value` | — | `ai_diagnosis` | TL06 R15/STT 14 (hoi_hop) |
| 10 | `ngat` | Ngất hoặc tiền sử ngất | `mvp` | `boolean` | — | `visit_value` | — | `ai_diagnosis`, `ai_medsafety` | TL06 R16/STT 15 (ngat); TL06 R188/STT 192 (tien_su_te_nga_ngat) |
| 11 | `lu_lan_sang` | Lú lẫn hoặc sảng | `mvp` | `boolean` | — | `visit_value` | — | `ai_diagnosis` | TL06 R17/STT 16 (lu_lan_sang) |
| 12 | `te_nga` | Té ngã hoặc tiền sử té ngã | `mvp` | `boolean` | — | `visit_value` | — | `ai_diagnosis`, `ai_medsafety` | TL06 R18/STT 17 (te_nga); TL06 R188/STT 192 (tien_su_te_nga_ngat) |
| 13 | `chan_an` | Chán ăn | `mvp` | `boolean` | — | `visit_value` | — | `ai_diagnosis` | TL06 R19/STT 18 (chan_an) |
| 14 | `mat_ngu` | Mất ngủ | `mvp` | `boolean` | — | `visit_value` | — | `ai_diagnosis` | TL06 R20/STT 19 (mat_ngu) |
| 15 | `giam_van_dong` | Giảm vận động | `mvp` | `boolean` | — | `visit_value` | — | `ai_diagnosis` | TL06 R21/STT 20 (giam_van_dong) |
| 16 | `giam_kha_nang_tu_cham_soc` | Giảm khả năng tự chăm sóc | `mvp` | `boolean` | — | `visit_value` | — | `ai_diagnosis` | TL06 R22/STT 21 (giam_kha_nang_tu_cham_soc) |
| 17 | `suy_giam_chuc_nang_khong_giai_thich` | Suy giảm chức năng không giải thích được | `mvp` | `boolean` | — | `visit_value` | — | `ai_diagnosis` | TL06 R23/STT 22 (suy_giam_chuc_nang_khong_giai_thich) |
| 18 | `thay_doi_trieu_chung` | Diễn biến thay đổi triệu chứng | `mvp` | `single_choice` | — | `visit_value` | `cai_thien` (Cải thiện), `khong_doi` (Không đổi), `nang_len` (Nặng lên) | `ai_diagnosis` | TL06 R77/STT 81 (thay_doi_trieu_chung) |
| 19 | `nyha_hien_tai` | Phân độ chức năng NYHA hiện tại | `mvp` | `single_choice` | — | `visit_value` | `nyha_i` (Độ I), `nyha_ii` (Độ II), `nyha_iii` (Độ III), `nyha_iv` (Độ IV) | `ai_diagnosis`, `ai_treatment` | TL06 R79/STT 83 (thay_doi_nyha); TL06 R149/STT 153 (nyha) |
| 20 | `nhu_cau_tang_lieu_loi_tieu` | Nhu cầu tăng liều lợi tiểu gần đây | `mvp` | `boolean` | — | `visit_value` | — | `ai_diagnosis` | TL06 R82/STT 86 (nhu_cau_tang_lieu_loi_tieu) |
| 21 | `thay_doi_can_nang_kg` | Mức thay đổi cân nặng | `can_xac_nhan` | `number` | kg | `visit_value` | [-50 .. 50] | `ai_diagnosis` | TL06 R78/STT 82 (thay_doi_can_nang) |
| 22 | `thay_doi_can_nang_khoang_thoi_gian` | Khoảng thời gian theo dõi thay đổi cân nặng | `can_xac_nhan` | `integer` | ngày | `visit_value` | [1 .. 365] | `ai_diagnosis` | TL06 R78/STT 82 (thay_doi_can_nang) |
| 23 | `thay_doi_nyha` | Thay đổi phân độ NYHA | `can_xac_nhan` | `single_choice` | — | `visit_value` | `nyha_i` (Độ I), `nyha_ii` (Độ II), `nyha_iii` (Độ III), `nyha_iv` (Độ IV) | `ai_diagnosis` | TL06 R79/STT 83 (thay_doi_nyha) |
| 24 | `so_lan_cap_cuu_nhap_vien` | Số lần cấp cứu / nhập viện vì suy tim | `can_xac_nhan` | `integer` | lần | `visit_value` | [0 .. 100] | `ai_diagnosis` | TL06 R81/STT 85 (so_lan_cap_cuu_nhap_vien) |
| 25 | `tinh_trang_worsening_decompensated` | Tình trạng worsening / decompensated | `can_xac_nhan` | `text` | — | `visit_value` | — | `ai_treatment` | TL06 R150/STT 154 (worsening_decompensated) |

### 4.3. Nhóm `sinh_ton_kham` — Dấu hiệu sinh tồn, Nhân trắc và Khám thực thể (`18` `mvp` + `1` `can_xac_nhan`)

| # | `code` | Nhãn tiếng Việt | Phạm vi | Kiểu (`data_type`) | Đơn vị chuẩn | Nơi lưu (`storage_level`) | Miền giá trị / Lựa chọn | Module AI | Nguồn (`source_ref`) |
|---:|---|---|---|---|---|---|---|---|---|
| 1 | `chieu_cao_cm` | Chiều cao | `mvp` | `number` | cm | `visit_value` | [50 .. 250] | `ai_diagnosis` | TL06 R4/STT 3 (chieu_cao) |
| 2 | `can_nang_kg` | Cân nặng hiện tại | `mvp` | `number` | kg | `visit_value` | [15 .. 250] | `ai_diagnosis`, `ai_medsafety` | TL06 R5/STT 4 (can_nang); TL06 R190/STT 194 (dinh_duong_can_nang_sarcopenia) |
| 3 | `bmi` | Chỉ số khối cơ thể (BMI) | `mvp` | `number` | kg/m² | `computed` | [10 .. 80] | `ai_diagnosis` | TL06 R6/STT 5 (bmi) |
| 4 | `huyet_ap_tam_thu` | Huyết áp tâm thu | `mvp` | `integer` | mmHg | `orthostatic_bp` | [40 .. 300] | `ai_diagnosis`, `ai_medsafety`, `ai_treatment` | TL06 R24/STT 23 (ha_t_the_nam_ngoi); TL06 R25/STT 24 (ha_t_the_dung); TL06 R152/STT 156 (ha_treatment); TL06 R165/STT 169 (nguy_co_te_nga_hha); +1 dòng khác |
| 5 | `huyet_ap_tam_truong` | Huyết áp tâm trương | `mvp` | `integer` | mmHg | `orthostatic_bp` | [20 .. 200] | `ai_diagnosis`, `ai_medsafety`, `ai_treatment` | TL06 R24/STT 23 (ha_t_the_nam_ngoi); TL06 R25/STT 24 (ha_t_the_dung); TL06 R152/STT 156 (ha_treatment); TL06 R165/STT 169 (nguy_co_te_nga_hha); +1 dòng khác |
| 6 | `thoi_diem_do_ha` | Thời điểm đo huyết áp | `mvp` | `text` | — | `orthostatic_bp` | — | `ai_diagnosis`, `ai_medsafety`, `ai_treatment` | TL06 R24/STT 23 (ha_t_the_nam_ngoi); TL06 R25/STT 24 (ha_t_the_dung); TL06 R152/STT 156 (ha_treatment); TL06 R184/STT 188 (ha_nam_ngoi_dung) |
| 7 | `tu_the_do_ha` | Tư thế đo huyết áp | `mvp` | `single_choice` | — | `orthostatic_bp` | `supine` (Nằm), `sitting` (Ngồi), `standing` (Đứng) | `ai_diagnosis`, `ai_medsafety`, `ai_treatment` | TL06 R24/STT 23 (ha_t_the_nam_ngoi); TL06 R25/STT 24 (ha_t_the_dung); TL06 R152/STT 156 (ha_treatment); TL06 R165/STT 169 (nguy_co_te_nga_hha); +1 dòng khác |
| 8 | `mach` | Mạch / Tần số tim | `mvp` | `integer` | lần/phút | `visit_value` | [20 .. 300] | `ai_diagnosis`, `ai_medsafety`, `ai_treatment` | TL06 R26/STT 25 (mach); TL06 R153/STT 157 (mach_treatment); TL06 R185/STT 189 (nhip_tim_ecg) |
| 9 | `nhip_tho` | Nhịp thở | `mvp` | `integer` | lần/phút | `visit_value` | [4 .. 80] | `ai_diagnosis` | TL06 R27/STT 26 (nhip_tho) |
| 10 | `spo2` | Độ bão hòa oxy máu ngoại vi (SpO₂) | `mvp` | `number` | % | `visit_value` | [30 .. 100] | `ai_diagnosis`, `ai_treatment` | TL06 R28/STT 27 (spo2); TL06 R154/STT 158 (spo2_treatment) |
| 11 | `tinh_mach_co_noi` | Tĩnh mạch cổ nổi | `mvp` | `boolean` | — | `visit_value` | — | `ai_diagnosis`, `ai_lab_test` | TL06 R29/STT 28 (tinh_mach_co_noi); TL06 R107/STT 111 (trieu_chung_dau_hieu) |
| 12 | `phan_hoi_gan_tinh_mach_co` | Phản hồi gan – tĩnh mạch cổ dương tính | `mvp` | `boolean` | — | `visit_value` | — | `ai_diagnosis` | TL06 R30/STT 29 (phan_hoi_gan_tinh_mach_co) |
| 13 | `tieng_tim_t3` | Tiếng tim T3 (ngựa phi) | `mvp` | `boolean` | — | `visit_value` | — | `ai_diagnosis` | TL06 R31/STT 30 (tieng_tim_t3) |
| 14 | `ran_am_phoi` | Ran ẩm ở phổi | `mvp` | `boolean` | — | `visit_value` | — | `ai_diagnosis` | TL06 R32/STT 31 (ran_am_phoi) |
| 15 | `phu_ngoai_bien` | Phù ngoại biên (khám thực thể) | `mvp` | `boolean` | — | `visit_value` | — | `ai_diagnosis`, `ai_lab_test` | TL06 R33/STT 32 (phu_ngoai_bien); TL06 R107/STT 111 (trieu_chung_dau_hieu) |
| 16 | `gan_to` | Gan to | `mvp` | `boolean` | — | `visit_value` | — | `ai_diagnosis` | TL06 R34/STT 33 (gan_to) |
| 17 | `co_truong` | Cổ trướng | `mvp` | `boolean` | — | `visit_value` | — | `ai_diagnosis` | TL06 R35/STT 34 (co_truong) |
| 18 | `giam_tuoi_mau_ngoai_vi` | Dấu hiệu giảm tưới máu ngoại vi | `mvp` | `boolean` | — | `visit_value` | — | `ai_diagnosis`, `ai_treatment` | TL06 R36/STT 35 (giam_tuoi_mau_ngoai_vi); TL06 R151/STT 155 (sung_huyet_tuoi_mau) |
| 19 | `tinh_trang_sung_huyet` | Kết luận tình trạng sung huyết lâm sàng | `can_xac_nhan` | `text` | — | `visit_value` | — | `ai_treatment` | TL06 R151/STT 155 (sung_huyet_tuoi_mau) |

### 4.4. Nhóm `benh_su_dong_mac` — Bệnh sử, Yếu tố nguy cơ, Nguyên nhân và Bệnh đồng mắc (`24` `mvp` + `2` `can_xac_nhan`)

| # | `code` | Nhãn tiếng Việt | Phạm vi | Kiểu (`data_type`) | Đơn vị chuẩn | Nơi lưu (`storage_level`) | Miền giá trị / Lựa chọn | Module AI | Nguồn (`source_ref`) |
|---:|---|---|---|---|---|---|---|---|---|
| 1 | `ts_benh_mach_vanh_nmct` | Bệnh mạch vành / Nhồi máu cơ tim | `mvp` | `boolean` | — | `visit_value` | — | `ai_diagnosis`, `ai_treatment` | TL06 R44/STT 45 (benh_mach_vanh_nhoi_mau_co_tim); TL06 R161/STT 165 (benh_dong_mac_treatment) |
| 2 | `ts_dai_thao_duong` | Đái tháo đường | `mvp` | `boolean` | — | `visit_value` | — | `ai_diagnosis`, `ai_lab_test`, `ai_treatment` | TL06 R45/STT 46 (dai_thao_duong); TL06 R111/STT 115 (benh_dong_mac_lab); TL06 R161/STT 165 (benh_dong_mac_treatment) |
| 3 | `ts_beo_phi` | Béo phì (ghi nhận lâm sàng) | `mvp` | `boolean` | — | `visit_value` | — | `ai_diagnosis` | TL06 R46/STT 47 (beo_phi) |
| 4 | `ts_benh_than_man` | Bệnh thận mạn (CKD) | `mvp` | `boolean` | — | `visit_value` | — | `ai_diagnosis`, `ai_lab_test`, `ai_treatment` | TL06 R47/STT 48 (benh_than_man); TL06 R111/STT 115 (benh_dong_mac_lab); TL06 R161/STT 165 (benh_dong_mac_treatment) |
| 5 | `ts_hoa_tri_thuoc_doc_tim` | Tiền sử hóa trị / thuốc độc tim | `mvp` | `boolean` | — | `visit_value` | — | `ai_diagnosis` | TL06 R48/STT 49 (tien_su_hoa_tri_thuoc_doc_tim) |
| 6 | `ts_benh_co_tim_cau_truc` | Tiền sử bệnh cơ tim / tim cấu trúc | `mvp` | `boolean` | — | `visit_value` | — | `ai_diagnosis` | TL06 R49/STT 50 (tien_su_benh_co_tim_cau_truc) |
| 7 | `ts_tang_huyet_ap` | Tăng huyết áp | `mvp` | `boolean` | — | `visit_value` | — | `ai_diagnosis` | TL06 R50/STT 52 (tang_huyet_ap_nguyen_nhan) |
| 8 | `ts_benh_van_tim` | Bệnh van tim | `mvp` | `boolean` | — | `visit_value` | — | `ai_diagnosis` | TL06 R51/STT 53 (benh_van_tim) |
| 9 | `ts_rung_nhi_roi_loan_nhip` | Rung nhĩ / Rối loạn nhịp khác | `mvp` | `boolean` | — | `visit_value` | — | `ai_diagnosis`, `ai_treatment` | TL06 R52/STT 54 (rung_nhi_roi_loan_nhip); TL06 R161/STT 165 (benh_dong_mac_treatment) |
| 10 | `ts_benh_co_tim` | Bệnh cơ tim (giãn, phì đại, hạn chế...) | `mvp` | `boolean` | — | `visit_value` | — | `ai_diagnosis` | TL06 R53/STT 55 (benh_co_tim) |
| 11 | `ts_amyloidosis_tim` | Bệnh cơ tim Amyloid (Amyloidosis tim) | `mvp` | `boolean` | — | `visit_value` | — | `ai_diagnosis` | TL06 R54/STT 56 (amyloidosis_tim) |
| 12 | `ts_viem_co_tim` | Viêm cơ tim | `mvp` | `boolean` | — | `visit_value` | — | `ai_diagnosis` | TL06 R55/STT 57 (viem_co_tim) |
| 13 | `ts_thuoc_doc_chat` | Suy tim do thuốc hoặc độc chất | `mvp` | `boolean` | — | `visit_value` | — | `ai_diagnosis` | TL06 R56/STT 58 (thuoc_doc_chat) |
| 14 | `ts_takotsubo` | Bệnh cơ tim Takotsubo | `mvp` | `boolean` | — | `visit_value` | — | `ai_diagnosis` | TL06 R57/STT 59 (takotsubo) |
| 15 | `ts_benh_noi_tiet_chuyen_hoa` | Bệnh nội tiết – chuyển hóa | `mvp` | `boolean` | — | `visit_value` | — | `ai_diagnosis` | TL06 R58/STT 60 (benh_noi_tiet_chuyen_hoa) |
| 16 | `ts_suy_tim_cung_luong_cao` | Suy tim cung lượng cao | `mvp` | `boolean` | — | `visit_value` | — | `ai_diagnosis` | TL06 R59/STT 61 (suy_tim_cung_luong_cao) |
| 17 | `ts_copd` | Bệnh phổi tắc nghẽn mạn tính (COPD) | `mvp` | `boolean` | — | `visit_value` | — | `ai_diagnosis`, `ai_lab_test`, `ai_treatment` | TL06 R60/STT 64 (copd); TL06 R111/STT 115 (benh_dong_mac_lab); TL06 R161/STT 165 (benh_dong_mac_treatment) |
| 18 | `ts_thieu_mau` | Thiếu máu | `mvp` | `boolean` | — | `visit_value` | — | `ai_diagnosis`, `ai_lab_test` | TL06 R61/STT 65 (thieu_mau); TL06 R111/STT 115 (benh_dong_mac_lab) |
| 19 | `ts_benh_gan` | Bệnh gan | `mvp` | `boolean` | — | `visit_value` | — | `ai_diagnosis` | TL06 R62/STT 66 (benh_gan) |
| 20 | `ts_roi_loan_tuyen_giap` | Rối loạn tuyến giáp | `mvp` | `boolean` | — | `visit_value` | — | `ai_diagnosis` | TL06 R63/STT 67 (roi_loan_tuyen_giap) |
| 21 | `ts_sa_sut_tri_tue` | Sa sút trí tuệ | `mvp` | `boolean` | — | `visit_value` | — | `ai_diagnosis` | TL06 R64/STT 68 (sa_sut_tri_tue) |
| 22 | `ts_tram_cam` | Trầm cảm | `mvp` | `boolean` | — | `visit_value` | — | `ai_diagnosis` | TL06 R65/STT 69 (tram_cam) |
| 23 | `ts_benh_mach_mau_nao` | Bệnh mạch máu não (đột quỵ / TIA) | `mvp` | `boolean` | — | `visit_value` | — | `ai_diagnosis` | TL06 R66/STT 70 (benh_mach_mau_nao) |
| 24 | `ts_ung_thu` | Ung thư | `mvp` | `boolean` | — | `visit_value` | — | `ai_diagnosis` | TL06 R67/STT 71 (ung_thu) |
| 25 | `ts_benh_mach_vanh_chi_tiet` | Chi tiết mức độ hẹp / can thiệp ĐMV | `can_xac_nhan` | `text` | — | `visit_value` | — | `ai_diagnosis` | TL06 R44/STT 45 (benh_mach_vanh_nhoi_mau_co_tim) |
| 26 | `ts_thiet_bi_cay_ghep_chong_chi_dinh_mri` | Thiết bị cấy ghép và chống chỉ định MRI | `can_xac_nhan` | `text` | — | `visit_value` | — | `ai_lab_test` | TL06 R114/STT 118 (thiet_bi_cay_ghep) |

### 4.5. Nhóm `thuoc_di_ung` — Thuốc hiện dùng và Dị ứng / ADR (`4` `mvp` + `2` `can_xac_nhan`)

| # | `code` | Nhãn tiếng Việt | Phạm vi | Kiểu (`data_type`) | Đơn vị chuẩn | Nơi lưu (`storage_level`) | Miền giá trị / Lựa chọn | Module AI | Nguồn (`source_ref`) |
|---:|---|---|---|---|---|---|---|---|---|
| 1 | `thuoc_ghi_nhan` | Danh sách thuốc đang sử dụng | `mvp` | `text` | — | `medication` | — | `ai_diagnosis`, `ai_lab_test`, `ai_medsafety`, `ai_treatment` | TL06 R68/STT 72 (danh_sach_thuoc); TL06 R112/STT 116 (thuoc_dang_su_dung_lab); TL06 R159/STT 163 (thuoc_lieu_tuan_thu); TL06 R177/STT 181 (don_thuoc_moi); +1 dòng khác |
| 2 | `so_luong_thuoc_dong_thoi` | Số lượng thuốc sử dụng đồng thời | `mvp` | `integer` | thuốc | `computed` | [0 .. 50] | `ai_diagnosis`, `ai_medsafety` | TL06 R69/STT 73 (da_thuoc); TL06 R179/STT 183 (so_luong_thuoc_dong_thoi) |
| 3 | `di_ung_adr` | Dị ứng thuốc, ADR và không dung nạp | `mvp` | `text` | — | `allergy` | — | `ai_lab_test`, `ai_medsafety`, `ai_treatment` | TL06 R113/STT 117 (di_ung_thuoc_can_quang); TL06 R160/STT 164 (khong_dung_nap_thuoc); TL06 R180/STT 184 (di_ung_phan_ung_co_hai) |
| 4 | `di_ung_thuoc_can_quang` | Dị ứng thuốc cản quang | `mvp` | `boolean` | — | `allergy` | — | `ai_lab_test` | TL06 R113/STT 117 (di_ung_thuoc_can_quang) |
| 5 | `co_da_thuoc` | Cờ tình trạng đa thuốc | `can_xac_nhan` | `boolean` | — | `computed` | — | `ai_diagnosis` | TL06 R69/STT 73 (da_thuoc) |
| 6 | `thuoc_muc_do_tuan_thu` | Mức độ tuân thủ dùng thuốc | `can_xac_nhan` | `text` | — | `medication` | — | `ai_treatment` | TL06 R159/STT 163 (thuoc_lieu_tuan_thu) |

### 4.6. Nhóm `can_lam_sang` — Kết quả Cận lâm sàng đã có (`18` `mvp` + `2` `can_xac_nhan`)

| # | `code` | Nhãn tiếng Việt | Phạm vi | Kiểu (`data_type`) | Đơn vị chuẩn | Nơi lưu (`storage_level`) | Miền giá trị / Lựa chọn | Module AI | Nguồn (`source_ref`) |
|---:|---|---|---|---|---|---|---|---|---|
| 1 | `cls_ecg_ket_luan` | Kết quả đọc Điện tâm đồ (ECG 12 chuyển đạo) | `mvp` | `text` | — | `lab_result` | — | `ai_diagnosis`, `ai_lab_test`, `ai_medsafety` | TL06 R70/STT 74 (ecg_12_chuyen_dao); TL06 R109/STT 113 (xet_nghiem_da_co); TL06 R185/STT 189 (nhip_tim_ecg) |
| 2 | `cls_ecg_thoi_diem` | Thời điểm đo ECG | `mvp` | `text` | — | `lab_result` | — | `ai_diagnosis`, `ai_medsafety` | TL06 R70/STT 74 (ecg_12_chuyen_dao); TL06 R185/STT 189 (nhip_tim_ecg) |
| 3 | `cls_bnp` | Xét nghiệm BNP | `mvp` | `number` | pg/mL | `lab_result` | [0 .. 50000] | `ai_diagnosis`, `ai_lab_test`, `ai_treatment` | TL06 R71/STT 75 (bnp_ntprobnp); TL06 R109/STT 113 (xet_nghiem_da_co); TL06 R156/STT 160 (bnp_treatment) |
| 4 | `cls_don_vi` | Đơn vị xét nghiệm cận lâm sàng | `mvp` | `text` | — | `lab_result` | — | `ai_diagnosis`, `ai_medsafety`, `ai_treatment` | TL06 R71/STT 75 (bnp_ntprobnp); TL06 R72/STT 76 (troponin); TL06 R75/STT 79 (creatinin_egfr); TL06 R76/STT 80 (dien_giai); +6 dòng khác |
| 5 | `cls_nt_probnp` | Xét nghiệm NT-proBNP | `mvp` | `number` | pg/mL | `lab_result` | [0 .. 200000] | `ai_diagnosis`, `ai_lab_test`, `ai_treatment` | TL06 R71/STT 75 (bnp_ntprobnp); TL06 R109/STT 113 (xet_nghiem_da_co); TL06 R156/STT 160 (bnp_treatment) |
| 6 | `cls_thoi_diem` | Thời điểm thực hiện / lấy mẫu CLS | `mvp` | `text` | — | `lab_result` | — | `ai_diagnosis`, `ai_medsafety`, `ai_treatment` | TL06 R71/STT 75 (bnp_ntprobnp); TL06 R72/STT 76 (troponin); TL06 R75/STT 79 (creatinin_egfr); TL06 R76/STT 80 (dien_giai); +6 dòng khác |
| 7 | `cls_troponin` | Xét nghiệm Troponin | `mvp` | `number` | ng/L | `lab_result` | [0 .. 100000] | `ai_diagnosis` | TL06 R72/STT 76 (troponin) |
| 8 | `cls_troponin_loai` | Loại xét nghiệm Troponin | `mvp` | `single_choice` | — | `lab_result` | `hs_troponin_t` (hs-Troponin T), `hs_troponin_i` (hs-Troponin I), `troponin_t` (Troponin T), `troponin_i` (Troponin I) | `ai_diagnosis` | TL06 R72/STT 76 (troponin) |
| 9 | `cls_lvef` | Phân suất tống máu thất trái (LVEF) | `mvp` | `number` | % | `lab_result` | [5 .. 95] | `ai_diagnosis`, `ai_lab_test`, `ai_treatment` | TL06 R73/STT 77 (sieu_am_tim_ef); TL06 R109/STT 113 (xet_nghiem_da_co); TL06 R155/STT 159 (ef_hien_tai) |
| 10 | `cls_sieu_am_tim_ket_luan` | Kết luận siêu âm tim | `mvp` | `text` | — | `lab_result` | — | `ai_diagnosis` | TL06 R73/STT 77 (sieu_am_tim_ef) |
| 11 | `cls_sieu_am_tim_thoi_diem` | Thời điểm siêu âm tim | `mvp` | `text` | — | `lab_result` | — | `ai_diagnosis`, `ai_treatment` | TL06 R73/STT 77 (sieu_am_tim_ef); TL06 R155/STT 159 (ef_hien_tai) |
| 12 | `cls_xquang_ket_luan` | Kết quả X-quang tim phổi | `mvp` | `text` | — | `lab_result` | — | `ai_diagnosis`, `ai_lab_test` | TL06 R74/STT 78 (xquang_tim_phoi); TL06 R109/STT 113 (xet_nghiem_da_co) |
| 13 | `cls_xquang_thoi_diem` | Thời điểm chụp X-quang tim phổi | `mvp` | `text` | — | `lab_result` | — | `ai_diagnosis` | TL06 R74/STT 78 (xquang_tim_phoi) |
| 14 | `cls_creatinin` | Creatinin huyết thanh | `mvp` | `number` | umol/L | `lab_result` | [10 .. 3000] | `ai_diagnosis`, `ai_lab_test`, `ai_medsafety`, `ai_treatment` | TL06 R75/STT 79 (creatinin_egfr); TL06 R110/STT 114 (chuc_nang_than_gan_dien_giai); TL06 R157/STT 161 (creatinin_egfr_treatment); TL06 R181/STT 185 (creatinin_egfr_medsafety) |
| 15 | `cls_egfr` | Mức lọc cầu thận ước tính (eGFR) | `mvp` | `number` | mL/phút/1.73m² | `lab_result` | [1 .. 200] | `ai_diagnosis`, `ai_lab_test`, `ai_medsafety`, `ai_treatment` | TL06 R75/STT 79 (creatinin_egfr); TL06 R110/STT 114 (chuc_nang_than_gan_dien_giai); TL06 R157/STT 161 (creatinin_egfr_treatment); TL06 R181/STT 185 (creatinin_egfr_medsafety) |
| 16 | `cls_clo` | Clo máu (Cl-) | `mvp` | `number` | mmol/L | `lab_result` | [60 .. 150] | `ai_diagnosis`, `ai_medsafety` | TL06 R76/STT 80 (dien_giai); TL06 R182/STT 186 (kali_natri_dien_giai_medsafety) |
| 17 | `cls_kali` | Kali máu (K+) | `mvp` | `number` | mmol/L | `lab_result` | [1.0 .. 10.0] | `ai_diagnosis`, `ai_lab_test`, `ai_medsafety`, `ai_treatment` | TL06 R76/STT 80 (dien_giai); TL06 R110/STT 114 (chuc_nang_than_gan_dien_giai); TL06 R158/STT 162 (kali_natri_gan); TL06 R182/STT 186 (kali_natri_dien_giai_medsafety) |
| 18 | `cls_natri` | Natri máu (Na+) | `mvp` | `number` | mmol/L | `lab_result` | [90 .. 190] | `ai_diagnosis`, `ai_lab_test`, `ai_medsafety`, `ai_treatment` | TL06 R76/STT 80 (dien_giai); TL06 R110/STT 114 (chuc_nang_than_gan_dien_giai); TL06 R158/STT 162 (kali_natri_gan); TL06 R182/STT 186 (kali_natri_dien_giai_medsafety) |
| 19 | `thay_doi_bnp_ntprobnp_ef` | Biến thiên BNP/NT-proBNP và EF | `can_xac_nhan` | `number` | % | `computed` | [-100 .. 10000] | `ai_diagnosis` | TL06 R80/STT 84 (thay_doi_bnp_ntprobnp) |
| 20 | `cls_chuc_nang_gan` | Kết quả chức năng gan | `can_xac_nhan` | `text` | — | `lab_result` | — | `ai_lab_test`, `ai_medsafety`, `ai_treatment` | TL06 R110/STT 114 (chuc_nang_than_gan_dien_giai); TL06 R158/STT 162 (kali_natri_gan); TL06 R183/STT 187 (chuc_nang_gan_medsafety) |

### 4.7. Nhóm `lao_khoa` — Đánh giá Lão khoa và Hỗ trợ Xã hội (`9` `mvp` + `10` `can_xac_nhan`)

| # | `code` | Nhãn tiếng Việt | Phạm vi | Kiểu (`data_type`) | Đơn vị chuẩn | Nơi lưu (`storage_level`) | Miền giá trị / Lựa chọn | Module AI | Nguồn (`source_ref`) |
|---:|---|---|---|---|---|---|---|---|---|
| 1 | `lao_khoa_tien_su_sang` | Tiền sử sảng (Delirium) | `mvp` | `boolean` | — | `visit_value` | — | `ai_diagnosis`, `ai_medsafety` | TL06 R39/STT 39 (tien_su_sang); TL06 R187/STT 191 (nhan_thuc_tien_su_sang) |
| 2 | `lao_khoa_sarcopenia` | Suy giảm khối cơ / lực cơ (Sarcopenia) | `mvp` | `boolean` | — | `visit_value` | — | `ai_diagnosis`, `ai_medsafety`, `ai_treatment` | TL06 R42/STT 42 (sarcopenia); TL06 R166/STT 170 (dinh_duong_sarcopenia); TL06 R190/STT 194 (dinh_duong_can_nang_sarcopenia) |
| 3 | `lao_khoa_tu_su_dung_thuoc` | Khả năng tự sử dụng và quản lý thuốc | `mvp` | `single_choice` | — | `visit_value` | `tu_su_dung_duoc` (Tự sử dụng được), `can_ho_tro` (Cần hỗ trợ), `khong_tu_su_dung` (Không tự sử dụng) | `ai_diagnosis`, `ai_medsafety`, `ai_treatment` | TL06 R43/STT 43 (tu_su_dung_thuoc); TL06 R167/STT 171 (tu_quan_ly_thuoc); TL06 R189/STT 193 (kha_nang_nuot_tu_dung_thuoc) |
| 4 | `xh_co_nguoi_cham_soc` | Có người chăm sóc hỗ trợ | `mvp` | `boolean` | — | `visit_value` | — | `ai_diagnosis`, `ai_medsafety`, `ai_treatment` | TL06 R83/STT 87 (nguoi_cham_soc); TL06 R167/STT 171 (tu_quan_ly_thuoc); TL06 R191/STT 195 (ho_tro_nguoi_cham_soc_medsafety) |
| 5 | `xh_quan_he_nguoi_cham_soc` | Quan hệ người chăm sóc | `mvp` | `text` | — | `visit_value` | — | `ai_diagnosis` | TL06 R83/STT 87 (nguoi_cham_soc) |
| 6 | `xh_kha_nang_chi_tra` | Khả năng chi trả | `mvp` | `single_choice` | — | `visit_value` | `du` (Đủ), `han_che` (Hạn chế), `khong_du` (Không đủ) | `ai_diagnosis`, `ai_lab_test`, `ai_medsafety` | TL06 R84/STT 88 (kha_nang_chi_tra); TL06 R116/STT 120 (muc_tieu_kha_nang_xet_nghiem); TL06 R192/STT 196 (chi_tra_tai_kham_medsafety) |
| 7 | `xh_kha_nang_tai_kham` | Khả năng tái khám | `mvp` | `single_choice` | — | `visit_value` | `co` (Có), `han_che` (Hạn chế), `khong` (Không) | `ai_diagnosis`, `ai_medsafety` | TL06 R85/STT 89 (kha_nang_tai_kham); TL06 R192/STT 196 (chi_tra_tai_kham_medsafety) |
| 8 | `xh_kha_nang_mua_su_dung_thuoc` | Khả năng mua và sử dụng thuốc | `mvp` | `single_choice` | — | `visit_value` | `tot` (Tốt), `han_che` (Hạn chế), `khong` (Không) | `ai_diagnosis` | TL06 R86/STT 90 (kha_nang_mua_su_dung_thuoc) |
| 9 | `xh_ho_tro_gia_dinh` | Mức độ hỗ trợ của gia đình | `mvp` | `single_choice` | — | `visit_value` | `tot` (Tốt), `trung_binh` (Trung bình), `it_khong` (Ít/Không) | `ai_diagnosis`, `ai_medsafety` | TL06 R88/STT 92 (ho_tro_gia_dinh); TL06 R191/STT 195 (ho_tro_nguoi_cham_soc_medsafety) |
| 10 | `lao_khoa_frailty` | Đánh giá suy yếu (Frailty) | `can_xac_nhan` | `text` | — | `visit_value` | — | `ai_diagnosis`, `ai_lab_test`, `ai_medsafety`, `ai_treatment` | TL06 R37/STT 36 (frailty); TL06 R108/STT 112 (frailty_hop_tac_xet_nghiem); TL06 R162/STT 166 (frailty_treatment); TL06 R186/STT 190 (frailty_medsafety) |
| 11 | `lao_khoa_chuc_nang_nhan_thuc` | Chức năng nhận thức | `can_xac_nhan` | `text` | — | `visit_value` | — | `ai_diagnosis`, `ai_lab_test`, `ai_medsafety`, `ai_treatment` | TL06 R38/STT 38 (chuc_nang_nhan_thuc); TL06 R108/STT 112 (frailty_hop_tac_xet_nghiem); TL06 R163/STT 167 (nhan_thuc_treatment); TL06 R187/STT 191 (nhan_thuc_tien_su_sang) |
| 12 | `lao_khoa_nguy_co_te_nga` | Nguy cơ té ngã | `can_xac_nhan` | `text` | — | `visit_value` | — | `ai_diagnosis`, `ai_treatment` | TL06 R40/STT 40 (nguy_co_te_nga); TL06 R165/STT 169 (nguy_co_te_nga_hha) |
| 13 | `lao_khoa_tinh_trang_dinh_duong` | Tình trạng dinh dưỡng | `can_xac_nhan` | `text` | — | `visit_value` | — | `ai_diagnosis`, `ai_medsafety`, `ai_treatment` | TL06 R41/STT 41 (tinh_trang_dinh_duong); TL06 R166/STT 170 (dinh_duong_sarcopenia); TL06 R190/STT 194 (dinh_duong_can_nang_sarcopenia) |
| 14 | `xh_khoang_cach_co_so_y_te` | Khoảng cách đến cơ sở y tế | `can_xac_nhan` | `number` | km | `visit_value` | [0 .. 1000] | `ai_diagnosis` | TL06 R87/STT 91 (khoang_cach_co_so_y_te) |
| 15 | `kha_nang_hop_tac_xet_nghiem` | Khả năng hợp tác thực hiện xét nghiệm | `can_xac_nhan` | `text` | — | `visit_value` | — | `ai_lab_test` | TL06 R108/STT 112 (frailty_hop_tac_xet_nghiem) |
| 16 | `kha_nang_gang_suc_tham_do_xam_lan` | Khả năng chịu đựng nghiệm pháp gắng sức / xâm lấn | `can_xac_nhan` | `text` | — | `visit_value` | — | `ai_lab_test` | TL06 R115/STT 119 (kha_nang_gang_suc_tham_do) |
| 17 | `kha_nang_thuc_hien_xet_nghiem` | Khả năng thực hiện xét nghiệm tại cơ sở | `can_xac_nhan` | `text` | — | `visit_value` | — | `ai_lab_test` | TL06 R116/STT 120 (muc_tieu_kha_nang_xet_nghiem) |
| 18 | `lao_khoa_adl_iadl` | Khả năng thực hiện ADL/IADL | `can_xac_nhan` | `text` | — | `visit_value` | — | `ai_treatment` | TL06 R164/STT 168 (adl_iadl_treatment) |
| 19 | `lao_khoa_kha_nang_nuot` | Khả năng nuốt | `can_xac_nhan` | `text` | — | `visit_value` | — | `ai_medsafety` | TL06 R189/STT 193 (kha_nang_nuot_tu_dung_thuoc) |

### 4.8. Nhóm `ghi_chu` — Ghi chú bác sĩ và Kết luận trước điều trị (`0` `mvp` + `4` `can_xac_nhan`)

| # | `code` | Nhãn tiếng Việt | Phạm vi | Kiểu (`data_type`) | Đơn vị chuẩn | Nơi lưu (`storage_level`) | Miền giá trị / Lựa chọn | Module AI | Nguồn (`source_ref`) |
|---:|---|---|---|---|---|---|---|---|---|
| 1 | `muc_tieu_dieu_tri` | Mục tiêu điều trị ưu tiên | `can_xac_nhan` | `multi_choice` | — | `visit_value` | `keo_dai_song` (Kéo dài thời gian sống), `giam_nhap_vien` (Giảm nhập viện), `giam_trieu_chung` (Giảm triệu chứng), `duy_tri_chuc_nang` (Duy trì chức năng), `nang_cao_chat_luong_song` (Nâng cao chất lượng sống), `cham_soc_giam_nhe` (Chăm sóc giảm nhẹ) | `ai_lab_test`, `ai_treatment` | TL06 R116/STT 120 (muc_tieu_kha_nang_xet_nghiem); TL06 R168/STT 172 (muc_tieu_dieu_tri) |
| 2 | `chan_doan_stage_suy_tim` | Giai đoạn suy tim (Stage A–D) | `can_xac_nhan` | `single_choice` | — | `visit_value` | `stage_a` (Stage A), `stage_b` (Stage B), `stage_c` (Stage C), `stage_d` (Stage D) | `ai_treatment` | TL06 R146/STT 150 (stage_suy_tim) |
| 3 | `chan_doan_kieu_hinh_ef` | Kiểu hình suy tim theo EF | `can_xac_nhan` | `single_choice` | — | `visit_value` | `hfref` (EF giảm), `hfpef` (EF bảo tồn), `hfimef` (EF cải thiện), `unclassified` (Chưa phân loại do thiếu EF) | `ai_treatment` | TL06 R147/STT 151 (ef_treatment) |
| 4 | `chan_doan_nguyen_nhan_suy_tim` | Nguyên nhân suy tim trước điều trị | `can_xac_nhan` | `text` | — | `visit_value` | — | `ai_treatment` | TL06 R148/STT 152 (nguyen_nhan_treatment) |
