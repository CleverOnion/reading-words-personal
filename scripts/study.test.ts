import {test} from 'node:test';
import assert from 'node:assert/strict';
import {progressFromAnswers} from '../lib/study.ts';
test('wrong words retain lifetime mistakes and need three consecutive correct answers',()=>{
 const a=[{wordId:'2010-1-1',correct:false,at:1000}];
 assert.equal(progressFromAnswers(a)['2010-1-1'].mistakes,1);
 for(let i=1;i<=3;i++)a.push({wordId:'2010-1-1',correct:true,at:1000+i});
 let p=progressFromAnswers(a)['2010-1-1'];
 assert.equal(p.streak,3);assert.equal(p.mistakes,1);assert.equal(p.seen,4);
 a.push({wordId:'2010-1-1',correct:false,at:2000});
 p=progressFromAnswers(a)['2010-1-1'];assert.equal(p.streak,0);assert.equal(p.mistakes,2);assert.equal(p.dueAt,2000);
});
test('review due dates and passage-specific progress',()=>{
 const p=progressFromAnswers([{wordId:'a',correct:false,at:1},{wordId:'a',correct:true,at:100},{wordId:'b',correct:true,at:200}]);
 assert.equal(p.a.dueAt,100+86400000);assert.equal(p.b.mistakes,0);assert.equal(Object.keys(p).length,2);
});
