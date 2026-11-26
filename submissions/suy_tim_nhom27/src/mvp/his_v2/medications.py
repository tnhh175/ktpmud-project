"""Conservative, reviewable ingredient lookup; unrecognised brands stay unmapped."""
import json
from pathlib import Path
import re
import unicodedata

GROUPS={'ACEI':'ACE-I','ARB':'ARB','ARNI':'ARNI','beta_blocker':'Chẹn beta','MRA':'MRA','SGLT2i':'SGLT2',
        'loop_diuretic':'Lợi tiểu quai','NSAID':'NSAIDs','corticosteroid':'Corticoid','TZD':'TZD',
        'class_I_antiarrhythmic':'Chống loạn nhịp nhóm I','other':'Khác'}
PILLARS={'ACEI','ARB','ARNI','beta_blocker','MRA','SGLT2i'}
CAUTIONS={'NSAID','corticosteroid','TZD','class_I_antiarrhythmic'}

def normalize(text):
    return re.sub(r'\s+',' ',unicodedata.normalize('NFKC',text).casefold()).strip()

# Generic ingredients from PLAN-v2 / project rule-base; aliases carry source refs.
INGREDIENTS={
 'ACEI':['enalapril','perindopril','lisinopril','captopril','ramipril','imidapril'],
 'ARNI':['sacubitril'], 'ARB':['losartan','valsartan','telmisartan','irbesartan','candesartan','olmesartan'],
 'beta_blocker':['bisoprolol','metoprolol','carvedilol','nebivolol','atenolol'],
 'MRA':['spironolactone','spironolacton','eplerenone'], 'SGLT2i':['dapagliflozin','empagliflozin'],
 'loop_diuretic':['furosemide','furosemid','torsemide','torasemide','bumetanide'],
 'NSAID':['ibuprofen','diclofenac','meloxicam','celecoxib','etoricoxib','naproxen','piroxicam','aceclofenac'],
 'corticosteroid':['methylprednisolon','methylprednisolone','prednisolon','prednisolone','prednisone','dexamethasone','budesonide','fluticasone'],
 'TZD':['pioglitazone','rosiglitazone'], 'class_I_antiarrhythmic':['flecainide','propafenone','quinidine','disopyramide'],
 'other':['atorvastatin','rosuvastatin','simvastatin','pravastatin','pitavastatin','fenofibrat','fenofibrate',
 'amlodipine','amlodipin','nifedipin','nifedipine','metformin','sitagliptin','vildagliptin','linagliptin','gliclazide',
 'clopidogrel','aspirin','rivaroxaban','dabigatran','edoxaban','apixaban','digoxin','amiodarone','ivabradine',
 'insulin','levothyroxine','omeprazole','esomeprazole','pantoprazole','lansoprazole','paracetamol','acetaminophen',
 'indapamide','hydrochlorothiazide','salbutamol','formoterol','salmeterol','pregabalin','piracetam','tenofovir']}
ALIASES={}
def aliases(group,ingredient,names,source):
    for name in names.split('|'):ALIASES[normalize(name)]={'ingredient':ingredient,'group':group,'source':source}

aliases('ARNI','sacubitril_valsartan','Uperio|Entresto','https://www.efda.gov.et/wp-content/uploads/2024/06/SACUBITRIL-VALSARTAN_UPERIO-FCT-100MG_Novartis-Farma-SpA.pdf')
aliases('ACEI','perindopril','Coversyl|Coversyl Plus|Viacoram|Coveram|SaViDopril','https://www.servier.com/en/our-medicines/')
aliases('ARB','telmisartan','Micardis|Micardis plus|Telmida|Mibetel','https://www.boehringer-ingelheim.com/human-health/metabolic-diseases/micardis')
aliases('ARB','losartan','Cozaar|Hyzaar|Lorista','https://dailymed.nlm.nih.gov/dailymed/search.cfm?query=losartan')
aliases('beta_blocker','bisoprolol','Concor|Concor Cor|SaViProlol','https://www.merckgroup.com/en/expertise/general-medicine/cardiovascular.html')
aliases('beta_blocker','metoprolol','Betaloc Zok|Betaloc','https://www.astrazeneca.com/medicines.html')
aliases('MRA','spironolactone','Aldactone|Verospiron|Hadulacton','https://dailymed.nlm.nih.gov/dailymed/search.cfm?query=spironolactone')
aliases('SGLT2i','dapagliflozin','Forxiga|Xigduo','https://www.astrazeneca.com/medicines.html')
aliases('SGLT2i','empagliflozin','Jardiance|Jardiance Duo','https://www.boehringer-ingelheim.com/human-health/products/jardiance')
aliases('loop_diuretic','furosemide','Lasix','https://dailymed.nlm.nih.gov/dailymed/search.cfm?query=lasix')
aliases('NSAID','meloxicam','Mobic','https://dailymed.nlm.nih.gov/dailymed/search.cfm?query=mobic')
aliases('NSAID','diclofenac','Voltaren','https://dailymed.nlm.nih.gov/dailymed/search.cfm?query=voltaren')
aliases('corticosteroid','methylprednisolone','Medrol','https://labeling.pfizer.com/ShowLabeling.aspx?id=601')
aliases('corticosteroid','budesonide','Pulmicort|Symbicort','https://www.astrazeneca.com/medicines.html')
aliases('corticosteroid','fluticasone','Seretide','https://www.gsk.com/en-gb/products/our-prescription-medicines/')
for ingredient,names in {
 'atorvastatin':'Lipitor|Atoris','rosuvastatin':'Crestor','fenofibrate':'Lipanthyl',
 'metformin':'Glucophage','gliclazide':'Diamicron','linagliptin':'Trajenta','vildagliptin':'Galvus',
 'ivabradine':'Procoralan','indapamide':'Natrilix','amlodipine':'Amlor','nifedipine':'Adalat',
 'rivaroxaban':'Xarelto','dabigatran':'Pradaxa','edoxaban':'Lixiana','clopidogrel':'Plavix|Duoplavin',
 'esomeprazole':'Nexium','pregabalin':'Lyrica','insulin':'Mixtard|NovoMix|Novorapid|Lantus|Toujeo|Tresiba|Wosulin|Humulin|Scilin',
 'salbutamol':'Ventolin','levothyroxine':'Levothyrox'}.items():
    aliases('other',ingredient,names,'ingredient alias; pending hospital pharmacy verification')

