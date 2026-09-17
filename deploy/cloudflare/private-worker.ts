export type PrivateEnv = {
  PRIVATE_USER_ID?: string;
  PRIVATE_PASSWORD_HASH?: string;
  PRIVATE_SESSION_SECRET?: string;
  DB?: D1Database;
};
const cookieName='__Host-reading_session';
const lifetime=7*86400;
const encoder=new TextEncoder();
const hex=(buffer:ArrayBuffer)=>Array.from(new Uint8Array(buffer),v=>v.toString(16).padStart(2,'0')).join('');
const digest=async(value:string)=>hex(await crypto.subtle.digest('SHA-256',encoder.encode(value)));
const signingKey=(secret:string)=>crypto.subtle.importKey('raw',encoder.encode(secret),{name:'HMAC',hash:'SHA-256'},false,['sign','verify']);
const cookie=(value:string,age=lifetime)=>`${cookieName}=${value}; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=${age}`;
function safeReturn(value:string|null){
  if(!value||!value.startsWith('/')||value.startsWith('//'))return '/';
  const url=new URL(value,'https://reading.local');
  return url.origin==='https://reading.local'&&!/^\/(auth|signin-with-chatgpt|signout-with-chatgpt)/.test(url.pathname)?url.pathname+url.search:'/';
}
function loginPage(message='',returnTo='/',status=200){
  const escape=(s:string)=>s.replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]!));
  return new Response(`<!doctype html><html lang="zh-CN"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>登录 · 读词</title><style>html{background:#f5f5ed;color:#30372d;font-family:"Microsoft YaHei",sans-serif}body{margin:0;min-height:100svh;display:grid;place-items:center}main{width:min(360px,calc(100% - 64px));padding:48px 0}small{letter-spacing:3px;color:#849070}h1{font-family:Georgia,"SimSun",serif;font-size:48px;font-weight:500;margin:18px 0}p{color:#737f65;line-height:1.8}label{display:block;margin:32px 0 10px;font-size:14px}input,button{box-sizing:border-box;width:100%;border-radius:6px;padding:14px;font:inherit}input{background:#fffef8;border:1px solid #cdd4bf}input:focus-visible,button:focus-visible{outline:2px solid #77925c;outline-offset:3px}button{border:0;background:#303c29;color:white;margin-top:16px;cursor:pointer}.error{color:#a04c35;font-size:14px}</style></head><body><main><small>READING NOTES</small><h1>读词。</h1><p>你的阅读与积累，接着上次继续。</p><form method="post" action="/auth/login"><input type="hidden" name="returnTo" value="${escape(returnTo)}"><label for="password">个人访问密码</label><input id="password" name="password" type="password" autocomplete="current-password" required maxlength="256" autofocus>${message?`<p class="error" role="alert">${escape(message)}</p>`:''}<button type="submit">进入阅读书架 →</button></form></main></body></html>`,{status,headers:{'Content-Type':'text/html; charset=utf-8','Cache-Control':'no-store','Content-Security-Policy':"default-src 'none'; style-src 'unsafe-inline'; form-action 'self'; base-uri 'none'; frame-ancestors 'none'",'X-Content-Type-Options':'nosniff','Referrer-Policy':'no-referrer'}});
}
const error=(message:string,status:number)=>Response.json({error:message},{status,headers:{'Cache-Control':'no-store'}});
const redirect=(to:string,sessionCookie?:string)=>new Response(null,{status:303,headers:{Location:to,'Cache-Control':'no-store',...(sessionCookie?{'Set-Cookie':sessionCookie}:{})}});

async function authenticated(request:Request,env:PrivateEnv){
  const matches=(request.headers.get('cookie')||'').split(';').map(v=>v.trim()).filter(v=>v.startsWith(cookieName+'='));
  if(matches.length!==1)return false;
  const token=matches[0].slice(cookieName.length+1);
  const [expires,nonce,signature,...rest]=token.split('.');
  if(rest.length||!/^\d{10}$/.test(expires)||!/^\w{32}$/.test(nonce)||!signature||!/^[a-f0-9]{64}$/.test(signature))return false;
  const now=Math.floor(Date.now()/1000);
  if(Number(expires)<=now||Number(expires)>now+lifetime)return false;
  const key=await signingKey(env.PRIVATE_SESSION_SECRET!);
  const bytes=Uint8Array.from(signature.match(/../g)!,v=>parseInt(v,16));
  return crypto.subtle.verify('HMAC',key,bytes,encoder.encode(`${expires}.${nonce}.${env.PRIVATE_PASSWORD_HASH}`));
}

