import test from 'node:test';
import assert from 'node:assert/strict';
import {rememberAnswer} from '../lib/practice-review.ts';
test('past answers retain original choice and appear once in actual practice order',()=>{
 const first={position:0,wordId:'2010-1-20',choice:null,correct:false};
 const second={position:1,wordId:'2010-1-2',choice:'PDF meaning',correct:true};
 const previous=[second];const list=rememberAnswer(previous,first);
 assert.deepEqual(list,[first,second]);assert.deepEqual(previous,[second]);
 assert.equal(rememberAnswer(list,{...first,choice:'different retry'}),list);
});
