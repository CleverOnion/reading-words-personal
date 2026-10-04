'use client';
import Meaning from './meaning';
import {answerRating,ratingLabel,type RecallRating} from '../lib/recall-policy';
import SimilarWords from './similar-words';
import {useEffect,useRef,useState} from 'react';
import {ArrowLeft,ArrowRight,X,Volume2,Check,BookOpen} from 'lucide-react';
import {byId,wordSource} from '../lib/vocabulary';
import type {PastAnswer} from '../lib/practice-review';

export default function PracticeReview({studyFormat,answers,onClose,onSpeak,speechAvailable,busy,onRevise,completed}:{busy:boolean;completed:boolean;onRevise:(entry:PastAnswer,rating:RecallRating)=>Promise<void>;studyFormat:string;answers:PastAnswer[];onClose:()=>void;onSpeak:(word:string)=>void;speechAvailable:boolean}){
 const dialog=useRef<HTMLDialogElement>(null),close=useRef<HTMLButtonElement>(null);
 const [index,setIndex]=useState(answers.length-1);
 const [message,setMessage]=useState(''),[saveError,setSaveError]=useState('');
 async function revise(rating:RecallRating){setMessage('');setSaveError('');try{await onRevise(entry,rating);setMessage('已更正，错词本和统计已同步。');}catch(e){setSaveError(e instanceof Error?e.message:'保存失败，请重试。')}}
 const entry=answers[index],word=entry&&byId.get(entry.wordId);
 useEffect(()=>{
  const previous=document.activeElement as HTMLElement|null;const overflow=document.body.style.overflow;
  document.body.style.overflow='hidden';dialog.current?.showModal();close.current?.focus();
  return()=>{document.body.style.overflow=overflow;previous?.focus();};
 },[]);
 return <dialog ref={dialog} className="practice-review-dialog" aria-labelledby="past-word-title" onCancel={e=>{e.preventDefault();if(!busy)onClose();}} onKeyDown={e=>{
  if(!busy&&e.key==='ArrowLeft'){e.preventDefault();setIndex(i=>Math.max(0,i-1));}
  if(!busy&&e.key==='ArrowRight'){e.preventDefault();setIndex(i=>Math.min(answers.length-1,i+1));}
 }}>
  <header><span><BookOpen size={17}/>本轮已背单词</span><button ref={close} disabled={busy} onClick={onClose} aria-label="关闭回看"><X size={20}/></button></header>
  {word&&<div className="past-word-body" aria-live="polite"><p className="eyebrow">LOOK BACK, REMEMBER BETTER</p><p className="past-word-position">第 {index+1} / {answers.length} 个已背词</p><div className="past-word-heading"><h2 id="past-word-title">{word.word}</h2>{speechAvailable&&<button aria-label={'朗读 '+word.word} onClick={()=>onSpeak(word.word)}><Volume2 size={20}/></button>}</div><p className="past-word-source">{word.id.split('-')[0]} · Text {word.id.split('-')[1]} · {wordSource(word.id)}</p><div className="past-word-definition"><span>词库释义</span><p><Meaning text={word.meaning}/></p></div><div className={'past-word-result '+(entry.correct?'correct':'incorrect')}>{entry.correct?<Check size={17}/>:<X size={17}/>}<div><strong>{studyFormat==='recall'?('当前记录为“'+ratingLabel[answerRating(entry)]+'”'):(entry.correct?'当时答对了':entry.choice===null?'当前记录为“不认识”':'当时答错了')}</strong>{!entry.correct&&entry.choice!==null&&<p>你的选择：<Meaning text={entry.choice}/></p>}</div></div><SimilarWords word={word.word} speak={onSpeak} speechAvailable={speechAvailable}/></div>}
  {word&&studyFormat==='recall'&&<section className="past-word-correction" aria-label="更正本词自评"><span>刚才点错了？修改本词记录</span><div>{(['forgotten','fuzzy','remembered'] as const).map(rating=><button key={rating} disabled={busy||answerRating(entry)===rating} aria-pressed={answerRating(entry)===rating} onClick={()=>revise(rating)}>{ratingLabel[rating]}</button>)}</div><p role="status">{busy?'正在保存…':message}</p>{saveError&&<p role="alert">{saveError}</p>}</section>}
  <nav className="past-word-navigation" aria-label="已背词翻页"><button disabled={busy||index<=0} onClick={()=>setIndex(i=>i-1)}><ArrowLeft size={16}/>上一个</button><button disabled={busy||index>=answers.length-1} onClick={()=>setIndex(i=>i+1)}>下一个<ArrowRight size={16}/></button></nav>
  <div className="past-word-footer"><button className="primary" disabled={busy} onClick={onClose}>{completed?'返回本轮小结':'返回当前题目'} <ArrowRight size={16}/></button><p>更正会更新原记录，不增加作答次数 · 回看时间不计入答题用时</p></div>
 </dialog>;
}
