import {readFile,writeFile,mkdir,readdir,unlink} from 'node:fs/promises';
import assert from 'node:assert/strict';
import {findWordMatches} from '../lib/reading-matches.ts';
const vocabulary=JSON.parse(await readFile('data/vocabulary.json','utf8'));
await mkdir('public/readings',{recursive:true});
const report=[];let totalParagraphs=0;
for(let year=2010;year<=2024;year++){
 const source=JSON.parse(await readFile(`data/reading-sources/${year}.json`,'utf8'));
 const translations=JSON.parse(await readFile(`data/reading-translations/${year}.json`,'utf8'));
 assert.equal(source.length,4);
 assert.deepEqual(Object.keys(translations).sort(),source.map(p=>p.id).sort());
 for(const p of source){
  assert.equal(p.paragraphs.length,translations[p.id].length,`${p.id}: translation count`);
  assert.ok(p.paragraphs.length>=3);
  const data={id:p.id,year:p.year,text:p.text,translationSource:'AI 参考译文',sourceNote:'已整理原文件断行与明显字符错误；译文按所供真题内容编写。'+(p.id==='2015-4'?' 本篇第 2 段的 “dangerous goals” 疑有转录误差，暂按原文件保留。':''),paragraphs:p.paragraphs.map((en,i)=>{
   const zh=translations[p.id][i];
   assert.ok(en.length>60&&/[a-z]/i.test(en),p.id+': invalid English');
   assert.ok(typeof zh==='string'&&zh.length>20&&/[\u4e00-\u9fff]/.test(zh),p.id+': invalid Chinese');
   assert.ok(!/[\x00-\x08\x0b-\x1f\ufffd]/.test(en),p.id+': corrupt source');
   return {en,zh};
  })};
  const words=vocabulary.find(v=>v.id===p.id).words;
  const unmatched=words.filter(w=>!p.paragraphs.some(s=>findWordMatches(s,w.word).length)).map(w=>w.word);
  report.push({id:p.id,paragraphs:data.paragraphs.length,words:words.length,matched:words.length-unmatched.length,unmatched});
  totalParagraphs+=data.paragraphs.length;
  await writeFile(`public/readings/${p.id}.json`,JSON.stringify(data)+'\n');
 }
}
for(const name of await readdir('public/readings'))if(/^202[56]-[1-4]\.json$/.test(name))await unlink('public/readings/'+name);
assert.equal((await readdir('public/readings')).filter(s=>s.endsWith('.json')).length,60);
await mkdir('docs',{recursive:true});
await writeFile('docs/reading-match-report.json',JSON.stringify(report,null,2)+'\n');
console.log(`Validated ${report.length} readings / ${totalParagraphs} bilingual paragraphs. Matching ${report.reduce((n,p)=>n+p.matched,0)}/${report.reduce((n,p)=>n+p.words,0)} vocabulary entries.`);
