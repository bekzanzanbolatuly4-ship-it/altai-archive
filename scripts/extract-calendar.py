"""Extract paragraph pairs from the supplied RU/KK 2026 calendar DOCX."""
from pathlib import Path
from zipfile import ZipFile
from xml.etree import ElementTree as ET
import json, re

SOURCE = Path('hackathon-materials/source_documents/календарь 2026 год каз рус.docx')
OUT = Path('data/calendar-2026.json')
NS = {'w': 'http://schemas.openxmlformats.org/wordprocessingml/2006/main'}
MONTHS = {
 'января':1,'февраля':2,'марта':3,'апреля':4,'мая':5,'июня':6,'июль':7,'августа':8,'сентября':9,'октября':10,'ноября':11,'декабря':12,
 'қаңтар':1,'ақпан':2,'наурыз':3,'сәуір':4,'мамыр':5,'маусым':6,'шілде':7,'тамыз':8,'қыркүйек':9,'қазан':10,'қараша':11,'желтоқсан':12,
 'январь':1,'февраль':2,'март':3,'апрель':4,'май':5,'июнь':6,'июль':7,'август':8,'сентябрь':9,'октябрь':10,'ноябрь':11,'декабрь':12,
}

def paragraphs(path):
    with ZipFile(path) as z:
        root = ET.fromstring(z.read('word/document.xml'))
    return [''.join(x.text or '' for x in p.findall('.//w:t', NS)).strip() for p in root.findall('.//w:p', NS)]

def parse_section(lines, language):
    events=[]; current=None
    for raw in lines:
        s=' '.join(raw.split())
        if not s: continue
        day_month = re.match(r'^(\d{1,2})\s*(?:-|\s)?([А-Яа-яӘәҒғҚқҢңӨөҰұҮүҺһІі]+)$', s)
        year_only = re.match(r'^(\d{4})\s*(?:г|ж)?\.?$', s)
        month_only = s.lower() in MONTHS
        if day_month or year_only or month_only:
            current={'sourceDate':s,'year':2026,'month':MONTHS.get(day_month.group(2).lower()) if day_month else None,
                     'day':int(day_month.group(1)) if day_month else None,'language':language,'text':'',
                     'sourceDocument':'календарь 2026 год каз рус.docx','needsReview':False,'reviewNotes':[]}
            if year_only: current.update(year=2026,month=None,day=None)
            elif month_only: current['month']=MONTHS[s.lower()]
            events.append(current); continue
        if current and not current['text']:
            current['text']=s
    return [x for x in events if x['text']]

all_lines=paragraphs(SOURCE)
ru_start=next(i for i,x in enumerate(all_lines) if x.startswith('2026 жылға'))
ru=parse_section(all_lines[2:ru_start], 'ru')
kk=parse_section(all_lines[ru_start+1:], 'kk')
# Each language remains independent; source-order pairing only detects likely discrepancies.
notes={0:'Различаются годы жизни: RU 1896–1971, KK 1896–1917.', 27:'Различаются юбилейные числа телефонной станции 1946 года: RU 70 лет, KK 80 лет.', 33:'Различаются юбилейные числа для школы, открытой в 1886 году: RU 130 лет, KK 140 лет.', 39:'Различаются юбилейные числа для исследования Рудного Алтая: RU 245 лет, KK 255 лет.'}
for idx,note in notes.items():
    for collection in (ru,kk):
        if idx < len(collection): collection[idx]['needsReview']=True; collection[idx]['reviewNotes'].append(note)
OUT.parent.mkdir(parents=True,exist_ok=True)
OUT.write_text(json.dumps(ru+kk,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
print(f'RU={len(ru)} KK={len(kk)} output={OUT}')
