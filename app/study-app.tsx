'use client';
import {useState,useEffect,useRef,useCallback} from 'react';
import {BookOpen,Layers,History,Bookmark,ArrowUpRight,ArrowRight,ArrowLeft,Sparkles,Check,X,Search,RotateCcw,Clock,CheckCircle2,Cloud,Volume2,ChevronDown} from 'lucide-react';
import {Button} from '../components/ui/button';
import {Input} from '../components/ui/input';
import {Select,SelectTrigger,SelectValue,SelectContent,SelectItem} from '../components/ui/select';
import {passages,words,byId} from '../lib/vocabulary';
import type {WordProgress} from '../lib/study';
import ReadingLibrary from './reading-library';

type Session={id:string;title:string;mode:string;startedAt:number;finishedAt:number|null;status:string;total:number;answered:number;correct:number;duration:number;wrongIds:string[]};
type State={progress:Record<string,WordProgress>;sessions:Session[]};
type Practice={id:string;title:string;status:string;total:number;index:number;correct:number;question:null|{id:string;word:string;page:number;options:string[]}};
type Feedback={correct:boolean;meaning:string;choice:string|null;done:boolean};
type View='library'|'wrong'|'history'|'practice'|'result';
const labels={library:'阅读词库',wrong:'错词本',history:'学习记录',practice:'正在练习',result:'练习小结'};
const date=(n:number)=>new Date(n).toLocaleString('zh-CN',{month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',hour12:false});
const fullDate=(n:number)=>new Date(n).toLocaleString('zh-CN',{year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',hour12:false});
const time=(ms:number)=>Math.floor(ms/60000)+' 分 '+Math.floor(ms%60000/1000)+' 秒';
const source=(id:string)=>id.split('-')[0]+' · Text '+id.split('-')[1];
function Filter({label,value,onChange,items}:{label:string;value:string;onChange:(v:string)=>void;items:[string,string][]}){return <Select value={value} onValueChange={onChange}><SelectTrigger aria-label={label} className="filter"><SelectValue/></SelectTrigger><SelectContent>{items.map(([id,label])=><SelectItem key={id} value={id}>{label}</SelectItem>)}</SelectContent></Select>;}
async function api<T=State>(data?:Record<string,unknown>,session?:string):Promise<T>{
 const r=await fetch('/api/study'+(session?'?session='+encodeURIComponent(session):''),data?{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(data)}:{cache:'no-store'});
 const result=await r.json() as T&{error?:string};
 if(!r.ok)throw Object.assign(new Error(result.error||'暂时无法连接，请重试。'),{status:r.status});
 return result;
}
export default function StudyApp(){
 const [view,setView]=useState<View>('library'),[year,setYear]=useState(2026);
 const [state,setState]=useState<State>({progress:{},sessions:[]});
 const [loading,setLoading]=useState(true),[busy,setBusy]=useState(false),[error,setError]=useState(''),[auth,setAuth]=useState(false);
 const [practice,setPractice]=useState<Practice|null>(null),[feedback,setFeedback]=useState<Feedback|null>(null);
 const [order,setOrder]=useState('original'),[limit,setLimit]=useState('all'),[wordList,setWordList]=useState<string|null>(null);
 const [wrongFilter,setWrongFilter]=useState('pending'),[passageFilter,setPassageFilter]=useState('all'),[query,setQuery]=useState('');
 const [historyYear,setHistoryYear]=useState('all'),[historyMode,setHistoryMode]=useState('all'),[expanded,setExpanded]=useState<string|null>(null);
 const [resultId,setResultId]=useState<string|null>(null),[speechAvailable,setSpeechAvailable]=useState(false);
 const locked=useRef(false),questionStart=useRef(0);
 const progress=Object.values(state.progress);
 const wrong=progress.filter(p=>p.mistakes>0);
 const pending=wrong.filter(p=>p.streak<3);
 const due=pending.filter(p=>p.dueAt<=Date.now());
 const active=state.sessions.find(s=>s.status==='active');
 const result=state.sessions.find(s=>s.id===resultId);
 function showError(e:unknown){const err=e as Error&{status?:number};setError(err.message||'操作未完成，请重试。');if(err.status===401)setAuth(true);}
 const refresh=useCallback(async()=>{try{const data=await api();setState(data);setAuth(false);setLoading(false);return data as State;}catch(e){showError(e);setLoading(false);throw e;}},[]);
 useEffect(()=>{refresh().catch(()=>{});setSpeechAvailable('speechSynthesis' in window);},[refresh]);
 async function action(fn:()=>Promise<void>){if(locked.current)return;locked.current=true;setBusy(true);setError('');try{await fn();}catch(e){showError(e);}finally{locked.current=false;setBusy(false);}}
 async function openPractice(id:string){const p=await api<Practice>(undefined,id);setPractice(p);setFeedback(null);questionStart.current=performance.now();if(p.status!=='active'){await refresh();setResultId(id);setView('result');}else setView('practice');}
 function start(mode='passage',passageId?:string,wordIds?:string[]){void action(async()=>{const s=await api<{id:string}>({action:'start',mode,passageId,wordIds,order,limit:limit==='all'?null:Number(limit)});await openPractice(s.id);await refresh();});}
 function resume(id:string){void action(()=>openPractice(id));}
 function answer(choice:string|null){if(!practice?.question||feedback)return;void action(async()=>{const f=await api<Feedback>({action:'answer',sessionId:practice.id,position:practice.index,choice,duration:performance.now()-questionStart.current});setFeedback(f);});}
 function next(){if(!practice||!feedback)return;void action(async()=>{if(feedback.done){await refresh();setResultId(practice.id);setView('result');setFeedback(null);}else await openPractice(practice.id);});}
 function pause(){void action(async()=>{await refresh();setView('library');setFeedback(null);});}
 function stop(id:string){void action(async()=>{await api({action:'stop',sessionId:id});await refresh();setResultId(id);setView('result');});}
 function navigate(v:View){if(busy)return;setView(v);setError('');if(view==='practice')refresh().catch(()=>{});}
 function speak(word:string){if(!speechAvailable)return;window.speechSynthesis.cancel();const utterance=new SpeechSynthesisUtterance(word);utterance.lang='en-US';utterance.rate=.85;window.speechSynthesis.speak(utterance);}
 useEffect(()=>{function key(e:KeyboardEvent){if(view!=='practice'||busy||!practice?.question||(e.target as HTMLElement)?.closest('input,select,textarea,[role="combobox"]'))return;if(e.repeat)return;if(feedback&&e.key==='Enter'){e.preventDefault();next();}else if(!feedback&&/^[1-4]$/.test(e.key)){e.preventDefault();answer(practice.question.options[Number(e.key)-1]);}else if(!feedback&&e.key==='0'){e.preventDefault();answer(null);}}window.addEventListener('keydown',key);return()=>window.removeEventListener('keydown',key);});
 const stateRef=useRef(state);stateRef.current=state;
 useEffect(()=>{
  const context=(document as Document&{modelContext?:{registerTool:(tool:unknown,options:unknown)=>unknown}}).modelContext;if(!context?.registerTool)return;
  const controller=new AbortController();
  try{Promise.resolve(context.registerTool({name:'read_learning_progress',title:'查看学习进度',description:'读取当前账号已加载的阅读学习记录和错词统计，不修改数据。',inputSchema:{type:'object',properties:{},additionalProperties:false},annotations:{readOnlyHint:true},execute(input:unknown){if(!input||typeof input!=='object'||Object.keys(input).length)throw new Error('Expected empty object');const s=stateRef.current;return {practicedWords:Object.keys(s.progress).length,pendingMistakes:Object.values(s.progress).filter(p=>p.mistakes>0&&p.streak<3).length,sessions:s.sessions.map(s=>({title:s.title,status:s.status,answered:s.answered,correct:s.correct}))};}},{signal:controller.signal})).catch(()=>{});}catch{}
  return()=>controller.abort();
 },[]);
 const filteredWrong=wrong.filter(p=>(wrongFilter==='all'||wrongFilter==='mastered'&&p.streak>=3||wrongFilter==='pending'&&p.streak<3||wrongFilter==='due'&&p.streak<3&&p.dueAt<=Date.now())&&(passageFilter==='all'||p.wordId.startsWith(passageFilter+'-'))&&((byId.get(p.wordId)?.word+' '+byId.get(p.wordId)?.meaning).toLowerCase().includes(query.toLowerCase()))).sort((a,b)=>b.mistakes-a.mistakes||b.lastAt-a.lastAt);
 const filteredHistory=state.sessions.filter(s=>(historyMode==='all'||s.mode===historyMode)&&(historyYear==='all'||s.title.startsWith(historyYear)));
 const reviewed=state.sessions.reduce((n,s)=>n+s.answered,0),correct=state.sessions.reduce((n,s)=>n+s.correct,0);
 const controls=<div className="practice-controls"><Filter label="词序" value={order} onChange={setOrder} items={[['original','原文顺序'],['shuffle','随机顺序']]}/><Filter label="每次词数" value={limit} onChange={setLimit} items={[['all','全部词条'],['10','每次 10 词'],['20','每次 20 词']]}/></div>;
 return <div className="app-shell">
 <header className="site-header"><button className="wordmark" onClick={()=>navigate('library')} aria-label="读词首页">读词<span>.</span><small>READING NOTES</small></button><nav className="top-navigation">{([['library','阅读书架'],['wrong','错词手记'],['history','学习足迹']] as const).map(([v,label])=><button key={v} className={view===v?'active':''} disabled={busy} onClick={()=>navigate(v)}>{label}{v==='wrong'&&pending.length>0&&<i>{pending.length}</i>}</button>)}</nav><span className="header-edition">考研英语一<span>个人词汇研习室</span></span></header>
 <main><div className="content">
 {error&&<div className="error-banner" role="alert"><span>{error}</span>{auth?<a href="/signin-with-chatgpt?return_to=%2F" target="_top">登录并继续 <ArrowRight size={15}/></a>:<Button variant="ghost" onClick={()=>{setError('');refresh().catch(()=>{});}}>重新加载记录</Button>}</div>}
 {view==='library'&&<ReadingLibrary progress={state.progress} sessions={state.sessions} loading={loading} busy={busy} start={start} resume={resume} controls={controls}/>}
 {view==='practice'&&practice&&<>
 <div className="practice-top"><button className="plain back-link" disabled={busy} onClick={pause}><ArrowLeft size={17}/>暂存退出</button><span>{practice.title}</span><button className="plain meta-link" disabled={busy} onClick={()=>stop(practice.id)}>结束本次</button></div>
 <div className="practice-progress"><span>词条 {Math.min(practice.index+1,practice.total)} <em>/ {practice.total}</em></span><span>已答对 {practice.correct+(feedback?.correct?1:0)} 词</span></div><div className="progress-track large"><i style={{width:(practice.index+(feedback?1:0))/practice.total*100+'%'}}/></div>
 {practice.question&&<section className="question-card"><p className="eyebrow">CHOOSE THE MEANING</p><div className="question-word"><h1>{practice.question.word}</h1>{speechAvailable&&<Button variant="ghost" size="icon" aria-label="朗读单词" onClick={()=>speak(practice.question!.word)}><Volume2 size={20}/></Button>}</div><p className="muted">选择它在这篇阅读中的释义</p><span className="question-source">{source(practice.question.id)} · PDF 第 {practice.question.page} 页</span><div className="options">{practice.question.options.map((option,i)=><button disabled={busy||!!feedback} className={'option '+(feedback?(option===feedback.meaning?'correct':option===feedback.choice?'incorrect':'dim'):'')} key={option} onClick={()=>answer(option)}><span className="option-key">{i+1}</span><span>{option}</span>{feedback&&option===feedback.meaning&&<Check size={20}/ >}{feedback&&!feedback.correct&&option===feedback.choice&&<X size={20}/>}</button>)}</div>
 {!feedback?<div className="question-actions"><button disabled={busy} className="plain unknown" onClick={()=>answer(null)}>{busy?'正在保存…':'不认识，加入错词本'} <kbd>0</kbd></button><span>按 1–4 选择答案</span></div>:<div className={'feedback '+(feedback.correct?'success':'mistake')} role="status"><div><b>{feedback.correct?'答对了，继续积累。':'记住这次，下次就会了。'}</b><p>{feedback.meaning}</p><small>{feedback.correct?'本次作答已保存':'已加入错词本 · 作答已保存'}</small></div><Button className="primary" disabled={busy} onClick={next}>{feedback.done?'查看小结':'下一词'}<ArrowRight size={17}/></Button></div>}
 </section>}<p className="practice-footnote">释义保留自原 PDF；朗读使用浏览器语音。暂存退出后，可从原进度继续。</p>
 </>}
 {view==='result'&&result&&<>
 <div className="result-hero"><span className="result-icon"><CheckCircle2 size={36}/></span><p className="eyebrow">A LITTLE PROGRESS, EVERY DAY</p><h1>{result.status==='completed'?'这一轮，积累完成。':'这一轮，先记到这里。'}</h1><p className="muted">{result.title} · {fullDate(result.startedAt)}</p></div><div className="stats result-stats"><div><span className="stat-label">本次作答</span><strong>{result.answered}<small> / {result.total} 词</small></strong></div><div><span className="stat-label">正确率</span><strong>{result.answered?Math.round(result.correct/result.answered*100):0}<small> %</small></strong></div><div><span className="stat-label">需要再记</span><strong className="orange">{result.wrongIds.length}<small> 词</small></strong></div><div><span className="stat-label">作答用时</span><strong className="duration-value">{time(result.duration)}</strong></div></div>
 <div className="result-actions"><Button className="primary" onClick={()=>navigate('library')}>返回阅读词库</Button>{result.wrongIds.some(id=>state.progress[id]?.streak<3)&&<Button className="secondary" disabled={busy} onClick={()=>start('wrong',undefined,result.wrongIds)}>再练本次错词 <RotateCcw size={16}/></Button>}<Button variant="ghost" onClick={()=>navigate('history')}>查看学习记录</Button></div>
 <h2 className="subheading">本次错词 <span>{result.wrongIds.length}</span></h2>{result.wrongIds.length?<div className="word-list">{result.wrongIds.map(id=>{const w=byId.get(id)!;return <div className="word-row" key={id}><strong>{w.word}</strong><span>{w.meaning}</span><small>{source(id)}</small></div>})}</div>:<div className="empty compact"><CheckCircle2/><h3>{result.answered?'这一轮没有错词':'还没有作答'}</h3><p>{result.answered?'保持积累，也别忘了回来复习。':'已保留这次记录，选一篇阅读重新开始吧。'}</p></div>}
 </>}
 {view==='wrong'&&<>
 <div className="page-heading"><div><p className="eyebrow">MEET YOUR WORDS AGAIN</p><h1>错过的，再认识一次<span>。</span></h1><p className="muted">连续答对 3 次标记已巩固；答错会重新开始计数。</p></div><Button className="primary" disabled={busy||!due.length} onClick={()=>start('due')}>复习到期词 <span>{due.length}</span><ArrowRight size={16}/></Button></div>
 <div className="review-counts"><button className={wrongFilter==='pending'?'selected':''} onClick={()=>setWrongFilter('pending')}>待巩固 <b>{pending.length}</b></button><button className={wrongFilter==='due'?'selected':''} onClick={()=>setWrongFilter('due')}>到期复习 <b>{due.length}</b></button><button className={wrongFilter==='mastered'?'selected':''} onClick={()=>setWrongFilter('mastered')}>已巩固 <b>{wrong.filter(p=>p.streak>=3).length}</b></button><button className={wrongFilter==='all'?'selected':''} onClick={()=>setWrongFilter('all')}>全部曾错 <b>{wrong.length}</b></button></div>
 <div className="filterbar"><div className="search-field"><Search size={17}/><Input value={query} onChange={e=>setQuery(e.target.value)} placeholder="搜索单词或释义" aria-label="搜索错词"/></div><Filter label="按阅读筛选错词" value={passageFilter} onChange={setPassageFilter} items={[['all','全部阅读'],...passages.filter(p=>wrong.some(w=>w.wordId.startsWith(p.id+'-'))).map(p=>[p.id,p.year+' · Text '+p.text] as [string,string])]}/><Button className="secondary" disabled={busy||!filteredWrong.some(p=>p.streak<3)} onClick={()=>start('wrong',passageFilter,filteredWrong.filter(p=>p.streak<3).map(p=>p.wordId))}>练习当前错词</Button></div>
 <p className="list-note">共 {filteredWrong.length} 个词条 · 按出错次数排序 · 答对后分别间隔 1 天、3 天安排复习</p>
 {filteredWrong.length?<div className="mistake-list">{filteredWrong.map(p=>{const w=byId.get(p.wordId)!;return <article className="mistake-row" key={p.wordId}><div className="mistake-word"><strong>{w.word}</strong><p>{w.meaning}</p><small>{source(w.id)} · PDF 第 {w.page} 页</small></div><div className="mistake-info"><span className="wrong-count">出错 {p.mistakes} 次</span><span className={p.streak>=3?'mastered':''}>{p.streak>=3?'已巩固':'连续答对 '+p.streak+' / 3'}</span><span>最近：{date(p.lastAt)}</span><small>{p.streak>=3?'曾错记录已保留':p.dueAt<=Date.now()?'现在可以复习':'下次复习 '+date(p.dueAt)}</small></div><Button variant="ghost" size="icon" aria-label={'朗读 '+w.word} disabled={!speechAvailable} onClick={()=>speak(w.word)}><Volume2 size={18}/></Button></article>})}</div>:<div className="empty"><Bookmark size={35}/><h3>{wrong.length?'这里暂时没有匹配的错词':'错词本还是空的'}</h3><p>{wrong.length?'试试切换筛选，或搜索其他单词。':'开始一篇阅读练习，答错和不认识的词会自动来到这里。'}</p><Button className="primary" onClick={()=>navigate('library')}>去阅读词库</Button></div>}
 </>}
 {view==='history'&&<>
 <div className="page-heading"><div><p className="eyebrow">EVERY SESSION COUNTS</p><h1>每一次练习，都算数<span>。</span></h1><p className="muted">回看练过的阅读，也看看自己一点点的进步。</p></div></div>
 <div className="stats"><div><span className="stat-label">累计练习</span><strong>{state.sessions.length}<small> 次</small></strong><span>含未完成的练习</span></div><div><span className="stat-label">累计作答</span><strong>{reviewed}<small> 词次</small></strong><span>重复练习也计入</span></div><div><span className="stat-label">总体正确率</span><strong>{reviewed?Math.round(correct/reviewed*100):'—'}<small> %</small></strong><span>按全部作答计算</span></div><div><span className="stat-label">累计作答用时</span><strong>{Math.floor(state.sessions.reduce((n,s)=>n+s.duration,0)/60000)}<small> 分钟</small></strong><span>不含反馈页停留时间</span></div></div>
 <div className="filterbar"><h2 className="subheading">练习时间线</h2><Filter label="筛选记录年份" value={historyYear} onChange={setHistoryYear} items={[['all','全部年份'],...Array.from({length:17},(_,i)=>[String(2026-i),String(2026-i)+' 年'] as [string,string])]}/><Filter label="筛选练习类型" value={historyMode} onChange={setHistoryMode} items={[['all','全部练习'],['passage','阅读刷词'],['wrong','错词巩固'],['due','到期复习']]}/></div>
 {filteredHistory.length?<div className="history-list">{filteredHistory.map(s=><article key={s.id} className="history-card"><div className="history-icon">{s.mode==='passage'?<BookOpen size={20}/>:<RotateCcw size={20}/>}</div><div className="history-main"><div className="history-title"><h3>{s.title}</h3><span className={'badge '+(s.status==='completed'?'green':'')}>{s.status==='active'?'待继续':s.status==='completed'?'已完成':'提前结束'}</span></div><p>{fullDate(s.startedAt)} · {time(s.duration)}</p><div className="history-detail"><span>作答 <b>{s.answered}/{s.total}</b></span><span>正确率 <b>{s.answered?Math.round(s.correct/s.answered*100)+'%':'—'}</b></span><span>错词 <b className="orange">{s.wrongIds.length}</b></span></div><div className="history-buttons">{s.status==='active'&&<Button className="primary" disabled={busy} onClick={()=>resume(s.id)}>继续练习</Button>}<Button variant="ghost" onClick={()=>setExpanded(expanded===s.id?null:s.id)}>{expanded===s.id?'收起错词':'查看当次错词'}<ChevronDown size={15}/></Button></div>{expanded===s.id&&<div className="history-words">{s.wrongIds.length?s.wrongIds.map(id=><div key={id}><strong>{byId.get(id)?.word}</strong><span>{byId.get(id)?.meaning}</span></div>):<p>本次已答题目中没有错词。</p>}</div>}</div></article>)}</div>:<div className="empty"><History size={35}/><h3>{state.sessions.length?'没有匹配的练习记录':'你的第一条记录，从这里开始'}</h3><p>完成一次刷词，篇目、正确率、用时和错词都会保留下来。</p><Button className="primary" onClick={()=>navigate('library')}>开始刷词</Button></div>}
 </>}
 <footer>词汇与释义来自你提供的 PDF · 学长小谭考研<span>小步积累，日有所进。</span></footer>
 </div></main></div>;
}

