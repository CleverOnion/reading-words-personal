import {findWordMatches} from './reading-matches.ts';

export type Entry={id:string;word:string;meaning:string;source?:string};
export type RelatedWord=Entry&{kind:'spelling'|'confusable';note?:string};
type ConfusableGroup={words:string[];note:string};
export type SpellingPart={text:string;changed:boolean};
const normalize=(word:string)=>word.trim().toLowerCase();

// Banded distance avoids allocating a full matrix for every dictionary word.
function closeDistance(a:string,b:string,limit:number){
 let older:number[]=[],previous=Array.from({length:b.length+1},(_,i)=>i);
 for(let i=1;i<=a.length;i++){
  const row=Array(b.length+1).fill(limit+1);row[0]=i;
  for(let j=Math.max(1,i-limit);j<=Math.min(b.length,i+limit);j++){
   row[j]=Math.min(previous[j]+1,row[j-1]+1,previous[j-1]+Number(a[i-1]!==b[j-1]));
   if(i>1&&j>1&&a[i-1]===b[j-2]&&a[i-2]===b[j-1])row[j]=Math.min(row[j],older[j-2]+1);
  }
  older=previous;previous=row;
 }
 return previous[b.length];
}

// Optimal string alignment: adjacent swapped letters count as one edit.
function matrix(a:string,b:string){
 const d=Array.from({length:a.length+1},(_,i)=>Array.from({length:b.length+1},(_,j)=>i===0?j:j===0?i:0));
 for(let i=1;i<=a.length;i++)for(let j=1;j<=b.length;j++){
  d[i][j]=Math.min(d[i-1][j]+1,d[i][j-1]+1,d[i-1][j-1]+Number(a[i-1]!==b[j-1]));
  if(i>1&&j>1&&a[i-1]===b[j-2]&&a[i-2]===b[j-1])d[i][j]=Math.min(d[i][j],d[i-2][j-2]+1);
 }
 return d;
}

export function createSimilarWordLookup(entries:Entry[],groups:ConfusableGroup[]=[],limit=3){
 const unique=new Map<string,Entry>();
 for(const entry of entries){const key=normalize(entry.word);if(/^[a-z]{3,24}$/.test(key)&&entry.meaning.trim()&&!unique.has(key))unique.set(key,entry);}
 const variants=new Map<string,Set<string>>();
 for(const key of unique.keys()){
  const forms=[key+'s',key+'ed',key+'ing'];
  if(key.endsWith('e'))forms.push(key+'d',key.slice(0,-1)+'ing');
  if(/[^aeiou]y$/.test(key))forms.push(key.slice(0,-1)+'ies',key.slice(0,-1)+'ied');
  if(/(?:s|x|z|ch|sh|o)$/.test(key))forms.push(key+'es');
  if(key.endsWith('ise'))forms.push(key.slice(0,-3)+'ize');
  if(key.endsWith('ize'))forms.push(key.slice(0,-3)+'ise');
  for(const form of forms){const bases=variants.get(form)??new Set<string>();bases.add(key);variants.set(form,bases);}
 }
 const buckets=new Map<number,[string,Entry][]>();
 for(const item of unique){const length=item[0].length;buckets.set(length,[...(buckets.get(length)??[]),item]);}
 const cache=new Map<string,RelatedWord[]>();
 return (word:string):RelatedWord[]=>{
  const original=normalize(word);
  if(!/^[a-z]{3,24}$/.test(original))return [];
  const cached=cache.get(original);if(cached)return cached;
  const bases=variants.get(original);
  const term=!unique.has(original)&&bases?.size===1?[...bases][0]:original;
  const maxDistance=term.length>=6?2:1;
  const curated=new Map<string,RelatedWord>();
  for(const group of groups)if(group.words.includes(term))for(const key of group.words){
   const entry=unique.get(key);
   if(entry&&key!==term&&!curated.has(key))curated.set(key,{...entry,kind:'confusable',note:group.note});
  }
  const ranked:{entry:Entry;distance:number;ratio:number}[]=[];
  for(let length=term.length-maxDistance;length<=term.length+maxDistance;length++)for(const [key,entry] of buckets.get(length)??[]){
   if(term===key||curated.has(key))continue;
   const distance=closeDistance(term,key,maxDistance);
   const ratio=distance/Math.max(term.length,key.length);
   if(distance>maxDistance||ratio>.34)continue;
   // Inflected forms and spelling variants are not distinct confusable words.
   if(findWordMatches(key,term).length||findWordMatches(term,key).length)continue;
   ranked.push({entry,distance,ratio});
  }
  ranked.sort((a,b)=>a.distance-b.distance||a.ratio-b.ratio||a.entry.word.localeCompare(b.entry.word,'en'));
  const result:RelatedWord[]=[...curated.values(),...ranked.map(item=>({...item.entry,kind:'spelling' as const}))].slice(0,limit);
  if(cache.size>=500)cache.delete(cache.keys().next().value!);
  cache.set(original,result);return result;
 };
}

// The syllabus defines membership; reading entries override definitions only.
export function syllabusEntries(syllabus:Entry[],reading:Entry[]):Entry[]{
 const preferred=new Map<string,Entry>();
 for(const entry of reading)if(entry.meaning.trim()&&!preferred.has(normalize(entry.word)))preferred.set(normalize(entry.word),entry);
 return syllabus.map(entry=>({...entry,meaning:preferred.get(normalize(entry.word))?.meaning??entry.meaning,source:preferred.has(normalize(entry.word))?'阅读词库释义':'大纲词表释义'}));
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
