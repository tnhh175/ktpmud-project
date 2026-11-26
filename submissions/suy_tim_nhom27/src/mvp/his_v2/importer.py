"""Local XLSX library/CLI. Logs contain counts/error codes, never source rows.

python -m src.mvp.his_v2.importer FILE --dsn DSN --nurse USER [--apply]
Without --apply, validates and counts only. Missing age rejects a new identity;
the importer never invents a date of birth to pass the required DOB contract.
"""
import argparse
from datetime import date,datetime,timezone,timedelta
import json
from pathlib import Path
import re
from uuid import uuid4

from openpyxl import load_workbook
from psycopg.rows import dict_row
from psycopg.types.json import Jsonb
from .calculations import answer,derive,number
from .medications import split_medications

COLUMNS=('SoVaoVien','SoTiepNhan','Tuoi','GioiTinh','NgayKham','Kham','ChanDoanICD','ICDChinh','ICDPhu',
 'MaBenhKemTheo','Thuoc','HuyetApCao','HuyetApThap','NhipTho','ChieuCao','CanNang','NTProBNp','HbA1c',
 'HDl','LDL','Cholesterol','Triglycerid','CreatininMau','CreatininNieu','AlbuminNieu','Na','K','Cl','TongLuotKham')
LABS={'NTProBNp':('cls_nt_probnp','pg/mL'),'HbA1c':('cls_hba1c','%'),'HDl':('cls_hdl','mmol/L'),
 'LDL':('cls_ldl','mmol/L'),'Cholesterol':('cls_cholesterol','mmol/L'),'Triglycerid':('cls_triglycerid','mmol/L'),
 'CreatininMau':('cls_creatinin','umol/L'),'CreatininNieu':('cls_creatinin_nieu','mmol/L'),
 'AlbuminNieu':('cls_albumin_nieu','mg/L'),'Na':('cls_natri','mmol/L'),'K':('cls_kali','mmol/L'),'Cl':('cls_clo','mmol/L')}
ICD=re.compile(r'^[A-Z][0-9]{2}(?:\.[0-9A-Z]{1,4})?$')

class RowError(ValueError):pass

def clean(value):
    if value is None or isinstance(value,str) and value.strip().upper() in ('','NULL'):return None
    return value.strip() if isinstance(value,str) else value

def external(value):
    value=clean(value)
    if value is None:return None
    return str(int(value)) if type(value) is float and value.is_integer() else str(value)

def normalize_row(raw):
    row={k:clean(v) for k,v in raw.items()};warnings=[]
    patient_code,visit_code=external(row.get('SoVaoVien')),external(row.get('SoTiepNhan'))
    if not patient_code or not visit_code:raise RowError('HIS_ID_MISSING')
    when=row.get('NgayKham')
    if isinstance(when,str):
        try:when=datetime.fromisoformat(when)
        except ValueError:raise RowError('HIS_DATE_INVALID') from None
    if isinstance(when,date) and not isinstance(when,datetime):when=datetime.combine(when,datetime.min.time())
    if not isinstance(when,datetime):raise RowError('HIS_DATE_INVALID')
    if when.tzinfo is None:when=when.replace(tzinfo=timezone(timedelta(hours=7)))
    years=number(row.get('Tuoi'));birth=None
    if years is not None:
        if years!=int(years) or not 0<=years<=120:raise RowError('HIS_AGE_INVALID')
        try:birth=date(when.year-int(years),1,1)
        except ValueError:raise RowError('HIS_AGE_INVALID') from None
        if birth<date(1900,1,1) or birth>date.today():raise RowError('HIS_AGE_INVALID')
    else:warnings.append('HIS_AGE_MISSING')
    sex={'nam':'male','male':'male','nữ':'female','nu':'female','female':'female'}.get(str(row.get('GioiTinh')).casefold(),'unknown')
    fields={}
    for source,code,unit in [('ChieuCao','chieu_cao_cm','cm'),('CanNang','can_nang_kg','kg'),('NhipTho','nhip_tho','/min')]:
        fields[code]=answer(number(row.get(source)),unit)
    a,b=number(row.get('HuyetApCao')),number(row.get('HuyetApThap'))
    if a is not None and b is not None:
        sbp,dbp=max(a,b),min(a,b)
        if sbp-dbp<10:warnings.append('HIS_BP_NARROW_PULSE_PRESSURE')
    else:
        sbp=dbp=None
        if a is not None or b is not None:warnings.append('HIS_BP_PAIR_INCOMPLETE')
    fields['huyet_ap_tam_thu']=answer(sbp,'mmHg');fields['huyet_ap_tam_truong']=answer(dbp,'mmHg')
    fields['mach']={**answer(None),'reason':'HIS không có cột mạch; NVYT cần đo bổ sung.'}
    fields['spo2']={**answer(None),'reason':'HIS không có cột SpO₂; NVYT cần đo bổ sung.'}
    for code in ('chieu_cao_cm','can_nang_kg','huyet_ap_tam_thu','huyet_ap_tam_truong'):
        if fields[code]['value_state']=='unknown':
            fields[code]['reason']='HIS thiếu giá trị hoặc cặp HA chưa đầy đủ; NVYT cần xác minh.'
    for source,(code,unit) in LABS.items():fields[code]=answer(number(row.get(source)),unit,when.isoformat())
    if any(fields[code]['value_state']=='answered' for code,_unit in LABS.values()):
        # The 29-column extract provides neither sample times nor lab units.
        warnings+=['HIS_LAB_TIME_FROM_VISIT_UNVERIFIED','HIS_LAB_UNITS_ASSUMED_UNVERIFIED']
    diagnoses=[]
    for source in ('ICDChinh','ICDPhu','MaBenhKemTheo'):
        for code in re.split(r'\s*\+\s*',str(row.get(source) or '')):
            code=code.strip().upper()
            if not code:continue
            if not ICD.fullmatch(code):warnings.append('HIS_ICD_UNMAPPED');continue
            if code not in diagnoses:diagnoses.append(code)
    fields['diagnoses']=answer(diagnoses if diagnoses else None)
    medications=split_medications(row.get('Thuoc'))
    fields['medications']=answer(medications)
    # No allergy/history/symptom values exist in HIS; keep all of them unknown.
    fields['allergies']=answer(None)
    fields.update(derive(fields,birth_date=birth,visit_date=when,sex=sex))
    return {'externalPatientCode':patient_code,'externalVisitCode':visit_code,'birthDate':birth,'sex':sex,
            'visitDate':when,'clinic':row.get('Kham'),'icdPrimary':row.get('ICDChinh'),'icdSecondary':row.get('ICDPhu'),
            'fields':fields,'warnings':sorted(set(warnings))}

