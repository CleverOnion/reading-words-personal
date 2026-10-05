import {test} from 'node:test';
import assert from 'node:assert/strict';
import {DatabaseSync} from 'node:sqlite';
import {readFileSync,mkdirSync} from 'node:fs';
import {build} from 'esbuild';
mkdirSync('work',{recursive:true});
await build({stdin:{contents:"export {GET,POST} from './app/api/native-ai/route.ts';export {runAiBatch,nativeWordCount} from './lib/native-ai-server.ts';",resolveDir:process.cwd()},outfile:'work/native-ai-api-bundle.mjs',bundle:true,platform:'node',format:'esm',plugins:[{name:'env',setup(b){b.onResolve({filter:/^cloudflare:workers$/},()=>({path:'env',namespace:'test'}));b.onLoad({filter:/.*/,namespace:'test'},()=>({contents:'export const env={get DB(){return globalThis.__aiDB},PRIVATE_SESSION_SECRET:"local-test-encryption-secret-at-least-32-chars"};'}));}}]});
const {GET,POST,runAiBatch,nativeWordCount}=await import('../work/native-ai-api-bundle.mjs');
const sql=new DatabaseSync(':memory:');sql.exec(readFileSync('drizzle/0005_native_ai.sql','utf8'));
class Statement{
 constructor(text,args=[]){this.text=text;this.args=args;}
 bind(...args){return new Statement(this.text,args);}
 execute(){const stmt=sql.prepare(this.text);return /^SELECT/i.test(this.text.trim())?{results:stmt.all(...this.args)}:{results:[],meta:stmt.run(...this.args)};}
 async run(){return this.execute();}async all(){return this.execute();}async first(){return sql.prepare(this.text).get(...this.args)??null;}
}
const DB={prepare:text=>new Statement(text),batch:async statements=>{sql.exec('BEGIN');try{const result=statements.map(s=>s.execute());sql.exec('COMMIT');return result;}catch(e){sql.exec('ROLLBACK');throw e;}}};
globalThis.__aiDB=DB;
const env={DB,PRIVATE_SESSION_SECRET:'local-test-encryption-secret-at-least-32-chars'};
const value={intuition:'想象把一个东西固定在某处。',register:'常见的日常表达。',collocations:[{en:'drive a nail',zh:'钉钉子'},{en:'a rusty nail',zh:'生锈的钉子'}],pitfall:'名词也可指指甲。',example:{en:'He drove a nail into the wall.',zh:'他把一枚钉子钉进墙里。'}};
const reply=()=>Response.json({choices:[{message:{content:JSON.stringify(value)}}]});
const originalFetch=globalThis.fetch;
async function request(data,user='alice',wordId){const req=new Request('https://notebook.example/api/native-ai'+(wordId?'?wordId='+wordId:''),{method:data?'POST':'GET',headers:{'oai-authenticated-user-id':user,origin:'https://notebook.example','Content-Type':'application/json'},...(data?{body:JSON.stringify(data)}:{})});const r=await (data?POST(req):GET(req));return {status:r.status,body:await r.json()};}
async function save(user='alice'){const r=await request({action:'save',baseUrl:'https://provider.example/v1',model:'test-model',apiKey:'secret-test-token'},user);assert.equal(r.status,200);return r.body;}
test('settings never return API keys, require auth and origin, and isolate users',async()=>{
 const s=await save();assert.equal(s.settings.hasKey,true);assert.ok(!JSON.stringify(s).includes('secret-test-token'));
 assert.equal((await request(null,'bob')).body.settings,null);
 assert.equal((await GET(new Request('https://notebook.example/api/native-ai'))).status,401);
 assert.equal((await POST(new Request('https://notebook.example/api/native-ai',{method:'POST',headers:{'oai-authenticated-user-id':'alice',origin:'https://evil.example'},body:'{}'}))).status,403);
 assert.equal((await request({action:'save',baseUrl:'https://other.example/v1',model:'test',apiKey:''})).status,400);
 const stored=sql.prepare('SELECT encrypted_key FROM ai_settings WHERE user_id=?').get('alice').encrypted_key;assert.ok(!stored.includes('secret-test-token'));
});
test('single generation saves reusable content, and failed regeneration preserves prior content',async()=>{
 let calls=0;
 globalThis.fetch=async(url,init)=>{calls++;assert.equal(url,'https://provider.example/v1/chat/completions');assert.equal(init.redirect,'error');assert.equal(init.headers.Authorization,'Bearer secret-test-token');return reply();};
 try{
  const r=await request({action:'generate',wordId:'2024-1-kk-001'});assert.equal(r.status,200);assert.equal(r.body.status,'ready');assert.deepEqual(r.body.content,value);
  const saved=await request(null,'alice','2024-1-kk-001');assert.deepEqual(saved.body.content,value);assert.equal(calls,1);
  assert.equal((await request(null,'bob','2024-1-kk-001')).body.status,'missing');
  globalThis.fetch=async()=>new Response('raw upstream error secret-test-token',{status:500});
  const failed=await request({action:'generate',wordId:'2024-1-kk-001'});assert.equal(failed.body.status,'error');assert.deepEqual(failed.body.content,value);assert.ok(!JSON.stringify(failed).includes('secret-test-token'));
 }finally{globalThis.fetch=originalFetch;}
});
test('batch deduplicates words, survives retries and overlapping cron invocations, and pauses on quota errors',async()=>{
 await save('batch');const r=await request({action:'start'},'batch');assert.equal(r.status,200);assert.equal(r.body.counts.pending,nativeWordCount);
 await request({action:'start'},'batch');assert.equal(sql.prepare('SELECT COUNT(*) n FROM ai_notes WHERE user_id=?').get('batch').n,nativeWordCount);
 let calls=0;globalThis.fetch=async()=>{calls++;await new Promise(r=>setTimeout(r,2));return reply();};
 try{
  await Promise.all([runAiBatch(env),runAiBatch(env)]);assert.equal(calls,9);
  const done=(await request(null,'batch')).body;assert.equal(done.counts.ready,9);
  await request({action:'pause'},'batch');await runAiBatch(env);assert.equal(calls,9);
  await request({action:'start'},'batch');globalThis.fetch=async()=>new Response('',{status:429});await runAiBatch(env);
  assert.equal((await request(null,'batch')).body.job.status,'paused');
  await request({action:'start'},'batch');assert.equal((await request(null,'batch')).body.counts.error,0);
  await request({action:'pause'},'batch');
 }finally{globalThis.fetch=originalFetch;}
});
test('stale generation leases recover and pending regeneration keeps its old result',async()=>{
 await save('recover');
 sql.prepare("INSERT INTO ai_jobs(user_id,status,updated_at) VALUES('recover','running',0)").run();
 sql.prepare("INSERT INTO ai_notes(user_id,word_key,word_id,status,content,updated_at,lease_until) VALUES('recover','nail','2024-1-kk-001','generating',?,0,1)").run(JSON.stringify(value));
 globalThis.fetch=async()=>reply();try{await runAiBatch(env);assert.equal(sql.prepare("SELECT status FROM ai_notes WHERE user_id='recover'").get().status,'ready');assert.equal((await request(null,'recover')).body.job.status,'completed');}finally{globalThis.fetch=originalFetch;}
});

test('overlapping manual regeneration makes one provider call',async()=>{
 await save('parallel');let calls=0;globalThis.fetch=async()=>{calls++;await new Promise(r=>setTimeout(r,20));return reply();};
 try{await Promise.all([request({action:'generate',wordId:'2024-1-kk-001'},'parallel'),request({action:'generate',wordId:'2024-1-kk-001'},'parallel')]);assert.equal(calls,1);assert.equal((await request(null,'parallel','2024-1-kk-001')).body.status,'ready');}finally{globalThis.fetch=originalFetch;}
});
test('repeated malformed model responses pause batch instead of draining the entire queue',async()=>{
 await save('malformed');await request({action:'start'},'malformed');let calls=0;globalThis.fetch=async()=>{calls++;return Response.json({choices:[{message:{content:'unstructured text'}}]});};
 try{await runAiBatch(env);assert.equal(calls,3);assert.equal((await request(null,'malformed')).body.job.status,'paused');}finally{globalThis.fetch=originalFetch;}
});
