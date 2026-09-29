'use client';
import {useEffect,useState} from 'react';
import {Volume2,RotateCcw} from 'lucide-react';
import {EXAMPLES_VERSION,highlightWord,readingExampleForWord,selectExamples,usageNoteForWord,type Example} from '../lib/word-examples';

type Result={examples:Example[];complete:boolean;version:string;error?:string};
type Props={word:string;wordId?:string;passageId?:string;speak?:(word:string)=>void;speechAvailable?:boolean;compact?:boolean};
const memory=new Map<string,Example[]>();
export function WordExamples({word,wordId,passageId,speak,speechAvailable,compact=false}:Props){
 const key=wordId??word;
 const [result,setResult]=useState<{key:string;examples:Example[];loading:boolean;error:string}>({key,examples:[],loading:true,error:''});
 const [source,setSource]=useState<{key:string;example:Example|null}>({key,example:null});
 const [retry,setRetry]=useState(0);
 useEffect(()=>{
  const controller=new AbortController(),cached=memory.get(key);
  setResult({key,examples:cached??[],loading:!cached,error:''});
  setSource({key,example:null});
  if(!cached){
   const params=new URLSearchParams({[wordId?'wordId':'word']:wordId??word,v:EXAMPLES_VERSION});
   fetch(`/api/word?${params}`,{credentials:'same-origin',signal:controller.signal,cache:retry?'reload':'default'})
    .then(async response=>{
     const body=await response.json() as Result;
     if(!response.ok||body.version!==EXAMPLES_VERSION)throw new Error(body.error||'补充例句暂时未能加载');
     const examples=selectExamples(null,Array.isArray(body.examples)?body.examples:[]);
     if(controller.signal.aborted)return;
     if(examples.length>=3){if(memory.size>=300)memory.delete(memory.keys().next().value!);memory.set(key,examples)}
     setResult({key,examples,loading:false,error:examples.length<3?'暂未找到更多合适的双语例句':''});
    }).catch(()=>{if(!controller.signal.aborted)setResult({key,examples:[],loading:false,error:'补充例句暂时未能加载'})});
  }
  if(passageId){
   fetch(`/readings/${passageId}.json`,{cache:'force-cache',credentials:'same-origin',signal:controller.signal})
    .then(response=>response.ok?response.json() as Promise<{paragraphs:{en:string;zh:string}[]}>:null)
    .then(reading=>{if(reading&&!controller.signal.aborted)setSource({key,example:readingExampleForWord(reading.paragraphs,word)})}).catch(()=>{});
  }
  return()=>controller.abort();
 },[key,word,wordId,passageId,retry]);
 const current=result.key===key?result:{key,examples:[],loading:true,error:''};
 const examples=selectExamples(source.key===key?source.example:null,current.examples);
 const usageNote=usageNoteForWord(word);
 const retryExamples=()=>{memory.delete(key);setRetry(value=>value+1)};
 return <section className={'word-examples '+(compact?'compact':'')} aria-label={`${word} 例句`}>
  <div className="word-examples-heading"><span>EXAMPLES / 例句</span>{speak&&speechAvailable&&<button disabled={!examples.length} aria-label={`朗读 ${word} 例句`} onClick={()=>speak(examples.map(example=>example.text).join(' '))}><Volume2 size={15}/></button>}</div>
  {usageNote&&<p className="word-example-note">{usageNote}</p>}
  {examples.length>0&&<ol>{examples.map((example,index)=><li key={`${example.source}-${example.text}`}><span className="word-example-number">0{index+1}</span><div><p>{highlightWord(example.text,word).map((segment,segmentIndex)=>segment.highlight?<mark className="word-example-highlight" key={`${segmentIndex}-${segment.text}`}>{segment.text}</mark>:<span key={`${segmentIndex}-${segment.text}`}>{segment.text}</span>)}</p><p className="word-example-translation">{example.translation}</p><small>{example.source==='reading'?(example.translationScope==='paragraph'?'真题语境 · 段落对照':'真题原句'):example.source==='dictionary'?<a href={example.sourceUrl} target="_blank" rel="noreferrer">{example.attribution||'双语词典例句'} ↗</a>:'自编例句'}</small></div></li>)}</ol>}
  {examples.length<3&&(current.loading?<p className="word-examples-state" role="status">正在加载补充例句…</p>:<div className="word-examples-state"><span>{current.error||'暂未找到更多合适的双语例句'}</span><button type="button" className="word-examples-retry" onClick={retryExamples}><RotateCcw size={12}/>重试</button></div>)}
 </section>;
}
