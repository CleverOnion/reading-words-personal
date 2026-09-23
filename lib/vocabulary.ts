import data from '../data/vocabulary.json';
export type Word={id:string;word:string;meaning:string;page:number;source?:string;section?:string};
export type Passage={id:string;year:number;text:number;words:Word[]};
export const passages:Passage[]=data;
export const words=passages.flatMap(p=>p.words);
export const byId=new Map(words.map(w=>[w.id,w]));
export function wordSource(id:string){
 const w=byId.get(id) as Word|undefined;
 if(!w)return '';
 if(w.source==='kongka')return `空卡 PDF 第 ${w.page} 页 · ${w.section==='options'?'选项词':'段落词'}`;
 return `词库第 ${w.page} 页`;
}
export function shuffle<T>(items:T[],seed:number){
 const result=[...items];
 for(let i=result.length-1;i>0;i--){seed=(Math.imul(seed,1664525)+1013904223)>>>0;const j=seed%(i+1);[result[i],result[j]]=[result[j],result[i]];}
 return result;
}
export function optionsFor(wordId:string,sessionId:string,position:number){
 const word=byId.get(wordId);
 if(!word)throw new Error('Unknown vocabulary entry');
 const seed=Array.from(sessionId+position).reduce((h,c)=>Math.imul(h,31)+c.charCodeAt(0),7)>>>0;
 const group=passages.find(p=>p.id===wordId.split('-').slice(0,2).join('-'))!;
 const meanings=[...new Set(shuffle(group.words,seed).filter(w=>w.word!==word.word&&w.meaning!==word.meaning).map(w=>w.meaning))].slice(0,3);
 const options=shuffle([word.meaning,...meanings],seed+7);
 assertQuestion({id:wordId,word:word.word,options});
 return options;
}
export function assertQuestion(q:{id:string;word:string;options:string[]}){
 const w=byId.get(q.id);
 if(!w||q.word!==w.word||q.options.length!==4||new Set(q.options).size!==4||q.options.filter(o=>o===w.meaning).length!==1)
  throw new Error('题目与释义不一致，已停止展示。请刷新页面后继续，已保存进度不会丢失。');
}
