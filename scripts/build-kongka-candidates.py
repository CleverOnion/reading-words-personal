"""Make auditable candidates, never publish raw OCR directly."""
import json,re
from pathlib import Path
ROOT=Path('work/kongka');passages={};current=None;options=False;warnings=[]
def definition(s):
 s=s.strip().replace('（','(').replace('）',')')
 s=re.sub(r'^[\[【].*?[\]】]\s*','',s)
 c=re.search(r'[\u4e00-\u9fff]',s)
 if not c:return s
 prefix=s[:c.start()]
 matches=list(re.finditer(r'(?:prep\.?/?conj|adj|adv|prep|conj|pron|num|aux|vt|vi|n|v)\.?',prefix))
 if matches:
  start=matches[-1].start()
  for prev in reversed(matches[:-1]):
   if re.fullmatch(r'[./&\s]*',prefix[prev.end():start]):start=prev.start()
   else:break
  s=s[start:]
 elif c.start():s=s[max(0,c.start()-(1 if prefix.endswith('(') else 0)):]
 return re.sub(r'\.{3,}|[·…]{2,}','……',s)
for f in sorted(ROOT.glob('rows-*.json'),key=lambda p:int(p.stem.split('-')[1])):
 data=json.loads(f.read_text(encoding='utf8'))
 for r in data['rows']:
  full=r['full'];heading=re.search(r'(20\d{2}).*?[Tt]e[xs][tlI]?\s*([1-4lI])',full)
  if heading:
   year=int(heading[1]);text=int(heading[2].replace('l','1').replace('I','1'))
   current=f'{year}-{text}';options=False
   passages.setdefault(current,{'id':current,'year':year,'text':text,'words':[]});continue
  if re.search(r'(新题型|翻译|完[形型]填空)',full) and ('20' in full or len(full)<20):
   current=None;continue
  if '选项生词' in full:options=True;continue
  if not current or ('词汇' in full and '词义' in full):continue
  word=r['word'].strip();meaning=definition(r['meaning'])
  if not word and r['page']==55 and abs(r['y'][0]-1503)<4:word='fold'
  if not word and r['page']==76 and abs(r['y'][0]-987)<4:word='oppose'
  if not word and r['page']==103 and abs(r['y'][0]-1054)<4:word='workload'
  if r['page']==183 and word=='dispute' and not meaning:meaning='n.争论；争端；v.质疑；争论（补充释义，原书未注）'
  if not word or not meaning or re.search(r'[\u4e00-\u9fff]',word):
   warnings.append(r);continue
  word=re.sub(r'([a-z]{3,}) ([a-z])$',r'\1\2',word)
  words=passages[current]['words'];words.append({'id':current+'-kk-'+str(len(words)+1).zfill(3),'word':word,'meaning':meaning,'page':r['page'],'source':'kongka','section':'options' if options else 'passage','row':r['y'],'rawMeaning':r['meaning'],'wordScore':r['wordScore'],'meaningScore':r['meaningScore']})
for year in range(2010,2025):
 ps=[p for p in passages.values() if p['year']==year]
 if ps:(ROOT/f'candidate-{year}.json').write_text(json.dumps(ps,ensure_ascii=False,indent=2),encoding='utf8')
(ROOT/'parse-warnings.json').write_text(json.dumps(warnings,ensure_ascii=False,indent=2),encoding='utf8')
print('Candidates',[(p['id'],len(p['words'])) for p in passages.values()]);print('Warnings',len(warnings))
