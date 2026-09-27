'use client';
import {useEffect,useState} from 'react';
import {Search,Volume2,X} from 'lucide-react';
import {sentenceForWord,practiceExamples} from '../lib/word-examples';
import Meaning from './meaning';

type Result={word:string;meaning:string;definition:string|null;examples:string[]};
type Props={word:string;passageId?:string;speak?:(word:string)=>void;speechAvailable?:boolean;compact?:boolean};
export function WordExamples({word,passageId,speak,speechAvailable,compact=false}:Props){
 const [result,setResult]=useState<Result|null>(null),[source,setSource]=useState<string|null>(null),[error,setError]=useState('');
 useEffect(()=>{const controller=new AbortController();
  fetch(`/api/word?word=${encodeURIComponent(word)}`,{cache:'no-store',signal:controller.signal}).then(async response=>{if(!response.ok)throw new Error('例句暂时无法加载');return response.json() as Promise<Result>}).then(value=>{if(!controller.signal.aborted)setResult(value)}).catch(reason=>{if(!controller.signal.aborted)setError(reason instanceof Error?reason.message:'例句暂时无法加载')});
  if(passageId){fetch(`/readings/${passageId}.json`,{cache:'force-cache',signal:controller.signal}).then(response=>response.ok?response.json() as Promise<{paragraphs:{en:string}[]}>:null).then(reading=>{if(!reading||controller.signal.aborted)return;const found=reading.paragraphs.flatMap(paragraph=>paragraph.en.match(/[^.!?。！？]+[.!?。！？]+(?:['”」』)]*)|[^.!?。！？]+$/g)??[]).map(sentence=>sentence.trim()).find(sentence=>sentenceForWord(sentence,word));if(found)setSource(found)}).catch(()=>{})}
  return()=>controller.abort();
 },[word,passageId]);
 const examples=source?[source,...(result?.examples??[]).filter(example=>example.toLowerCase()!==source.toLowerCase())]:result?.examples??[];
 const filled=examples.length>=3?examples.slice(0,3):[...examples,...practiceExamples(word)].slice(0,3);
 return <section className={'word-examples '+(compact?'compact':'')} aria-label={`${word} 例句`}><div className="word-examples-heading"><span>EXAMPLES / 例句</span>{speak&&speechAvailable&&<button aria-label={`朗读 ${word} 例句`} onClick={()=>speak(filled.join(' '))}><Volume2 size={15}/></button>}</div>{error?<p className="word-examples-state">{error}</p>:!result?<p className="word-examples-state">正在准备 3 个例句…</p>:<ol>{filled.map((example,index)=><li key={example}><span className="word-example-number">0{index+1}</span><div><p>{example}</p><small>{source&&index===0?'真题原句':result.examples.includes(example)?'词典例句':'练习例句'}</small></div></li>)}</ol>}</section>;
}

export function WordLookup({speak,speechAvailable}:{speak?:(word:string)=>void;speechAvailable:boolean}){
 const [open,setOpen]=useState(false),[query,setQuery]=useState(''),[search,setSearch]=useState('');
 return <section className="word-lookup"><button className="word-lookup-trigger" onClick={()=>setOpen(value=>!value)} aria-expanded={open}><Search size={15}/>查询任意单词</button>{open&&<div className="word-lookup-panel"><div className="word-lookup-input"><Search size={15}/><input value={query} onChange={event=>setQuery(event.target.value)} onKeyDown={event=>{if(event.key==='Enter')setSearch(query.trim())}} placeholder="输入英文单词或短语" aria-label="查询任意单词"/><button aria-label="关闭查询" onClick={()=>{setOpen(false);setSearch('')}}><X size={15}/></button></div>{search?<><WordDefinition word={search} speak={speak} speechAvailable={speechAvailable}/><WordExamples word={search} speak={speak} speechAvailable={speechAvailable} compact/></>:<p className="word-lookup-hint">输入一个不在词库里的词，也可以直接查释义和例句。</p>}</div>}</section>;
}
function WordDefinition({word,speak,speechAvailable}:{word:string;speak?:(word:string)=>void;speechAvailable:boolean}){
 const [result,setResult]=useState<Result|null>(null),[error,setError]=useState('');
 useEffect(()=>{const controller=new AbortController();fetch(`/api/word?word=${encodeURIComponent(word)}`,{signal:controller.signal,cache:'no-store'}).then(async response=>{if(!response.ok)throw new Error('没有找到这个词');return response.json() as Promise<Result>}).then(value=>{if(!controller.signal.aborted)setResult(value)}).catch(reason=>{if(!controller.signal.aborted)setError(reason instanceof Error?reason.message:'查询失败')});return()=>controller.abort()},[word]);
 return <div className="word-lookup-result">{error?<p className="word-examples-state">{error}</p>:!result?<p className="word-examples-state">正在查询…</p>:<><div className="word-lookup-word"><strong>{result.word}</strong>{speak&&speechAvailable&&<button aria-label={`朗读 ${result.word}`} onClick={()=>speak(result.word)}><Volume2 size={16}/></button>}</div><p className="word-lookup-meaning"><Meaning text={result.meaning}/></p>{result.definition&&<p className="word-lookup-definition">{result.definition}</p>}</>}</div>;
}
