"""PLAN-v2 executable test conventions; no diagnostic or prescribing authority."""
from copy import deepcopy

SYMPTOMS=('kho_tho_khi_gang_suc','kho_tho_khi_nam','kho_tho_kich_phat_ve_dem','met_moi',
          'phu_hai_chi_duoi','tinh_mach_co_noi','ran_am_phoi')
RISKS=('tang_huyet_ap','dai_thao_duong','ts_beo_phi','ts_benh_mach_vanh_nmct','ts_benh_than_man','ts_hoa_tri_thuoc_doc_tim')
M1_FIELDS=set(SYMPTOMS)|set(RISKS)|{'age','sex','diagnoses','nyha_hien_tai',
 'trieu_chung_khang_tri_khi_nghi','dien_bien_cap','co_keo_co_ho_hap','huyet_ap_tam_thu','nhip_tho','mach','spo2',
 'dau_nguc','ts_rung_nhi_roi_loan_nhip','kho_tho_nang','phu_chi_duoi_muc_do','bien_thien_can_nang_7ngay','trieu_chung_khong_dien_hinh','danh_gia_suy_yeu_frailty'}
M3_FIELDS={'age','sex','diagnoses','cls_lvef','cls_bnp','cls_nt_probnp','cls_creatinin','cls_kali','egfr_ckd_epi','egfr_formula',
 'ecg_12_chuyen_dao','xquang_nguc_thang','e_over_a_ratio','huyet_ap_tam_thu','mach','nhip_tho','spo2','dien_bien_cap',
 'ran_am_phoi','phu_hai_chi_duoi','tinh_mach_co_noi','dang_dung_loi_tieu_quai_uong','lieu_loi_tieu_quai_ngay','natri_nieu_2gio','nuoc_tieu_6gio'}
M4_FIELDS={'age','sex','allergies','medications','selected_medications','cls_creatinin','cls_kali','egfr_ckd_epi',
 'giam_ha_tu_the','huyet_ap_tam_thu','ha_tam_thu_dung','danh_gia_suy_yeu_frailty','suy_giam_nhan_thuc','so_luong_thuoc_dong_thoi'}
M2_DIAGNOSIS_FIELDS = {
    'cls_lvef', 'cls_bnp', 'cls_nt_probnp', 'bat_thuong_cau_truc_tim',
    'bat_thuong_cau_truc_chi_tiet', 'roi_loan_tam_truong',
}
M2_LAB_FIELDS = M2_DIAGNOSIS_FIELDS | {
    'cls_creatinin', 'egfr_ckd_epi', 'cls_kali', 'cls_natri',
    'ecg_12_chuyen_dao', 'xquang_nguc_thang',
}
PENDING_EF = 'Chưa phân loại – chờ cận lâm sàng'


def effective_diagnosis(snapshot):
    clinical = snapshot.get('effective_m1') or {}
    confirmed = snapshot.get('effective_m2') or {}
    if 'stage' in confirmed:
        return {**clinical, **{key: confirmed.get(key) for key in ('stage', 'kieu_hinh_ef', 'benh_canh')}}
    return clinical


def field_value(fields, key):
    answer = fields.get(key, {})
    return answer.get('value') if answer.get('value_state') == 'answered' else None


def symptom_status(fields):
    signs = [field_value(fields, key) for key in SYMPTOMS]
    severity = [field_value(fields, key) for key in ('kho_tho_nang', 'phu_chi_duoi_muc_do')]
    symptoms = True in signs or any(type(value) in (int, float) and value > 0 for value in severity)
    absent = all(value is False for value in signs)
    # v1.2 has structured dyspnea/edema severity but lacks the full symptom list.
    if fields.get('kho_tho_khi_gang_suc') is None:
        absent = severity[0] == 0 and not any(value is True for value in signs)
    return symptoms, absent and not symptoms


