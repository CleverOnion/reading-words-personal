import {cp, mkdir, readFile, writeFile} from 'node:fs/promises';
import path from 'node:path';
import ts from 'typescript';

// Reads only account IDs and resource names, never authentication credentials.
const configPath=process.argv[2]||'.cloudflare-private/deployment.json';
const target=JSON.parse(await readFile(configPath,'utf8'));
for(const key of ['account_id','database_id','database_name','worker_name','user_id']){
  if(typeof target[key]!=='string'||!target[key])throw new Error('Missing deployment setting: '+key);
}
if(!/^[a-z0-9][a-z0-9-]*$/.test(target.worker_name))throw new Error('Invalid Worker name');
await mkdir('.cloudflare-build',{recursive:true});
await cp('dist/server','.cloudflare-build/server',{recursive:true});
await cp('dist/client','.cloudflare-build/client',{recursive:true});
await cp('drizzle','.cloudflare-build/drizzle',{recursive:true});
const source=await readFile('deploy/cloudflare/private-worker.ts','utf8');
const {outputText}=ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022}});
await writeFile('.cloudflare-build/server/private-worker.js',outputText);
await writeFile('.cloudflare-build/server/private-entry.js',`import app from './index.js';
import {handlePrivate} from './private-worker.js';
export default {fetch(request,env,ctx){return handlePrivate(request,env,async(trusted)=>{
  if(trusted.method==='GET'||trusted.method==='HEAD'){
    const asset=await env.ASSETS.fetch(trusted);
    if(asset.status!==404)return asset;
  }
  return app.fetch(trusted,env,ctx);
});}};
`);
const original=JSON.parse(await readFile('dist/server/wrangler.json','utf8'));
const config={
  name:target.worker_name,account_id:target.account_id,
  main:'server/private-entry.js',compatibility_date:original.compatibility_date,
  compatibility_flags:original.compatibility_flags,no_bundle:true,
  rules:original.rules,workers_dev:true,preview_urls:false,
  // Every request passes through the private entrypoint, including assets.
  assets:{directory:'client',binding:'ASSETS',run_worker_first:true},
  d1_databases:[{binding:'DB',database_name:target.database_name,database_id:target.database_id,migrations_dir:'drizzle'}],
  vars:{PRIVATE_DEPLOYMENT:'1',PRIVATE_USER_ID:target.user_id},
  observability:{enabled:false}
};
await writeFile('.cloudflare-build/wrangler.json',JSON.stringify(config,null,2)+'\n');
console.log('Prepared private Worker:',target.worker_name);
console.log('Config:',path.resolve('.cloudflare-build/wrangler.json'));