def classify(name):
    text=normalize(name)
    # Longest alias wins; require a word boundary to avoid unsafe prefix matches.
    candidates=[(alias,data) for alias,data in ALIASES.items() if re.match(r'^'+re.escape(alias)+r'(?=$|[\s\d/(.-])',text)]
    if candidates:
        _,found=max(candidates,key=lambda x:len(x[0]));found=dict(found)
    else:
        found=None
        # ARNI precedes valsartan; this lookup supplies one representative group.
        for group,ingredients in INGREDIENTS.items():
            for ingredient in ingredients:
                if re.search(r'(?<![a-z])'+re.escape(ingredient)+r'(?![a-z])',text):
                    found={'ingredient':ingredient,'group':group,'source':'PLAN-v2 / generic ingredient lookup'};break
            if found:break
    found=found or {'ingredient':None,'group':'other','source':None}
    return {**found,'groupLabel':GROUPS[found['group']],'pillar':found['group'] in PILLARS,
            'caution':found['group'] in CAUTIONS,'mapped':found['ingredient'] is not None,
            'reviewStatus':'pending_doctor_pharmacist_review'}

def split_medications(raw):
    """Split semicolons outside parentheses, retaining packaging continuations."""
    if raw is None or str(raw).strip().upper() in ('','NULL'):return None
    chunks=[];depth=0;start=0;text=str(raw)
    for i,char in enumerate(text):
        if char=='(':depth+=1
        elif char==')':depth=max(0,depth-1)
        elif char==';' and depth==0:chunks.append(text[start:i].strip());start=i+1
    chunks.append(text[start:].strip())
    merged=[]
    for chunk in chunks:
        if not chunk:continue
        if merged and re.match(r'(?i)^(hộp|hop\b|vỉ\b|vi\b|box\b|ống\b|ong\b)',chunk):merged[-1]+='; '+chunk
        else:merged.append(chunk)
    result=[]
    for i,chunk in enumerate(merged):
        match=re.search(r'\((?=\s*(?:S|T|C|Tr)\s*:)(.*?)\)\s*$',chunk)
        name=chunk[:match.start()].strip() if match else chunk
        schedule={}
        if match:
            for period,amount,unit in re.findall(r'(Tr|S|T|C)\s*:\s*(\d+(?:[.,]\d+)?)\s*([^\-]*)',match[1]):
                schedule[period]={'amount':float(amount.replace(',','.')),'unit':unit.strip()}
        result.append({'name':name,'schedule':schedule,'scheduleText':match[1] if match else None,**classify(name)})
    return result

def write_inventory(xlsx_path,output_path):
    """Only distinct drug names leave memory; never serialize patient rows."""
    from openpyxl import load_workbook
    workbook=load_workbook(xlsx_path,read_only=True,data_only=True)
    try:
        rows=iter(workbook.active.values);headers=next(rows);index=headers.index('Thuoc');names=set()
        for row in rows:
            names.update(d['name'] for d in (split_medications(row[index]) or []))
    finally:workbook.close()
    drugs=[{'name':name,**classify(name)} for name in sorted(names)]
    summary={'distinctNames':len(drugs),'mappedNames':sum(d['mapped'] for d in drugs),
             'clinicalValidation':'none; pharmacy/doctor review pending','medications':drugs}
    Path(output_path).write_text(json.dumps(summary,ensure_ascii=False,indent=2)+'\n',encoding='utf8')
    return {k:v for k,v in summary.items() if k!='medications'}