def diagnosis(module, snapshot, rules):
    fields = snapshot.get('fields', {})
    threshold = rules['v2Thresholds']
    def val(key):
        return field_value(fields, key)

    def compare(key, test):
        value = val(key)
        return type(value) in (int, float) and test(value)

    symptoms, asymptomatic = symptom_status(fields)
    risk = any(val(key) is True for key in RISKS + ('ts_rung_nhi_roi_loan_nhip',))
    refractory = val('nyha_hien_tai') == 'nyha_iv' and val('trieu_chung_khang_tri_khi_nghi') is True
    acute = val('dien_bien_cap') is True
    stage, phenotype, matched = None, PENDING_EF, []
    context = None
    if module == 'M1':
        if symptoms:
            stage = 'D' if refractory else 'C'
            matched.append('M1-clinical-D' if refractory else 'M1-clinical-C')
        elif asymptomatic and risk:
            stage = 'A'
            matched.append('M1-clinical-A')
        if acute:
            context = 'Suy tim cấp hoặc mạn tính'
            matched.append('1.8')
        elif stage in ('C', 'D'):
            context = 'Suy tim cấp hoặc mạn tính'
        alerts = [
            label for triggered, label in (
                (compare('huyet_ap_tam_thu', lambda x: x < threshold['sbpLow']), 'Tụt huyết áp'),
                (compare('nhip_tho', lambda x: x > threshold['rrHigh']), 'Thở nhanh'),
                (compare('mach', lambda x: x < threshold['hrLow'] or x > threshold['hrHigh']), 'Rối loạn nhịp nguy hiểm'),
                (compare('spo2', lambda x: x < threshold['spo2Low']), 'Giảm SpO₂'),
                (val('co_keo_co_ho_hap') is True, 'Co kéo cơ hô hấp'),
            ) if triggered and acute
        ]
        if alerts:
            matched.append('1.9')
        level = ('Nghi ngờ suy tim' if symptoms or acute else
                 'Có nguy cơ – Stage A' if stage == 'A' else 'Chưa đủ dữ liệu để kết luận')
        return dict(stage=stage, kieu_hinh_ef=phenotype, benh_canh=context,
                    stageProvisional=True, canh_bao_cap_cuu=alerts,
                    xac_suat_suy_tim={'muc': level, 'xac_suat': None,
                                      'calibration': 'synthetic_not_calibrated'}), matched

    ef = val('cls_lvef')
    bnp, nt = val('cls_bnp'), val('cls_nt_probnp')
    structural = (val('bat_thuong_cau_truc_tim') is True or bool(val('bat_thuong_cau_truc_chi_tiet'))
                  or val('roi_loan_tam_truong') is True or (ef is not None and ef < threshold['efPreservedMin']))
    peptide = ((bnp is not None and bnp >= threshold['bnpOutpatient'])
               or (nt is not None and nt >= threshold['ntprobnpOutpatient']))
    if symptoms and (structural or peptide):
        stage = 'D' if refractory else 'C'
        matched.extend(['1.3', '1.4'] if refractory else ['1.3'])
    elif asymptomatic and (structural or peptide):
        stage = 'B'
        matched.append('1.2')
    elif (asymptomatic and risk and ef is not None and ef >= threshold['efPreservedMin']
          and val('bat_thuong_cau_truc_tim') is False and val('roi_loan_tam_truong') is False
          and not structural and not peptide and (bnp is not None or nt is not None)):
        stage = 'A'
        matched.append('1.1')
    if stage in ('C', 'D') and ef is not None:
        if ef <= threshold['efReducedMax']:
            phenotype = 'HFrEF'
            matched.append('1.5')
        elif ef < threshold['efPreservedMin']:
            phenotype = 'HFmrEF'
            matched.append('1.6')
        elif val('roi_loan_tam_truong') is True:
            phenotype = 'HFpEF'
            matched.append('1.7')
    elif stage in ('A', 'B'):
        phenotype = 'Không áp dụng'
    if acute and ((bnp is not None and bnp >= threshold['bnpAcute'])
                  or (nt is not None and nt >= threshold['ntprobnpAcute'])):
        context = 'Decompensated HF'
    elif stage in ('C', 'D'):
        context = 'Suy tim cấp hoặc mạn tính'
    return dict(stage=stage, kieu_hinh_ef=phenotype, benh_canh=context), matched

