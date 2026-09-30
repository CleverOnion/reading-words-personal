"""Local OCR cache for the user-supplied scanned vocabulary PDF."""
import os,sys,json,time
from pathlib import Path
import fitz,cv2,numpy as np
from rapidocr_onnxruntime import RapidOCR

OUT=Path('work/kongka');OUT.mkdir(exist_ok=True,parents=True)
source=Path(sys.argv[3]) if len(sys.argv)>3 else Path('source-kongka.pdf')
doc=fitz.open(source)
ocr=RapidOCR(intra_op_num_threads=4,inter_op_num_threads=1)
pages=list(range(int(sys.argv[1]),int(sys.argv[2])+1))
for n in pages:
 dest=OUT/f'page-{n}.json'
 if dest.exists():continue
 start=time.time();pix=doc[n-1].get_pixmap(matrix=fitz.Matrix(2.4,2.4))
 img=np.frombuffer(pix.samples,dtype=np.uint8).reshape(pix.height,pix.width,3)
 cv2.imwrite(str(OUT/f'page-{n}.png'),cv2.cvtColor(img,cv2.COLOR_RGB2BGR))
 results,_=ocr(img)
 dest.write_text(json.dumps({'page':n,'width':pix.width,'height':pix.height,'items':results},ensure_ascii=False),encoding='utf8')
 print(n,len(results or []),round(time.time()-start,1),flush=True)
