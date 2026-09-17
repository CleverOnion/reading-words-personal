"""Extract paragraphs from the user's Word files, including misnamed binary DOC.

Usage: python scripts/extract-reading-word.py "F:/.../Word folder"
Dependencies: lxml, olefile. Source documents are opened read-only.
"""
import json, struct, sys, zipfile
from pathlib import Path
import olefile
from lxml import etree

def extract(path):
    if olefile.isOleFile(path):
        with olefile.OleFileIO(path) as ole:
            word=ole.openstream('WordDocument').read()
            flags=struct.unpack_from('<H',word,10)[0]
            table=ole.openstream('1Table' if flags&0x200 else '0Table').read()
        fc,lcb=struct.unpack_from('<II',word,0x1a2)
        ccp=struct.unpack_from('<I',word,0x4c)[0]
        clx=table[fc:fc+lcb];i=0
        while clx[i]==1:i+=3+struct.unpack_from('<H',clx,i+1)[0]
        assert clx[i]==2
        length=struct.unpack_from('<I',clx,i+1)[0]
        plc=clx[i+5:i+5+length];n=(length-4)//12
        cps=struct.unpack_from('<'+'I'*(n+1),plc,0);text=''
        for j in range(n):
            start=cps[j];end=min(cps[j+1],ccp)
            if start>=ccp:break
            pos=struct.unpack_from('<I',plc,4*(n+1)+8*j+2)[0]
            compressed=bool(pos&0x40000000);pos&=0x3fffffff
            if compressed:pos//=2
            text+=word[pos:pos+(end-start)*(1 if compressed else 2)].decode('cp1252' if compressed else 'utf-16le')
        return [s.strip() for s in text.replace('\x07','\r').split('\r') if s.strip()]
    with zipfile.ZipFile(path) as z:root=etree.fromstring(z.read('word/document.xml'))
    ns={'w':'http://schemas.openxmlformats.org/wordprocessingml/2006/main'}
    return [s for p in root.xpath('//w:body//w:p',namespaces=ns) if (s:=''.join(p.xpath('.//w:t/text()',namespaces=ns)).strip())]

if __name__=='__main__':
    folder=Path(sys.argv[1]);out=Path('work/readings');out.mkdir(parents=True,exist_ok=True)
    for year in range(2010,2024):
        source=folder/f'{year}年考研英语一真题.docx'
        if not source.exists():source=source.with_suffix('.doc')
        paragraphs=extract(source)
        (out/f'{year}.json').write_text(json.dumps(paragraphs,ensure_ascii=False,indent=2),'utf-8')
        print(year,len(paragraphs))
