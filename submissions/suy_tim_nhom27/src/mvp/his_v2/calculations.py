"""Deterministic calculations. Missing inputs never become negative findings."""
from datetime import date
import math
import re

CKD_SOURCE='https://www.kidney.org/professionals/ckd-epi-creatinine-equation-2021'

def number(value):
    if value is None or isinstance(value,bool): return None
    try:
        result=float(str(value).strip().replace(',','.'))
        return result if math.isfinite(result) else None
    except (TypeError,ValueError): return None

def age_at(birth_date, visit_date):
    if not birth_date or not visit_date: return None
    if isinstance(birth_date,str): birth_date=date.fromisoformat(birth_date[:10])
    if isinstance(visit_date,str): visit_date=date.fromisoformat(visit_date[:10])
    result=visit_date.year-birth_date.year-((visit_date.month,visit_date.day)<(birth_date.month,birth_date.day))
    return result if 0<=result<=120 else None

def bmi(height,weight):
    h,w=number(height),number(weight)
    return round(w/(h/100)**2,2) if h and w and 30<=h<=250 and 1<=w<=400 else None

def egfr_2021(creatinine,age,sex,unit='umol/L'):
    """Adult CKD-EPI 2021 creatinine equation, NKF; no race coefficient."""
    cr,years=number(creatinine),number(age)
    if cr is None or cr<=0 or years is None or not 18<=years<=120 or sex not in ('male','female'):return None
    if unit=='umol/L':cr/=88.4
    elif unit!='mg/dL':return None
    k,a=(.7,-.241) if sex=='female' else (.9,-.302)
    return round(142*min(cr/k,1)**a*max(cr/k,1)**-1.2*.9938**years*(1.012 if sex=='female' else 1))

def icd_risks(codes):
    result=set()
    for code in codes or []:
        m=re.fullmatch(r'([A-Z])(\d{2})(?:\.[0-9A-Z]{1,4})?',str(code).strip().upper())
        if not m:continue
        letter,n=m[1],int(m[2])
        for match,key in [ (letter=='I' and 10<=n<=15,'ts_tang_huyet_ap'),
            (letter=='E' and 10<=n<=14,'ts_dai_thao_duong'),
            (letter=='I' and 20<=n<=25,'ts_benh_mach_vanh_nmct'),
            (letter=='N' and n==18,'ts_benh_than_man'),(letter=='I' and n==48,'ts_rung_nhi_roi_loan_nhip'),
            (letter=='E' and n==66,'ts_beo_phi')]:
            if match:result.add(key)
    return sorted(result)

def answer(value,unit=None,measured_at=None):
    result={'value_state':'unknown' if value is None else 'answered','value':value}
    if value is not None and unit:result['unit']=unit
    if value is not None and measured_at:result['measuredAt']=measured_at
    return result

def derive(fields,*,birth_date=None,visit_date=None,sex=None):
    """Return auto answers; never overwrite doctor-confirmed risks."""
    def val(key):
        a=fields.get(key,{})
        return a.get('value') if a.get('value_state')=='answered' else None
    years=age_at(birth_date,visit_date) if birth_date else val('age')
    index=bmi(val('chieu_cao_cm'),val('can_nang_kg'))
    sbp,standing=number(val('huyet_ap_tam_thu')),number(val('ha_tam_thu_dung'))
    drugs=val('medications')
    count=len(drugs) if isinstance(drugs,list) else None
    cr=fields.get('cls_creatinin',{})
    egfr=egfr_2021(val('cls_creatinin'),years,sex or val('sex'),cr.get('unit'))
    from .medications import classify
    groups=[classify(d.get('name') or d.get('ingredient') or '') for d in drugs] if isinstance(drugs,list) else None
    return {key:answer(value,unit,when) for key,value,unit,when in [
        ('luot_tuoi',years,'years',None),('bmi',index,'kg/m2',None),
        ('goi_y_beo_phi',index>=25 if index is not None else None,None,None),
        ('giam_ha_tu_the',sbp-standing if sbp is not None and standing is not None else None,'mmHg',None),
        ('egfr_ckd_epi',egfr,'mL/min/1.73m2',cr.get('measuredAt')),
        ('egfr_formula','CKD-EPI 2021' if egfr is not None else None,None,None),
        ('so_luong_thuoc_dong_thoi',count,None,None),('co_da_thuoc',count>=5 if count is not None else None,None,None),
        ('nhom_thuoc_tu_dong',groups,None,None),('goi_y_nguy_co_icd',icd_risks(val('diagnoses')) if val('diagnoses') is not None else None,None,None)]}
