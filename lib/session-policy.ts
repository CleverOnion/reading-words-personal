export type ResumableSession={id:string;mode:string;title:string;status:string;startedAt:number;updatedAt?:number;answered:number;total:number;passageId?:string|null};
export function findResumableSession(sessions:ResumableSession[],passageId?:string):ResumableSession|undefined {
 return sessions.filter(s=>s.status!=='completed'&&s.answered<s.total&&(!passageId||(s.mode==='passage'&&(s.passageId===passageId||s.title===passageId.split('-')[0]+' 年 · Text '+passageId.split('-')[1]))))
  .sort((a,b)=>(b.updatedAt??b.startedAt)-(a.updatedAt??a.startedAt))[0];
}
