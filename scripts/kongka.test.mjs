import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
const passages=JSON.parse(await readFile('data/vocabulary.json','utf8'));
const words=passages.flatMap(p=>p.words);
test('new library contains only all 60 reading sections in 2010–2024',()=>{
 assert.equal(passages.length,60);assert.equal(words.length,3367);
 for(let year=2010;year<=2024;year++)assert.deepEqual(passages.filter(p=>p.year===year).map(p=>p.text),[1,2,3,4]);
 assert.equal(new Set(words.map(w=>w.id)).size,words.length);
 for(const p of passages)for(const w of p.words){
  assert.equal(w.source,'kongka');assert.ok(w.id.startsWith(p.id+'-kk-'));
  assert.ok(['passage','options'].includes(w.section));assert.match(w.meaning,/[\u4e00-\u9fff]/);
 }
 assert.equal(words.filter(w=>w.section==='options').length,577);
});
test('mixed page boundaries exclude cloze and include reading options and recovered rows',()=>{
 assert.equal(passages[0].words[0].word,'far-reaching');
 assert.equal(passages[0].words[0].page,49);
 assert.ok(words.some(w=>w.page===55&&w.word==='fold'));
 assert.ok(words.some(w=>w.page===76&&w.word==='oppose'));
 assert.ok(words.some(w=>w.page===103&&w.word==='workload'));
 const missing=words.find(w=>w.page===183&&w.word==='dispute');
 assert.equal(missing.section,'options');assert.match(missing.meaning,/补充释义，原书未注/);
 for(const p of passages){assert.ok(p.words.some(w=>w.section==='passage'));assert.ok(p.words.some(w=>w.section==='options'));}
});
