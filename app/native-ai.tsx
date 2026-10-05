'use client';
import {useEffect,useRef,useState} from 'react';
import {createPortal} from 'react-dom';
import {Sparkles,RotateCcw,X,Settings2,Check,ArrowUpRight} from 'lucide-react';
import type {NativeInsight} from '../lib/native-ai-format';
import {words} from '../lib/vocabulary';
import './native-ai.css';

type Status={settings:{baseUrl:string;model:string;hasKey:boolean}|null;job:{status:string;last_error:string|null};counts:{ready:number;pending:number;generating:number;error:number};saved:number;total:number};
type Note={status:string;content:NativeInsight|null;model:string|null;error:string|null;updatedAt:number|null};
async function api<T>(data?:Record<string,unknown>,wordId?:string):Promise<T>{
 const r=await fetch('/api/native-ai'+(wordId?'?wordId='+encodeURIComponent(wordId):''),data?{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(data)}:{cache:'no-store'});
 const value=await r.json() as T&{error?:string};if(!r.ok)throw new Error(value.error||'暂时无法连接 AI 服务。');return value;
}
const memory=new Map<string,Note>();
export function NativeInsightPanel({wordId,onSettings}:{wordId:string;onSettings:()=>void}){
 const [note,setNote]=useState<Note|null>(memory.get(wordId)??null),[busy,setBusy]=useState(false),[error,setError]=useState('');
 const alive=useRef(true),locked=useRef(false);
 useEffect(()=>{alive.current=true;async function load(){try{const n=await api<Note>(undefined,wordId);if(!alive.current)return;setNote(n);memory.set(wordId,n);}catch{if(alive.current)setError('语感内容暂未加载，请重试。');}}void load();return()=>{alive.current=false;};},[wordId]);
 useEffect(()=>{if(busy||!['pending','generating'].includes(note?.status??''))return;const timer=setInterval(()=>{void api<Note>(undefined,wordId).then(n=>{if(alive.current){setNote(n);memory.set(wordId,n);}}).catch(()=>{});},5000);return()=>clearInterval(timer);},[wordId,note?.status,busy]);
 async function generate(){if(locked.current)return;locked.current=true;setBusy(true);setError('');try{const n=await api<Note>({action:'generate',wordId});memory.clear();if(alive.current){setNote(n);memory.set(wordId,n);if(n.error)setError(n.error);}}catch(e){if(alive.current)setError((e as Error).message);}finally{locked.current=false;if(alive.current)setBusy(false);}}
 const c=note?.content;
 return <section className="native-insight" aria-label="AI 母语语感"><header><span><Sparkles size={14}/>母语语感 <small>AI</small></span><button title="AI 服务设置" aria-label="AI 服务设置" onClick={onSettings}><Settings2 size={14}/></button></header>
 {c?<><p className="native-intuition">{c.intuition}</p><div className="native-register">{c.register}</div><ul className="native-chunks">{c.collocations.map((pair,i)=><li key={i}><span>{pair.en}</span><small>{pair.zh}</small></li>)}</ul><details><summary>用词分寸与例句 <ArrowUpRight size={12}/></summary><p>{c.pitfall}</p><blockquote><span lang="en">{c.example.en}</span><small>{c.example.zh}</small></blockquote></details></>:<p className="native-empty">{note?.status==='pending'||note?.status==='generating'?'已排队，生成后会自动显示。':'从直觉、语气和搭配理解这个词。配置 AI 后可一次生成整个词库。'}</p>}
 {(error||note?.error)&&<p className="native-error" role="alert">{error||note?.error}</p>}
 <footer><button disabled={busy||note?.status==='generating'} onClick={generate}><RotateCcw size={12} className={busy?'native-spin':''}/>{busy?'正在生成…':c?'重新生成':'生成语感'}</button>{c&&<small title={note?.model??''}>AI 生成 · 供理解参考</small>}{!c&&<button onClick={onSettings}>配置服务</button>}</footer>
 </section>;
}

