import fitz, re, json
from pathlib import Path

source = Path('F:/考研/CO/考研英语阅读真题词汇 - 英语一【公众号：学长小谭考研】.pdf')
doc = fitz.open(source)
groups = []
year = None
group = None
word_parts = []
meaning_parts = []
word_page = None
ignored = []

def flush():
    global word_parts, meaning_parts
    if word_parts:
        word = ' '.join(word_parts).strip()
        meaning = ''.join(meaning_parts).replace('（学长小谭）', '').strip()
        if not group or not meaning:
            raise ValueError(f'Incomplete word: {word}, page {word_page}')
        group['words'].append({'id': f"{group['id']}-{len(group['words'])+1}", 'word':word, 'meaning':meaning, 'page':word_page})
    word_parts, meaning_parts = [], []

for i, page in enumerate(doc):
    for raw in page.get_text().splitlines():
        line = raw.strip()
        if not line: continue
        if '公众号' in line or '整理自' in line or '考研英语阅读真题词汇' in line: continue
        y = re.search(r'(20\d{2})\s*年阅读理解单词', line)
        if y:
            flush(); year = int(y[1]); continue
        t = re.fullmatch(r'Text\s*(\d)', line, re.I)
        if t:
            flush()
            group = {'id':f'{year}-{t[1]}','year':year,'text':int(t[1]),'words':[]}
            groups.append(group); continue
        if not group: ignored.append([i+1,line]); continue
        # All headwords are Latin text; Chinese text starts or continues the definition.
        if re.search(r'[\u3400-\u9fff]',line):
            if not word_parts: ignored.append([i+1,line])
            else: meaning_parts.append(line)
        elif re.fullmatch(r'\d+',line):
            ignored.append([i+1,line])
        elif re.match(r'^(?:n|v|a|ad|adj|adv|prep|conj|pron|vt|vi)\.',line):
            meaning_parts.append(line)
        else:
            if meaning_parts: flush()
            if not word_parts: word_page=i+1
            word_parts.append(line)
flush()
assert len(groups)==68, len(groups)
assert all(g['words'] for g in groups)
out=Path('data'); out.mkdir(exist_ok=True)
(out/'vocabulary.json').write_text(json.dumps(groups,ensure_ascii=False,indent=2),encoding='utf-8')
Path('docs').mkdir(exist_ok=True)
report={'source':str(source),'pages':len(doc),'passages':len(groups),'entries':sum(len(g['words']) for g in groups),'ignored':ignored,'counts':{g['id']:len(g['words']) for g in groups}}
Path('docs/extraction-report.json').write_text(json.dumps(report,ensure_ascii=False,indent=2),encoding='utf-8')
print(json.dumps(report,ensure_ascii=False))
