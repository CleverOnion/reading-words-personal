import {rememberAnswer,type PastAnswer} from './practice-review.ts';
import {scheduleRecall,type RecallRating} from './recall-policy.ts';

type Question={id:string;word:string;page:number;options:string[]};
type RecallState={queue?:string[];studyFormat:string;index:number;total:number;correct:number;answers:PastAnswer[];question:Question|null};
type Word={id:string;word:string;page:number;meaning:string};

// Use the server's exact queue, including shuffle, limits and wrong-word sessions.
// The last answer is confirmed before showing the final result.
export function previewRecall<T extends RecallState>(practice:T,choice:string|null,words:Map<string,Word>,rating?:RecallRating):T|null{
 if(practice.studyFormat!=='recall'||!practice.question)return null;
 if(practice.queue?.[practice.index]!==practice.question.id)return null;
 const current=words.get(practice.question.id);
 if(!current)return null;
 const resolved=rating??(choice===current.meaning?'remembered':'forgotten');
 const queue=scheduleRecall(practice.queue,practice.index,resolved);
 const next=words.get(queue[practice.index+1]);
 if(!current||!next)return null;
 const correct=resolved==='remembered';
 return {...practice,queue,total:queue.length,index:practice.index+1,correct:practice.correct+Number(correct),
  answers:rememberAnswer(practice.answers,{position:practice.index,wordId:current.id,choice,correct,...(rating?{rating}:{} )}),
  question:{id:next.id,word:next.word,page:next.page,options:[]}};
}
