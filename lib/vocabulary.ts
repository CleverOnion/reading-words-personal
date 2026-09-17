import data from '../data/vocabulary.json';
export type Word={id:string;word:string;meaning:string;page:number};
export type Passage={id:string;year:number;text:number;words:Word[]};
export const passages:Passage[]=data;
export const words=passages.flatMap(p=>p.words);
export const byId=new Map(words.map(w=>[w.id,w]));
export function shuffle<T>(items:T[],seed:number){
 const result=[...items];
 for(let i=result.length-1;i>0;i--){seed=(Math.imul(seed,1664525)+1013904223)>>>0;const j=seed%(i+1);[result[i],result[j]]=[result[j],result[i]];}
 return result;
}
export function optionsFor(wordId:string,sessionId:string,position:number){
 const word=byId.get(wordId)!;
 const seed=Array.from(sessionId+position).reduce((h,c)=>Math.imul(h,31)+c.charCodeAt(0),7)>>>0;
 const group=passages.find(p=>p.id===wordId.split('-').slice(0,2).join('-'))!;
 const meanings=[...new Set(shuffle(group.words,seed).filter(w=>w.word!==word.word&&w.meaning!==word.meaning).map(w=>w.meaning))].slice(0,3);
 return shuffle([word.meaning,...meanings],seed+7);
}
