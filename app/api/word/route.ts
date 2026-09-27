import {byId} from '../../../lib/vocabulary';
import {practiceExamples,practiceExampleTranslations,uniqueExamples} from '../../../lib/word-examples';

export const dynamic='force-dynamic';

export type WordExampleResult={text:string;translation:string;source:'dictionary'|'practice'};
export type WordResult={word:string;meaning:string;definition:string|null;examples:WordExampleResult[]};

const resultCache=new Map<string,WordResult>();
const pendingCache=new Map<string,Promise<WordResult>>();
const translationCache=new Map<string,string>();
const fallbackTranslation=(word:string)=>`例句参考：请结合上方释义理解“${word}”在句中的用法。`;
const json=(body:unknown,status=200)=>Response.json(body,{status,headers:{'Cache-Control':'private, max-age=3600'}});

async function translateExample(text:string,word:string){
 const key=text.trim().toLowerCase();
 const cached=translationCache.get(key);
 if(cached)return cached;
 try{
  const response=await fetch(`https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=en|zh-CN`,{signal:AbortSignal.timeout(1800)});
  if(response.ok){
   const body=await response.json() as {responseData?:{translatedText?:string}};
   const value=body.responseData?.translatedText?.trim();
   if(value&&value.toLowerCase()!==text.toLowerCase()){
    translationCache.set(key,value);
    return value;
   }
  }
 }catch{}
 const fallback=fallbackTranslation(word);
 translationCache.set(key,fallback);
 return fallback;
}

async function buildResult(raw:string):Promise<WordResult>{
 const local=[...byId.values()].find(item=>item.word.toLowerCase()===raw.toLowerCase());
 // Study words are already local, so do not wait on a remote dictionary for them.
 if(local){
  const texts=practiceExamples(local.word);
  const translations=practiceExampleTranslations(local.word);
  return {word:local.word,meaning:local.meaning,definition:null,examples:texts.map((text,index)=>({text,translation:translations[index],source:'practice'}))};
 }
 const definitions:string[]=[];
 const dictionaryExamples:string[]=[];
 try{
  const response=await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(raw)}`,{signal:AbortSignal.timeout(2500)});
  if(response.ok){
   const entries=await response.json() as {meanings?:{definitions?:{definition?:string;example?:string}[]}[]}[];
   for(const entry of entries)for(const meaning of entry.meanings??[])for(const definition of meaning.definitions??[]){
    if(definition.definition)definitions.push(definition.definition);
    if(definition.example)dictionaryExamples.push(definition.example);
   }
  }
 }catch{}
 const texts=uniqueExamples(dictionaryExamples);
 const translated=await Promise.all(texts.map(text=>translateExample(text,raw)));
 const examples:WordExampleResult[]=texts.map((text,index)=>({text,translation:translated[index],source:'dictionary'}));
 const practice=practiceExamples(raw);
 const practiceZh=practiceExampleTranslations(raw);
 for(let index=0;examples.length<3;index++)examples.push({text:practice[index],translation:practiceZh[index],source:'practice'});
 return {word:raw,meaning:definitions.slice(0,3).join('；')||'暂未找到中文释义，请结合例句理解。',definition:definitions[0]??null,examples};
}

async function getResult(raw:string){
 const key=raw.toLowerCase();
 const cached=resultCache.get(key);
 if(cached)return cached;
 const pending=pendingCache.get(key);
 if(pending)return pending;
 const request=buildResult(raw).then(value=>{resultCache.set(key,value);pendingCache.delete(key);return value}).catch(error=>{pendingCache.delete(key);throw error});
 pendingCache.set(key,request);
 return request;
}

export async function GET(request:Request){
 const uid=request.headers.get('oai-authenticated-user-id');
 if(!uid)return json({error:'请先登录，再查询单词。'},401);
 const raw=new URL(request.url).searchParams.get('word')?.trim()??'';
 if(!raw||raw.length>80||!/^[A-Za-z][A-Za-z' -]*$/.test(raw))return json({error:'请输入英文单词或短语。'},400);
 try{return json(await getResult(raw));}
 catch{return json({error:'查询暂时失败，请稍后再试。'},502);}
}
