'use client';
import {useEffect,useState} from 'react';
import {Search,Volume2,X} from 'lucide-react';
import {sentenceForWord,practiceExamples,practiceExampleTranslations} from '../lib/word-examples';
import Meaning from './meaning';

type ApiExample={text:string;translation:string;source:'dictionary'|'practice'};
type Result={word:string;meaning:string;definition:string|null;examples:ApiExample[]};
type DisplayExample={text:string;translation:string;source:'reading'|'dictionary'|'practice'};
type Props={word:string;passageId?:string;speak?:(word:string)=>void;speechAvailable?:boolean;compact?:boolean};

async function fetchResult(word:string,signal:AbortSignal){
 const response=await fetch(`/api/word?word=${encodeURIComponent(word)}`,{cache:'no-store',credentials:'same-origin',signal});
 const body=await response.json() as Result&{error?:string};
 if(!response.ok)throw new Error(body.error||'查询暂时失败，请稍后再试');
 return body as Result;
}

export function WordExamples({word,passageId,speak,speechAvailable,compact=false,initialResult}:Props&{initialResult?:Result|null}){
 const [result,setResult]=useState<Result|null>(initialResult??null),[source,setSource]=useState<DisplayExample|null>(null),[error,setError]=useState('');
 useEffect(()=>{const controller=new AbortController();
  if(initialResult!==undefined){setResult(initialResult);setError('');}else fetchResult(word,controller.signal).then(value=>{if(!controller.signal.aborted)setResult(value)}).catch(reason=>{if(!controller.signal.aborted)setError(reason instanceof Error?reason.message:'例句暂时无法加载')});
  if(passageId){fetch(`/readings/${passageId}.json`,{cache:'force-cache',credentials:'same-origin',signal:controller.signal}).then(response=>response.ok?response.json() as Promise<{paragraphs:{en:string;zh:string}[]}>:null).then(reading=>{if(!reading||controller.signal.aborted)return;for(const paragraph of reading.paragraphs){const found=sentenceForWord(paragraph.en,word);if(found){setSource({text:found,translation:paragraph.zh,source:'reading'});break}}}).catch(()=>{})}
  return()=>controller.abort();
 },[word,passageId,initialResult]);
 const examples:DisplayExample[]=[...(source?[source]:[]),...(result?.examples??[]).filter(example=>!source||example.text.toLowerCase()!==source.text.toLowerCase())];
 const fallbackText=practiceExamples(word),fallbackZh=practiceExampleTranslations(word);
 for(let index=0;examples.length<3;index++)examples.push({text:fallbackText[index],translation:fallbackZh[index],source:'practice'});
 const filled=examples.slice(0,3);
 return <section className={'word-examples '+(compact?'compact':'')} aria-label={`${word} 例句`}><div className="word-examples-heading"><span>EXAMPLES / 例句</span>{speak&&speechAvailable&&<button aria-label={`朗读 ${word} 例句`} onClick={()=>speak(filled.map(example=>example.text).join(' '))}><Volume2 size={15}/></button>}</div>{error?<p className="word-examples-state">{error}</p>:!result?<p className="word-examples-state">正在准备 3 个例句…</p>:<ol>{filled.map((example,index)=><li key={`${example.source}-${example.text}`}><span className="word-example-number">0{index+1}</span><div><p>{example.text}</p><p className="word-example-translation">{example.translation}</p><small>{example.source==='reading'?'真题原句':example.source==='dictionary'?'词典例句':'练习例句'}</small></div></li>)}</ol>}</section>;
}

export function WordLookup({speak,speechAvailable}:{speak?:(word:string)=>void;speechAvailable:boolean}){
 const [query,setQuery]=useState(''),[search,setSearch]=useState(''),[result,setResult]=useState<Result|null>(null),[loading,setLoading]=useState(false),[error,setError]=useState('');
 const submit=()=>{const value=query.trim();if(value)setSearch(value)};
 useEffect(()=>{if(!search)return;const controller=new AbortController();setLoading(true);setResult(null);setError('');fetchResult(search,controller.signal).then(value=>{if(!controller.signal.aborted)setResult(value)}).catch(reason=>{if(!controller.signal.aborted)setError(reason instanceof Error?reason.message:'查询暂时失败，请稍后再试')}).finally(()=>{if(!controller.signal.aborted)setLoading(false)});return()=>controller.abort()},[search]);
 return <section className="word-lookup" aria-label="查询任意单词"><div className="word-lookup-label"><span>WORD LOOKUP</span><strong>查询任意单词</strong><small>词库内即时返回，词库外自动补充释义与例句</small></div><form className="word-lookup-form" onSubmit={event=>{event.preventDefault();submit()}}><div className="word-lookup-input"><Search size={17}/><input value={query} onChange={event=>setQuery(event.target.value)} placeholder="输入英文单词或短语，例如：serendipity" aria-label="查询任意单词"/><button type="submit" className="word-lookup-submit" disabled={!query.trim()||loading}>{loading?'查询中':'查询'}</button>{search&&<button type="button" className="word-lookup-clear" aria-label="清空查询" onClick={()=>{setQuery('');setSearch('');setResult(null);setError('')}}><X size={15}/></button>}</div></form>{search?<div className="word-lookup-panel"><WordDefinition word={search} result={result} loading={loading} error={error} speak={speak} speechAvailable={speechAvailable}/>{!error&&<WordExamples word={search} speak={speak} speechAvailable={speechAvailable} compact initialResult={result}/>}</div>:<p className="word-lookup-hint">输入一个不在词库里的词，也可以直接查释义和例句。</p>}</section>;
}

function WordDefinition({word,result,loading,error,speak,speechAvailable}:{word:string;result:Result|null;loading:boolean;error:string;speak?:(word:string)=>void;speechAvailable:boolean}){
 return <div className="word-lookup-result">{error?<p className="word-examples-state">{error}</p>:!result?<p className="word-examples-state">{loading?'正在查询…':'请输入英文单词后查询'}</p>:<><div className="word-lookup-word"><strong>{result.word}</strong>{speak&&speechAvailable&&<button aria-label={`朗读 ${result.word}`} onClick={()=>speak(result.word)}><Volume2 size={16}/></button>}</div><p className="word-lookup-meaning"><Meaning text={result.meaning}/></p>{result.definition&&<p className="word-lookup-definition">{result.definition}</p>}</>}</div>;
}
