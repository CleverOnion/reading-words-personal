import assert from 'node:assert/strict';
import {readFile,writeFile} from 'node:fs/promises';
const base=process.argv[2]||'http://127.0.0.1:8788';
const local=new URL(base).hostname==='127.0.0.1';
const password=(await readFile('.cloudflare-private/login-password.txt','utf8')).trim();
const request=(path,init={})=>fetch(base+path,{redirect:'manual',...init,signal:AbortSignal.timeout(20000)});
assert.equal((await request('/api/study')).status,401);
assert.equal((await request('/api/study',{headers:{'oai-authenticated-user-id':'spoof'}})).status,401);
assert.equal((await request('/api/backup')).status,401);
assert.equal((await request('/')).status,303);
const login=await request('/auth/login',{method:'POST',headers:{origin:base,'Content-Type':'application/x-www-form-urlencoded'},body:new URLSearchParams({password})});
assert.equal(login.status,303,'Login failed: '+await login.text());
const cookie=login.headers.get('set-cookie').split(';')[0];
const auth=(path,init={})=>request(path,{...init,headers:{cookie,origin:base,...init.headers}});
const page=await auth('/');assert.equal(page.status,200);const html=await page.text();
assert.match(html,/导出备份/);assert.match(html,/退出登录/);
const assets=[...html.matchAll(/(?:src|href)="([^"?#]+\.(?:js|css))(?:[^" ]*)"/g)].map(m=>m[1]);
assert.ok(assets.length>0,'SSR asset references missing');
for(const url of assets.slice(0,5)){
 const asset=await auth(url);assert.equal(asset.status,200,'Missing asset '+url);
 assert.equal((await request(url)).status,303,'Asset bypasses private gateway');
}
const state=await auth('/api/study');assert.equal(state.status,200);
const originalState=await state.json();
// Mutating regression tests are restricted to the isolated loopback database.
if(local){
 const post=async body=>{const r=await auth('/api/study',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});assert.equal(r.status,200,await r.clone().text());return r.json();};
 const {id}=await post({action:'start',mode:'passage',passageId:'2010-1',limit:10});
 let r=await auth('/api/study?session='+id);const q=await r.json();
 await post({action:'answer',sessionId:id,position:q.index,wordId:q.question.id,choice:null,duration:1000});
 await post({action:'pause',sessionId:id});
 assert.equal((await post({action:'start',mode:'passage',passageId:'2010-1'})).id,id);
 r=await auth('/api/study?session='+id);assert.equal((await r.json()).index,q.index+1);
 const updated=await (await auth('/api/study')).json();assert.ok(updated.progress[q.question.id].mistakes>=1);
 assert.equal((await auth('/api/study',{method:'POST',headers:{origin:'https://attacker.example','Content-Type':'application/json'},body:'{}'})).status,403);
}
const backup=await auth('/api/backup');assert.equal(backup.status,200);assert.match(backup.headers.get('content-disposition'),/attachment/);
const data=await backup.json();assert.equal(data.format,'reading-notes-backup');
if(!local){
 const source=JSON.parse(await readFile('.cloudflare-private/source-backup.json','utf8'));
 for(const table of ['sessions','attempts'])assert.deepEqual(data[table],source[table],'Migration differs: '+table);
 assert.equal(originalState.sessions.length,source.sessions.length);
 await writeFile('.cloudflare-private/verified-cloudflare-backup.json',JSON.stringify(data,null,2));
}
const logout=await auth('/auth/logout',{method:'POST'});assert.equal(logout.status,303);assert.match(logout.headers.get('set-cookie'),/Max-Age=0/);
console.log('PASS: private login, identity-spoof rejection, authenticated SSR/assets, backup, logout'+(local?', resume and wrong-word persistence (isolated DB)':', exact migrated data (read-only verification)'));
