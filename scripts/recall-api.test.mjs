// Integration checks run the actual API against an ephemeral SQLite database.
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {DatabaseSync} from 'node:sqlite';
import {readFileSync,mkdirSync} from 'node:fs';
import {build} from 'esbuild';

mkdirSync('work',{recursive:true});
await build({entryPoints:['app/api/study/route.ts'],outfile:'work/recall-api-test-bundle.mjs',bundle:true,platform:'node',format:'esm',plugins:[{name:'test-d1',setup(build){
 build.onResolve({filter:/^cloudflare:workers$/},()=>({path:'d1',namespace:'test'}));
 build.onLoad({filter:/.*/,namespace:'test'},()=>({contents:'export const env={get DB(){return globalThis.__recallTestDB}};'}));
}}]});
const {GET,POST}=await import('../work/recall-api-test-bundle.mjs');
const sql=new DatabaseSync(':memory:');
for(const file of ['0000_mushy_strong_guy','0001_flippant_black_bird','0002_plain_ares','0003_outgoing_hemingway','0004_recall_rating'])sql.exec(readFileSync(`drizzle/${file}.sql`,'utf8'));
class Statement{
 constructor(text,args=[]){this.text=text;this.args=args;}
 bind(...args){return new Statement(this.text,args);}
 execute(){const stmt=sql.prepare(this.text);return /^SELECT/i.test(this.text.trim())?{results:stmt.all(...this.args)}:{results:[],meta:stmt.run(...this.args)};}
 async run(){return this.execute();}
 async all(){return this.execute();}
 async first(){return sql.prepare(this.text).get(...this.args)??null;}
}
globalThis.__recallTestDB={prepare:text=>new Statement(text),async batch(statements){sql.exec('BEGIN');try{const out=statements.map(s=>s.execute());sql.exec('COMMIT');return out;}catch(e){sql.exec('ROLLBACK');throw e;}}};
async function request(body,id,expected=200){
 const url='https://test.local/api/study'+(id?'?session='+id:'');
 const r=await (body?POST:GET)(new Request(url,{method:body?'POST':'GET',headers:{'oai-authenticated-user-id':'test-user',origin:'https://test.local','Content-Type':'application/json'},...(body?{body:JSON.stringify(body)}:{})}));
 const data=await r.json();assert.equal(r.status,expected,JSON.stringify(data));return data;
}
const start=()=>request({action:'start',mode:'passage',passageId:'2010-1',forceNew:true,limit:10});
const answer=(p,rating)=>({action:'answer',sessionId:p.id,position:p.index,wordId:p.question.id,rating,duration:250});

test('fuzzy persists, returns survive reload, retries are idempotent and loop finishes',async()=>{
 const {id}=await start();let p=await request(null,id);const first=p.question.id;
 const body=answer(p,'fuzzy');const saved=await request(body);
 assert.equal(saved.rating,'fuzzy');assert.equal(saved.queue[7],first);assert.equal(saved.done,false);
 assert.deepEqual(await request(body),saved);
 p=await request(null,id);assert.equal(p.index,1);assert.equal(p.answers[0].rating,'fuzzy');assert.equal(p.total,11);
 await request({action:'pause',sessionId:id});await request({action:'resume',sessionId:id});
 assert.deepEqual((await request(null,id)).queue,saved.queue);
 while(p.question){await request(answer(p,'remembered'));p=await request(null,id);assert.ok(p.index<=11);}
 assert.equal(p.status,'completed');assert.equal(p.answers.length,11);
 const state=await request();const session=state.sessions.find(s=>s.id===id);
 assert.equal(session.fuzzy,1);assert.equal(session.returns,1);assert.deepEqual(session.wrongIds,[]);
});
test('correction changes rating, cancels pending repeats, and does not add attempts',async()=>{
 const {id}=await start();let p=await request(null,id);const wordId=p.question.id;
 await request(answer(p,'forgotten'));p=await request(null,id);assert.equal(p.total,11);
 await request({action:'revise',sessionId:id,position:0,wordId,rating:'remembered'});
 p=await request(null,id);assert.equal(p.total,10);assert.equal(p.index,1);assert.equal(p.answers[0].rating,'remembered');
 await request({action:'revise',sessionId:id,position:0,wordId,rating:'fuzzy'});
 p=await request(null,id);assert.equal(p.total,11);assert.equal(p.index,1);assert.equal(p.answers[0].rating,'fuzzy');
});
test('last original word returns and correction can finish an otherwise empty queue',async()=>{
 const {id}=await start();let p=await request(null,id);
 while(p.index<9){await request(answer(p,'remembered'));p=await request(null,id);}
 const wordId=p.question.id;await request(answer(p,'forgotten'));
 p=await request(null,id);assert.equal(p.status,'active');assert.equal(p.index,10);assert.equal(p.question.id,wordId);
 await request({action:'revise',sessionId:id,position:9,wordId,rating:'remembered'});
 p=await request(null,id);assert.equal(p.status,'completed');assert.equal(p.question,null);assert.equal(p.index,10);
});
test('concurrent duplicate ratings cannot insert two answers or conflicting returns',async()=>{
 const {id}=await start();const p=await request(null,id);
 const results=await Promise.all([request(answer(p,'remembered')),request(answer(p,'forgotten'))]);
 const fresh=await request(null,id);assert.equal(fresh.index,1);
 assert.equal(results[0].rating,results[1].rating);
 assert.equal(fresh.total,results[0].rating==='remembered'?10:11);
});
