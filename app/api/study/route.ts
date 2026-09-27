import {db,state,getSession,answers} from '../../../lib/server-store';
import {byId,passages,optionsFor,shuffle} from '../../../lib/vocabulary';
import {findResumableSession} from '../../../lib/session-policy';
export const dynamic='force-dynamic';
const json=(data:unknown,status=200)=>Response.json(data,{status,headers:{'Cache-Control':'no-store'}});
const fail=(message:string,status=400)=>json({error:message},status);
function user(request:Request){return request.headers.get('oai-authenticated-user-id');}
export async function GET(request:Request){
 const uid=user(request);if(!uid)return fail('请先登录，再保存你的学习记录。',401);
 try{
  const id=new URL(request.url).searchParams.get('session');
  if(!id)return json(await state(uid));
  const s=await getSession(id,uid);if(!s)return fail('未找到这次练习。',404);
  const items=await answers(id);const queue:string[]=JSON.parse(s.queue);const index=items.length;
  const word=byId.get(queue[index]);
  return json({id:s.id,title:s.title,studyFormat:s.study_format||'choice',status:s.status,total:queue.length,index,correct:items.filter(a=>a.correct).length,
   answers:items.map(a=>({position:a.position,wordId:a.word_id,choice:a.choice,correct:!!a.correct})),
   question:s.status==='active'&&word?{id:word.id,word:word.word,page:word.page,options:s.study_format==='recall'?[]:optionsFor(word.id,id,index)}:null});
 }catch(e){console.error('Study load failed',e);return fail('学习记录暂时无法加载，请稍后重试。',503);}
}
export async function POST(request:Request){
 const uid=user(request);if(!uid)return fail('请先登录，再保存你的学习记录。',401);
 const origin=request.headers.get('origin');if(origin&&origin!==new URL(request.url).origin)return fail('请求来源不匹配。',403);
 try{
  const body=await request.json() as Record<string,unknown>;
  if(body.action==='bookmark'){
   if(typeof body.wordId!=='string'||!byId.has(body.wordId)||typeof body.saved!=='boolean')return fail('词条或收藏状态无效。');
   if(body.saved)await db().prepare('INSERT INTO saved_words (user_id,word_id,saved_at) VALUES (?,?,?) ON CONFLICT(user_id,word_id) DO NOTHING').bind(uid,body.wordId,Date.now()).run();
   else await db().prepare('DELETE FROM saved_words WHERE user_id = ? AND word_id = ?').bind(uid,body.wordId).run();
   return json({ok:true});
  }
  if(body.action==='start'){
   const mode=body.mode;
   const studyFormat=body.studyFormat??'recall';
   if(studyFormat!=='recall')return fail('背词方式无效。');
   if(!['passage','wrong','due','saved'].includes(String(mode)))return fail('练习模式无效。');
   let queue:string[]=[];let title='';
   if(mode==='passage'){
    const p=passages.find(p=>p.id===body.passageId);if(!p)return fail('阅读篇目不存在。');
    if(body.forceNew!==true){
     const existing=findResumableSession((await state(uid)).sessions.filter(s=>s.studyFormat===studyFormat),p.id);
     if(existing){await db().prepare("UPDATE sessions SET status = 'active', finished_at = NULL, updated_at = ? WHERE id = ? AND user_id = ?").bind(Date.now(),existing.id,uid).run();return json({id:existing.id,resumed:true});}
    }
    queue=p.words.map(w=>w.id);title=p.year+' 年 · Text '+p.text;
   }else if(mode==='saved'){
    const st=await state(uid);queue=st.savedWordIds.filter(id=>byId.has(id));
    if(body.passageId&&body.passageId!=='all')queue=queue.filter(id=>id.startsWith(String(body.passageId)+'-'));
    if(Array.isArray(body.wordIds))queue=queue.filter(id=>(body.wordIds as unknown[]).includes(id));
    title='重点词复习';
   }else{
    const st=await state(uid);
    const candidates=Object.values(st.progress).filter(p=>p.mistakes>0&&p.streak<3&&(mode!=='due'||p.dueAt<=Date.now()));
    if(body.passageId&&body.passageId!=='all')queue=candidates.filter(p=>p.wordId.startsWith(String(body.passageId)+'-')).map(p=>p.wordId);
    else queue=candidates.map(p=>p.wordId);
    if(Array.isArray(body.wordIds))queue=queue.filter(id=>(body.wordIds as unknown[]).includes(id));
    title=mode==='due'?'到期错词复习':'错词巩固';
   }
   if(!queue.length)return fail('当前没有需要练习的词条。');
   if(body.order==='shuffle')queue=shuffle(queue,crypto.getRandomValues(new Uint32Array(1))[0]);
   if(body.limit===10||body.limit===20)queue=queue.slice(0,body.limit);
   const id=crypto.randomUUID();await db().prepare('INSERT INTO sessions (id,user_id,title,mode,study_format,queue,started_at,status) VALUES (?,?,?,?,?,?,?,?)').bind(id,uid,title,mode,studyFormat,JSON.stringify(queue),Date.now(),'active').run();
   return json({id});
  }
  if(typeof body.sessionId!=='string')return fail('缺少练习编号。');
  const s=await getSession(body.sessionId,uid);if(!s)return fail('未找到这次练习。',404);
  if(body.action==='resume'||body.action==='pause'){
   const items=await answers(s.id);const queue:string[]=JSON.parse(s.queue);
   if(s.status==='completed'||items.length>=queue.length)return json({ok:true,completed:true});
   await db().prepare("UPDATE sessions SET status = 'active', finished_at = NULL, updated_at = ? WHERE id = ? AND user_id = ?").bind(Date.now(),s.id,uid).run();
   return json({ok:true,answered:items.length});
  }
  if(body.action==='stop'){
   await db().prepare("UPDATE sessions SET status = 'stopped', finished_at = ?, updated_at = ? WHERE id = ? AND user_id = ? AND status = 'active'").bind(Date.now(),Date.now(),s.id,uid).run();
   return json({ok:true});
  }
  if(body.action==='revise'){
   if(s.study_format!=='recall')return fail('仅支持修改自评记录。');
   const queue:string[]=JSON.parse(s.queue),pos=body.position;
   if(!Number.isInteger(pos)||Number(pos)<0||Number(pos)>=queue.length||typeof body.correct!=='boolean')return fail('修改参数无效。');
   const w=byId.get(queue[Number(pos)]);
   if(!w||body.wordId!==w.id)return fail('词条不匹配，请重新打开回看。',409);
   const prior=(await answers(s.id)).find(a=>a.position===pos);
   if(!prior)return fail('只能修改已经背过的词。',409);
   await db().prepare('UPDATE attempts SET correct = ?, choice = ? WHERE session_id = ? AND position = ? AND word_id = ?').bind(Number(body.correct),body.correct?w.meaning:null,s.id,pos,w.id).run();
   return json({ok:true});
  }
  if(body.action!=='answer')return fail('未知操作。');
  const queue:string[]=JSON.parse(s.queue);const pos=body.position;
  if(!Number.isInteger(pos)||Number(pos)<0||Number(pos)>=queue.length)return fail('题目编号无效。');
  const index=Number(pos);const w=byId.get(queue[index])!;
  if(body.wordId!==undefined&&body.wordId!==w.id)return fail('题目已切换，请刷新后从已保存进度继续。',409);
  const previous=await answers(s.id);const replay=previous.find(a=>a.position===index);
  if(replay)return json({correct:!!replay.correct,meaning:w.meaning,choice:replay.choice,done:index===queue.length-1});
  if(s.status!=='active'||index!==previous.length)return fail('练习进度已更新，请重新打开这次练习。',409);
  if(s.study_format==='recall'&&body.choice!==null&&body.choice!==w.meaning)return fail('自评请选择记得或不记得。');
  if(s.study_format!=='recall'&&body.choice!==null&&(typeof body.choice!=='string'||!optionsFor(w.id,s.id,index).includes(body.choice)))return fail('答案选项无效。');
  const correct=body.choice===w.meaning;const now=Date.now();
  const duration=typeof body.duration==='number'&&Number.isFinite(body.duration)?Math.max(0,Math.min(300000,Math.round(body.duration))):0;
  const batch=[db().prepare('INSERT INTO attempts (session_id,position,word_id,choice,correct,answered_at,duration) VALUES (?,?,?,?,?,?,?) ON CONFLICT(session_id,position) DO NOTHING').bind(s.id,index,w.id,body.choice as string|null,Number(correct),now,duration)];
  batch.push(db().prepare('UPDATE sessions SET updated_at = MAX(updated_at, ?) WHERE id = ? AND user_id = ?').bind(now,s.id,uid));
  if(index===queue.length-1)batch.push(db().prepare("UPDATE sessions SET status = 'completed', finished_at = ? WHERE id = ? AND user_id = ? AND (SELECT COUNT(*) FROM attempts WHERE session_id = ?) = ?").bind(now,s.id,uid,s.id,queue.length));
  await db().batch(batch);
  const saved=await db().prepare('SELECT correct, choice FROM attempts WHERE session_id = ? AND position = ?').bind(s.id,index).first<{correct:number;choice:string|null}>();
  return json({correct:!!saved!.correct,meaning:w.meaning,choice:saved!.choice,done:index===queue.length-1});
 }catch(e){console.error('Study save failed',e);return fail('本次操作未确认保存，请重试；同一道题不会重复计数。',503);}
}
