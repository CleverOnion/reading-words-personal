import {env} from 'cloudflare:workers';
import {answerRating} from './recall-policy';
import {progressFromAnswers} from './study';
export function db(){if(!env.DB)throw new Error('Database unavailable');return env.DB;}
export type SessionRow={id:string;user_id:string;title:string;mode:string;study_format:string;queue:string;started_at:number;finished_at:number|null;status:string;updated_at:number};
export type AttemptRow={session_id:string;position:number;word_id:string;choice:string|null;correct:number;answered_at:number;duration:number;rating?:string|null};
export async function state(userId:string){
 const [s,a,bookmarks]=await db().batch([
  db().prepare('SELECT * FROM sessions WHERE user_id = ? ORDER BY started_at DESC').bind(userId),
  db().prepare('SELECT a.* FROM attempts a JOIN sessions s ON s.id = a.session_id WHERE s.user_id = ? ORDER BY a.answered_at, a.session_id, a.position').bind(userId),
  db().prepare('SELECT word_id FROM saved_words WHERE user_id = ? ORDER BY saved_at DESC, word_id').bind(userId)
 ]);
 const attempts=a.results as AttemptRow[];
 return {savedWordIds:(bookmarks.results as {word_id:string}[]).map(w=>w.word_id),progress:progressFromAnswers(attempts.map(a=>({wordId:a.word_id,correct:!!a.correct,rating:answerRating(a),at:a.answered_at}))),
  sessions:(s.results as SessionRow[]).map(s=>{const items=attempts.filter(a=>a.session_id===s.id);const queue:string[]=JSON.parse(s.queue);return {id:s.id,title:s.title,mode:s.mode,studyFormat:s.study_format||'choice',passageId:s.mode==='passage'?queue[0]?.split('-').slice(0,2).join('-'):null,startedAt:s.started_at,updatedAt:Math.max(s.updated_at,s.started_at,...items.map(a=>a.answered_at)),finishedAt:s.finished_at,status:s.status,total:queue.length,answered:items.length,correct:items.filter(a=>a.correct).length,fuzzy:items.filter(a=>a.rating==='fuzzy').length,returns:items.length-new Set(items.map(a=>a.word_id)).size,duration:items.reduce((n,a)=>n+a.duration,0),wrongIds:[...new Map(items.map(a=>[a.word_id,a])).values()].filter(a=>!a.correct).map(a=>a.word_id)};})};
}
export async function getSession(id:string,userId:string){return db().prepare('SELECT * FROM sessions WHERE id = ? AND user_id = ?').bind(id,userId).first<SessionRow>();}
export async function answers(id:string){return (await db().prepare('SELECT * FROM attempts WHERE session_id = ? ORDER BY position').bind(id).all<AttemptRow>()).results;}
