import {byId,words} from '../../../lib/vocabulary';
import {createExampleService} from '../../../lib/example-provider';
import {EXAMPLES_VERSION,normalizeWord,originalExamples,type Example} from '../../../lib/word-examples';

export const dynamic='force-dynamic';
const getExamples=createExampleService();
const json=(body:unknown,status=200,ttl=0)=>Response.json(body,{status,headers:{'Cache-Control':ttl?`private, max-age=${ttl}`:'no-store'}});

// Public example content only: never cache learning records or authentication.
function edgeCache():Cache|null{
 return typeof caches==='undefined'?null:(caches as CacheStorage&{default?:Cache}).default??null;
}
export async function GET(request:Request){
 if(!request.headers.get('oai-authenticated-user-id'))return json({error:'请先登录，再查看例句。'},401);
 const params=new URL(request.url).searchParams,id=params.get('wordId'),raw=params.get('word')?.trim()??'';
 const local=id?byId.get(id):words.find(word=>normalizeWord(word.word)===normalizeWord(raw));
 // This endpoint serves the notebook's entries, including sb./sth. and slashes.
 if(!local)return json({error:'未找到这个词条。'},400);
 const key=new Request(`https://example-cache.reading-notes.invalid/${EXAMPLES_VERSION}/${encodeURIComponent(local.id)}`);
 const cache=edgeCache();
 const result=(examples:Example[])=>({word:local.word,meaning:local.meaning,definition:null,examples,complete:examples.length>=3,version:EXAMPLES_VERSION});
 try{
  const authored=originalExamples(local.word);
  if(authored.length>=3)return json(result(authored),200,86400);
  if(cache){
   const hit=await cache.match(key).catch(()=>null);
   if(hit)return json(result(await hit.json() as Example[]),200,86400);
  }
  const examples=await getExamples(local.word,local.meaning);
  if(cache&&examples.length>=3)await cache.put(key,Response.json(examples,{headers:{'Cache-Control':'public, max-age=2592000'}})).catch(()=>{});
  return json(result(examples),200,examples.length>=3?86400:0);
 }catch{
  return json({error:'补充例句暂时未能加载，请重试。',examples:[],complete:false,version:EXAMPLES_VERSION},503);
 }
}
