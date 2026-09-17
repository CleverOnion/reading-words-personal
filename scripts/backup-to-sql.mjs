import {readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';

const [input,output]=process.argv.slice(2);
if(!input||!output)throw new Error('Usage: node scripts/backup-to-sql.mjs backup.json output.sql');
const raw=await readFile(input,'utf8');const backup=JSON.parse(raw);
if(backup.format!=='reading-notes-backup'||backup.version!==1||!Array.isArray(backup.sessions)||!Array.isArray(backup.attempts))throw new Error('Unsupported backup');
const owners=new Set(backup.sessions.map(s=>s.user_id));
if(owners.size>1)throw new Error('Refusing multi-user backup');
const sessions=new Set(backup.sessions.map(s=>s.id));
if(sessions.size!==backup.sessions.length)throw new Error('Duplicate session IDs');
if(backup.attempts.some(a=>!sessions.has(a.session_id)))throw new Error('Orphaned answers');
const quote=v=>{
  if(v===null)return 'NULL';
  if(typeof v==='number'&&Number.isSafeInteger(v))return String(v);
  if(typeof v==='string'&&!v.includes('\0'))return "'"+v.replaceAll("'","''")+"'";
  throw new Error('Invalid backup value');
};
let sql='-- Reading Notes backup SHA-256: '+createHash('sha256').update(raw).digest('hex')+'\n';
const columns={sessions:['id','user_id','title','mode','queue','started_at','finished_at','status','updated_at'],attempts:['session_id','position','word_id','choice','correct','answered_at','duration']};
for(const [table,fields] of Object.entries(columns))for(const row of backup[table]){
  if(table==='sessions'){
    const queue=JSON.parse(row.queue);
    if(!Array.isArray(queue)||queue.some(id=>typeof id!=='string'))throw new Error('Invalid question queue');
  }
  // Additive only: retrying an import cannot overwrite newer practice.
  sql+=`INSERT OR IGNORE INTO ${table} (${fields.join(',')}) VALUES (${fields.map(f=>quote(row[f])).join(',')});\n`;
}
await writeFile(output,sql);
console.log(`Validated backup: ${backup.sessions.length} sessions, ${backup.attempts.length} answers. SQL written to ${output}`);