def read_rows(path):
    workbook=load_workbook(path,read_only=True,data_only=True)
    try:
        rows=iter(workbook.active.values);headers=next(rows)
        if len(headers)!=29 or set(headers)!=set(COLUMNS):raise ValueError('HIS_COLUMNS_INVALID')
        for row in rows:
            if any(clean(v) is not None for v in row):yield dict(zip(headers,row))
    finally:workbook.close()

def persist_row(conn,row,nurse_id):
    """Runs within the caller's transaction; replay never changes an existing visit."""
    nurse=conn.execute("SELECT role::text AS role FROM app_user WHERE id=%s AND is_active",(nurse_id,)).fetchone()
    if not nurse or nurse['role']!='nurse':raise ValueError('HIS_NURSE_REQUIRED')
    version=conn.execute("SELECT id FROM form_version WHERE version_label='v2.0' AND status='published'").fetchone()
    if not version:raise ValueError('HIS_FORM_V2_REQUIRED')
    conn.execute("SELECT pg_advisory_xact_lock(hashtext('hf-his-import-v2'))")
    existing=conn.execute('SELECT id,patient_id FROM visit WHERE external_visit_code=%s',(row['externalVisitCode'],)).fetchone()
    if existing:
        owner=conn.execute('SELECT external_patient_code FROM patient WHERE id=%s',(existing['patient_id'],)).fetchone()
        if owner['external_patient_code']!=row['externalPatientCode']:raise RowError('HIS_VISIT_ID_CONFLICT')
        return 'replayed'
    patients=conn.execute('SELECT id,birth_date,sex FROM patient WHERE external_patient_code=%s',(row['externalPatientCode'],)).fetchall()
    if len(patients)>1:raise RowError('HIS_PATIENT_ID_AMBIGUOUS')
    if patients:
        patient=patients[0];pid=patient['id']
        if patient['sex']!='unknown' and row['sex']!='unknown' and patient['sex']!=row['sex']:raise RowError('HIS_DEMOGRAPHICS_CONFLICT')
        if row['birthDate'] and patient['birth_date'] and row['birthDate'].year!=patient['birth_date'].year:raise RowError('HIS_DEMOGRAPHICS_CONFLICT')
    else:
        if not row['birthDate']:raise RowError('HIS_AGE_MISSING')
        conn.execute("SELECT pg_advisory_xact_lock(hashtext('patient_code_seq'))")
        seq=conn.execute("SELECT COALESCE(MAX(SUBSTRING(patient_code FROM 4)::int),0)+1 AS n FROM patient WHERE patient_code ~ '^BN-[0-9]{5}$'").fetchone()['n']
        if seq>99999:raise ValueError('HIS_PATIENT_CODE_EXHAUSTED')
        pid=uuid4()
        conn.execute('INSERT INTO patient(id,patient_code,external_patient_code,full_name,sex,birth_date,created_by) VALUES(%s,%s,%s,%s,%s,%s,%s)',
          (pid,f'BN-{seq:05d}',row['externalPatientCode'],'HIS '+row['externalPatientCode'],row['sex'],row['birthDate'],nurse_id))
    vid=uuid4()
    conn.execute("INSERT INTO visit(id,visit_code,external_visit_code,patient_id,form_version_id,visit_date,status,created_by,submitted_by,submitted_at) VALUES(%s,%s,%s,%s,%s,%s,'waiting',%s,%s,%s)",
      (vid,'LK-HIS-'+vid.hex[:16].upper(),row['externalVisitCode'],pid,version['id'],row['visitDate'],nurse_id,nurse_id,row['visitDate']))
    definitions={r['code']:r for r in conn.execute('SELECT fd.* FROM form_field ff JOIN field_definition fd ON fd.id=ff.field_definition_id WHERE ff.form_version_id=%s',(version['id'],))}
    # Store medication source detail in the structured answer; workflow projection
    # strips display/schedule text and accepts only explicitly mapped ingredients.
    for code,value in row['fields'].items():
        if code not in definitions:continue
        conn.execute('INSERT INTO visit_value(visit_id,field_definition_id,value_state,answer) VALUES(%s,%s,%s,%s)',(vid,definitions[code]['id'],value['value_state'],Jsonb(value)))
    for code,value in [('phong_kham',row['clinic']),('icd_chinh',row['icdPrimary']),('icd_phu',row['icdSecondary'])]:
        if value and code in definitions:conn.execute("INSERT INTO visit_value(visit_id,field_definition_id,value_state,value_text) VALUES(%s,%s,'answered',%s)",(vid,definitions[code]['id'],str(value)))
    conn.execute("INSERT INTO audit_log(actor_user_id,action,entity_type,entity_id,outcome,detail) VALUES(%s,'visit_submit','visit',%s,'success',%s)",(nurse_id,vid,Jsonb({'source':'his-v2','warningCodes':row['warnings']})))
    return 'imported'

