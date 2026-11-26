"""Pinned v2 field specification; existing shared definitions stay unchanged."""
SECTIONS = [
    ('hanh_chinh', 'Hành chính'), ('sinh_ton', 'Sinh hiệu'),
    ('trieu_chung_kham', 'Triệu chứng & khám'), ('chan_doan_nguy_co', 'Chẩn đoán & yếu tố nguy cơ'),
    ('can_lam_sang', 'Cận lâm sàng'), ('thuoc', 'Thuốc'), ('lao_khoa', 'Lão khoa'), ('ghi_chu', 'Ghi chú'),
]

# code, label, type, unit, role, source rule. All missing answers remain unknown.
FIELDS = []
def add(section, role, rules, rows):
    for code, label, kind, unit in rows:
        FIELDS.append(dict(code=code, labelVi=label, sectionCode=section, dataType=kind,
                           canonicalUnit=unit, entryRole=role, isCalculated=role=='auto', rules=rules))

add('hanh_chinh','nurse','HIS',[
 ('bn_ma','Mã bệnh nhân','text',None), ('bn_ho_ten','Tên bệnh nhân','text',None),
 ('bn_gioi_tinh','Giới tính','single_choice',None), ('ma_benh_nhan_his','Mã HIS (SoVaoVien)','text',None),
 ('ma_luot_kham_his','Số tiếp nhận','text',None), ('ngay_kham','Ngày khám','date',None),
 ('phong_kham','Phòng khám','text',None)])
add('hanh_chinh','auto','HIS; 4.4',[('luot_tuoi','Tuổi tại ngày khám','integer','years')])
add('sinh_ton','nurse','1.9; 4.4',[
 ('chieu_cao_cm','Chiều cao','number','cm'), ('can_nang_kg','Cân nặng','number','kg'),
 ('huyet_ap_tam_thu','HA tâm thu','integer','mmHg'), ('huyet_ap_tam_truong','HA tâm trương','integer','mmHg'),
 ('mach','Mạch / tần số tim','integer','/min'), ('nhip_tho','Nhịp thở','integer','/min'),
 ('spo2','SpO₂','number','%'), ('ha_tam_thu_dung','HA tâm thu đứng','integer','mmHg')])
add('sinh_ton','auto','1.1; 4.4',[
 ('bmi','BMI','number','kg/m2'), ('giam_ha_tu_the','Mức giảm HA tâm thu tư thế','number','mmHg')])
add('trieu_chung_kham','doctor','1.1–1.9',[
 ('kho_tho_khi_gang_suc','Khó thở khi gắng sức','boolean',None),
 ('kho_tho_khi_nam','Khó thở khi nằm','boolean',None),
 ('kho_tho_kich_phat_ve_dem','Khó thở kịch phát về đêm','boolean',None),
 ('met_moi','Mệt mỏi','boolean',None), ('phu_hai_chi_duoi','Phù hai chi dưới','boolean',None),
 ('tinh_mach_co_noi','Tĩnh mạch cổ nổi','boolean',None), ('ran_am_phoi','Ran ẩm phổi','boolean',None),
 ('dau_nguc','Đau ngực kiểu mạch vành','boolean',None), ('nyha_hien_tai','NYHA','single_choice',None),
 ('trieu_chung_khang_tri_khi_nghi','Triệu chứng khi nghỉ kháng điều trị tối ưu','boolean',None),
 ('dien_bien_cap','Diễn biến cấp cần cấp cứu / nhập viện','boolean',None),
 ('co_keo_co_ho_hap','Co kéo cơ hô hấp','boolean',None),
 ('kho_tho_nang','Mức độ khó thở','single_choice',None),
 ('phu_chi_duoi_muc_do','Mức độ phù chi dưới','single_choice',None),
 ('bien_thien_can_nang_7ngay','Biến thiên cân nặng 7 ngày','number','kg'),
 ('trieu_chung_khong_dien_hinh','Triệu chứng không điển hình','single_choice',None)])
