"""Import reviewed reading-only candidates. Never include other exam sections."""
import json,re,hashlib
from pathlib import Path
root=Path('work/kongka');passages=[];corrections=[]
for y in range(2010,2025):
 ps=json.loads((root/f'candidate-{y}.json').read_text(encoding='utf8'))
 assert [p['text'] for p in ps]==[1,2,3,4],y
 passages.extend(ps)
for f in sorted(root.glob('corrections-*.json')):
 corrections.extend(json.loads(f.read_text(encoding='utf8')))
words=[w for p in passages for w in p['words']]
for c in corrections:
 matches=[w for w in words if w['page']==c['page'] and w['word']==c['word'] and (not c.get('section') or w['section']==c['section']) and (not c.get('row') or abs(w['row'][0]-c['row'][0])<5)]
 assert len(matches)==1,('ambiguous correction',c,matches)
 w=matches[0]
 if c.get('newWord'):w['word']=c['newWord']
 if c.get('meaning'):w['meaning']=c['meaning']
for p in passages:
 assert 20<=len(p['words'])<=120,(p['id'],len(p['words']))
 for w in p['words']:
  w['meaning']=re.sub(r'(?<=[\u4e00-\u9fff])\s+(?=[\u4e00-\u9fff])','',w['meaning'])
  w['meaning']=re.sub(r'(?<![A-Za-z])(adj|adv|prep|conj|pron|vt|vi|n|v)\.*(?=[\u4e00-\u9fff(])',r'\1.',w['meaning'])
  w['meaning']=re.sub(r'[.·…]{2,}','……',w['meaning'])
  assert re.search('[A-Za-z]',w['word']) and not re.search('[\u4e00-\u9fff]',w['word']),w
  assert re.search('[\u4e00-\u9fff]',w['meaning']),w
  assert w['section'] in ['passage','options']
  for k in ['rawMeaning','row','wordScore','meaningScore']:w.pop(k,None)
Path('data/vocabulary.json').write_text(json.dumps(passages,ensure_ascii=False,indent=2)+'\n',encoding='utf8')
Path('docs/kongka-corrections.json').write_text(json.dumps(corrections,ensure_ascii=False,indent=2)+'\n',encoding='utf8')
report={'source':'空卡真题核心词（英语一）免费分享.pdf','scope':'2010–2024 Reading Part A Text 1–4, including passage and option vocabulary','passages':len(passages),'words':len(words),'optionWords':sum(w['section']=='options' for w in words),'corrections':len(corrections),'perPassage':[{'id':p['id'],'words':len(p['words']),'pages':sorted(set(w['page'] for w in p['words']))} for p in passages]}
Path('docs/kongka-import-report.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n',encoding='utf8')
print(f"Imported {len(passages)} readings, {len(words)} words, {report['optionWords']} option words, {len(corrections)} reviewed corrections")
