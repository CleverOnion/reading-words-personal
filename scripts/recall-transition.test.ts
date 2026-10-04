import {test} from 'node:test';
import assert from 'node:assert/strict';
import type {PastAnswer} from '../lib/practice-review.ts';
import {previewRecall} from '../lib/recall-transition.ts';
const words=new Map(['a','b','c'].map((id,i)=>[id,{id,word:id,page:i,meaning:`meaning-${id}`} ]));
const state={studyFormat:'recall',queue:['c','a','b'],index:0,total:3,correct:0,answers:[] as PastAnswer[],question:{id:'c',word:'c',page:2,options:[]}};
test('immediate preview follows server shuffle and preserves rollback snapshot',()=>{
 const snapshot=structuredClone(state);
 const next=previewRecall(state,'meaning-c',words)!;
 assert.equal(next.question?.id,'a');assert.equal(next.index,1);assert.equal(next.correct,1);
 assert.deepEqual(next.answers,[{position:0,wordId:'c',choice:'meaning-c',correct:true}]);
 assert.deepEqual(state,snapshot);
});
test('forgotten words remain incorrect in preview',()=>{
 const next=previewRecall(state,null,words)!;
 assert.equal(next.correct,0);assert.equal(next.answers[0].correct,false);
});
test('last word and stale/missing queues require server confirmation',()=>{
 assert.equal(previewRecall({...state,index:2},null,words),null);
 assert.equal(previewRecall({...state,queue:undefined},null,words),null);
 assert.equal(previewRecall({...state,queue:['a','c','b']},null,words),null);
 assert.equal(previewRecall({...state,queue:['c','missing','b']},null,words),null);
 assert.equal(previewRecall({...state,studyFormat:'choice'},null,words),null);
});
