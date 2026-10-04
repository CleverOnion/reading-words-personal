export type RecallRating='forgotten'|'fuzzy'|'remembered';
export function isRecallRating(value:unknown):value is RecallRating{return value==='forgotten'||value==='fuzzy'||value==='remembered';}
export function answerRating(answer:{rating?:string|null;correct:boolean|number}):RecallRating{
 return isRecallRating(answer.rating)?answer.rating:answer.correct?'remembered':'forgotten';
}
export const ratingLabel={forgotten:'忘记了',fuzzy:'有点模糊',remembered:'没忘记'};

export function scheduleRecall(queue:string[],position:number,rating:RecallRating):string[]{
 const word=queue[position];
 if(!word||rating==='remembered'||queue.slice(position+1).includes(word))return queue;
 if(queue.slice(0,position+1).filter(id=>id===word).length>=3)return queue;
 const next=[...queue];
 next.splice(Math.min(queue.length,position+1+(rating==='forgotten'?3:6)),0,word);
 return next;
}

// Only the most recent judgement of a word controls its remaining returns.
export function reviseRecallQueue(queue:string[],answered:number,position:number,rating:RecallRating):string[]{
 const word=queue[position];
 if(!word||queue.slice(position+1,answered).includes(word))return queue;
 const next=[...queue.slice(0,answered),...queue.slice(answered).filter(id=>id!==word)];
 if(rating==='remembered'||next.slice(0,answered).filter(id=>id===word).length>=3)return next;
 next.splice(Math.min(next.length,answered+(rating==='forgotten'?3:6)),0,word);
 return next;
}
