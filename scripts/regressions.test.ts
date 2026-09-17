import {test} from 'node:test';
import assert from 'node:assert/strict';
import {findResumableSession} from '../lib/session-policy.ts';
const sessions=[
 {id:'older',mode:'passage',title:'2010 年 · Text 1',passageId:'2010-1',status:'active',startedAt:1,updatedAt:10,answered:6,total:24},
 {id:'newer',mode:'passage',title:'2026 年 · Text 1',passageId:'2026-1',status:'active',startedAt:2,updatedAt:3,answered:1,total:47},
 {id:'finished',mode:'passage',title:'2010 年 · Text 1',passageId:'2010-1',status:'completed',startedAt:20,updatedAt:20,answered:24,total:24},
];
test('reopening a reading resumes its existing unfinished session',()=>{
 assert.equal(findResumableSession(sessions,'2010-1')?.id,'older');
 assert.equal(findResumableSession(sessions,'2026-1')?.id,'newer');
 assert.equal(findResumableSession(sessions,'2011-1'),undefined);
});
test('continue banner uses most recently studied session, not newest created',()=>{
 assert.equal(findResumableSession(sessions)?.id,'older');
});
test('previously stopped partial sessions remain recoverable without changing completed ones',()=>{
 assert.equal(findResumableSession([{...sessions[0],status:'stopped'}],'2010-1')?.id,'older');
 assert.equal(findResumableSession([{...sessions[0],answered:24}],'2010-1'),undefined);
});
