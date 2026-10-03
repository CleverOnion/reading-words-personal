import {ArrowRight,Volume2} from 'lucide-react';
import {words} from '../lib/vocabulary';
import {createSimilarWordLookup,spellingDifference,type SpellingPart} from '../lib/similar-words';
import Meaning from './meaning';
import './similar-words.css';

const lookup=createSimilarWordLookup(words);
function Spelling({parts}:{parts:SpellingPart[]}){
 return <>{parts.map((part,i)=>part.changed?<mark key={i}>{part.text}</mark>:<span key={i}>{part.text}</span>)}</>;
}
export default function SimilarWords({word,speak,speechAvailable=false}:{word:string;speak?:(word:string)=>void;speechAvailable?:boolean}){
 const candidates=lookup(word);
 return <section className="similar-words" aria-label={`${word} 的形近词`}>
  <div className="similar-words-heading"><span>LOOK ALIKES / 形近词</span><span>{candidates.length?String(candidates.length).padStart(2,'0'):''}</span></div>
  {candidates.length?<><p className="similar-words-note">对照拼写，留意标亮的差异</p><ul>{candidates.map(candidate=>{
   const diff=spellingDifference(word,candidate.word);
   return <li key={candidate.id}><div className="similar-spelling"><span className="similar-original" aria-label={`本词 ${word}`}><Spelling parts={diff.original}/></span><ArrowRight size={12} aria-hidden="true"/><strong aria-label={`形近词 ${candidate.word}`}><Spelling parts={diff.candidate}/></strong>{speak&&speechAvailable&&<button type="button" aria-label={`朗读形近词 ${candidate.word}`} onClick={()=>speak(candidate.word)}><Volume2 size={14}/></button>}</div><p className="similar-meaning"><Meaning text={candidate.meaning}/></p></li>;
  })}</ul><p className="similar-words-source">释义来自当前词库</p></>:<p className="similar-words-note">词库中暂未收录合适的形近词</p>}
 </section>;
}
