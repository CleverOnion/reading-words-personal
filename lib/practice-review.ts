import type {RecallRating} from './recall-policy.ts';
export type PastAnswer={position:number;wordId:string;choice:string|null;correct:boolean;rating?:RecallRating};
export function rememberAnswer(answers:PastAnswer[],answer:PastAnswer):PastAnswer[]{
 // A retried save for the same position must never duplicate a review entry.
 if(answers.some(item=>item.position===answer.position))return answers;
 return [...answers,answer].sort((a,b)=>a.position-b.position);
}
