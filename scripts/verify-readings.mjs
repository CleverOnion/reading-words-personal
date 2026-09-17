import assert from 'node:assert/strict';
import {readFile,writeFile} from 'node:fs/promises';
const base=process.argv[2]||'http://127.0.0.1:8788';
const local=new URL(base).hostname==='127.0.0.1';
const password=(await readFile('.cloudflare-private/login-password.txt','utf8')).trim();
const request=(path,init={})=>fetch(base+path,{redirect:'manual',...init,signal:AbortSignal.timeout(30000)});
const login=await request('/auth/login',{method:'POST',headers:{origin:base,'Content-Type':'application/x-www-form-urlencoded'},body:new URLSearchParams({password})});
assert.equal(login.status,303,'Login failed');
const cookie=login.headers.get('set-cookie').split(';')[0];
const auth=(path,init={})=>request(path,{...init,headers:{cookie,origin:base,...init.headers}});
const get=async path=>{const r=await auth(path);assert.equal(r.status,200,path);return r.json();};
if(process.argv.includes('--snapshot')){
 const backup=await get('/api/backup');
 await writeFile('.cloudflare-private/pre-readings-backup.json',JSON.stringify(backup));
 console.log(`Saved pre-update backup: ${backup.sessions.length} sessions, ${backup.attempts.length} answers.`);
 process.exit(0);
}
assert.equal((await request('/readings/2010-1.json')).status,303,'Original text must require login');
const original=await get('/api/study');assert.ok(Array.isArray(original.savedWordIds));
const homepage=await auth('/');assert.equal(homepage.status,200);
const html=await homepage.text();assert.match(html,/2010—2026 · 68 篇/);
for(const year of [2024,2025,2026])for(const n of [1,2,3,4])assert.ok(html.includes(`${year} 年 Text ${n} 原文与译文`),'Missing reading entry');
const allIds=Array.from({length:17},(_,i)=>[1,2,3,4].map(t=>`${2010+i}-${t}`)).flat();
let paragraphs=0;
// Bounded batches to avoid overwhelming the local server or the live Worker.
for(let i=0;i<allIds.length;i+=4)await Promise.all(allIds.slice(i,i+4).map(async id=>{
 const reading=await get('/readings/'+id+'.json');
 const expected=JSON.parse(await readFile(`public/readings/${id}.json`,'utf8'));
 assert.deepEqual(reading,expected,id+' deployed data mismatch');paragraphs+=reading.paragraphs.length;
}));
assert.equal((await auth('/readings/2027-1.json')).status,404);
if(local){
 const post=async(data,status=200)=>{const r=await auth('/api/study',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(data)});assert.equal(r.status,status,await r.clone().text());return r.json();};
 const wordId='2010-2-1';
 await post({action:'bookmark',wordId:'no-such-word',saved:true},400);
 await post({action:'bookmark',wordId,saved:'yes'},400);
 await post({action:'bookmark',wordId,saved:true});await post({action:'bookmark',wordId,saved:true});
 const after=await get('/api/study');
 assert.equal(after.savedWordIds.filter(id=>id===wordId).length,1);
 assert.deepEqual(after.progress,original.progress,'Bookmark must not create a wrong answer');
 assert.deepEqual(after.sessions,original.sessions,'Bookmark must not alter sessions');
 const start=await post({action:'start',mode:'saved',wordIds:[wordId,'2026-4-1']});
 const practice=await get('/api/study?session='+start.id);
 assert.equal(practice.question.id,wordId);assert.equal(practice.total,1);
 const vocab=JSON.parse(await readFile('data/vocabulary.json','utf8')).flatMap(p=>p.words);
 assert.ok(practice.question.options.includes(vocab.find(w=>w.id===wordId).meaning),'Must use PDF definition');
 await post({action:'bookmark',wordId,saved:false});
 assert.ok(!(await get('/api/study')).savedWordIds.includes(wordId));
 // Existing quiz is still answerable after a bookmark is removed.
 await post({action:'answer',sessionId:start.id,wordId,position:0,choice:null,duration:100});
 await post({action:'start',mode:'saved',wordIds:[wordId]},400);
}
const backup=await get('/api/backup');assert.equal(backup.version,2);assert.ok(Array.isArray(backup.saved_words));
if(!local){
 const before=JSON.parse(await readFile('.cloudflare-private/pre-readings-backup.json','utf8'));
 for(const s of before.sessions){const current=backup.sessions.find(row=>row.id===s.id);assert.ok(current,'Session removed');for(const key of ['user_id','title','mode','queue','started_at'])assert.equal(current[key],s[key]);}
 for(const a of before.attempts)assert.deepEqual(backup.attempts.find(row=>row.session_id===a.session_id&&row.position===a.position),a,'Existing answer changed');
}
console.log(`PASS: ${allIds.length} authenticated readings / ${paragraphs} translated paragraphs, bookmark-aware backup, ${local?'bookmark validation/idempotency/practice and PDF meanings':'read-only production verification and preserved learning records'}.`);
