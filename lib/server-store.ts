import {env} from 'cloudflare:workers';
import {progressFromAnswers} from './study';
export function db(){if(!env.DB)throw new Error('Database unavailable');return env.DB;}
export type SessionRow={id:string;user_id:string;title:string;mode:string;queue:string;started_at:number;finished_at:number|null;status:string;updated_at:number};
export type AttemptRow={session_id:string;position:number;word_id:string;choice:string|null;correct:number;answered_at:number;duration:number};
export async function state(userId:string){
 const [s,a]=await db().batch([
  db().prepare('SELECT * FROM sessions WHERE user_id = ? ORDER BY started_at DESC').bind(userId),
  db().prepare('SELECT a.* FROM attempts a JOIN sessions s ON s.id = a.session_id WHERE s.user_id = ? ORDER BY a.answered_at, a.session_id, a.position').bind(userId)
 ]);
 const attempts=a.results as AttemptRow[];
 return {progress:progressFromAnswers(attempts.map(a=>({wordId:a.word_id,correct:!!a.correct,at:a.answered_at}))),
  sessions:(s.results as SessionRow[]).map(s=>{const items=attempts.filter(a=>a.session_id===s.id);const queue:string[]=JSON.parse(s.queue);return {id:s.id,title:s.title,mode:s.mode,passageId:s.mode==='passage'?queue[0]?.split('-').slice(0,2).join('-'):null,startedAt:s.started_at,updatedAt:Math.max(s.updated_at,s.started_at,...items.map(a=>a.answered_at)),finishedAt:s.finished_at,status:s.status,total:queue.length,answered:items.length,correct:items.filter(a=>a.correct).length,duration:items.reduce((n,a)=>n+a.duration,0),wrongIds:items.filter(a=>!a.correct).map(a=>a.word_id)};})};
}
export async function getSession(id:string,userId:string){return db().prepare('SELECT * FROM sessions WHERE id = ? AND user_id = ?').bind(id,userId).first<SessionRow>();}
export async function answers(id:string){return (await db().prepare('SELECT * FROM attempts WHERE session_id = ? ORDER BY position').bind(id).all<AttemptRow>()).results;}