def profile(rules):
    rules=deepcopy(rules);rules['rulesVersion']='mock-2.0'
    for module,fields in [('M1',M1_FIELDS),('M2',M1_FIELDS|M2_LAB_FIELDS),('M3',M3_FIELDS),('M4',M4_FIELDS)]:
        rules['outputProjection']['gapFields'][module]=sorted(fields)
        # Explicit unknown is allowed, preserving the workflow uncertainty contract.
        # Core resolved fields match v1.2; removed COPD/anemia are never required.
        rules['workflowPolicy']['requiredResolved'][module]=[f for f in rules['workflowPolicy']['requiredResolved'][module] if f not in ('copd','thieu_mau')]
    return rules

def run_v2(module,snapshot,rules,legacy_output):
    fields=snapshot.get('fields',{});t=rules['v2Thresholds'];matched=[]
    def val(key):
        a=fields.get(key,{})
        return a.get('value') if a.get('value_state')=='answered' else None
    def numeric(key,op,limit):
        value=val(key)
        return type(value) in (int,float) and {'lt':lambda:value<limit,'gt':lambda:value>limit,'gte':lambda:value>=limit,'lte':lambda:value<=limit}[op]()
    out=deepcopy(legacy_output)
    out.update(rulesVersion='mock-2.0',clinicalUse=False,displayLabel=rules['displayLabel'])
    if module=='M2':
        # v2 deduplicates dated results automatically; v1.2 keeps reuse confirmation.
        suspected=(snapshot.get('effective_m1',{}).get('stage') in ('A','B','C','D') or
                   any(val(k) is True for k in SYMPTOMS+RISKS))
        if suspected:
            matched+=['2.1','2.2']
            for key in ('bnp_ntprobnp','ecg','sieu_am_tim','xquang','cong_thuc_mau','ure_creatinin_egfr',
                        'kali_natri','chuc_nang_gan','duong_huyet_hba1c','tsh','ferritin_tsat'):
                if out['goi_y_chi_dinh'][key]['trang_thai']!='Đã có kết quả gần đây':
                    out['goi_y_chi_dinh'][key]={'trang_thai':'Đề xuất','ly_do':'Luật 2.1–2.2; bác sĩ xác minh chỉ định, không tạo y lệnh tự động.'}
        for key,evidence in snapshot.get('recentTestEvidence',{}).items():
            out['goi_y_chi_dinh'][key]={'trang_thai':'Đã có kết quả gần đây',
                'ly_do':'Kết quả hợp lệ trong cửa sổ 30 ngày của mock; bác sĩ rà soát nhu cầu đo lại.',
                'evidenceObservationIds':evidence.get('observationIds',[evidence['id']])}
            if key not in out['khoa_trung_lap']:out['khoa_trung_lap'].append(key)
        ecg=val('ecg_12_chuyen_dao') or {}
        if numeric('cls_lvef','lte',40) and (val('dau_nguc') is True or val('ts_benh_mach_vanh_nmct') is True or ecg.get('pathological_q') is True):
            matched.append('2.3')
            out['goi_y_chi_dinh']['danh_gia_mach_vanh']={'trang_thai':'Đề xuất','ly_do':'Luật 2.3; bác sĩ phân tầng nguy cơ, kiểm tra đau ngực dù tối ưu nội khoa trước chọn MSCT hoặc chụp mạch qua da.'}
        if out.get('kieu_hinh_ef')=='HFpEF' and 'day_that_trai' in (val('bat_thuong_cau_truc_chi_tiet') or []):
            out['dataGaps'].append('Luật 2.4: bác sĩ xác minh tuổi cao và phì đại thất trái không do THA trước cân nhắc MRI LGE hoặc SPECT 99mTc-bisphosphonate; không tự đặt ngưỡng tuổi.')
        out['dataGaps']=[g for g in out['dataGaps'] if not g.startswith('Mock chỉ có luật')]
        out['dataGaps'].append('Kết quả mô phỏng hỗ trợ bác sĩ; chưa thẩm định lâm sàng.')
    elif module=='M3':
        out=deepcopy(rules['outputDefaults']['M3']);out.update(rulesVersion='mock-2.0')
        m1=effective_diagnosis(snapshot);out.update(stage=m1.get('stage'),kieu_hinh_ef=m1.get('kieu_hinh_ef',PENDING_EF))
        out['dinh_huong']='Bác sĩ đánh giá dữ liệu, huyết động và chống chỉ định trước khi chọn thuốc.'
        # Stability is positive evidence: all four vital signs must be present.
        stable=(val('dien_bien_cap') is False and numeric('huyet_ap_tam_thu','gte',t['sbpLow']) and
                numeric('mach','gte',t['hrLow']) and numeric('mach','lte',t['hrHigh']) and
                numeric('nhip_tho','lte',t['rrHigh']) and numeric('spo2','gte',t['spo2Low']))
        renal_safe=numeric('cls_kali','lte',t['potassiumHigh']) and numeric('cls_creatinin','lte',t['creatinineHigh']) and numeric('egfr_ckd_epi','gte',t['egfrLow'])
        if m1.get('stage')=='C' and m1.get('kieu_hinh_ef')=='HFrEF' and stable and renal_safe:
            matched.append('3.1')
            for group in ('ARNI_ACEI_ARB','beta_blocker','MRA','SGLT2i'):out['nhom_thuoc'][group]={'muc':'Cân nhắc','ly_do':'Luật 3.1; bác sĩ xác minh các chống chỉ định còn lại, chọn hoạt chất/liều.'}
            out['khuyen_nghi']['dieu_tri_stage_c']={'ap_dung':'co','noi_dung':'Bác sĩ rà soát bốn trụ cột.','ly_do':'Luật 3.1; mô phỏng, chưa thẩm định.'}
        else:out['dataGaps'].append('Chưa đủ bằng chứng ổn định/không chống chỉ định để áp dụng Luật 3.1.')
        if m1.get('kieu_hinh_ef') in ('HFmrEF','HFpEF'):
            matched.append('3.3' if m1['kieu_hinh_ef']=='HFmrEF' else '3.4')
            out['nhom_thuoc']['SGLT2i']={'muc':'Cân nhắc','ly_do':'Bác sĩ xác minh chỉ định, chức năng thận và chống chỉ định.'}
        congestion=any(val(k) is True for k in ('ran_am_phoi','phu_hai_chi_duoi','tinh_mach_co_noi'))
        if m1.get('kieu_hinh_ef')=='HFrEF' and congestion:
            matched.append('3.2');out['nhom_thuoc']['loop_diuretic']={'muc':'Cân nhắc','ly_do':'Luật 3.2; bác sĩ đánh giá sung huyết, cân nặng và chọn liều.'}
        if m1.get('benh_canh')=='Decompensated HF' and congestion:
            matched.append('3.5')
            prior=val('lieu_loi_tieu_quai_ngay')
            if val('dang_dung_loi_tieu_quai_uong') is False:
                out['ke_hoach_do_lieu']='Luật 3.5 mô phỏng: bác sĩ cân nhắc Furosemide IV 20–40 mg sau đánh giá; hệ thống không tạo đơn.'
            elif val('dang_dung_loi_tieu_quai_uong') is True and type(prior) in (int,float) and prior>0:
                out['ke_hoach_do_lieu']='Luật 3.5 mô phỏng: bác sĩ xác minh thuốc/liều tương đương rồi cân nhắc IV bằng 1–2 lần liều uống ngày; hệ thống không tạo đơn.'
            else:out['dataGaps'].append('Luật 3.5: chưa rõ tiền sử/liều lợi tiểu quai uống; không suy ra liều IV.')
            if numeric('natri_nieu_2gio','lt',50) or numeric('nuoc_tieu_6gio','lt',600):
                matched.append('3.6');out['ca_the_hoa'].append('Luật 3.6: bác sĩ xác minh đã dùng lợi tiểu IV và thời điểm 2/6 giờ, đánh giá đáp ứng trước khi cân nhắc chỉnh liều.')
            elif numeric('natri_nieu_2gio','gte',50) and numeric('natri_nieu_2gio','lt',70):
                out['dataGaps'].append('Luật 3.6 ghi khoảng 50–70 mEq/L; chưa chọn một điểm cắt cho khoảng này.')
    elif module=='M4':
        out=deepcopy(rules['outputDefaults']['M4']);out.update(rulesVersion='mock-2.0')
        drugs=[d for key in ('medications','selected_medications') for d in (val(key) or [])]
        def group(d):return d.get('class') or d.get('group')
        classes={group(d) for d in drugs}
        def alert(rule,title,groups,message,severity='Quan trọng',dd=204):
            ids=sorted({d['id'] for d in drugs if group(d) in groups and d.get('id')})
            if not ids:return
            out['canh_bao'].append({'id':rule,'loai':title,'ddCode':dd,'thuoc_lien_quan':ids,'muc_do':severity,
             'noi_dung':message,'hanh_dong_de_xuat':'Bác sĩ rà soát và quyết định; hệ thống không tự đổi đơn.',
             'auto_change_medication':False});matched.append(rule)
        if 'ACEI' in classes and 'ARNI' in classes:alert('4.1','ACE-I / ARNI',{'ACEI','ARNI'},'Không dùng đồng thời; bác sĩ xác minh ngừng ACE-I ít nhất 36 giờ trước ARNI.','Nghiêm trọng')
        raas={'ACEI','ARB','ARNI','MRA'}
        if classes & raas and (numeric('cls_kali','gt',t['potassiumHigh']) or numeric('cls_creatinin','gt',t['creatinineHigh']) or numeric('egfr_ckd_epi','lt',t['egfrLow'])):
            alert('4.2','Kali / chức năng thận',raas,'Vượt ngưỡng Luật 4.2; bác sĩ rà soát thuốc và theo dõi điện giải/chức năng thận 24–48 giờ.','Nghiêm trọng')
        harmful={'NSAID','corticosteroid','TZD','class_I_antiarrhythmic'}
        if effective_diagnosis(snapshot).get('stage') in ('A','B','C','D') and classes & harmful:alert('4.3','Thuốc cần tránh',harmful,'Luật 4.3: bác sĩ đánh giá thuốc giữ nước/độc tim và xem xét lựa chọn khác.')
        # The project provides no CFS cut-off: never infer frailty from its score.
        frail=val('suy_giam_nhan_thuc') is True
        drop=val('giam_ha_tu_the')
        if drop is None and type(val('huyet_ap_tam_thu')) in (int,float) and type(val('ha_tam_thu_dung')) in (int,float):drop=val('huyet_ap_tam_thu')-val('ha_tam_thu_dung')
        # Count medicine rows, including unmapped drugs; never count ingredients twice.
        count=len({d.get('id',str(i)) for i,d in enumerate(drugs)})
        if count>=t['polypharmacyMin'] and frail and type(drop) in (int,float) and drop>=t['orthostaticDropMin']:
            alert('4.4','Đa thuốc / hạ HA tư thế',classes,'Bác sĩ rà soát đơn giản hóa lịch thuốc, chỉ định và hỗ trợ người chăm sóc.')
            out['don_gian_hoa_phac_do'].append('Bác sĩ cân nhắc giảm số lần dùng thuốc sau rà soát chỉ định.')
        out['dataGaps']=['Chưa thẩm định lâm sàng; chưa bao phủ toàn bộ tương tác/chống chỉ định; thuốc chưa ánh xạ cần bác sĩ rà soát.']
        if val('danh_gia_suy_yeu_frailty') is not None:
            out['dataGaps'].append('Luật 4.4 chưa quy định ngưỡng CFS; không tự phân loại suy yếu từ điểm. Bác sĩ đánh giá tình trạng lão khoa.')
    return out,matched
