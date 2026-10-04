import type {PastAnswer} from '../lib/practice-review.ts';
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {scheduleRecall,reviseRecallQueue,answerRating} from '../lib/recall-policy.ts';
import {previewRecall} from '../lib/recall-transition.ts';
const queue=['a','b','c','d','e','f','g','h'];
test('forgotten returns after three intervening words, fuzzy after six',()=>{
 assert.deepEqual(scheduleRecall(queue,0,'forgotten'),['a','b','c','d','a','e','f','g','h']);
 assert.deepEqual(scheduleRecall(queue,0,'fuzzy'),['a','b','c','d','e','f','g','a','h']);
 assert.deepEqual(scheduleRecall(queue,0,'remembered'),queue);
 assert.equal(queue.length,8);
});
test('last-word returns and persistent failures terminate after at most three exposures',()=>{
 let q=['a'];let index=0;
 while(index<q.length){q=scheduleRecall(q,index,'forgotten');index++;assert.ok(index<=3);}
 assert.deepEqual(q,['a','a','a']);
 assert.deepEqual(scheduleRecall(['a','b','a'],0,'fuzzy'),['a','b','a']);
});
test('correction removes or schedules outstanding returns without touching answered positions',()=>{
 const q=scheduleRecall(queue,0,'forgotten');
 assert.deepEqual(reviseRecallQueue(q,2,0,'remembered'),queue);
 const fuzzy=reviseRecallQueue(queue,2,0,'fuzzy');
 assert.deepEqual(fuzzy.slice(0,2),queue.slice(0,2));assert.equal(fuzzy.at(-1),'a');
 assert.deepEqual(reviseRecallQueue(['a','b','a','c'],3,0,'forgotten'),['a','b','a','c']);
 assert.deepEqual(reviseRecallQueue(['a','a'],1,0,'remembered'),['a']);
});
test('fuzzy is distinct and old binary answers retain their meaning',()=>{
 assert.equal(answerRating({correct:false,rating:'fuzzy'}),'fuzzy');
 assert.equal(answerRating({correct:false}),'forgotten');
 assert.equal(answerRating({correct:true}),'remembered');
});
test('instant preview and server scheduling agree including the last original word',()=>{
 const words=new Map([['a',{id:'a',word:'a',page:1,meaning:'甲'}]]);
 const state={studyFormat:'recall',queue:['a'],index:0,total:1,correct:0,answers:[] as PastAnswer[],question:{id:'a',word:'a',page:1,options:[]}};
 const next=previewRecall(state,null,words,'fuzzy')!;
 assert.deepEqual(next.queue,scheduleRecall(state.queue,0,'fuzzy'));assert.equal(next.total,2);assert.equal(next.index,1);
 assert.equal(next.answers[0].rating,'fuzzy');assert.equal(next.correct,0);
 assert.equal(previewRecall(state,'甲',words,'remembered'),null);
});
