"""Import Part A of the user-supplied 2024–2026 DOCX exams, read-only.

Usage: python scripts/import-recent-reading-word.py <folder containing DOCX files>
Paragraph boundaries were checked against the first question after each Text.
The duplicate 2024 file is intentionally not imported twice.
"""
import json,re,sys,zipfile
from pathlib import Path
from lxml import etree

ranges={
    2024:[(113,119),(146,152),(179,186),(213,217)],
    2025:[(112,118),(145,151),(178,183),(210,214)],
    2026:[(114,119),(146,152),(179,184),(211,216)],
}
folder=Path(sys.argv[1])
ns={'w':'http://schemas.openxmlformats.org/wordprocessingml/2006/main'}
for year,sections in ranges.items():
    file=folder/f'考研英语一{year}年真题（整卷）.docx'
    with zipfile.ZipFile(file) as z:root=etree.fromstring(z.read('word/document.xml'))
    raw=[''.join(p.xpath('.//w:t/text()',namespaces=ns)).strip() for p in root.xpath('//w:body//w:p',namespaces=ns)]
    raw=[s for s in raw if s]
    assert str(year) in raw[0], 'Unexpected year in document'
    result=[]
    for n,(lo,hi) in enumerate(sections,1):
        assert raw[lo-1]==f'Text {n}'
        assert raw[hi+1].startswith(str(16+n*5)+'.'), 'Question boundary changed'
        result.append({'id':f'{year}-{n}','year':year,'text':n,'paragraphs':[re.sub(r'\s+',' ',s).strip() for s in raw[lo:hi+1]]})
    Path(f'data/reading-sources/{year}.json').write_text(json.dumps(result,ensure_ascii=False,indent=2)+'\n','utf-8')
    print(year, '4 passages,',sum(len(p['paragraphs']) for p in result),'paragraphs')
