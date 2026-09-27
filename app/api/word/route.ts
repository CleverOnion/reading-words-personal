import {byId} from '../../../lib/vocabulary';
import {practiceExamples,uniqueExamples} from '../../../lib/word-examples';

export const dynamic='force-dynamic';
const json=(body:unknown,status=200)=>Response.json(body,{status,headers:{'Cache-Control':'private, max-age=3600'}});
export async function GET(request:Request){
 const uid=request.headers.get('oai-authenticated-user-id');
 if(!uid)return json({error:'请先登录，再查询单词。'},401);
 const raw=new URL(request.url).searchParams.get('word')?.trim()??'';
 if(!raw||raw.length>80||!/^[A-Za-z][A-Za-z' -]*$/.test(raw))return json({error:'请输入英文单词或短语。'},400);
 const local=[...byId.values()].find(item=>item.word.toLowerCase()===raw.toLowerCase());
 const definitions:string[]=[];
 const dictionaryExamples:string[]=[];
 try{
  const response=await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(raw)}`,{signal:AbortSignal.timeout(5000)});
  if(response.ok){
   const entries=await response.json() as {meanings?:{definitions?:{definition?:string;example?:string}[]}[]}[];
   for(const entry of entries)for(const meaning of entry.meanings??[])for(const definition of meaning.definitions??[]){
    if(definition.definition)definitions.push(definition.definition);
    if(definition.example)dictionaryExamples.push(definition.example);
   }
  }
 }catch{}
 const examples=uniqueExamples(dictionaryExamples);
 for(const example of practiceExamples(raw))if(examples.length<3)examples.push(example);
 return json({word:local?.word??raw,meaning:local?.meaning??(definitions.slice(0,3).join('；')||'暂未找到中文释义，请结合例句理解。'),definition:definitions[0]??null,examples});
}
