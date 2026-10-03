import assert from 'node:assert/strict';
import {test} from 'node:test';
import {createSimilarWordLookup,spellingDifference} from '../lib/similar-words.ts';

const entries=['patent','patient','patents','pattern','affect','effect','effects','adapt','adopt','adapting','cat','act','catalog','company','companies'].map((word,i)=>({id:String(i),word,meaning:`释义 ${word}`}));
test('finds close spellings, excludes the word itself and inflections',()=>{
 const lookup=createSimilarWordLookup(entries);
 assert.equal(lookup('PATENT')[0].word,'patient');
 assert.ok(!lookup('patent').some(w=>w.word==='patents'));
 assert.ok(lookup('affect').some(w=>w.word==='effect'));
 assert.ok(lookup('adapt').some(w=>w.word==='adopt'));
 assert.ok(!lookup('company').some(w=>w.word==='companies'));
 assert.deepEqual(lookup('take into account'),[]);
 assert.deepEqual(lookup('zzzzzz'),[]);
});
test('deduplicates headwords, retains source meanings and limits results',()=>{
 const lookup=createSimilarWordLookup([...entries,{id:'duplicate',word:'patient',meaning:'another sense'},...['mail','sail','tail','fail','nail'].map(word=>({id:word,word,meaning:'原始释义'}))]);
 assert.equal(lookup('patent').filter(w=>w.word==='patient').length,1);
 assert.equal(lookup('patent')[0].meaning,'释义 patient');
 assert.equal(lookup('nail').length,3);
 assert.ok(lookup('nail').every(w=>w.meaning==='原始释义'));
});
test('highlights substitutions, additions, deletions and transpositions on both words',()=>{
 for(const [a,b] of [['affect','effect'],['patent','patient'],['patient','patent'],['cat','act']]){
  const diff=spellingDifference(a,b);
  assert.equal(diff.original.map(p=>p.text).join(''),a);
  assert.equal(diff.candidate.map(p=>p.text).join(''),b);
 }
 const added=spellingDifference('patent','patient');
 assert.equal(added.candidate.filter(p=>p.changed).map(p=>p.text).join(''),'i');
 const removed=spellingDifference('patient','patent');
 assert.equal(removed.original.filter(p=>p.changed).map(p=>p.text).join(''),'i');
 const swapped=spellingDifference('cat','act');
 assert.equal(swapped.original.filter(p=>p.changed).map(p=>p.text).join(''),'ca');
 assert.equal(swapped.candidate.filter(p=>p.changed).map(p=>p.text).join(''),'ac');
});
