import {rememberAnswer,type PastAnswer} from './practice-review.ts';

type Question={id:string;word:string;page:number;options:string[]};
type RecallState={queue?:string[];studyFormat:string;index:number;total:number;correct:number;answers:PastAnswer[];question:Question|null};
type Word={id:string;word:string;page:number;meaning:string};

// Use the server's exact queue, including shuffle, limits and wrong-word sessions.
// The last answer is confirmed before showing the final result.
export function previewRecall<T extends RecallState>(practice:T,choice:string|null,words:Map<string,Word>):T|null{
 if(practice.studyFormat!=='recall'||!practice.question||practice.index+1>=practice.total)return null;
 if(practice.queue?.[practice.index]!==practice.question.id)return null;
 const current=words.get(practice.question.id),next=words.get(practice.queue[practice.index+1]);
 if(!current||!next)return null;
 const correct=choice===current.meaning;
 return {...practice,index:practice.index+1,correct:practice.correct+Number(correct),
  answers:rememberAnswer(practice.answers,{position:practice.index,wordId:current.id,choice,correct}),
  question:{id:next.id,word:next.word,page:next.page,options:[]}};
}
