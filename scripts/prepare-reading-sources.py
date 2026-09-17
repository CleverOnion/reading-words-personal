"""Select Reading Part A paragraphs from locally extracted Word paragraphs.

Raw files in work/readings are produced from the supplied Word files. Numbers
below are zero-based paragraph indices; explicit joins repair Word page breaks.
The original documents are never modified.
"""
import json
import re
from pathlib import Path

RANGES = {
    2010: [(104,108),(135,140),(167,171),(198,203)],
    2011: [(44,48),(75,80),(107,110),(137,141)],
    2012: [(106,111),(138,143),(170,174),(201,207)],
    2013: [(105,110),(137,143),(170,176),(203,209)],
    2014: [(107,110),(137,142),(169,173),(200,205)],
    2015: [(107,114),(141,147),(174,179),(206,211)],
    2016: [(104,110),(137,142),(169,174),(201,207)],
    2017: [(104,110),(137,142),(169,175),(202,209)],
    2018: [(104,110),(137,142),(169,172),(199,202)],
    2019: [(105,111),(138,143),(170,178),(205,211)],
    2020: [(44,47),(74,80),(107,116),(143,149)],
    2021: [(45,48),(75,82),(109,114),(141,146)],
    2022: [(95,101),(128,134),(161,166),(193,200)],
}
LEGACY_JOINS = [
    [[126],[128,130,131,132],[133],[134],[135],[136],[138],[139]],
    [[171],[172],[173,175],[176],[177,179],[180],[181,182]],
    [[226,229],[230,231],[232],[234,235],[236,238,240,241],[242,244],[245]],
    [[276,278],[279],[280],[281],[282]],
]
# Obvious encoding/transcription defects in the provided 2023 Word document.
REPAIRS = {
    'changes 1to': 'changes to', 'leam in': 'learn in', 'bo.ards': 'boards',
    'cour es': 'courses', 'coures': 'courses', 'mo:re': 'more', ':below': 'below',
    'recently · voted': 'recently voted', "c:an't": "can't", 'dev,eloper': 'developer',
    'be·prepared': 'be prepared', 'R.andom': 'Random', ']late': 'late', 'Ⅵ1ith': 'with',
    'time.when': 'time when', 'wars,,': 'wars,', 'in . terms': 'in terms',
    'carc;ers': 'careers', 'problem ils': 'problem is', 'servke': 'service',
    'ages-·such': 'ages—such', 'schools-it': 'schools—it', 'facilities-de': 'facilities—de',
    'hotels--to': 'hotels—to', 'Schuster-the': 'Schuster—the', 'all-it': 'all—it',
    'individual-acting': 'individual—acting', 'consultant-was': 'consultant—was',
    'intellectual contact': 'intellectual content', 'non- profit': 'non-profit',
}

def clean(s, year):
    s = re.sub(r'[\x00-\x08\x0b-\x1f]', '', s)
    s = re.sub(r'\s+', ' ', s).strip()
    if year == 2023:
        for old, new in REPAIRS.items():
            s = s.replace(old, new)
        s = re.sub(r'\s+([,.;:!?])', r'\1', s)
        s = re.sub(r'\(\s+', '(', s)
        s = re.sub(r'\s+\)', ')', s)
        s = s.replace('30, 000', '30,000').replace('". says', '" says')
        s = s.rstrip(' ·')
    return s

def main():
    output = Path('data/reading-sources')
    output.mkdir(parents=True, exist_ok=True)
    for year in range(2010, 2024):
        raw = json.loads(Path(f'work/readings/{year}.json').read_text('utf-8'))
        groups = LEGACY_JOINS if year == 2023 else [[[i] for i in range(lo,hi+1)] for lo,hi in RANGES[year]]
        if year == 2010:
            groups[1][1:3] = [[136,137]]
        if year == 2015:
            groups[0][-2:] = [[113,114]]
        result = []
        for n, group in enumerate(groups, 1):
            paragraphs = [clean(' '.join(raw[i] for i in ids), year) for ids in group]
            result.append({'id':f'{year}-{n}', 'year':year, 'text':n, 'paragraphs':paragraphs})
        (output/f'{year}.json').write_text(json.dumps(result, ensure_ascii=False, indent=2)+'\n', 'utf-8')
        print(year, [len(p['paragraphs']) for p in result])

if __name__ == '__main__':
    main()
