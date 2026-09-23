"""Reconstruct scanned vocabulary table rows; retain OCR provenance for review."""
import json,re
from pathlib import Path
import cv2,numpy as np
OUT=Path('work/kongka')
def parse(n):
 data=json.loads((OUT/f'page-{n}.json').read_text(encoding='utf8'));w=data['width'];h=data['height']
 im=cv2.imread(str(OUT/f'page-{n}.png'),0)
 binary=cv2.adaptiveThreshold(im,255,cv2.ADAPTIVE_THRESH_GAUSSIAN_C,cv2.THRESH_BINARY_INV,31,15)
 horizontal=cv2.morphologyEx(binary,cv2.MORPH_OPEN,cv2.getStructuringElement(cv2.MORPH_RECT,(50,1)))
 counts=np.sum(horizontal>0,axis=1);indices=np.where(counts>w*.25)[0];groups=[]
 for y in indices:
  if not groups or y>groups[-1][-1]+5:groups.append([int(y)])
  else:groups[-1].append(int(y))
 lines=[float(np.mean(g)) for g in groups]
 items=[{'x':min(p[0] for p in b),'y':sum(p[1] for p in b)/4,'text':t,'score':s} for b,t,s in data['items']]
 # A left-aligned English-word column and a second, left-aligned definition column.
 hist={}
 for t in items:
  if .10*w<t['x']<.5*w:
   k=round(t['x']/20)*20;hist[k]=hist.get(k,0)+1
 anchors=sorted(sorted(hist,key=hist.get,reverse=True)[:2])
 # Adjacent bins may represent the same column: select separated peaks.
 a=max(hist,key=hist.get);other={k:v for k,v in hist.items() if abs(k-a)>.10*w}
 anchors=sorted([a,max(other,key=other.get)]);wordx,meaningx=anchors
 rows=[]
 for lo,hi in zip(lines,lines[1:]):
  ts=sorted([t for t in items if lo<t['y']<hi],key=lambda t:(round(t['y']/10),t['x']))
  full=' '.join(t['text'] for t in ts)
  ws=[t for t in ts if wordx-25<=t['x']<meaningx-25]
  ms=[t for t in ts if t['x']>=meaningx-25]
  word=' '.join(t['text'] for t in ws);meaning=' '.join(t['text'] for t in ms)
  rows.append({'page':n,'y':[round(lo),round(hi)],'full':full,'word':word,'meaning':meaning,'wordScore':min([t['score'] for t in ws] or [0]),'meaningScore':min([t['score'] for t in ms] or [0])})
 return {'page':n,'anchors':anchors,'rows':rows}
for f in sorted(OUT.glob('page-*.json')):
 n=int(f.stem.split('-')[1]);p=parse(n)
 (OUT/f'rows-{n}.json').write_text(json.dumps(p,ensure_ascii=False,indent=2),encoding='utf8')
print('Parsed',len(list(OUT.glob('rows-*.json'))),'pages')