export function NativeAiSettings({onClose}:{onClose:()=>void}){
 const dialog=useRef<HTMLDialogElement>(null),alive=useRef(true);
 const [state,setState]=useState<Status|null>(null),[base,setBase]=useState(''),[model,setModel]=useState(''),[key,setKey]=useState('');
 const [busy,setBusy]=useState(false),[error,setError]=useState(''),[message,setMessage]=useState(''),[preview,setPreview]=useState<NativeInsight|null>(null);
 const [sample,setSample]=useState(words.find(w=>w.word==='nail')?.id??words[0].id);
 useEffect(()=>{alive.current=true;dialog.current?.showModal();void api<Status>().then(s=>{if(!alive.current)return;setState(s);setBase(s.settings?.baseUrl??'');setModel(s.settings?.model??'');}).catch(e=>{if(alive.current)setError(e.message);});return()=>{alive.current=false;};},[]);
 useEffect(()=>{if(!state)return;const timer=setInterval(()=>{void api<Status>().then(s=>{if(alive.current)setState(s);}).catch(()=>{});},5000);return()=>clearInterval(timer);},[!!state]);
 const dirty=!!key||base!==(state?.settings?.baseUrl??'')||model!==(state?.settings?.model??'');
 async function act(action:'save'|'start'|'pause'|'sample'){
  if(busy)return;setBusy(true);setError('');setMessage('');
  try{
   if(action==='save'||action==='sample'&&dirty){const s=await api<Status>({action:'save',baseUrl:base,model,apiKey:key});if(!alive.current)return;setState(s);setBase(s.settings!.baseUrl);setKey('');setMessage('配置已加密保存。');}
   if(action==='sample'){const n=await api<Note>({action:'generate',wordId:sample});memory.clear();if(!alive.current)return;if(n.error)throw new Error(n.error);setPreview(n.content);setMessage('连接成功，这份试生成也已保存。');setState(await api<Status>());}
   if(action==='start'||action==='pause'){const s=await api<Status>({action});if(!alive.current)return;setState(s);setMessage(action==='start'?'已加入后台队列，关闭页面后仍会继续。首次调度可能需要几分钟。':'已暂停；正在生成的少量词条会完成保存。');}
  }catch(e){if(alive.current)setError((e as Error).message);}finally{if(alive.current)setBusy(false);}
 }
 const completed=state?(state.counts.ready+state.counts.error):0;
 return createPortal(<dialog ref={dialog} className="native-settings" onCancel={onClose} onClose={onClose} aria-labelledby="native-settings-title"><header><div><span className="native-eyebrow">A NOTE BEHIND EVERY WORD</span><h2 id="native-settings-title">让单词有语感</h2></div><button onClick={onClose} aria-label="关闭 AI 设置"><X size={20}/></button></header><div className="native-settings-body"><p className="native-settings-intro">一次生成，反复阅读。把你的模型接进读词，为每个词留下一段关于直觉、搭配与分寸的说明。</p>
 <form onSubmit={e=>{e.preventDefault();void act('save');}}><label>Base URL<input type="url" required placeholder="https://你的服务地址/v1" value={base} maxLength={1024} onChange={e=>setBase(e.target.value)} autoComplete="off"/></label><label>模型名称<input required placeholder="填写服务商提供的模型 ID" value={model} maxLength={200} onChange={e=>setModel(e.target.value)} autoComplete="off"/></label><label>API Key <span>{state?.settings?.hasKey?'已保存 · 留空保留':''}</span><input type="password" placeholder={state?.settings?.hasKey?'更换密钥时再填写':'仅发送到你指定的服务'} value={key} maxLength={4096} onChange={e=>setKey(e.target.value)} autoComplete="new-password"/></label><p className="native-help">兼容 OpenAI Chat Completions 格式。密钥在服务端加密保存，不回传浏览器。更换配置会暂停批量任务，已生成内容保留。</p><button className="native-primary" disabled={busy||!state} type="submit"><Check size={14}/>保存配置</button></form>
 <section className="native-sample"><h3><span>01</span> 先看一个词</h3><p>用一次真实请求检查连接和内容质量。</p><div className="native-sample-controls"><select aria-label="试生成单词" value={sample} onChange={e=>setSample(e.target.value)}>{['nail','critical','desert','run','intensive'].map(word=>words.find(w=>w.word===word)).filter(w=>!!w).map(w=><option value={w!.id} key={w!.id}>{w!.word}</option>)}</select><button disabled={busy||!base||!model} onClick={()=>void act('sample')}>{busy?'处理中…':'试生成'}</button></div>{preview&&<div className="native-sample-preview"><p>{preview.intuition}</p><small>{preview.register}</small><p>{preview.example.en}<br/>{preview.example.zh}</p></div>}</section>
 <section className="native-batch"><h3><span>02</span> 为整个词库做准备</h3><p>共 {state?.total??'—'} 个去重词头。同词跨篇共享，结合词库收录义项生成；已有结果自动跳过，失败项可重试。</p><div className="native-batch-progress"><strong>{state?.saved??0}<small> / {state?.total??'—'} 已保存</small></strong><span>{state?.job.status==='running'?'后台生成中':state?.job.status==='paused'?'已暂停':state?.job.status==='completed'?'本轮已处理':'尚未开始'}</span></div><progress aria-label="批量生成进度" max={state?.total||1} value={completed}/><div className="native-batch-counts"><span>待处理 {state?.counts.pending??0}</span><span>生成中 {state?.counts.generating??0}</span><span>失败 {state?.counts.error??0}</span></div><p className="native-help">全量会向你的服务发送数千次请求，费用取决于所选模型。可随时暂停；关闭浏览器也会继续。失败重生成时保留上一版内容。</p><div className="native-batch-actions"><button className="native-primary" disabled={busy||!state?.settings||dirty||state.job.status==='running'} onClick={()=>void act('start')}>{state?.saved?'继续生成 / 重试失败':'开始全量生成'}</button><button disabled={busy||state?.job.status!=='running'} onClick={()=>void act('pause')}>暂停</button></div>{dirty&&<small className="native-help">先保存新配置，再启动全量任务。</small>}{state?.job.last_error&&<p className="native-error">{state.job.last_error}</p>}</section>
 {error&&<p className="native-error" role="alert">{error}</p>}{message&&<p className="native-success" role="status">{message}</p>}
 </div></dialog>,document.body);
}
