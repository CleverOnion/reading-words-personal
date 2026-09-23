import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {buildStatistics} from '../lib/statistics.ts';

// Read-only on both local and production: never creates or modifies learning records.
const base=process.argv[2]||'http://127.0.0.1:8788';
const request=(path,init={})=>fetch(base+path,{redirect:'manual',...init,signal:AbortSignal.timeout(30000)});
assert.equal((await request('/api/statistics')).status,401);
assert.equal((await request('/api/statistics',{headers:{'oai-authenticated-user-id':'spoof'}})).status,401);
const password=(await readFile('.cloudflare-private/login-password.txt','utf8')).trim();
const login=await request('/auth/login',{method:'POST',headers:{origin:base,'Content-Type':'application/x-www-form-urlencoded'},body:new URLSearchParams({password})});
assert.equal(login.status,303);
const cookie=login.headers.get('set-cookie').split(';')[0];
const auth=path=>request(path,{headers:{cookie}});
const get=async path=>{const response=await auth(path);assert.equal(response.status,200,path);assert.match(response.headers.get('cache-control'),/no-store/);return response.json();};
assert.equal((await auth('/api/statistics?days=15')).status,400);
const backup=await get('/api/backup');
const passages=JSON.parse(await readFile('data/vocabulary.json','utf8'));
const attempts=backup.attempts.map(a=>({wordId:a.word_id,correct:!!a.correct,at:a.answered_at,duration:a.duration}));
const sessions=backup.sessions.map(s=>({mode:s.mode,status:s.status,passageId:s.mode==='passage'?JSON.parse(s.queue)[0]?.split('-').slice(0,2).join('-')??null:null}));
for(const days of [7,30,90]){
 const actual=await get('/api/statistics?days='+days);
 assert.deepEqual(actual,buildStatistics({attempts,sessions,passages,days,now:actual.generatedAt}));
 assert.equal(actual.readings.length,60);assert.equal(actual.calendar.length,84);
}
const after=await get('/api/backup');
for(const key of ['sessions','attempts','saved_words'])assert.deepEqual(after[key],backup[key],key+' changed during read-only verification');
console.log('PASS: authenticated statistics for 7/30/90 days match stored records; 60 readings, 84 dates; anonymous/spoofed access rejected; learning records unchanged.');
