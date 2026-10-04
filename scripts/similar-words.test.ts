import assert from 'node:assert/strict';
import {test} from 'node:test';
import {createSimilarWordLookup,syllabusEntries,spellingDifference} from '../lib/similar-words.ts';
import {readFileSync} from 'node:fs';
import {confusableGroups} from '../data/confusable-words.ts';

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

test('syllabus scope includes non-reading vocabulary and prefers reading meanings',()=>{
 const syllabus=JSON.parse(readFileSync(new URL('../data/syllabus-vocabulary.json',import.meta.url),'utf8'));
 assert.equal(syllabus.length,5530);
 assert.ok(syllabus.every((e:{word:string;meaning:string})=>e.word&&e.meaning));
 const merged=syllabusEntries(syllabus,[{id:'reading-effect',word:'effect',meaning:'PDF优先释义'},{id:'outside',word:'zzzzzz',meaning:'不在大纲'}]);
 assert.ok(!merged.some(e=>e.word==='zzzzzz'));
 const lookup=createSimilarWordLookup(merged,confusableGroups,Infinity);
 assert.equal(lookup('affect')[0].word,'effect');
 assert.equal(lookup('affect')[0].meaning,'PDF优先释义');
 assert.equal(lookup('affect')[0].kind,'confusable');
 assert.ok(lookup('adapt').some(e=>e.word==='adopt'));
 assert.ok(lookup('imply').some(e=>e.word==='infer'&&e.note?.includes('推断')));
 assert.ok(lookup('patent').some(e=>e.word==='patient'));
 assert.ok(lookup('economic').some(e=>e.word==='economical'));
 assert.ok(lookup('nail').length>3);
 const allowed=new Set(syllabus.map((e:{word:string})=>e.word));
 for(const term of ['affect','adapt','nail','imply','economic','patent']){
  const result=lookup(term);
  assert.equal(new Set(result.map(e=>e.word)).size,result.length);
  assert.ok(result.every(e=>allowed.has(e.word)&&e.word!==term));
 }
});

test('curated relationships never introduce candidates outside the allowed dictionary',()=>{
 const lookup=createSimilarWordLookup(entries,[{words:['affect','effect','unlisted'],note:'辨析'}],Infinity);
 assert.ok(!lookup('affect').some(e=>e.word==='unlisted'));
 assert.equal(lookup('effect')[0].word,'affect');
});

test('unambiguous inflections inherit confusable pairs without showing their own lemma',()=>{
 const lookup=createSimilarWordLookup(entries,[{words:['adapt','adopt'],note:'适应与采用'}],Infinity);
 assert.ok(lookup('adopted').some(e=>e.word==='adapt'&&e.kind==='confusable'));
 assert.ok(!lookup('adopted').some(e=>e.word==='adopt'));
 assert.ok(lookup('adopts').some(e=>e.word==='adapt'));
 assert.deepEqual(lookup('adopted'),lookup('adopted'));
});

test('expanded confusable groups cover meaning and spelling distinctions',()=>{
 const syllabus=JSON.parse(readFileSync(new URL('../data/syllabus-vocabulary.json',import.meta.url),'utf8'));
 const lookup=createSimilarWordLookup(syllabus,confusableGroups,Infinity);
 for(const [word,other] of [['device','devise'],['contract','contact'],['trail','trial'],['strategy','tactic'],['substitute','replace'],['sight','cite'],['consensus','census'],['stimulate','simulate'],['abundant','redundant'],['unanimous','anonymous'],['immigration','emigrate']]){
  assert.ok(lookup(word).some(e=>e.word===other&&e.kind==='confusable'&&e.note),`${word}/${other}`);
 }
});

test('banded search preserves transpositions and rejects distant candidates',()=>{
 const lookup=createSimilarWordLookup(['trail','trial','trails','trivial','weather','whether','international'].map(word=>({id:word,word,meaning:word})),[],Infinity);
 assert.ok(lookup('trail').some(e=>e.word==='trial'));
 assert.ok(!lookup('trail').some(e=>e.word==='trails'||e.word==='international'));
 assert.ok(lookup('weather').some(e=>e.word==='whether'));
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
