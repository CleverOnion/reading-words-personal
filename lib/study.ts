export type Answer = { wordId: string; correct: boolean; at: number; rating?:'forgotten'|'fuzzy'|'remembered' };
export type WordProgress = {wordId:string; seen:number; correct:number; mistakes:number; streak:number; lastAt:number; dueAt:number};
export function progressFromAnswers(answers:Answer[]):Record<string,WordProgress> {
 const result:Record<string,WordProgress>={};
 for(const a of answers){
  const p=result[a.wordId]??{wordId:a.wordId,seen:0,correct:0,mistakes:0,streak:0,lastAt:0,dueAt:0};
  p.seen++;p.correct+=Number(a.correct);p.mistakes+=Number(!a.correct);
  p.streak=a.correct?p.streak+1:0;p.lastAt=a.at;
  p.dueAt=a.at+(a.correct?([1,3,7][Math.min(p.streak-1,2)]*86400000):a.rating==='fuzzy'?6*3600000:0);
  result[a.wordId]=p;
 }
 return result;
}
