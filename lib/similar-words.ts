import {findWordMatches} from './reading-matches.ts';

type Entry={id:string;word:string;meaning:string};
export type SpellingPart={text:string;changed:boolean};
const normalize=(word:string)=>word.trim().toLowerCase();

// Optimal string alignment: adjacent swapped letters count as one edit.
function matrix(a:string,b:string){
 const d=Array.from({length:a.length+1},(_,i)=>Array.from({length:b.length+1},(_,j)=>i===0?j:j===0?i:0));
 for(let i=1;i<=a.length;i++)for(let j=1;j<=b.length;j++){
  d[i][j]=Math.min(d[i-1][j]+1,d[i][j-1]+1,d[i-1][j-1]+Number(a[i-1]!==b[j-1]));
  if(i>1&&j>1&&a[i-1]===b[j-2]&&a[i-2]===b[j-1])d[i][j]=Math.min(d[i][j],d[i-2][j-2]+1);
 }
 return d;
}

export function createSimilarWordLookup(entries:Entry[]){
 const unique=new Map<string,Entry>();
 for(const entry of entries){const key=normalize(entry.word);if(/^[a-z]{3,24}$/.test(key)&&entry.meaning.trim()&&!unique.has(key))unique.set(key,entry);}
 const buckets=new Map<number,[string,Entry][]>();
 for(const item of unique){const length=item[0].length;buckets.set(length,[...(buckets.get(length)??[]),item]);}
 const cache=new Map<string,Entry[]>();
 return (word:string):Entry[]=>{
  const term=normalize(word);
  if(!/^[a-z]{3,24}$/.test(term))return [];
  const cached=cache.get(term);if(cached)return cached;
  const maxDistance=term.length>=6?2:1;
  const ranked:{entry:Entry;distance:number;ratio:number}[]=[];
  for(let length=term.length-maxDistance;length<=term.length+maxDistance;length++)for(const [key,entry] of buckets.get(length)??[]){
   if(term===key)continue;
   const distance=matrix(term,key)[term.length][key.length];
   const ratio=distance/Math.max(term.length,key.length);
   if(distance>maxDistance||ratio>.34)continue;
   // Inflected forms and spelling variants are not distinct confusable words.
   if(findWordMatches(key,term).length||findWordMatches(term,key).length)continue;
   ranked.push({entry,distance,ratio});
  }
  ranked.sort((a,b)=>a.distance-b.distance||a.ratio-b.ratio||a.entry.word.localeCompare(b.entry.word,'en'));
  const result=ranked.slice(0,3).map(item=>item.entry);
  if(cache.size>=500)cache.delete(cache.keys().next().value!);
  cache.set(term,result);return result;
 };
}

export function spellingDifference(original:string,candidate:string){
 const a=original.toLowerCase(),b=candidate.toLowerCase(),d=matrix(a,b);
 const left=Array(a.length).fill(false),right=Array(b.length).fill(false);
 let i=a.length,j=b.length;
 while(i||j){
  if(i&&j&&a[i-1]===b[j-1]&&d[i][j]===d[i-1][j-1]){i--;j--;}
  else if(i>1&&j>1&&a[i-1]===b[j-2]&&a[i-2]===b[j-1]&&d[i][j]===d[i-2][j-2]+1){left[i-1]=left[i-2]=right[j-1]=right[j-2]=true;i-=2;j-=2;}
  else if(i&&j&&d[i][j]===d[i-1][j-1]+1){left[--i]=true;right[--j]=true;}
  else if(j&&d[i][j]===d[i][j-1]+1){right[--j]=true;}
  else {left[--i]=true;}
 }
 const parts=(text:string,changed:boolean[])=>{
  const result:SpellingPart[]=[];
  for(let k=0;k<text.length;k++){const last=result.at(-1);if(last&&last.changed===changed[k])last.text+=text[k];else result.push({text:text[k],changed:changed[k]});}
  return result;
 };
 return {original:parts(original,left),candidate:parts(candidate,right)};
}