export async function handlePrivate(request: Request, env: PrivateEnv, next: (request: Request) => Promise<Response>): Promise<Response> {
  if(!env.PRIVATE_USER_ID||!env.PRIVATE_SESSION_SECRET||env.PRIVATE_SESSION_SECRET.length<32||!env.PRIVATE_PASSWORD_HASH||!/^[a-f0-9]{64}$/.test(env.PRIVATE_PASSWORD_HASH))return error('网站登录尚未配置完成。',503);
  const url=new URL(request.url);
  const mutation=!['GET','HEAD','OPTIONS'].includes(request.method);
  if(mutation&&(request.headers.get('origin')!==url.origin||request.headers.get('sec-fetch-site')==='cross-site'))return error('请求来源不匹配。',403);
  if(url.pathname==='/auth/login'||url.pathname==='/signin-with-chatgpt'){
    if(request.method==='GET')return loginPage('',safeReturn(url.searchParams.get('return_to')));
    if(request.method!=='POST')return error('不支持此操作。',405);
    if(!request.headers.get('content-type')?.startsWith('application/x-www-form-urlencoded'))return error('登录格式不正确。',400);
    // Bound form size even when Content-Length is absent or untrusted.
    const reader=request.body?.getReader();let size=0;const chunks:Uint8Array[]=[];
    if(reader)while(true){const {done,value}=await reader.read();if(done)break;size+=value.byteLength;if(size>2048){await reader.cancel();return error('请求过大。',413);}chunks.push(value);}
    const bytes=new Uint8Array(size);let offset=0;for(const part of chunks){bytes.set(part,offset);offset+=part.length;}
    const form=new URLSearchParams(new TextDecoder().decode(bytes));
    const password=form.get('password')||'';const returnTo=safeReturn(form.get('returnTo'));
    const actual=await digest(password);
    let difference=actual.length^env.PRIVATE_PASSWORD_HASH.length;
    for(let i=0;i<actual.length;i++)difference|=actual.charCodeAt(i)^env.PRIVATE_PASSWORD_HASH.charCodeAt(i);
    if(!password.length||password.length>256||difference)return loginPage('密码不正确，请重试。',returnTo,401);
    const expires=Math.floor(Date.now()/1000)+lifetime;const nonce=crypto.randomUUID().replaceAll('-','');
    const signature=hex(await crypto.subtle.sign('HMAC',await signingKey(env.PRIVATE_SESSION_SECRET),encoder.encode(`${expires}.${nonce}.${env.PRIVATE_PASSWORD_HASH}`)));
    return redirect(returnTo,cookie(`${expires}.${nonce}.${signature}`));
  }
  if(!await authenticated(request,env)){
    if(url.pathname.startsWith('/api/'))return error('请先登录，再保存你的学习记录。',401);
    return redirect('/auth/login?return_to='+encodeURIComponent(safeReturn(url.pathname+url.search)));
  }
  if(url.pathname==='/auth/logout')return request.method==='POST'?redirect('/auth/login',cookie('',0)):error('请使用退出按钮。',405);
  if(url.pathname==='/api/backup'){
    if(request.method!=='GET')return error('不支持此操作。',405);
    if(!env.DB)return error('数据库不可用。',503);
    const [sessions,attempts]=await env.DB.batch([
      env.DB.prepare('SELECT * FROM sessions WHERE user_id = ? ORDER BY started_at, id').bind(env.PRIVATE_USER_ID),
      env.DB.prepare('SELECT a.* FROM attempts a JOIN sessions s ON s.id = a.session_id WHERE s.user_id = ? ORDER BY a.session_id, a.position').bind(env.PRIVATE_USER_ID)
    ]);
    return Response.json({format:'reading-notes-backup',version:1,exportedAt:new Date().toISOString(),sessions:sessions.results,attempts:attempts.results},{headers:{'Content-Disposition':`attachment; filename="reading-notes-${new Date().toISOString().slice(0,10)}.json"`,'Cache-Control':'no-store','X-Content-Type-Options':'nosniff'}});
  }
  const headers=new Headers(request.headers);
  for(const name of [...headers.keys()])if(name.startsWith('oai-authenticated-user-'))headers.delete(name);
  headers.set('oai-authenticated-user-id',env.PRIVATE_USER_ID);
  headers.set('oai-authenticated-user-email','owner@reading.local');
  const response=await next(new Request(request,{headers}));
  const result=new Response(response.body,response);
  result.headers.set('Cache-Control','private, no-store');
  result.headers.set('X-Content-Type-Options','nosniff');
  result.headers.set('Referrer-Policy','same-origin');
  return result;
}
