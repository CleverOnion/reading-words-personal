import {readFile,writeFile,mkdir} from 'node:fs/promises';
import assert from 'node:assert/strict';
// Reviewed versioned source; never import intermediate OCR from work/.
const vocabulary=JSON.parse(await readFile('data/vocabulary.json','utf8'));
const imported=JSON.parse(await readFile('data/recent-reading-vocabulary.json','utf8'));
const ids=['2025-1','2025-2','2025-3','2025-4','2026-1','2026-2','2026-3','2026-4'];
assert.deepEqual(imported.map(p=>p.id),ids);
const wordIds=new Set();
for(const p of imported){
 assert.ok(p.words.length>=10);
 assert.equal(p.id,`${p.year}-${p.text}`);
 assert.equal(new Set(p.words.map(w=>w.word)).size,p.words.length);
 for(const w of p.words){
  assert.ok(w.id.startsWith(p.id+'-kk-')&&!wordIds.has(w.id));wordIds.add(w.id);
  assert.match(w.meaning,/\p{Script=Han}/u);
  assert.doesNotMatch(w.meaning,/[\uFFFD\u0000-\u001f]|[（(]\s*[）)]|^[’'“”]/u);
  assert.ok(w.section==='passage'||w.section==='options');
  assert.equal(w.source,'kongka');assert.ok(Number.isInteger(w.page));
 }
}
for(const p of vocabulary.filter(p=>ids.includes(p.id)))for(const w of p.words){
 const replacement=imported.flatMap(p=>p.words).find(candidate=>candidate.id===w.id);
 assert.ok(replacement&&replacement.word===w.word,`Import would lose or reassign ${w.id}`);
}
const next=[...vocabulary.filter(p=>!ids.includes(p.id)),...imported].sort((a,b)=>a.year-b.year||a.text-b.text);
assert.equal(next.length,68);
await writeFile('data/vocabulary.json',JSON.stringify(next,null,2)+'\n');
await mkdir('docs',{recursive:true});
await writeFile('docs/recent-reading-vocabulary-import-report.json',JSON.stringify({
 source:'data/recent-reading-vocabulary.json',reviewedAt:'2026-10-05',
 scope:'2025—2026 阅读理解：段落词 + 选项词；排除新题型、完形等其它题型',
 passages:imported.map(p=>({id:p.id,words:p.words.length,passageWords:p.words.filter(w=>w.section==='passage').length,optionWords:p.words.filter(w=>w.section==='options').length,pages:[...new Set(p.words.map(w=>w.page))].sort((a,b)=>a-b)})),
 totalWords:imported.reduce((n,p)=>n+p.words.length,0),
},null,2)+'\n');
console.log(`Imported ${imported.length} readings / ${imported.reduce((n,p)=>n+p.words.length,0)} reviewed words; IDs preserved.`);
