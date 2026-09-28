import test from 'node:test';
import assert from 'node:assert/strict';
import vocabulary from '../data/vocabulary.json' with {type:'json'};
import sources2025 from '../data/reading-sources/2025.json' with {type:'json'};
import sources2026 from '../data/reading-sources/2026.json' with {type:'json'};
import {hasReading} from '../lib/readings.ts';

const recent=vocabulary.filter(p=>p.year>=2025);
const banned=new Set(['fritillary','sea-pink','chalk cliff','take-off shot','wide-angle lens','skittish','tamper','signature shot','wing-beats','glimpse','alternative','set up','contradiction','negotiation','business community','skip','stretch','pinch','foolproof','bountiful with','summer','refreshment','neuroscientist','at pains','indulgence']);

test('2025 and 2026 contain four reading passages each',()=>{
 assert.deepEqual(recent.map(p=>p.id),['2025-1','2025-2','2025-3','2025-4','2026-1','2026-2','2026-3','2026-4']);
 assert.equal(sources2025.length,4);
 assert.equal(sources2026.length,4);
 for(const year of [2025,2026])for(let text=1;text<=4;text++)assert.equal(hasReading(`${year}-${text}`),true,`${year}-${text} should expose its original text`);
});

test('recent vocabulary keeps passage and option sections separate',()=>{
 for(const passage of recent){
  assert.ok(passage.words.length>=10,`${passage.id} should have imported words`);
  assert.ok(passage.words.every(word=>word.source==='kongka'));
  assert.ok(passage.words.every(word=>word.section==='passage'||word.section==='options'));
  assert.equal(new Set(passage.words.map(word=>word.word)).size,passage.words.length);
  for(const word of passage.words)assert.equal(banned.has(word.word),false,`${passage.id} imported a non-reading word: ${word.word}`);
 }
});

test('all recent meanings are usable Chinese strings',()=>{
 for(const passage of recent)for(const word of passage.words){
  assert.match(word.meaning,/\p{Script=Han}/u,`${word.id} has no Chinese meaning`);
  assert.ok(word.meaning.length>=1,`${word.id} has an empty meaning`);
 }
});
