'use client';
import Meaning from './meaning';
import {useEffect,useRef,useState} from 'react';
import {ArrowLeft,ArrowRight,X,Volume2,Check,BookOpen} from 'lucide-react';
import {byId,wordSource} from '../lib/vocabulary';
import type {PastAnswer} from '../lib/practice-review';

export default function PracticeReview({studyFormat,answers,onClose,onSpeak,speechAvailable}:{studyFormat:string;answers:PastAnswer[];onClose:()=>void;onSpeak:(word:string)=>void;speechAvailable:boolean}){
 const dialog=useRef<HTMLDialogElement>(null),close=useRef<HTMLButtonElement>(null);
 const [index,setIndex]=useState(answers.length-1);
 const entry=answers[index],word=entry&&byId.get(entry.wordId);
 useEffect(()=>{
  const previous=document.activeElement as HTMLElement|null;const overflow=document.body.style.overflow;
  document.body.style.overflow='hidden';dialog.current?.showModal();close.current?.focus();
  return()=>{document.body.style.overflow=overflow;previous?.focus();};
 },[]);
 return <dialog ref={dialog} className="practice-review-dialog" aria-labelledby="past-word-title" onCancel={e=>{e.preventDefault();onClose();}} onKeyDown={e=>{
  if(e.key==='ArrowLeft'){e.preventDefault();setIndex(i=>Math.max(0,i-1));}
  if(e.key==='ArrowRight'){e.preventDefault();setIndex(i=>Math.min(answers.length-1,i+1));}
 }}>
  <header><span><BookOpen size={17}/>本轮已背单词</span><button ref={close} onClick={onClose} aria-label="关闭回看"><X size={20}/></button></header>
  {word&&<div className="past-word-body" aria-live="polite"><p className="eyebrow">LOOK BACK, REMEMBER BETTER</p><p className="past-word-position">第 {index+1} / {answers.length} 个已背词</p><div className="past-word-heading"><h2 id="past-word-title">{word.word}</h2>{speechAvailable&&<button aria-label={'朗读 '+word.word} onClick={()=>onSpeak(word.word)}><Volume2 size={20}/></button>}</div><p className="past-word-source">{word.id.split('-')[0]} · Text {word.id.split('-')[1]} · {wordSource(word.id)}</p><div className="past-word-definition"><span>词库释义</span><p><Meaning text={word.meaning}/></p></div><div className={'past-word-result '+(entry.correct?'correct':'incorrect')}>{entry.correct?<Check size={17}/>:<X size={17}/>}<div><strong>{studyFormat==='recall'?(entry.correct?'当时选择了“没忘记”':'当时选择了“忘记了”'):(entry.correct?'当时答对了':entry.choice===null?'当时选择了“不认识”':'当时答错了')}</strong>{!entry.correct&&entry.choice!==null&&<p>你的选择：<Meaning text={entry.choice}/></p>}</div></div></div>}
  <nav className="past-word-navigation" aria-label="已背词翻页"><button disabled={index<=0} onClick={()=>setIndex(i=>i-1)}><ArrowLeft size={16}/>上一个</button><button disabled={index>=answers.length-1} onClick={()=>setIndex(i=>i+1)}>下一个<ArrowRight size={16}/></button></nav>
  <div className="past-word-footer"><button className="primary" onClick={onClose}>返回当前题目 <ArrowRight size={16}/></button><p>仅回看，不改变作答记录 · 回看时间不计入答题用时</p></div>
 </dialog>;
}
