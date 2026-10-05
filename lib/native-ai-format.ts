export type NativeInsight={intuition:string;register:string;collocations:{en:string;zh:string}[];pitfall:string;example:{en:string;zh:string}};
export function normalizeBase(raw:string){
 let url:URL;try{url=new URL(raw.trim());}catch{throw new Error('请填写完整的 HTTPS Base URL。');}
 const host=url.hostname.toLowerCase();
 if(url.protocol!=='https:'||url.username||url.password||url.search||url.hash||url.port&&url.port!=='443'||!host.includes('.')||host==='localhost'||/\.(localhost|local|internal)$/.test(host)||host.includes(':')||/^[\d.]+$/.test(host))throw new Error('请使用公开服务的 HTTPS 地址，不含账号、参数或端口。');
 url.pathname=url.pathname.replace(/\/+$/,'').replace(/\/chat\/completions$/,'');
 return url.href.replace(/\/$/,'');
}
export function parseInsight(raw:string):NativeInsight{
 let data:unknown;try{data=JSON.parse(raw.trim().replace(/^```(?:json)?\s*/i,'').replace(/\s*```$/,''));}catch{throw new Error('模型未返回有效 JSON，请重试或更换模型。');}
 const d=data as NativeInsight;
 const text=(s:unknown,max:number,chinese=false)=>typeof s==='string'&&s.trim().length>0&&s.length<=max&&(!chinese||/\p{Script=Han}/u.test(s));
 if(!d||!text(d.intuition,650,true)||!text(d.register,350,true)||!text(d.pitfall,450,true)||!Array.isArray(d.collocations)||d.collocations.length<2||d.collocations.length>4||!d.collocations.every(c=>c&&text(c.en,120)&&text(c.zh,160,true))||!d.example||!text(d.example.en,400)||!text(d.example.zh,400,true))throw new Error('模型内容不完整或过长，请重新生成。');
 return {intuition:d.intuition.trim(),register:d.register.trim(),collocations:d.collocations.map(c=>({en:c.en.trim(),zh:c.zh.trim()})),pitfall:d.pitfall.trim(),example:{en:d.example.en.trim(),zh:d.example.zh.trim()}};
}
const encoder=new TextEncoder();
async function encryptionKey(secret:string){
 if(secret.length<32)throw new Error('服务器尚未配置密钥保护。');
 return crypto.subtle.importKey('raw',await crypto.subtle.digest('SHA-256',encoder.encode('native-ai:'+secret)),'AES-GCM',false,['encrypt','decrypt']);
}
function b64(bytes:Uint8Array){return btoa(String.fromCharCode(...bytes));}
export async function sealKey(value:string,secret:string,user:string){
 const iv=crypto.getRandomValues(new Uint8Array(12));
 const encrypted=await crypto.subtle.encrypt({name:'AES-GCM',iv,additionalData:encoder.encode(user)},await encryptionKey(secret),encoder.encode(value));
 return b64(iv)+'.'+b64(new Uint8Array(encrypted));
}
export async function openKey(value:string,secret:string,user:string){
 const [iv,body]=value.split('.');
 try{return new TextDecoder().decode(await crypto.subtle.decrypt({name:'AES-GCM',iv:Uint8Array.from(atob(iv),c=>c.charCodeAt(0)),additionalData:encoder.encode(user)},await encryptionKey(secret),Uint8Array.from(atob(body),c=>c.charCodeAt(0))));}catch{throw new Error('已保存的密钥无法读取，请重新填写 API Key。');}
}