def import_workbook(path,*,dsn=None,nurse_username=None,apply=False):
    counts={'rows':0,'imported':0,'replayed':0,'valid':0,'rejected':0,'errorCodes':{},'warningCodes':{}}
    conn=None;nurse_id=None
    if apply:
        import psycopg
        if not dsn or not nurse_username:raise ValueError('HIS_DSN_NURSE_REQUIRED')
        conn=psycopg.connect(dsn,row_factory=dict_row)
        nurse=conn.execute('SELECT id FROM app_user WHERE username=%s',(nurse_username,)).fetchone()
        if not nurse:conn.close();raise ValueError('HIS_NURSE_REQUIRED')
        nurse_id=nurse['id']
    try:
        for raw in read_rows(path):
            counts['rows']+=1
            try:
                row=normalize_row(raw)
                for code in row['warnings']:counts['warningCodes'][code]=counts['warningCodes'].get(code,0)+1
                if apply:
                    with conn.transaction():outcome=persist_row(conn,row,nurse_id)
                    counts[outcome]+=1
                elif row['birthDate'] is None:raise RowError('HIS_AGE_MISSING')
                else:counts['valid']+=1
            except RowError as error:
                counts['rejected']+=1;code=str(error);counts['errorCodes'][code]=counts['errorCodes'].get(code,0)+1
        if conn:conn.commit()
    finally:
        if conn:conn.close()
    return counts

def main():
    p=argparse.ArgumentParser(description=__doc__);p.add_argument('xlsx',type=Path);p.add_argument('--dsn');p.add_argument('--nurse');p.add_argument('--apply',action='store_true')
    a=p.parse_args()
    try:result=import_workbook(a.xlsx,dsn=a.dsn,nurse_username=a.nurse,apply=a.apply)
    except Exception:
        # Exceptions from database drivers can contain row contents/connection secrets.
        print(json.dumps({'error':'HIS_IMPORT_ABORTED','detail':'Check schema, nurse account and source format locally.'}));return 2
    print(json.dumps(result));return 1 if result['rejected'] else 0

if __name__=='__main__':raise SystemExit(main())
