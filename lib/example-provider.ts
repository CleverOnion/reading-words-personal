import {findWordMatches} from './reading-matches.ts';
import {type Example,isUsableExample,normalizeWord,originalExamples,selectExamples} from './word-examples.ts';

type SentencePair={sentence?:unknown;'sentence-eng'?:unknown;'sentence-translation'?:unknown;source?:unknown};
type CollinsSentence={eng_sent?:unknown;chn_sent?:unknown};
type CollinsSense={exam_sents?:{sent?:CollinsSentence[]}};
type DictionaryBody={blng_sents_part?:{'sentence-pair'?:SentencePair[]};collins?:{collins_entries?:{entries?:{entry?:{tran_entry?:CollinsSense[]}[]}}[]}};
const corrections:Record<string,string>={
 'the writing is on the well':'the writing is on the wall',
 'recorder-high':'record-high','telephone-number-si zed':'telephone-number-sized',
 'historically-low':'historically low','catalog(ue)':'catalogue',
};
export function dictionaryQuery(word:string){return corrections[normalizeWord(word)]??normalizeWord(word);}

// Provider HTML is converted to plain text, never inserted into the DOM.
export function plainText(value:unknown){
 if(typeof value!=='string')return '';
 return value.replace(/<[^>]*>/g,'').replace(/&(?:amp|quot|apos|lt|gt|nbsp);/g,entity=>({'&amp;':'&','&quot;':'"','&apos;':"'",'&lt;':'<','&gt;':'>','&nbsp;':' '}[entity]!))
  .replace(/&#(?:x([0-9a-f]+)|(\d+));/gi,(_,hex,dec)=>{const code=parseInt(hex??dec,hex?16:10);return code>=0&&code<=0x10ffff?String.fromCodePoint(code):''})
  .replace(/\s+/g,' ').trim();
}
export function parseDictionaryExamples(body:unknown,word:string,meaning=''):Example[]{
 if(!body||typeof body!=='object')return [];
 const data=body as DictionaryBody,candidates:Example[]=[];
 const sourceUrl=`https://dict.youdao.com/w/${encodeURIComponent(dictionaryQuery(word))}/`;
 const add=(en:unknown,zh:unknown,attribution:unknown)=>{
  const item:Example={text:plainText(en),translation:plainText(zh),source:'dictionary',attribution:plainText(attribution)||'有道双语例句',sourceUrl};
  if(isUsableExample(item)&&findWordMatches(item.text,dictionaryQuery(word)).length)candidates.push(item);
 };
 const pairs=data.blng_sents_part?.['sentence-pair'];
 if(Array.isArray(pairs))for(const pair of pairs)add(pair.sentence??pair['sentence-eng'],pair['sentence-translation'],pair.source);
 const entries=data.collins?.collins_entries;
 if(Array.isArray(entries))for(const entry of entries){
  const parts=entry.entries?.entry;
  if(Array.isArray(parts))for(const part of parts){
   const translations=part.tran_entry;
   if(Array.isArray(translations))for(const translation of translations){
    const examples=translation.exam_sents?.sent;
    if(Array.isArray(examples))for(const example of examples)add(example.eng_sent,example.chn_sent,'柯林斯英汉双解词典 · 有道');
   }
  }
 }
 // Rank by Chinese PDF senses; never replace the user's PDF definitions.
 const senses=meaning.replace(/\([^)]*\)|（[^）]*）/g,'').split(/[，,；;、。\s/]+/).map(s=>s.replace(/[^\u3400-\u9fff]/g,'')).filter(s=>s.length>=2);
 const score=(example:Example)=>senses.reduce((n,sense)=>n+(example.translation.includes(sense)?1:0),0);
 candidates.sort((a,b)=>score(b)-score(a));
 return selectExamples(null,candidates);
}
export async function fetchUsageExamples(word:string,meaning='',fetcher:typeof fetch=fetch):Promise<Example[]>{
 const authored=originalExamples(word);
 if(authored.length>=3)return authored;
 const response=await fetcher(`https://dict.youdao.com/jsonapi?q=${encodeURIComponent(dictionaryQuery(word))}&jsonversion=2&client=mobile`,{headers:{Accept:'application/json'},signal:AbortSignal.timeout(5500)});
 if(!response.ok)throw new Error('例句来源暂时不可用');
 const examples=parseDictionaryExamples(await response.json(),word,meaning);
 if(!examples.length)throw new Error('暂未找到符合要求的双语例句');
 return selectExamples(null,[...authored,...examples]);
}
type CacheItem={expires:number;examples:Example[]};
export function createExampleService(fetcher:typeof fetch=fetch,now=()=>Date.now()){
 const cache=new Map<string,CacheItem>(),pending=new Map<string,Promise<Example[]>>();
 return async (word:string,meaning='')=>{
  const key=normalizeWord(word)+'\n'+meaning,found=cache.get(key);
  if(found&&found.expires>now())return found.examples;
  const inFlight=pending.get(key);if(inFlight)return inFlight;
  const request=fetchUsageExamples(word,meaning,fetcher).then(examples=>{
   if(examples.length===3){
    if(cache.size>=512)cache.delete(cache.keys().next().value!);
    cache.set(key,{examples,expires:now()+86400000});
   }
   return examples;
  }).finally(()=>pending.delete(key));
  pending.set(key,request);return request;
 };
}
