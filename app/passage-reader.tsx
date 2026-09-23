'use client';
import Meaning from './meaning';
import {useEffect,useMemo,useRef,useState} from 'react';
import {ArrowLeft,ArrowUp,ArrowDown,Bookmark,Check,Search,X,BookOpen} from 'lucide-react';
import {passages,byId,wordSource} from '../lib/vocabulary';
import type {WordProgress} from '../lib/study';
import type {Reading} from '../lib/readings';
import {findWordMatches,segmentParagraph} from '../lib/reading-matches';

type Props={passageId:string;wordId?:string;progress:Record<string,WordProgress>;savedWordIds:string[];saving:boolean;saveError?:string;onSave:(id:string,saved:boolean)=>void;onClose:()=>void};
type Mode='english'|'parallel'|'reveal';
export default function PassageReader({passageId,wordId,progress,savedWordIds,saving,saveError,onSave,onClose}:Props){
 const dialog=useRef<HTMLDialogElement>(null),scroll=useRef<HTMLDivElement>(null),closeButton=useRef<HTMLButtonElement>(null);
 const [reading,setReading]=useState<Reading|null>(null),[error,setError]=useState(''),[retry,setRetry]=useState(0);
 const [mode,setMode]=useState<Mode>('reveal'),[selected,setSelected]=useState(wordId||''),[occurrence,setOccurrence]=useState(0);
 const [query,setQuery]=useState(''),[showWords,setShowWords]=useState(false),[revealed,setRevealed]=useState<Set<number>>(new Set());
 const passage=useMemo(()=>{
  const active=passages.find(p=>p.id===passageId)!;
  const old=wordId&&byId.get(wordId);
  return old&&!active.words.some(w=>w.id===old.id)?{...active,words:[old,...active.words]}:active;
 },[passageId,wordId]);
 const selectedWord=passage.words.find(w=>w.id===selected),p=progress[selected];
 const saved=savedWordIds.includes(selected);
 useEffect(()=>{
  const previous=document.activeElement as HTMLElement|null;
  const overflow=document.body.style.overflow;document.body.style.overflow='hidden';
  dialog.current?.showModal();closeButton.current?.focus();
  setShowWords(window.matchMedia('(min-width:761px)').matches);
  try{const value=localStorage.getItem('reading-display');if(['english','parallel','reveal'].includes(value||''))setMode(value as Mode);}catch{}
  return()=>{document.body.style.overflow=overflow;previous?.focus();};
 },[]);
 useEffect(()=>{
  const controller=new AbortController();setError('');setReading(null);
  fetch('/readings/'+passageId+'.json',{signal:controller.signal}).then(async r=>{
   if(!r.ok)throw new Error(r.status===401?'登录已过期，请关闭阅读页后重新登录。':'原文暂时无法加载，请重试。');
   const data=await r.json() as Reading;if(data.id!==passageId||!data.paragraphs?.length)throw new Error('原文数据不完整，请重试。');
   setReading(data);
  }).catch(e=>{if(!controller.signal.aborted)setError(e.message||'原文暂时无法加载。');});
  return()=>controller.abort();
 },[passageId,retry]);
 const occurrences=useMemo(()=>selectedWord&&reading?reading.paragraphs.flatMap((para,i)=>findWordMatches(para.en,selectedWord.word).map(m=>({...m,paragraph:i}))):[],[selectedWord,reading]);
 const counts=useMemo(()=>new Map(passage.words.map(w=>[w.id,reading?.paragraphs.reduce((n,p)=>n+findWordMatches(p.en,w.word).length,0)||0])),[passage,reading]);
 const segments=useMemo(()=>reading?.paragraphs.map(p=>segmentParagraph(p.en,passage.words,selected)),[reading,passage,selected]);
 useEffect(()=>{
  const m=occurrences[occurrence];if(!m)return;
  const frame=requestAnimationFrame(()=>{document.getElementById(`reading-hit-${m.paragraph}-${m.start}`)?.scrollIntoView({block:'center',behavior:'instant'});});
  return()=>cancelAnimationFrame(frame);
 },[occurrences,occurrence]);
 function choose(id:string,paragraph?:number,start?:number){
  setSelected(id);if(window.matchMedia('(max-width:760px)').matches)setShowWords(false);
  const w=passage.words.find(w=>w.id===id)!;
  const all=reading?.paragraphs.flatMap((p,i)=>findWordMatches(p.en,w.word).map(m=>({...m,paragraph:i})))||[];
  setOccurrence(Math.max(0,all.findIndex(m=>m.paragraph===paragraph&&m.start===start)));
 }
 function changeMode(value:Mode){setMode(value);try{localStorage.setItem('reading-display',value);}catch{}}
 const filteredWords=passage.words.filter(w=>(w.word+' '+w.meaning).toLowerCase().includes(query.toLowerCase()));
 return <dialog ref={dialog} className="passage-reader" aria-labelledby="reader-title" onCancel={e=>{e.preventDefault();onClose();}}>
  <header className="reader-header"><button ref={closeButton} className="reader-back" onClick={onClose}><ArrowLeft size={18}/><span>返回学习</span></button><div><span className="reader-kicker">THE ORIGINAL / 阅读原文</span><h1 id="reader-title">{passage.year}<em> / </em>Text {passage.text}</h1></div><button className="reader-close" onClick={onClose} aria-label="关闭原文"><X size={21}/></button></header>
  <div className="reader-toolbar"><div className="reader-modes" aria-label="阅读显示模式">{([['english','纯英文'],['parallel','逐段对照'],['reveal','点击看译文']] as const).map(([value,label])=><button key={value} aria-pressed={mode===value} onClick={()=>changeMode(value)}>{label}</button>)}</div><span>点击标记词，回到它的语境。</span></div>
  <div className="reader-body" ref={scroll}>
   <article className="reader-article" aria-label="阅读原文与译文">
    {error?<div role="alert" className="reader-error"><p>{error}</p><button onClick={()=>setRetry(n=>n+1)}>重新加载</button></div>:!reading?<p role="status">正在展开这篇阅读…</p>:<>
     <div className="reader-article-heading"><p>READING COMPREHENSION · PART A</p><h2>在语境中，重新认识单词。</h2><span>{reading.paragraphs.length} 段原文 · {passage.words.length} 个词条 · {reading.translationSource}</span></div>
     {reading.paragraphs.map((para,i)=><section className={'reading-paragraph '+(mode==='parallel'?'is-parallel':'')} id={'reading-paragraph-'+i} key={i}>
      <div className="paragraph-label"><span>{String(i+1).padStart(2,'0')}</span>{mode==='reveal'&&<button aria-expanded={revealed.has(i)} aria-controls={'translation-'+i} onClick={()=>setRevealed(prev=>{const next=new Set(prev);if(next.has(i))next.delete(i);else next.add(i);return next;})}>{revealed.has(i)?'收起译文':'查看译文'}</button>}</div>
      <p lang="en" className="paragraph-english">{segments?.[i].map(s=>s.wordId?<button key={s.start} id={`reading-hit-${i}-${s.start}`} className={'reading-word '+(s.wordId===selected?'selected ':'')+(progress[s.wordId]?.mistakes>0&&progress[s.wordId].streak<3?'previously-wrong ':'')+(savedWordIds.includes(s.wordId)?'is-saved':'')} aria-label={'查看 '+s.text+' 的词条'} aria-pressed={s.wordId===selected} onClick={()=>choose(s.wordId!,i,s.start)}>{s.text}</button>:<span key={s.start}>{s.text}</span>)}</p>
      {(mode==='parallel'||mode==='reveal'&&revealed.has(i))&&<p id={'translation-'+i} className="paragraph-chinese" lang="zh-CN">{para.zh}</p>}
     </section>)}
     <div className="reader-source"><BookOpen size={18}/><p>原文：你提供的 {passage.year} 年英语一真题 Word。<br/>{reading.sourceNote}<br/>译文：AI 参考译文，非官方答案。下划线为已收录词；橙色标记待巩固错词。</p></div>
    </>}
   </article>
   <aside className={'reader-vocab '+(showWords?'words-open':'')} aria-label="原文词汇对照">
    {saveError&&<p className="reader-error" role="alert">{saveError}</p>}
    <div className="reader-vocab-top"><span>WORDS IN CONTEXT</span><button onClick={()=>setShowWords(v=>!v)} aria-expanded={showWords}>{showWords?'收起词表':'本篇词表'} <span>{passage.words.length}</span></button></div>
    {selectedWord?<div className="reader-selection" aria-live="polite"><div className="reader-selection-title"><h3>{selectedWord.word}</h3><button disabled={saving} aria-label={saved?'取消重点收藏':'加入重点收藏'} aria-pressed={saved} onClick={()=>onSave(selected,!saved)}>{saved?<Check size={18}/>:<Bookmark size={18}/>}</button></div><p className="reader-meaning"><Meaning text={selectedWord.meaning}/></p><small>{wordSource(selectedWord.id)}</small><div className="reader-learning"><span>{p?`练过 ${p.seen} 次 · 错 ${p.mistakes} 次`:'尚未练习'}</span><span>{saved?'已加入重点词':'可收藏为重点词'}</span></div>
     {reading&&(occurrences.length?<div className="reader-occurrences"><span>原文位置 {occurrence+1} / {occurrences.length}<small>含词形变化</small></span><div><button aria-label="上一个出现位置" disabled={occurrences.length<2} onClick={()=>setOccurrence(n=>(n-1+occurrences.length)%occurrences.length)}><ArrowUp size={17}/></button><button aria-label="下一个出现位置" disabled={occurrences.length<2} onClick={()=>setOccurrence(n=>(n+1)%occurrences.length)}><ArrowDown size={17}/></button></div></div>:<p className="reader-unmatched">本篇未定位到该词。它可能来自题目、选项或词表中的扩展表达；这里仍保留 PDF 释义。</p>)}
    </div>:<div className="reader-selection reader-selection-empty"><BookOpen size={25}/><p>点一下原文中的标记词，<br/>看看释义和你的学习记录。</p></div>}
    <div className="reader-word-browser"><label className="reader-search"><Search size={15}/><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="查找本篇单词" aria-label="查找本篇单词"/></label><div className="reader-word-list">{filteredWords.map(w=><button key={w.id} className={selected===w.id?'selected':''} onClick={()=>choose(w.id)}><span>{w.word}{savedWordIds.includes(w.id)&&<Bookmark size={11}/>}</span><small>{!reading?'…':counts.get(w.id)?counts.get(w.id)+' 处':'未定位'}</small></button>)}{!filteredWords.length&&<p>本篇没有匹配的词条。</p>}</div><p className="reader-match-note">按完整词、常见词形与拼写变体定位；未定位的词不生成例句。</p></div>
   </aside>
  </div>
 </dialog>;
}
