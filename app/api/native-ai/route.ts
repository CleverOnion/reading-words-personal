import {env} from 'cloudflare:workers';
import {aiStatus,readInsight,saveAiConfig,queueAll,pauseAi,regenerateInsight,type AiEnv} from '../../../lib/native-ai-server';
export const dynamic='force-dynamic';
const json=(body:unknown,status=200)=>Response.json(body,{status,headers:{'Cache-Control':'no-store'}});
export async function GET(request:Request){
 const user=request.headers.get('oai-authenticated-user-id');if(!user)return json({error:'请先登录。'},401);
 try{const id=new URL(request.url).searchParams.get('wordId');return json(id?await readInsight(env as AiEnv,user,id):await aiStatus(env as AiEnv,user));}catch{return json({error:'AI 数据暂时无法读取，请稍后重试。'},503);}
}
export async function POST(request:Request){
 const user=request.headers.get('oai-authenticated-user-id');if(!user)return json({error:'请先登录。'},401);
 if(request.headers.get('origin')!==new URL(request.url).origin)return json({error:'请求来源不匹配。'},403);
 if(!request.headers.get('content-type')?.includes('application/json'))return json({error:'需要 JSON 请求。'},415);
 let body:Record<string,unknown>;
 try{
  const reader=request.body?.getReader();let size=0,raw='';const decoder=new TextDecoder();
  if(!reader)return json({error:'请求为空。'},400);
  while(true){const {done,value}=await reader.read();if(done)break;size+=value.byteLength;if(size>12000){await reader.cancel();return json({error:'请求过大。'},413);}raw+=decoder.decode(value,{stream:true});}
  const parsed=JSON.parse(raw+decoder.decode());if(!parsed||typeof parsed!=='object'||Array.isArray(parsed))return json({error:'请求格式不正确。'},400);body=parsed;
 }catch{return json({error:'请求格式不正确。'},400);}
 try{
  const e=env as AiEnv;
  if(body.action==='save')await saveAiConfig(e,user,body);
  else if(body.action==='start')await queueAll(e,user);
  else if(body.action==='pause')await pauseAi(e,user);
  else if(body.action==='generate'&&typeof body.wordId==='string')return json(await regenerateInsight(e,user,body.wordId));
  else return json({error:'不支持此操作。'},400);
  return json(await aiStatus(e,user));
 }catch(error){
  // Never return provider responses, request bodies, database errors or secrets.
  const message=error instanceof Error?error.message:'';
  const safe=/^(请|首次|未找到|已保存的密钥|服务器尚未配置)/.test(message);
  return json({error:safe?message:'AI 操作暂时失败，请稍后重试。'},400);
 }
}
