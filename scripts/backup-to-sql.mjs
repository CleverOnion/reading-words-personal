import {readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';

const [input,output]=process.argv.slice(2);
if(!input||!output)throw new Error('Usage: node scripts/backup-to-sql.mjs backup.json output.sql');
const raw=await readFile(input,'utf8');const backup=JSON.parse(raw);
if(backup.format!=='reading-notes-backup'||![1,2].includes(backup.version)||!Array.isArray(backup.sessions)||!Array.isArray(backup.attempts)||(backup.version===2&&!Array.isArray(backup.saved_words)))throw new Error('Unsupported backup');
backup.saved_words??=[];
backup.ai_notes??=[];
if(!Array.isArray(backup.ai_notes))throw new Error('Invalid AI notes');
const owners=new Set([...backup.sessions,...backup.saved_words,...backup.ai_notes].map(s=>s.user_id));
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
const columns={sessions:['id','user_id','title','mode','study_format','queue','started_at','finished_at','status','updated_at'],attempts:['session_id','position','word_id','choice','correct','rating','answered_at','duration'],saved_words:['user_id','word_id','saved_at'],ai_notes:['user_id','word_key','word_id','content','model','updated_at','status']};
for(const [table,fields] of Object.entries(columns))for(const row of backup[table]){
  if(table==='ai_notes'){const {parseInsight}=await import('../lib/native-ai-format.ts');parseInsight(row.content);row.status='ready';}
  if(table==='attempts'){row.rating??=null;if(row.rating!==null&&!['forgotten','fuzzy','remembered'].includes(row.rating))throw new Error('Invalid rating');}
  if(table==='sessions'){
    row.study_format??='choice';
    if(!['choice','recall'].includes(row.study_format))throw new Error('Invalid study format');
    const queue=JSON.parse(row.queue);
    if(!Array.isArray(queue)||queue.some(id=>typeof id!=='string'))throw new Error('Invalid question queue');
  }
  // Additive only: retrying an import cannot overwrite newer practice.
  sql+=`INSERT OR IGNORE INTO ${table} (${fields.join(',')}) VALUES (${fields.map(f=>quote(row[f])).join(',')});\n`;
}
await writeFile(output,sql);
console.log(`Validated backup: ${backup.sessions.length} sessions, ${backup.attempts.length} answers. SQL written to ${output}`);
