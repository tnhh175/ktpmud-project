"""Deterministic versioned HF mapping; source references are metadata, never patient data."""
from pathlib import Path
import json
ROOT=Path(__file__).resolve().parents[2]
MODULES=('ai_diagnosis','ai_lab_test','ai_treatment','ai_medsafety')

def build_registry():
    rows=[]
    def add(code,source=None,kind='number',unit=None,transform='identity-v1',modules=(),row=None,enum=None):
        rows.append(dict(aiCode=code,direction='input',source=source,type=kind,canonicalUnit=unit,transform=transform,requiredForModules=list(modules),sourceRow=row,enum=enum,missingPolicy='not_collected-if-unconfigured',timePolicy='all-observations-no-current-selector',retryPolicy='none-local-transform'))
    common=[('MA_BN','patientId','string',None,'hmac-patient-v1'),('MA_LK','visitId','string',None,'hmac-visit-v1'),('HO_TEN',None,'string',None,'omit-privacy-v1'),('NGAY_SINH',None,'string',None,'omit-privacy-v1'),('TUOI','age','integer','years','age-at-confirm-v1'),('GIOI_TINH','sex','integer',None,'sex-code-v1'),('SO_BHYT',None,'string',None,'omit-privacy-v1'),('KHOA_PHONG',None,'string',None,'unsupported-v1'),('THOI_GIAN_KHAM',None,'string',None,'unsupported-v1'),('BAC_SI_KHAM',None,'string',None,'unsupported-v1'),('CHIEU_CAO','chieu_cao_cm','number','cm','identity-v1'),('CAN_NANG','can_nang_kg','number','kg','identity-v1'),('BMI','bmi','number','kg/m2','bmi-v1'),('HA_TAM_THU','systolic','integer','mmHg','series-only-v1'),('HA_TAM_TRUONG','diastolic','integer','mmHg','series-only-v1'),('TAN_SO_TIM','mach','integer','/min','identity-v1'),('SPO2','spo2','number','%','identity-v1'),('TIEN_SU_DI_UNG','allergies','array',None,'list-v1'),('DANH_MUC_THUOC_DANG_DUNG','medications','array',None,'list-v1'),('BENH_DONG_MAC_ICD10','diagnoses','array',None,'list-v1')]
    for i,args in enumerate(common,7):
        code=args[0];modules=MODULES if code in ('TUOI','GIOI_TINH') else (('ai_medsafety',) if code in ('TIEN_SU_DI_UNG','DANH_MUC_THUOC_DANG_DUNG') else (('ai_diagnosis','ai_treatment') if code=='BENH_DONG_MAC_ICD10' else ()))
        add(*args,modules=modules,row='Chung!'+str((list(range(7,17))+list(range(19,29)))[i-7]))
    hf=[('KHO_THO_NANG',None,'integer',None,'unsupported-v1', [0,1,2,3]),('PHU_CHI_DUOI',None,'integer',None,'unsupported-v1',[0,1,2]),('TINH_MACH_CO_NOI','tinh_mach_co_noi','integer',None,'boolean-01-v1',[0,1]),('RAN_AM_PHOI','ran_am_phoi','integer',None,'boolean-01-v1',[0,1]),('BIEN_THIEN_CAN_NANG_7NGAY',None,'number','kg','unsupported-v1',None),('TRIEU_CHUNG_KHONG_DIEN_HINH',None,'integer',None,'unsupported-v1',[0,1,2]),('DANH_GIA_SUY_YEU_FRAILTY',None,'integer',None,'unsupported-v1',list(range(1,10))),('NT_PROBNP','cls_nt_probnp','number','pg/mL','lab-series-v1',None),('BNP','cls_bnp','number','pg/mL','lab-series-v1',None),('EF_SIEU_AM_TIM','cls_lvef','number','%','lab-series-v1',None),('E_OVER_A_RATIO',None,'number','ratio','unsupported-v1',None),('CREATININE_MAU','cls_creatinin','number','umol/L','lab-series-v1',None),('EGFR_CKD_EPI',None,'number','mL/min/1.73m2','unsupported-v1',None),('KALI_MAU','cls_kali','number','mmol/L','lab-series-v1',None),('ECG_12_CHUYEN_DAO','cls_ecg_ket_luan','string',None,'withheld-free-text-v1',None),('XQUANG_NGUC_THANG','cls_xquang_ket_luan','string',None,'withheld-free-text-v1',None)]
    for i,(code,source,kind,unit,transform,enum) in enumerate(hf):
        modules=('ai_diagnosis','ai_lab_test') if i<7 else ('ai_treatment',)
        add(code,source,kind,unit,transform,modules,'HF!'+str(6+i if i<7 else 18+i-7),enum)
    outputs=['DxAI_XAC_SUAT_SUY_TIM','DxAI_PHAN_LOAI_STAGE','DxAI_CANH_BAO_GIA_SUY_TIM','LabAI_GOI_Y_CHI_DINH','LabAI_KHOA_TRUNG_LAP','TxAI_KIỂU_HÌNH_SUY_TIM','TxAI_KE_HOACH_DO_LIEU','ARNI_SACUBUTRIL_VALSARTAN','CHET_BETA_GIAO_CAM','KHANG_MRA_SPIRONOLACTONE','SGLT2_INHIBITOR','LOI_TIEU_QUAI_FUROSEMIDE','DDI_CANH_BAO_NSAID','DDI_CANH_BAO_TANG_KALI','DDI_CANH_BAO_CHAM_NHIP','DDI_NGO_DOC_DIGOXIN','DDI_HA_HA_TU_THE_TE_NGA']
    outputs[7]='ARNI_SACUBITRIL_VALSARTAN'
    return dict(mappingVersion='hf-map/1.0',contractVersion='hf-ai-input/1.0',variableTableVersion='3.0',profile='HF',effectiveDate='2026-11-24',approvalSource='G1-decisions.md #11-17',consumerAcceptance='pending',inputs=rows,outputs=[{'aiCode':c,'direction':'output'} for c in outputs])

REGISTRY=build_registry()
