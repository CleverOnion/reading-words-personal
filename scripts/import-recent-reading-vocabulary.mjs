import {readFile,writeFile,mkdir} from 'node:fs/promises';
import assert from 'node:assert/strict';

const vocabulary=JSON.parse(await readFile('data/vocabulary.json','utf8'));
const rows=JSON.parse(await readFile('work/recent-vocabulary-final.json','utf8'));
const pageById={
 '2025-1':190,'2025-2':191,'2025-3':193,'2025-4':195,
 '2026-1':199,'2026-2':200,'2026-3':201,'2026-4':203,
};
const ids=Object.keys(pageById);
const grouped=new Map(ids.map(id=>[id,[]]));
for(const row of rows){
 const list=grouped.get(row.id); assert.ok(list,`Unexpected reading id ${row.id}`);
 const word=String(row.word??'').trim();
 const meaning=String(row.meaning??'').trim();
 assert.ok(word&&meaning&&/[\u3400-\u9fff]/.test(meaning),`${row.id}: incomplete ${word}`);
 if(!list.some(item=>item.word===word))list.push({word,meaning,section:row.section==='options'?'options':'passage'});
}
const imported=[];
for(const id of ids){
 const [year,text]=id.split('-').map(Number);
 const list=grouped.get(id);
 assert.ok(list.length>=10,`${id}: too few imported words`);
 assert.ok(new Set(list.map(x=>x.meaning)).size>=4,`${id}: not enough unique meanings`);
 const words=list.map((item,index)=>({
  id:`${id}-kk-${String(index+1).padStart(3,'0')}`,
  word:item.word,
  meaning:item.meaning,
  page:pageById[id],
  source:'kongka',
  section:item.section,
 }));
 imported.push({id,year,text,words});
}
const next=[...vocabulary.filter(p=>!ids.includes(p.id)),...imported].sort((a,b)=>a.year-b.year||a.text-b.text);
assert.equal(next.length,68,'Expected 2010—2026 four passages per year');
await writeFile('data/vocabulary.json',JSON.stringify(next,null,2)+'\n');
await mkdir('docs',{recursive:true});
await writeFile('docs/recent-reading-vocabulary-import-report.json',JSON.stringify({
 importedAt:new Date().toISOString(),
 scope:'2025—2026 阅读理解：段落词 + 选项词；排除新题型、完形等其它题型',
 passages:imported.map(p=>({id:p.id,words:p.words.length,passageWords:p.words.filter(w=>w.section==='passage').length,optionWords:p.words.filter(w=>w.section==='options').length,page:pageById[p.id]})),
 totalWords:imported.reduce((n,p)=>n+p.words.length,0),
},null,2)+'\n');
console.log(`Imported ${imported.length} readings / ${imported.reduce((n,p)=>n+p.words.length,0)} words.`);
