import test from 'node:test';
import assert from 'node:assert/strict';
import {handlePrivate, type PrivateEnv} from '../deploy/cloudflare/private-worker.ts';

const origin='https://reading.example.com';
const password='generated-long-test-password-123456789';
const digest=Buffer.from(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(password))).toString('hex');
const env:PrivateEnv={PRIVATE_USER_ID:'personal-owner',PRIVATE_PASSWORD_HASH:digest,PRIVATE_SESSION_SECRET:'test-signing-key-with-more-than-32-characters'};
const next=async (r:Request)=>Response.json({uid:r.headers.get('oai-authenticated-user-id'),email:r.headers.get('oai-authenticated-user-email')});
const call=(path='/',init:RequestInit={},e=env)=>handlePrivate(new Request(origin+path,init),e,next);
async function login(){
 const r=await call('/auth/login',{method:'POST',headers:{origin,'Content-Type':'application/x-www-form-urlencoded'},body:new URLSearchParams({password})});
 assert.equal(r.status,303);
 return r.headers.get('Set-Cookie')!;
}
test('private API rejects anonymous and spoofed identity headers',async()=>{
 assert.equal((await call('/api/study')).status,401);
 assert.equal((await call('/api/study',{headers:{'oai-authenticated-user-id':'personal-owner'}})).status,401);
});
test('missing secrets fail closed',async()=>{assert.equal((await call('/',{},{})).status,503);});
test('configured personal password can be shorter than generated credentials',async()=>{
 const customPassword='sample123';
 const hash=Buffer.from(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(customPassword))).toString('hex');
 const customEnv={...env,PRIVATE_PASSWORD_HASH:hash};
 const r=await call('/auth/login',{method:'POST',headers:{origin,'Content-Type':'application/x-www-form-urlencoded'},body:new URLSearchParams({password:customPassword})},customEnv);
 assert.equal(r.status,303);
 const oldCookie=await login();
 assert.equal((await call('/api/study',{headers:{cookie:oldCookie}},customEnv)).status,401);
});
test('login validates password and rejects cross-origin form submits',async()=>{
 assert.equal((await call('/auth/login',{method:'POST',headers:{origin,'Content-Type':'application/x-www-form-urlencoded'},body:'password=wrong'})).status,401);
 assert.equal((await call('/auth/login',{method:'POST',headers:{origin:'https://attacker.example','Content-Type':'application/x-www-form-urlencoded'},body:new URLSearchParams({password})})).status,403);
 const cookie=await login();assert.match(cookie,/HttpOnly/);assert.match(cookie,/Secure/);assert.match(cookie,/SameSite=Strict/);
 const r=await call('/api/study',{headers:{cookie,'oai-authenticated-user-id':'attacker','oai-authenticated-user-email':'attacker@example.com'}});
 assert.deepEqual(await r.json(),{uid:'personal-owner',email:'owner@reading.local'});
});
test('tampered, expired and password-rotated cookies do not authenticate',async()=>{
 const cookie=await login();
 assert.equal((await call('/api/study',{headers:{cookie:cookie.replace('=','=x')}})).status,401);
 assert.equal((await call('/api/study',{headers:{cookie}}, {...env,PRIVATE_PASSWORD_HASH:'a'.repeat(64)})).status,401);
 const originalNow=Date.now;
 try {Date.now=()=>originalNow()+8*86400000;assert.equal((await call('/api/study',{headers:{cookie}})).status,401);} finally {Date.now=originalNow;}
});
test('authenticated mutations require same origin and sign-out clears the cookie',async()=>{
 const cookie=await login();
 assert.equal((await call('/api/study',{method:'POST',headers:{cookie,origin:'https://attacker.example'}})).status,403);
 assert.equal((await call('/auth/logout',{method:'POST',headers:{cookie,origin}})).headers.get('Set-Cookie')?.includes('Max-Age=0'),true);
});
