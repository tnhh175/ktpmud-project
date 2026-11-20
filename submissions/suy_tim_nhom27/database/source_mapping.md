# Bảng Ánh xạ Nguồn Dữ liệu sang Schema (`source_mapping.md`)

**Tệp truy vết đầu vào:** `trace-table.xlsx`  
**Mục tiêu kiểm chứng:** Chứng minh truy vết đầy đủ từ `TL06` (`206` dòng = `141` đầu vào + `65` đầu ra) và các trường bổ sung từ `TL04`, `TL05`, `XLS` sang `field_definition.code` / cột bảng chuẩn hóa; xác nhận **95 mã `mvp` + 26 mã `can_xac_nhan`** chỉ đến từ `141` dòng đầu vào (`0` mã từ `65` dòng đầu ra AI và `0` mã từ `5` dòng chuyển tiếp `M1 -> M2`).

---

## 1. Thống kê Đối soát Chặng A → Chặng C

| Hạng mục trong `trace-table.xlsx` (`TL06`) | Số dòng nguồn | Chiều (`chieu`) | Số mã `field_definition.code` duy nhất | Trạng thái trong `seed.sql` |
|---|---:|---|---:|---|
| Quyết định `MVP` | `99` | `100% vao` (`0` `ra`) | **`95`** | Nạp `field_definition` (`scope_status = 'mvp'`), `form_field.is_visible = true` |
| Quyết định `can_xac_nhan` | `37` | `100% vao` (`0` `ra`) | **`26`** mã riêng *(+ `21` mã đã nằm ở `MVP`)* | Nạp `field_definition` (`scope_status = 'can_xac_nhan'`), `form_field.is_visible = false` |
| Quyết định `giai_doan_sau` | `70` | `65` `ra` + `5` `vao` (`M1 -> M2`) | `0` trong CSDL MVP | **Loại khỏi `field_definition` và `seed.sql`** (`0` mã lọt vào catalog) |
| **Tổng cộng `TL06`** | **`206`** | **`141` `vao` + `65` `ra`** | **`121`** (`95 + 26`) | Khớp 100% tiêu chí nghiệm thu (e), (f), (g) |

---

## 2. Ánh xạ Các Trường Ngoài `TL06` (`TL04`, `TL05`, `XLS`) vào Bảng CSDL

> Các trường hành chính và định danh lõi ngoài `TL06` được chuẩn hóa thành cột trực tiếp trên bảng `patient` và `visit` (không nhồi thêm vào `field_definition` để giữ nguyên bộ đếm chuẩn `95 mvp + 26 can_xac_nhan` từ `TL06`).

| Mã nguồn (`TL04`/`TL05`/`XLS`) | Tên trường nguồn | Mã đề xuất trong `trace-table` | Bảng & Cột đích trong `schema.sql` | Quyết định |
|---|---|---|---|---|
| `TL04` `T1R2`; `TL05` `R7` | `MA_BN` | `bn_ma_ho_so`, `bn_ma_ngoai` | `patient.patient_code` (`BN-\d{5}`), `patient.external_patient_code` | `MVP` |
| `TL05` `R9` | `HO_TEN` | `bn_ten_hien_thi` | `patient.full_name` | `MVP` |
| `TL04` `T1R4`; `TL05` `R10`; `XLS` `Col C` | `NGAY_SINH`, `NamSinh` | `bn_ngay_sinh`, `bn_nam_sinh` | `patient.birth_date`, `patient.birth_year`, `patient.declared_age` | `MVP` |
| `TL04` `T1R3`; `TL05` `R8` | `MA_LK` | `luot_ma_luot`, `luot_ma_ngoai` | `visit.visit_code`, `visit.external_visit_code` | `MVP` |
| `TL04` `T1R6`; `TL05` `R15`; `XLS` `Col D` | `NGAY_VAO` / `THOI_GIAN_KHAM` | `luot_thoi_diem_kham` | `visit.visit_date` (`timestamptz`) | `MVP` |
| `TL05` `R16` | `BAC_SI_KHAM` | `luot_bac_si_phu_trach` | `visit.created_by` (`FK -> app_user.id`) | `MVP` |
| `XLS` `Col Q`; `BAN-GIAO` §3.1 | `TienSuKhac` / Ghi chú BS | `ghi_chu_lam_sang` | `visit.clinical_note` | `MVP` |
| `XLS` `Col AO–AP` | `Clo_KetQua`, `Clo_DonVi` | `cls_clo` | Đã có trong `TL06` R76/R182 → `field_definition.code = 'cls_clo'` → `visit_lab_result` | `MVP` |
| `TL05` `R13–R14`; `TL04` `T1R7–T1R9`; `XLS` `Col E–I` | `SO_BHYT`, `KHOA_PHONG`, `NGAY_RA`, `MA_BENH_CHINH`, `MA_BENH_KEM_THEO` | `bn_so_bhyt`, `luot_khoa_phong`, `luot_thoi_diem_ket_thuc`, `luot_chan_doan_icd_*` | Giữ ngoài schema MVP (chờ xác nhận quy tắc BHYT/ICD-10 theo `BAN-GIAO` §4.1) | `can_xac_nhan` |
| `TL04` `T3R7`; `TL05` `R21`; `XLS` `Col L–P, T` | `CONG_THUC_MAU`, `E_OVER_A_RATIO`, `NhietDo`, `RuouBia`, `ThuocLa` | `cls_hemoglobin`, `cls_e_over_a_ratio`, `nhiet_do_c`, `ts_ruou_bia`, `ts_thuoc_la` | Chờ xác nhận bổ sung từ nhóm AI/Bệnh viện (danh mục `can_xac_nhan`) | `can_xac_nhan` |

---

## 3. Bảng Ánh xạ Toàn bộ `206` dòng `TL06` (`R2–R207`) → `field_definition.code`

