'use client';
import {useEffect,useState} from 'react';
import {Volume2} from 'lucide-react';
import {sentenceForWord,practiceExamples,practiceExampleTranslations} from '../lib/word-examples';

type ApiExample={text:string;translation:string;source:'dictionary'|'practice'};
type Result={word:string;meaning:string;definition:string|null;examples:ApiExample[]};
type DisplayExample={text:string;translation:string;source:'reading'|'dictionary'|'practice'};
type Props={word:string;passageId?:string;speak?:(word:string)=>void;speechAvailable?:boolean;compact?:boolean};

async function fetchResult(word:string,signal:AbortSignal){
 const response=await fetch(`/api/word?word=${encodeURIComponent(word)}`,{cache:'no-store',credentials:'same-origin',signal});
 const body=await response.json() as Result&{error?:string};
 if(!response.ok)throw new Error(body.error||'例句暂时无法加载');
 return body as Result;
}

export function WordExamples({word,passageId,speak,speechAvailable,compact=false}:Props){
 const [result,setResult]=useState<Result|null>(null),[source,setSource]=useState<DisplayExample|null>(null),[error,setError]=useState('');
 useEffect(()=>{const controller=new AbortController();
  fetchResult(word,controller.signal).then(value=>{if(!controller.signal.aborted)setResult(value)}).catch(reason=>{if(!controller.signal.aborted)setError(reason instanceof Error?reason.message:'例句暂时无法加载')});
  if(passageId){fetch(`/readings/${passageId}.json`,{cache:'force-cache',credentials:'same-origin',signal:controller.signal}).then(response=>response.ok?response.json() as Promise<{paragraphs:{en:string;zh:string}[]}>:null).then(reading=>{if(!reading||controller.signal.aborted)return;for(const paragraph of reading.paragraphs){const found=sentenceForWord(paragraph.en,word);if(found){setSource({text:found,translation:paragraph.zh,source:'reading'});break}}}).catch(()=>{})}
  return()=>controller.abort();
 },[word,passageId]);
 const examples:DisplayExample[]=[...(source?[source]:[]),...(result?.examples??[]).filter(example=>!source||example.text.toLowerCase()!==source.text.toLowerCase())];
 const fallbackText=practiceExamples(word),fallbackZh=practiceExampleTranslations(word);
 for(let index=0;examples.length<3;index++)examples.push({text:fallbackText[index],translation:fallbackZh[index],source:'practice'});
 const filled=examples.slice(0,3);
 return <section className={'word-examples '+(compact?'compact':'')} aria-label={`${word} 例句`}><div className="word-examples-heading"><span>EXAMPLES / 例句</span>{speak&&speechAvailable&&<button aria-label={`朗读 ${word} 例句`} onClick={()=>speak(filled.map(example=>example.text).join(' '))}><Volume2 size={15}/></button>}</div>{error?<p className="word-examples-state">{error}</p>:!result?<p className="word-examples-state">正在准备 3 个例句…</p>:<ol>{filled.map((example,index)=><li key={`${example.source}-${example.text}`}><span className="word-example-number">0{index+1}</span><div><p>{example.text}</p><p className="word-example-translation">{example.translation}</p><small>{example.source==='reading'?'真题原句':example.source==='dictionary'?'词典例句':'练习例句'}</small></div></li>)}</ol>}</section>;
}