add('chan_doan_nguy_co','doctor','1.1; 2.3; HIS',[
 ('icd_chinh','ICD chính','text',None), ('icd_phu','ICD phụ','text',None),
 ('diagnoses','Mã bệnh kèm theo','object',None),
 ('ts_tang_huyet_ap','Tăng huyết áp (bác sĩ xác nhận)','boolean',None),
 ('ts_dai_thao_duong','Đái tháo đường (bác sĩ xác nhận)','boolean',None),
 ('ts_beo_phi','Béo phì (bác sĩ xác nhận)','boolean',None),
 ('ts_benh_mach_vanh_nmct','Bệnh mạch vành / NMCT','boolean',None),
 ('ts_benh_than_man','Bệnh thận mạn','boolean',None),
 ('ts_hoa_tri_thuoc_doc_tim','Hóa trị / thuốc độc tim','boolean',None),
 ('ts_rung_nhi_roi_loan_nhip','Rung nhĩ','boolean',None)])
add('chan_doan_nguy_co','auto','1.1; HIS',[
 ('goi_y_nguy_co_icd','Yếu tố nguy cơ gợi ý từ ICD, chờ bác sĩ xác nhận','object',None),
 ('goi_y_beo_phi','Gợi ý béo phì từ BMI ≥25, chờ bác sĩ xác nhận','boolean',None)])
add('can_lam_sang','doctor','1.2–1.8; 2.1–2.4; 4.2',[
 ('cls_lvef','LVEF','number','%'), ('bat_thuong_cau_truc_tim','Bất thường cấu trúc / chức năng tim','boolean',None),
 ('bat_thuong_cau_truc_chi_tiet','Dày thất trái / giãn buồng / bệnh van','multi_choice',None),
 ('roi_loan_tam_truong','Rối loạn tâm trương / tăng áp lực đổ đầy','boolean',None),
 ('e_over_a_ratio','Tỉ lệ E/A Doppler','number','ratio'), ('ecg_12_chuyen_dao','ECG (có sóng Q bệnh lý)','object',None),
 ('xquang_nguc_thang','X-quang ngực thẳng','object',None),
 ('cls_nt_probnp','NT-proBNP','number','pg/mL'), ('cls_bnp','BNP','number','pg/mL'),
 ('cls_creatinin','Creatinin máu','number','umol/L'), ('cls_natri','Na','number','mmol/L'),
 ('cls_kali','K','number','mmol/L'), ('cls_clo','Cl','number','mmol/L'),
 ('cls_hba1c','HbA1c','number','%'), ('cls_hdl','HDL','number','mmol/L'),
 ('cls_ldl','LDL','number','mmol/L'), ('cls_cholesterol','Cholesterol','number','mmol/L'),
 ('cls_triglycerid','Triglycerid','number','mmol/L'),
 ('cls_creatinin_nieu','Creatinin niệu','number','mmol/L'), ('cls_albumin_nieu','Albumin niệu','number','mg/L'),
 ('natri_nieu_2gio','Natri niệu sau 2 giờ','number','mEq/L'), ('nuoc_tieu_6gio','Nước tiểu tích lũy 6 giờ','number','mL')])
add('can_lam_sang','auto','4.2; CKD-EPI 2021',[
 ('egfr_ckd_epi','eGFR CKD-EPI 2021','number','mL/min/1.73m2'),
 ('egfr_formula','Công thức eGFR','single_choice',None)])
add('thuoc','doctor','3.1–3.6; 4.1–4.4',[
 ('medications','Thuốc đang dùng (tên, liều, lịch S/T/C/Tr)','object',None),
 ('allergies','Dị ứng / ADR','object',None),
 ('dang_dung_loi_tieu_quai_uong','Đang dùng lợi tiểu quai uống','boolean',None),
 ('lieu_loi_tieu_quai_ngay','Liều lợi tiểu quai uống mỗi ngày','number','mg/day')])
add('thuoc','auto','4.4',[
 ('so_luong_thuoc_dong_thoi','Số thuốc đồng thời','integer',None),
 ('co_da_thuoc','Đa thuốc (≥5)','boolean',None), ('nhom_thuoc_tu_dong','Nhóm thuốc từ bảng tra','object',None)])
add('lao_khoa','doctor','4.4',[
 ('danh_gia_suy_yeu_frailty','Điểm suy yếu CFS','single_choice',None),
 ('suy_giam_nhan_thuc','Suy giảm nhận thức','boolean',None)])
add('ghi_chu','doctor','Ghi chú',[('ghi_chu_lam_sang','Ghi chú lâm sàng','text',None)])

BY_CODE={f['code']:f for f in FIELDS}