| Dòng Excel | STT `TL06` | Module (`TL06`) | Chiều | Tên gốc (`ten_goc`) | Quyết định | `ma_truong_dich` (`field_definition.code` / ngoài MVP) | Nơi lưu trữ CSDL |
|---:|---:|---|---|---|---|---|---|
| R2 | 1 | Model 1 – AI Diagnosis | `vao` | `tuoi` | `MVP` | `luot_tuoi` | `computed` |
| R3 | 2 | Model 1 – AI Diagnosis | `vao` | `gioi_tinh` | `MVP` | `bn_gioi_tinh` | `patient` |
| R4 | 3 | Model 1 – AI Diagnosis | `vao` | `chieu_cao` | `MVP` | `chieu_cao_cm` | `visit_value` |
| R5 | 4 | Model 1 – AI Diagnosis | `vao` | `can_nang` | `MVP` | `can_nang_kg` | `visit_value` |
| R6 | 5 | Model 1 – AI Diagnosis | `vao` | `bmi` | `MVP` | `bmi` | `computed` |
| R7 | 6 | Model 1 – AI Diagnosis | `vao` | `kho_tho_khi_gang_suc` | `MVP` | `kho_tho_khi_gang_suc` | `visit_value` |
| R8 | 7 | Model 1 – AI Diagnosis | `vao` | `kho_tho_khi_nam` | `MVP` | `kho_tho_khi_nam` | `visit_value` |
| R9 | 8 | Model 1 – AI Diagnosis | `vao` | `kho_tho_kich_phat_ve_dem` | `MVP` | `kho_tho_kich_phat_ve_dem` | `visit_value` |
| R10 | 9 | Model 1 – AI Diagnosis | `vao` | `met_moi` | `MVP` | `met_moi` | `visit_value` |
| R11 | 10 | Model 1 – AI Diagnosis | `vao` | `giam_kha_nang_gang_suc` | `MVP` | `giam_kha_nang_gang_suc` | `visit_value` |
| R12 | 11 | Model 1 – AI Diagnosis | `vao` | `phu_hai_chi_duoi` | `MVP` | `phu_hai_chi_duoi` | `visit_value` |
| R13 | 12 | Model 1 – AI Diagnosis | `vao` | `tang_can_nhanh` | `MVP` | `tang_can_nhanh` | `visit_value` |
| R14 | 13 | Model 1 – AI Diagnosis | `vao` | `dau_nguc` | `MVP` | `dau_nguc` | `visit_value` |
| R15 | 14 | Model 1 – AI Diagnosis | `vao` | `hoi_hop` | `MVP` | `hoi_hop` | `visit_value` |
| R16 | 15 | Model 1 – AI Diagnosis | `vao` | `ngat` | `MVP` | `ngat` | `visit_value` |
| R17 | 16 | Model 1 – AI Diagnosis | `vao` | `lu_lan_sang` | `MVP` | `lu_lan_sang` | `visit_value` |
| R18 | 17 | Model 1 – AI Diagnosis | `vao` | `te_nga` | `MVP` | `te_nga` | `visit_value` |
| R19 | 18 | Model 1 – AI Diagnosis | `vao` | `chan_an` | `MVP` | `chan_an` | `visit_value` |
| R20 | 19 | Model 1 – AI Diagnosis | `vao` | `mat_ngu` | `MVP` | `mat_ngu` | `visit_value` |
| R21 | 20 | Model 1 – AI Diagnosis | `vao` | `giam_van_dong` | `MVP` | `giam_van_dong` | `visit_value` |
| R22 | 21 | Model 1 – AI Diagnosis | `vao` | `giam_kha_nang_tu_cham_soc` | `MVP` | `giam_kha_nang_tu_cham_soc` | `visit_value` |
| R23 | 22 | Model 1 – AI Diagnosis | `vao` | `suy_giam_chuc_nang_khong_giai_thich` | `MVP` | `suy_giam_chuc_nang_khong_giai_thich` | `visit_value` |
| R24 | 23 | Model 1 – AI Diagnosis | `vao` | `ha_t_the_nam_ngoi` | `MVP` | `huyet_ap_tam_thu`, `huyet_ap_tam_truong`, `tu_the_do_ha`, `thoi_diem_do_ha` | `orthostatic_bp` |
| R25 | 24 | Model 1 – AI Diagnosis | `vao` | `ha_t_the_dung` | `MVP` | `huyet_ap_tam_thu`, `huyet_ap_tam_truong`, `tu_the_do_ha`, `thoi_diem_do_ha` | `orthostatic_bp` |
| R26 | 25 | Model 1 – AI Diagnosis | `vao` | `mach` | `MVP` | `mach` | `visit_value` |
| R27 | 26 | Model 1 – AI Diagnosis | `vao` | `nhip_tho` | `MVP` | `nhip_tho` | `visit_value` |
| R28 | 27 | Model 1 – AI Diagnosis | `vao` | `spo2` | `MVP` | `spo2` | `visit_value` |
| R29 | 28 | Model 1 – AI Diagnosis | `vao` | `tinh_mach_co_noi` | `MVP` | `tinh_mach_co_noi` | `visit_value` |
| R30 | 29 | Model 1 – AI Diagnosis | `vao` | `phan_hoi_gan_tinh_mach_co` | `MVP` | `phan_hoi_gan_tinh_mach_co` | `visit_value` |
| R31 | 30 | Model 1 – AI Diagnosis | `vao` | `tieng_tim_t3` | `MVP` | `tieng_tim_t3` | `visit_value` |
| R32 | 31 | Model 1 – AI Diagnosis | `vao` | `ran_am_phoi` | `MVP` | `ran_am_phoi` | `visit_value` |
| R33 | 32 | Model 1 – AI Diagnosis | `vao` | `phu_ngoai_bien` | `MVP` | `phu_ngoai_bien` | `visit_value` |
| R34 | 33 | Model 1 – AI Diagnosis | `vao` | `gan_to` | `MVP` | `gan_to` | `visit_value` |
| R35 | 34 | Model 1 – AI Diagnosis | `vao` | `co_truong` | `MVP` | `co_truong` | `visit_value` |
| R36 | 35 | Model 1 – AI Diagnosis | `vao` | `giam_tuoi_mau_ngoai_vi` | `MVP` | `giam_tuoi_mau_ngoai_vi` | `visit_value` |
| R37 | 36 | Model 1 – AI Diagnosis | `vao` | `frailty` | `can_xac_nhan` | `lao_khoa_frailty` | `visit_value` |
| R38 | 38 | Model 1 – AI Diagnosis | `vao` | `chuc_nang_nhan_thuc` | `can_xac_nhan` | `lao_khoa_chuc_nang_nhan_thuc` | `visit_value` |
| R39 | 39 | Model 1 – AI Diagnosis | `vao` | `tien_su_sang` | `MVP` | `lao_khoa_tien_su_sang` | `visit_value` |
| R40 | 40 | Model 1 – AI Diagnosis | `vao` | `nguy_co_te_nga` | `can_xac_nhan` | `lao_khoa_nguy_co_te_nga` | `visit_value` |
| R41 | 41 | Model 1 – AI Diagnosis | `vao` | `tinh_trang_dinh_duong` | `can_xac_nhan` | `lao_khoa_tinh_trang_dinh_duong` | `visit_value` |
| R42 | 42 | Model 1 – AI Diagnosis | `vao` | `sarcopenia` | `MVP` | `lao_khoa_sarcopenia` | `visit_value` |
| R43 | 43 | Model 1 – AI Diagnosis | `vao` | `tu_su_dung_thuoc` | `MVP` | `lao_khoa_tu_su_dung_thuoc` | `visit_value` |
| R44 | 45 | Model 1 – AI Diagnosis | `vao` | `benh_mach_vanh_nhoi_mau_co_tim` | `can_xac_nhan` | `ts_benh_mach_vanh_nmct`, `ts_benh_mach_vanh_chi_tiet` | `visit_value` |
| R45 | 46 | Model 1 – AI Diagnosis | `vao` | `dai_thao_duong` | `can_xac_nhan` | `ts_dai_thao_duong` | `visit_value` |
| R46 | 47 | Model 1 – AI Diagnosis | `vao` | `beo_phi` | `MVP` | `ts_beo_phi` | `visit_value` |
| R47 | 48 | Model 1 – AI Diagnosis | `vao` | `benh_than_man` | `can_xac_nhan` | `ts_benh_than_man` | `visit_value` |
| R48 | 49 | Model 1 – AI Diagnosis | `vao` | `tien_su_hoa_tri_thuoc_doc_tim` | `MVP` | `ts_hoa_tri_thuoc_doc_tim` | `visit_value` |
| R49 | 50 | Model 1 – AI Diagnosis | `vao` | `tien_su_benh_co_tim_cau_truc` | `MVP` | `ts_benh_co_tim_cau_truc` | `visit_value` |
| R50 | 52 | Model 1 – AI Diagnosis | `vao` | `tang_huyet_ap_nguyen_nhan` | `MVP` | `ts_tang_huyet_ap` | `visit_value` |
| R51 | 53 | Model 1 – AI Diagnosis | `vao` | `benh_van_tim` | `MVP` | `ts_benh_van_tim` | `visit_value` |
| R52 | 54 | Model 1 – AI Diagnosis | `vao` | `rung_nhi_roi_loan_nhip` | `MVP` | `ts_rung_nhi_roi_loan_nhip` | `visit_value` |
| R53 | 55 | Model 1 – AI Diagnosis | `vao` | `benh_co_tim` | `MVP` | `ts_benh_co_tim` | `visit_value` |
| R54 | 56 | Model 1 – AI Diagnosis | `vao` | `amyloidosis_tim` | `MVP` | `ts_amyloidosis_tim` | `visit_value` |
| R55 | 57 | Model 1 – AI Diagnosis | `vao` | `viem_co_tim` | `MVP` | `ts_viem_co_tim` | `visit_value` |
| R56 | 58 | Model 1 – AI Diagnosis | `vao` | `thuoc_doc_chat` | `MVP` | `ts_thuoc_doc_chat` | `visit_value` |
| R57 | 59 | Model 1 – AI Diagnosis | `vao` | `takotsubo` | `MVP` | `ts_takotsubo` | `visit_value` |
| R58 | 60 | Model 1 – AI Diagnosis | `vao` | `benh_noi_tiet_chuyen_hoa` | `MVP` | `ts_benh_noi_tiet_chuyen_hoa` | `visit_value` |
| R59 | 61 | Model 1 – AI Diagnosis | `vao` | `suy_tim_cung_luong_cao` | `MVP` | `ts_suy_tim_cung_luong_cao` | `visit_value` |
| R60 | 64 | Model 1 – AI Diagnosis | `vao` | `copd` | `MVP` | `ts_copd` | `visit_value` |
| R61 | 65 | Model 1 – AI Diagnosis | `vao` | `thieu_mau` | `MVP` | `ts_thieu_mau` | `visit_value` |
| R62 | 66 | Model 1 – AI Diagnosis | `vao` | `benh_gan` | `MVP` | `ts_benh_gan` | `visit_value` |
| R63 | 67 | Model 1 – AI Diagnosis | `vao` | `roi_loan_tuyen_giap` | `MVP` | `ts_roi_loan_tuyen_giap` | `visit_value` |
| R64 | 68 | Model 1 – AI Diagnosis | `vao` | `sa_sut_tri_tue` | `MVP` | `ts_sa_sut_tri_tue` | `visit_value` |
| R65 | 69 | Model 1 – AI Diagnosis | `vao` | `tram_cam` | `MVP` | `ts_tram_cam` | `visit_value` |
| R66 | 70 | Model 1 – AI Diagnosis | `vao` | `benh_mach_mau_nao` | `MVP` | `ts_benh_mach_mau_nao` | `visit_value` |
| R67 | 71 | Model 1 – AI Diagnosis | `vao` | `ung_thu` | `MVP` | `ts_ung_thu` | `visit_value` |
| R68 | 72 | Model 1 – AI Diagnosis | `vao` | `danh_sach_thuoc` | `MVP` | `thuoc_ghi_nhan` | `medication` |
| R69 | 73 | Model 1 – AI Diagnosis | `vao` | `da_thuoc` | `can_xac_nhan` | `so_luong_thuoc_dong_thoi`, `co_da_thuoc` | `computed` |
| R70 | 74 | Model 1 – AI Diagnosis | `vao` | `ecg_12_chuyen_dao` | `MVP` | `cls_ecg_ket_luan`, `cls_ecg_thoi_diem` | `lab_result` |
| R71 | 75 | Model 1 – AI Diagnosis | `vao` | `bnp_ntprobnp` | `MVP` | `cls_bnp`, `cls_nt_probnp`, `cls_don_vi`, `cls_thoi_diem` | `lab_result` |
| R72 | 76 | Model 1 – AI Diagnosis | `vao` | `troponin` | `MVP` | `cls_troponin`, `cls_troponin_loai`, `cls_don_vi`, `cls_thoi_diem` | `lab_result` |
| R73 | 77 | Model 1 – AI Diagnosis | `vao` | `sieu_am_tim_ef` | `MVP` | `cls_lvef`, `cls_sieu_am_tim_ket_luan`, `cls_sieu_am_tim_thoi_diem` | `lab_result` |
| R74 | 78 | Model 1 – AI Diagnosis | `vao` | `xquang_tim_phoi` | `MVP` | `cls_xquang_ket_luan`, `cls_xquang_thoi_diem` | `lab_result` |
| R75 | 79 | Model 1 – AI Diagnosis | `vao` | `creatinin_egfr` | `MVP` | `cls_creatinin`, `cls_egfr`, `cls_don_vi`, `cls_thoi_diem` | `lab_result` |
| R76 | 80 | Model 1 – AI Diagnosis | `vao` | `dien_giai` | `MVP` | `cls_natri`, `cls_kali`, `cls_clo`, `cls_don_vi`, `cls_thoi_diem` | `lab_result` |
| R77 | 81 | Model 1 – AI Diagnosis | `vao` | `thay_doi_trieu_chung` | `MVP` | `thay_doi_trieu_chung` | `visit_value` |
| R78 | 82 | Model 1 – AI Diagnosis | `vao` | `thay_doi_can_nang` | `can_xac_nhan` | `thay_doi_can_nang_kg`, `thay_doi_can_nang_khoang_thoi_gian` | `visit_value` |
| R79 | 83 | Model 1 – AI Diagnosis | `vao` | `thay_doi_nyha` | `can_xac_nhan` | `nyha_hien_tai`, `thay_doi_nyha` | `visit_value` |
| R80 | 84 | Model 1 – AI Diagnosis | `vao` | `thay_doi_bnp_ntprobnp` | `can_xac_nhan` | `thay_doi_bnp_ntprobnp_ef` | `computed` |
| R81 | 85 | Model 1 – AI Diagnosis | `vao` | `so_lan_cap_cuu_nhap_vien` | `can_xac_nhan` | `so_lan_cap_cuu_nhap_vien` | `visit_value` |
| R82 | 86 | Model 1 – AI Diagnosis | `vao` | `nhu_cau_tang_lieu_loi_tieu` | `MVP` | `nhu_cau_tang_lieu_loi_tieu` | `visit_value` |
| R83 | 87 | Model 1 – AI Diagnosis | `vao` | `nguoi_cham_soc` | `MVP` | `xh_co_nguoi_cham_soc`, `xh_quan_he_nguoi_cham_soc` | `visit_value` |
| R84 | 88 | Model 1 – AI Diagnosis | `vao` | `kha_nang_chi_tra` | `MVP` | `xh_kha_nang_chi_tra` | `visit_value` |
| R85 | 89 | Model 1 – AI Diagnosis | `vao` | `kha_nang_tai_kham` | `MVP` | `xh_kha_nang_tai_kham` | `visit_value` |
| R86 | 90 | Model 1 – AI Diagnosis | `vao` | `kha_nang_mua_su_dung_thuoc` | `MVP` | `xh_kha_nang_mua_su_dung_thuoc` | `visit_value` |
| R87 | 91 | Model 1 – AI Diagnosis | `vao` | `khoang_cach_co_so_y_te` | `can_xac_nhan` | `xh_khoang_cach_co_so_y_te` | `visit_value` |
| R88 | 92 | Model 1 – AI Diagnosis | `vao` | `ho_tro_gia_dinh` | `MVP` | `xh_ho_tro_gia_dinh` | `visit_value` |
| R89 | 93 | Model 1 – AI Diagnosis | `ra` | `xac_suat_suy_tim` | `giai_doan_sau` | `ai_m1_xac_suat_suy_tim` *(loại khỏi MVP)* | Không tạo bảng/cột MVP (chỉ hợp đồng tương lai) |
| R90 | 94 | Model 1 – AI Diagnosis | `ra` | `kieu_hinh_ef` | `giai_doan_sau` | `ai_m1_kieu_hinh_ef` *(loại khỏi MVP)* | Không tạo bảng/cột MVP (chỉ hợp đồng tương lai) |
| R91 | 95 | Model 1 – AI Diagnosis | `ra` | `benh_canh_suy_tim` | `giai_doan_sau` | `ai_m1_benh_canh_suy_tim` *(loại khỏi MVP)* | Không tạo bảng/cột MVP (chỉ hợp đồng tương lai) |
| R92 | 96 | Model 1 – AI Diagnosis | `ra` | `xep_hang_nguyen_nhan` | `giai_doan_sau` | `ai_m1_xep_hang_nguyen_nhan` *(loại khỏi MVP)* | Không tạo bảng/cột MVP (chỉ hợp đồng tương lai) |
| R93 | 97 | Model 1 – AI Diagnosis | `ra` | `canh_bao_gia_suy_tim` | `giai_doan_sau` | `ai_m1_canh_bao_gia_suy_tim` *(loại khỏi MVP)* | Không tạo bảng/cột MVP (chỉ hợp đồng tương lai) |
| R94 | 98 | Model 1 – AI Diagnosis | `ra` | `frailty_dung_nap_dieu_tri` | `giai_doan_sau` | `ai_m1_frailty_dung_nap_dieu_tri` *(loại khỏi MVP)* | Không tạo bảng/cột MVP (chỉ hợp đồng tương lai) |
| R95 | 99 | Model 1 – AI Diagnosis | `ra` | `du_bao_nhap_vien_tai_nhap_vien` | `giai_doan_sau` | `ai_m1_du_bao_nhap_vien_tai_nhap_vien` *(loại khỏi MVP)* | Không tạo bảng/cột MVP (chỉ hợp đồng tương lai) |
| R96 | 100 | Model 1 – AI Diagnosis | `ra` | `du_bao_tu_vong` | `giai_doan_sau` | `ai_m1_du_bao_tu_vong` *(loại khỏi MVP)* | Không tạo bảng/cột MVP (chỉ hợp đồng tương lai) |
| R97 | 101 | Model 1 – AI Diagnosis | `ra` | `du_bao_te_nga` | `giai_doan_sau` | `ai_m1_du_bao_te_nga` *(loại khỏi MVP)* | Không tạo bảng/cột MVP (chỉ hợp đồng tương lai) |
| R98 | 102 | Model 1 – AI Diagnosis | `ra` | `du_bao_sang` | `giai_doan_sau` | `ai_m1_du_bao_sang` *(loại khỏi MVP)* | Không tạo bảng/cột MVP (chỉ hợp đồng tương lai) |
| R99 | 103 | Model 1 – AI Diagnosis | `ra` | `du_bao_suy_giam_chuc_nang` | `giai_doan_sau` | `ai_m1_du_bao_suy_giam_chuc_nang` *(loại khỏi MVP)* | Không tạo bảng/cột MVP (chỉ hợp đồng tương lai) |
| R100 | 104 | Model 1 – AI Diagnosis | `ra` | `du_bao_mat_tu_cham_soc` | `giai_doan_sau` | `ai_m1_du_bao_mat_tu_cham_soc` *(loại khỏi MVP)* | Không tạo bảng/cột MVP (chỉ hợp đồng tương lai) |
| R101 | 105 | Model 1 – AI Diagnosis | `ra` | `canh_bao_cap_cuu` | `giai_doan_sau` | `ai_m1_canh_bao_cap_cuu` *(loại khỏi MVP)* | Không tạo bảng/cột MVP (chỉ hợp đồng tương lai) |
| R102 | 106 | Model 2 – AI Lab/Test | `vao` | `giai_doan_suy_tim_ai` | `giai_doan_sau` | `ai_m2_in_giai_doan_suy_tim_ai` *(loại khỏi MVP)* | Không tạo bảng/cột MVP (chỉ hợp đồng tương lai) |
| R103 | 107 | Model 2 – AI Lab/Test | `vao` | `kieu_hinh_nghi_ngo_ai` | `giai_doan_sau` | `ai_m2_in_kieu_hinh_nghi_ngo_ai` *(loại khỏi MVP)* | Không tạo bảng/cột MVP (chỉ hợp đồng tương lai) |
| R104 | 108 | Model 2 – AI Lab/Test | `vao` | `benh_canh_ai` | `giai_doan_sau` | `ai_m2_in_benh_canh_ai` *(loại khỏi MVP)* | Không tạo bảng/cột MVP (chỉ hợp đồng tương lai) |
| R105 | 109 | Model 2 – AI Lab/Test | `vao` | `nguyen_nhan_nghi_ngo_ai` | `giai_doan_sau` | `ai_m2_in_nguyen_nhan_nghi_ngo_ai` *(loại khỏi MVP)* | Không tạo bảng/cột MVP (chỉ hợp đồng tương lai) |
| R106 | 110 | Model 2 – AI Lab/Test | `vao` | `benh_gia_suy_tim_can_loai_tru` | `giai_doan_sau` | `ai_m2_in_benh_gia_suy_tim_can_loai_tru` *(loại khỏi MVP)* | Không tạo bảng/cột MVP (chỉ hợp đồng tương lai) |
| R107 | 111 | Model 2 – AI Lab/Test | `vao` | `trieu_chung_dau_hieu` | `MVP` | `kho_tho_khi_gang_suc`, `tinh_mach_co_noi`, `phu_ngoai_bien` | `visit_value` |
| R108 | 112 | Model 2 – AI Lab/Test | `vao` | `frailty_hop_tac_xet_nghiem` | `can_xac_nhan` | `lao_khoa_frailty`, `lao_khoa_chuc_nang_nhan_thuc`, `kha_nang_hop_tac_xet_nghiem` | `visit_value` |
| R109 | 113 | Model 2 – AI Lab/Test | `vao` | `xet_nghiem_da_co` | `MVP` | `cls_bnp`, `cls_nt_probnp`, `cls_lvef`, `cls_ecg_ket_luan`, `cls_xquang_ket_luan` | `lab_result` |
| R110 | 114 | Model 2 – AI Lab/Test | `vao` | `chuc_nang_than_gan_dien_giai` | `can_xac_nhan` | `cls_creatinin`, `cls_egfr`, `cls_natri`, `cls_kali`, `cls_chuc_nang_gan` | `lab_result` |
| R111 | 115 | Model 2 – AI Lab/Test | `vao` | `benh_dong_mac_lab` | `MVP` | `ts_dai_thao_duong`, `ts_benh_than_man`, `ts_copd`, `ts_thieu_mau` | `visit_value` |
| R112 | 116 | Model 2 – AI Lab/Test | `vao` | `thuoc_dang_su_dung_lab` | `MVP` | `thuoc_ghi_nhan` | `medication` |
| R113 | 117 | Model 2 – AI Lab/Test | `vao` | `di_ung_thuoc_can_quang` | `MVP` | `di_ung_adr`, `di_ung_thuoc_can_quang` | `allergy` |
| R114 | 118 | Model 2 – AI Lab/Test | `vao` | `thiet_bi_cay_ghep` | `can_xac_nhan` | `ts_thiet_bi_cay_ghep_chong_chi_dinh_mri` | `visit_value` |
| R115 | 119 | Model 2 – AI Lab/Test | `vao` | `kha_nang_gang_suc_tham_do` | `can_xac_nhan` | `kha_nang_gang_suc_tham_do_xam_lan` | `visit_value` |
| R116 | 120 | Model 2 – AI Lab/Test | `vao` | `muc_tieu_kha_nang_xet_nghiem` | `can_xac_nhan` | `muc_tieu_dieu_tri`, `xh_kha_nang_chi_tra`, `kha_nang_thuc_hien_xet_nghiem` | `visit_value` |
| R117 | 121 | Model 2 – AI Lab/Test | `ra` | `goi_y_bnp_ntprobnp` | `giai_doan_sau` | `ai_m2_out_goi_y_bnp_ntprobnp` *(loại khỏi MVP)* | Không tạo bảng/cột MVP (chỉ hợp đồng tương lai) |
| R118 | 122 | Model 2 – AI Lab/Test | `ra` | `goi_y_ecg` | `giai_doan_sau` | `ai_m2_out_goi_y_ecg` *(loại khỏi MVP)* | Không tạo bảng/cột MVP (chỉ hợp đồng tương lai) |
| R119 | 123 | Model 2 – AI Lab/Test | `ra` | `goi_y_sieu_am_tim` | `giai_doan_sau` | `ai_m2_out_goi_y_sieu_am_tim` *(loại khỏi MVP)* | Không tạo bảng/cột MVP (chỉ hợp đồng tương lai) |
| R120 | 124 | Model 2 – AI Lab/Test | `ra` | `goi_y_xquang_tim_phoi` | `giai_doan_sau` | `ai_m2_out_goi_y_xquang_tim_phoi` *(loại khỏi MVP)* | Không tạo bảng/cột MVP (chỉ hợp đồng tương lai) |
| R121 | 125 | Model 2 – AI Lab/Test | `ra` | `goi_y_cong_thuc_mau` | `giai_doan_sau` | `ai_m2_out_goi_y_cong_thuc_mau` *(loại khỏi MVP)* | Không tạo bảng/cột MVP (chỉ hợp đồng tương lai) |
| R122 | 126 | Model 2 – AI Lab/Test | `ra` | `goi_y_ure_creatinin_egfr` | `giai_doan_sau` | `ai_m2_out_goi_y_ure_creatinin_egfr` *(loại khỏi MVP)* | Không tạo bảng/cột MVP (chỉ hợp đồng tương lai) |
| R123 | 127 | Model 2 – AI Lab/Test | `ra` | `goi_y_kali_natri` | `giai_doan_sau` | `ai_m2_out_goi_y_kali_natri` *(loại khỏi MVP)* | Không tạo bảng/cột MVP (chỉ hợp đồng tương lai) |
| R124 | 128 | Model 2 – AI Lab/Test | `ra` | `goi_y_chuc_nang_gan` | `giai_doan_sau` | `ai_m2_out_goi_y_chuc_nang_gan` *(loại khỏi MVP)* | Không tạo bảng/cột MVP (chỉ hợp đồng tương lai) |
| R125 | 129 | Model 2 – AI Lab/Test | `ra` | `goi_y_duong_huyet_hba1c` | `giai_doan_sau` | `ai_m2_out_goi_y_duong_huyet_hba1c` *(loại khỏi MVP)* | Không tạo bảng/cột MVP (chỉ hợp đồng tương lai) |
| R126 | 130 | Model 2 – AI Lab/Test | `ra` | `goi_y_tsh` | `giai_doan_sau` | `ai_m2_out_goi_y_tsh` *(loại khỏi MVP)* | Không tạo bảng/cột MVP (chỉ hợp đồng tương lai) |
| R127 | 131 | Model 2 – AI Lab/Test | `ra` | `goi_y_ferritin_tsat` | `giai_doan_sau` | `ai_m2_out_goi_y_ferritin_tsat` *(loại khỏi MVP)* | Không tạo bảng/cột MVP (chỉ hợp đồng tương lai) |
| R128 | 132 | Model 2 – AI Lab/Test | `ra` | `goi_y_uacr` | `giai_doan_sau` | `ai_m2_out_goi_y_uacr` *(loại khỏi MVP)* | Không tạo bảng/cột MVP (chỉ hợp đồng tương lai) |
| R129 | 133 | Model 2 – AI Lab/Test | `ra` | `goi_y_danh_gia_mach_vanh` | `giai_doan_sau` | `ai_m2_out_goi_y_danh_gia_mach_vanh` *(loại khỏi MVP)* | Không tạo bảng/cột MVP (chỉ hợp đồng tương lai) |
| R130 | 134 | Model 2 – AI Lab/Test | `ra` | `goi_y_doppler_van_tim` | `giai_doan_sau` | `ai_m2_out_goi_y_doppler_van_tim` *(loại khỏi MVP)* | Không tạo bảng/cột MVP (chỉ hợp đồng tương lai) |
| R131 | 135 | Model 2 – AI Lab/Test | `ra` | `goi_y_holter_ecg` | `giai_doan_sau` | `ai_m2_out_goi_y_holter_ecg` *(loại khỏi MVP)* | Không tạo bảng/cột MVP (chỉ hợp đồng tương lai) |
| R132 | 136 | Model 2 – AI Lab/Test | `ra` | `goi_y_mri_tim` | `giai_doan_sau` | `ai_m2_out_goi_y_mri_tim` *(loại khỏi MVP)* | Không tạo bảng/cột MVP (chỉ hợp đồng tương lai) |
| R133 | 137 | Model 2 – AI Lab/Test | `ra` | `goi_y_xet_nghiem_amyloidosis` | `giai_doan_sau` | `ai_m2_out_goi_y_xet_nghiem_amyloidosis` *(loại khỏi MVP)* | Không tạo bảng/cột MVP (chỉ hợp đồng tương lai) |
| R134 | 138 | Model 2 – AI Lab/Test | `ra` | `goi_y_danh_gia_benh_co_tim` | `giai_doan_sau` | `ai_m2_out_goi_y_danh_gia_benh_co_tim` *(loại khỏi MVP)* | Không tạo bảng/cột MVP (chỉ hợp đồng tương lai) |
| R135 | 139 | Model 2 – AI Lab/Test | `ra` | `goi_y_suy_tim_cung_luong_cao` | `giai_doan_sau` | `ai_m2_out_goi_y_suy_tim_cung_luong_cao` *(loại khỏi MVP)* | Không tạo bảng/cột MVP (chỉ hợp đồng tương lai) |
| R136 | 140 | Model 2 – AI Lab/Test | `ra` | `goi_y_danh_gia_benh_than` | `giai_doan_sau` | `ai_m2_out_goi_y_danh_gia_benh_than` *(loại khỏi MVP)* | Không tạo bảng/cột MVP (chỉ hợp đồng tương lai) |
| R137 | 141 | Model 2 – AI Lab/Test | `ra` | `goi_y_danh_gia_benh_phoi` | `giai_doan_sau` | `ai_m2_out_goi_y_danh_gia_benh_phoi` *(loại khỏi MVP)* | Không tạo bảng/cột MVP (chỉ hợp đồng tương lai) |
| R138 | 142 | Model 2 – AI Lab/Test | `ra` | `goi_y_danh_gia_thieu_mau` | `giai_doan_sau` | `ai_m2_out_goi_y_danh_gia_thieu_mau` *(loại khỏi MVP)* | Không tạo bảng/cột MVP (chỉ hợp đồng tương lai) |
| R139 | 143 | Model 2 – AI Lab/Test | `ra` | `goi_y_dinh_duong` | `giai_doan_sau` | `ai_m2_out_goi_y_dinh_duong` *(loại khỏi MVP)* | Không tạo bảng/cột MVP (chỉ hợp đồng tương lai) |
| R140 | 144 | Model 2 – AI Lab/Test | `ra` | `goi_y_tuyen_giap` | `giai_doan_sau` | `ai_m2_out_goi_y_tuyen_giap` *(loại khỏi MVP)* | Không tạo bảng/cột MVP (chỉ hợp đồng tương lai) |
| R141 | 145 | Model 2 – AI Lab/Test | `ra` | `goi_y_gang_suc_tham_do_huyet_dong` | `giai_doan_sau` | `ai_m2_out_goi_y_gang_suc_tham_do_huyet_dong` *(loại khỏi MVP)* | Không tạo bảng/cột MVP (chỉ hợp đồng tương lai) |
| R142 | 146 | Model 2 – AI Lab/Test | `ra` | `phan_loai_ket_qua_xet_nghiem` | `giai_doan_sau` | `ai_m2_out_phan_loai_ket_qua_xet_nghiem` *(loại khỏi MVP)* | Không tạo bảng/cột MVP (chỉ hợp đồng tương lai) |
| R143 | 147 | Model 2 – AI Lab/Test | `ra` | `muc_uu_tien_xet_nghiem` | `giai_doan_sau` | `ai_m2_out_muc_uu_tien_xet_nghiem` *(loại khỏi MVP)* | Không tạo bảng/cột MVP (chỉ hợp đồng tương lai) |
| R144 | 148 | Model 2 – AI Lab/Test | `ra` | `danh_gia_loi_ich_nguy_co_xet_nghiem` | `giai_doan_sau` | `ai_m2_out_danh_gia_loi_ich_nguy_co_xet_nghiem` *(loại khỏi MVP)* | Không tạo bảng/cột MVP (chỉ hợp đồng tương lai) |
| R145 | 149 | Model 2 – AI Lab/Test | `ra` | `canh_bao_khong_chi_dinh_xam_lan_theo_tuoi` | `giai_doan_sau` | `ai_m2_out_canh_bao_khong_chi_dinh_xam_lan_theo_tuoi` *(loại khỏi MVP)* | Không tạo bảng/cột MVP (chỉ hợp đồng tương lai) |
| R146 | 150 | Model 3 – AI Treatment | `vao` | `stage_suy_tim` | `can_xac_nhan` | `chan_doan_stage_suy_tim` | `visit_value` |
| R147 | 151 | Model 3 – AI Treatment | `vao` | `ef_treatment` | `can_xac_nhan` | `chan_doan_kieu_hinh_ef` | `visit_value` |
| R148 | 152 | Model 3 – AI Treatment | `vao` | `nguyen_nhan_treatment` | `can_xac_nhan` | `chan_doan_nguyen_nhan_suy_tim` | `visit_value` |
| R149 | 153 | Model 3 – AI Treatment | `vao` | `nyha` | `MVP` | `nyha_hien_tai` | `visit_value` |
| R150 | 154 | Model 3 – AI Treatment | `vao` | `worsening_decompensated` | `can_xac_nhan` | `tinh_trang_worsening_decompensated` | `visit_value` |
| R151 | 155 | Model 3 – AI Treatment | `vao` | `sung_huyet_tuoi_mau` | `can_xac_nhan` | `tinh_trang_sung_huyet`, `giam_tuoi_mau_ngoai_vi` | `visit_value` |
| R152 | 156 | Model 3 – AI Treatment | `vao` | `ha_treatment` | `MVP` | `huyet_ap_tam_thu`, `huyet_ap_tam_truong`, `tu_the_do_ha`, `thoi_diem_do_ha` | `orthostatic_bp` |
| R153 | 157 | Model 3 – AI Treatment | `vao` | `mach_treatment` | `MVP` | `mach` | `visit_value` |
| R154 | 158 | Model 3 – AI Treatment | `vao` | `spo2_treatment` | `MVP` | `spo2` | `visit_value` |
| R155 | 159 | Model 3 – AI Treatment | `vao` | `ef_hien_tai` | `MVP` | `cls_lvef`, `cls_sieu_am_tim_thoi_diem` | `lab_result` |
| R156 | 160 | Model 3 – AI Treatment | `vao` | `bnp_treatment` | `MVP` | `cls_bnp`, `cls_nt_probnp`, `cls_don_vi`, `cls_thoi_diem` | `lab_result` |
| R157 | 161 | Model 3 – AI Treatment | `vao` | `creatinin_egfr_treatment` | `MVP` | `cls_creatinin`, `cls_egfr`, `cls_don_vi`, `cls_thoi_diem` | `lab_result` |
| R158 | 162 | Model 3 – AI Treatment | `vao` | `kali_natri_gan` | `can_xac_nhan` | `cls_natri`, `cls_kali`, `cls_chuc_nang_gan`, `cls_don_vi`, `cls_thoi_diem` | `lab_result` |
| R159 | 163 | Model 3 – AI Treatment | `vao` | `thuoc_lieu_tuan_thu` | `can_xac_nhan` | `thuoc_ghi_nhan`, `thuoc_muc_do_tuan_thu` | `medication` |
| R160 | 164 | Model 3 – AI Treatment | `vao` | `khong_dung_nap_thuoc` | `MVP` | `di_ung_adr` | `allergy` |
| R161 | 165 | Model 3 – AI Treatment | `vao` | `benh_dong_mac_treatment` | `MVP` | `ts_dai_thao_duong`, `ts_benh_than_man`, `ts_rung_nhi_roi_loan_nhip`, `ts_copd`, `ts_benh_mach_vanh_nmct` | `visit_value` |
| R162 | 166 | Model 3 – AI Treatment | `vao` | `frailty_treatment` | `can_xac_nhan` | `lao_khoa_frailty` | `visit_value` |
| R163 | 167 | Model 3 – AI Treatment | `vao` | `nhan_thuc_treatment` | `can_xac_nhan` | `lao_khoa_chuc_nang_nhan_thuc` | `visit_value` |
| R164 | 168 | Model 3 – AI Treatment | `vao` | `adl_iadl_treatment` | `can_xac_nhan` | `lao_khoa_adl_iadl` | `visit_value` |
| R165 | 169 | Model 3 – AI Treatment | `vao` | `nguy_co_te_nga_hha` | `can_xac_nhan` | `lao_khoa_nguy_co_te_nga`, `huyet_ap_tam_thu`, `huyet_ap_tam_truong`, `tu_the_do_ha` | `orthostatic_bp`, `visit_value` |
| R166 | 170 | Model 3 – AI Treatment | `vao` | `dinh_duong_sarcopenia` | `can_xac_nhan` | `lao_khoa_tinh_trang_dinh_duong`, `lao_khoa_sarcopenia` | `visit_value` |
| R167 | 171 | Model 3 – AI Treatment | `vao` | `tu_quan_ly_thuoc` | `MVP` | `lao_khoa_tu_su_dung_thuoc`, `xh_co_nguoi_cham_soc` | `visit_value` |
| R168 | 172 | Model 3 – AI Treatment | `vao` | `muc_tieu_dieu_tri` | `can_xac_nhan` | `muc_tieu_dieu_tri` | `visit_value` |
| R169 | 173 | Model 3 – AI Treatment | `ra` | `dieu_tri_stage_a` | `giai_doan_sau` | `ai_m3_dieu_tri_stage_a` *(loại khỏi MVP)* | Không tạo bảng/cột MVP (chỉ hợp đồng tương lai) |
| R170 | 174 | Model 3 – AI Treatment | `ra` | `dieu_tri_stage_b` | `giai_doan_sau` | `ai_m3_dieu_tri_stage_b` *(loại khỏi MVP)* | Không tạo bảng/cột MVP (chỉ hợp đồng tương lai) |
| R171 | 175 | Model 3 – AI Treatment | `ra` | `dieu_tri_stage_c` | `giai_doan_sau` | `ai_m3_dieu_tri_stage_c` *(loại khỏi MVP)* | Không tạo bảng/cột MVP (chỉ hợp đồng tương lai) |
| R172 | 176 | Model 3 – AI Treatment | `ra` | `ca_the_hoa_nguoi_cao_tuoi` | `giai_doan_sau` | `ai_m3_ca_the_hoa_nguoi_cao_tuoi` *(loại khỏi MVP)* | Không tạo bảng/cột MVP (chỉ hợp đồng tương lai) |
| R173 | 177 | Model 3 – AI Treatment | `ra` | `xu_tri_worsening_hf` | `giai_doan_sau` | `ai_m3_xu_tri_worsening_hf` *(loại khỏi MVP)* | Không tạo bảng/cột MVP (chỉ hợp đồng tương lai) |
| R174 | 178 | Model 3 – AI Treatment | `ra` | `xu_tri_decompensated_hf` | `giai_doan_sau` | `ai_m3_xu_tri_decompensated_hf` *(loại khỏi MVP)* | Không tạo bảng/cột MVP (chỉ hợp đồng tương lai) |
| R175 | 179 | Model 3 – AI Treatment | `ra` | `dieu_tri_stage_d` | `giai_doan_sau` | `ai_m3_dieu_tri_stage_d` *(loại khỏi MVP)* | Không tạo bảng/cột MVP (chỉ hợp đồng tương lai) |
| R176 | 180 | Model 3 – AI Treatment | `ra` | `ke_hoach_theo_doi` | `giai_doan_sau` | `ai_m3_ke_hoach_theo_doi` *(loại khỏi MVP)* | Không tạo bảng/cột MVP (chỉ hợp đồng tương lai) |
| R177 | 181 | Model 4 – AI MedSafety | `vao` | `don_thuoc_moi` | `can_xac_nhan` | `thuoc_ghi_nhan` | `medication` |
| R178 | 182 | Model 4 – AI MedSafety | `vao` | `thuoc_otc_tpcn_yhct` | `MVP` | `thuoc_ghi_nhan` | `medication` |
| R179 | 183 | Model 4 – AI MedSafety | `vao` | `so_luong_thuoc_dong_thoi` | `MVP` | `so_luong_thuoc_dong_thoi` | `computed` |
| R180 | 184 | Model 4 – AI MedSafety | `vao` | `di_ung_phan_ung_co_hai` | `MVP` | `di_ung_adr` | `allergy` |
| R181 | 185 | Model 4 – AI MedSafety | `vao` | `creatinin_egfr_medsafety` | `MVP` | `cls_creatinin`, `cls_egfr`, `cls_don_vi`, `cls_thoi_diem` | `lab_result` |
| R182 | 186 | Model 4 – AI MedSafety | `vao` | `kali_natri_dien_giai_medsafety` | `MVP` | `cls_natri`, `cls_kali`, `cls_clo`, `cls_don_vi`, `cls_thoi_diem` | `lab_result` |
| R183 | 187 | Model 4 – AI MedSafety | `vao` | `chuc_nang_gan_medsafety` | `can_xac_nhan` | `cls_chuc_nang_gan`, `cls_don_vi`, `cls_thoi_diem` | `lab_result` |
| R184 | 188 | Model 4 – AI MedSafety | `vao` | `ha_nam_ngoi_dung` | `MVP` | `huyet_ap_tam_thu`, `huyet_ap_tam_truong`, `tu_the_do_ha`, `thoi_diem_do_ha` | `orthostatic_bp` |
| R185 | 189 | Model 4 – AI MedSafety | `vao` | `nhip_tim_ecg` | `MVP` | `mach`, `cls_ecg_ket_luan`, `cls_ecg_thoi_diem` | `lab_result`, `visit_value` |
| R186 | 190 | Model 4 – AI MedSafety | `vao` | `frailty_medsafety` | `can_xac_nhan` | `lao_khoa_frailty` | `visit_value` |
| R187 | 191 | Model 4 – AI MedSafety | `vao` | `nhan_thuc_tien_su_sang` | `can_xac_nhan` | `lao_khoa_chuc_nang_nhan_thuc`, `lao_khoa_tien_su_sang` | `visit_value` |
| R188 | 192 | Model 4 – AI MedSafety | `vao` | `tien_su_te_nga_ngat` | `MVP` | `te_nga`, `ngat` | `visit_value` |
| R189 | 193 | Model 4 – AI MedSafety | `vao` | `kha_nang_nuot_tu_dung_thuoc` | `can_xac_nhan` | `lao_khoa_kha_nang_nuot`, `lao_khoa_tu_su_dung_thuoc` | `visit_value` |
| R190 | 194 | Model 4 – AI MedSafety | `vao` | `dinh_duong_can_nang_sarcopenia` | `can_xac_nhan` | `lao_khoa_tinh_trang_dinh_duong`, `can_nang_kg`, `lao_khoa_sarcopenia` | `visit_value` |
| R191 | 195 | Model 4 – AI MedSafety | `vao` | `ho_tro_nguoi_cham_soc_medsafety` | `MVP` | `xh_co_nguoi_cham_soc`, `xh_ho_tro_gia_dinh` | `visit_value` |
| R192 | 196 | Model 4 – AI MedSafety | `vao` | `chi_tra_tai_kham_medsafety` | `MVP` | `xh_kha_nang_chi_tra`, `xh_kha_nang_tai_kham` | `visit_value` |
| R193 | 197 | Model 4 – AI MedSafety | `ra` | `phat_hien_da_thuoc` | `giai_doan_sau` | `ai_m4_phat_hien_da_thuoc` *(loại khỏi MVP)* | Không tạo bảng/cột MVP (chỉ hợp đồng tương lai) |
| R194 | 198 | Model 4 – AI MedSafety | `ra` | `tuong_tac_thuoc_thuoc` | `giai_doan_sau` | `ai_m4_tuong_tac_thuoc_thuoc` *(loại khỏi MVP)* | Không tạo bảng/cột MVP (chỉ hợp đồng tương lai) |
| R195 | 199 | Model 4 – AI MedSafety | `ra` | `tuong_tac_thuoc_benh` | `giai_doan_sau` | `ai_m4_tuong_tac_thuoc_benh` *(loại khỏi MVP)* | Không tạo bảng/cột MVP (chỉ hợp đồng tương lai) |
| R196 | 200 | Model 4 – AI MedSafety | `ra` | `chong_chi_dinh` | `giai_doan_sau` | `ai_m4_chong_chi_dinh` *(loại khỏi MVP)* | Không tạo bảng/cột MVP (chỉ hợp đồng tương lai) |
| R197 | 201 | Model 4 – AI MedSafety | `ra` | `sai_lieu` | `giai_doan_sau` | `ai_m4_sai_lieu` *(loại khỏi MVP)* | Không tạo bảng/cột MVP (chỉ hợp đồng tương lai) |
| R198 | 202 | Model 4 – AI MedSafety | `ra` | `thuoc_khong_con_chi_dinh` | `giai_doan_sau` | `ai_m4_thuoc_khong_con_chi_dinh` *(loại khỏi MVP)* | Không tạo bảng/cột MVP (chỉ hợp đồng tương lai) |
| R199 | 203 | Model 4 – AI MedSafety | `ra` | `khuyen_nghi_chinh_lieu` | `giai_doan_sau` | `ai_m4_khuyen_nghi_chinh_lieu` *(loại khỏi MVP)* | Không tạo bảng/cột MVP (chỉ hợp đồng tương lai) |
| R200 | 204 | Model 4 – AI MedSafety | `ra` | `canh_bao_nguy_co` | `giai_doan_sau` | `ai_m4_canh_bao_nguy_co` *(loại khỏi MVP)* | Không tạo bảng/cột MVP (chỉ hợp đồng tương lai) |
| R201 | 205 | Model 4 – AI MedSafety | `ra` | `thuoc_lam_nang_suy_tim` | `giai_doan_sau` | `ai_m4_thuoc_lam_nang_suy_tim` *(loại khỏi MVP)* | Không tạo bảng/cột MVP (chỉ hợp đồng tương lai) |
| R202 | 206 | Model 4 – AI MedSafety | `ra` | `thuoc_suy_tim_dac_hieu` | `giai_doan_sau` | `ai_m4_thuoc_suy_tim_dac_hieu` *(loại khỏi MVP)* | Không tạo bảng/cột MVP (chỉ hợp đồng tương lai) |
| R203 | 207 | Model 4 – AI MedSafety | `ra` | `don_gian_hoa_phac_do` | `giai_doan_sau` | `ai_m4_don_gian_hoa_phac_do` *(loại khỏi MVP)* | Không tạo bảng/cột MVP (chỉ hợp đồng tương lai) |
| R204 | 208 | Model 4 – AI MedSafety | `ra` | `giam_ngung_thuoc` | `giai_doan_sau` | `ai_m4_giam_ngung_thuoc` *(loại khỏi MVP)* | Không tạo bảng/cột MVP (chỉ hợp đồng tương lai) |
| R205 | 209 | Model 4 – AI MedSafety | `ra` | `ke_hoach_xet_nghiem_theo_doi` | `giai_doan_sau` | `ai_m4_ke_hoach_xet_nghiem_theo_doi` *(loại khỏi MVP)* | Không tạo bảng/cột MVP (chỉ hợp đồng tương lai) |
| R206 | 210 | Model 4 – AI MedSafety | `ra` | `phan_tang_canh_bao` | `giai_doan_sau` | `ai_m4_phan_tang_canh_bao` *(loại khỏi MVP)* | Không tạo bảng/cột MVP (chỉ hợp đồng tương lai) |
| R207 | 211 | Model 4 – AI MedSafety | `ra` | `xac_nhan_bac_si` | `giai_doan_sau` | `ai_m4_xac_nhan_bac_si` *(loại khỏi MVP)* | Không tạo bảng/cột MVP (chỉ hợp đồng tương lai) |
