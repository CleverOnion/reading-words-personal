import {answerRating} from '../../../lib/recall-policy';
import {db} from '../../../lib/server-store';
import {passages} from '../../../lib/vocabulary';
import {buildStatistics} from '../../../lib/statistics';

export const dynamic='force-dynamic';
const json=(body:unknown,status=200)=>Response.json(body,{status,headers:{'Cache-Control':'no-store'}});
export async function GET(request:Request){
 const uid=request.headers.get('oai-authenticated-user-id');
 if(!uid)return json({error:'请先登录，再查看学习画像。'},401);
 const value=new URL(request.url).searchParams.get('days')??'30';
 if(!['7','30','90'].includes(value))return json({error:'请选择 7、30 或 90 天。'},400);
 try{
  const [attemptRows,sessionRows]=await db().batch([
   db().prepare('SELECT a.word_id, a.correct, a.rating, a.answered_at, a.duration FROM attempts a JOIN sessions s ON s.id = a.session_id WHERE s.user_id = ? ORDER BY a.answered_at, a.session_id, a.position').bind(uid),
   db().prepare('SELECT mode,status,queue FROM sessions WHERE user_id = ?').bind(uid),
  ]);
  const attempts=(attemptRows.results as {word_id:string;correct:number;rating?:string|null;answered_at:number;duration:number}[]).map(a=>({wordId:a.word_id,correct:!!a.correct,rating:answerRating(a),at:a.answered_at,duration:a.duration}));
  const sessions=(sessionRows.results as {mode:string;status:string;queue:string}[]).map(s=>({mode:s.mode,status:s.status,passageId:s.mode==='passage'?(JSON.parse(s.queue) as string[])[0]?.split('-').slice(0,2).join('-')??null:null}));
  return json(buildStatistics({attempts,sessions,passages,days:Number(value) as 7|30|90,now:Date.now()}));
 }catch(error){console.error('Statistics load failed',error);return json({error:'学习画像暂时无法加载，请稍后重试。'},503);}
}
