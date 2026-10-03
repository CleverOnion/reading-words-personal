import {ArrowRight,Volume2} from 'lucide-react';
import {useState} from 'react';
import {words} from '../lib/vocabulary';
import syllabus from '../data/syllabus-vocabulary.json';
import {confusableGroups} from '../data/confusable-words';
import {createSimilarWordLookup,syllabusEntries,spellingDifference,type SpellingPart} from '../lib/similar-words';
import Meaning from './meaning';
import './similar-words.css';

const lookup=createSimilarWordLookup(syllabusEntries(syllabus,words),confusableGroups,Infinity);
function Spelling({parts}:{parts:SpellingPart[]}){
 return <>{parts.map((part,i)=>part.changed?<mark key={i}>{part.text}</mark>:<span key={i}>{part.text}</span>)}</>;
}
export default function SimilarWords({word,speak,speechAvailable=false}:{word:string;speak?:(word:string)=>void;speechAvailable?:boolean}){
 const candidates=lookup(word);
 const [expandedWord,setExpandedWord]=useState('');
 const expanded=expandedWord===word;
 return <section className="similar-words" aria-label={`${word} 的形近词与易混词`}>
  <div className="similar-words-heading"><span>COMPARE / 形近 · 易混</span><span>{candidates.length?String(candidates.length).padStart(2,'0'):''}</span></div>
  {candidates.length?<><p className="similar-words-note">大纲词汇范围 · 标亮拼写差异</p><ul>{(expanded?candidates:candidates.slice(0,3)).map(candidate=>{
   const diff=spellingDifference(word,candidate.word);
   return <li key={candidate.id}><span className="similar-kind">{candidate.kind==='confusable'?'易混辨析':'拼写相近'}</span><div className="similar-spelling"><span className="similar-original" aria-label={`本词 ${word}`}><Spelling parts={diff.original}/></span><ArrowRight size={12} aria-hidden="true"/><strong aria-label={`形近词 ${candidate.word}`}><Spelling parts={diff.candidate}/></strong>{speak&&speechAvailable&&<button type="button" aria-label={`朗读形近词 ${candidate.word}`} onClick={()=>speak(candidate.word)}><Volume2 size={14}/></button>}</div><p className="similar-meaning"><Meaning text={candidate.meaning}/></p>{candidate.note&&<p className="similar-distinction">{candidate.note}</p>}<span className="similar-kind">{candidate.source}</span></li>;
  })}</ul>{candidates.length>3&&<button className="similar-expand" type="button" aria-expanded={expanded} onClick={()=>setExpandedWord(expanded?'':word)}>{expanded?'收起':`查看其余 ${candidates.length-3} 个`}</button>}</>:<p className="similar-words-note">大纲候选词中暂无合适的形近词或已整理的易混词</p>}
  <p className="similar-words-source"><a href="https://github.com/exam-data/NETEMVocabulary" target="_blank" rel="noreferrer">词表：NETEMVocabulary · 2024 大纲整理</a> · <a href="https://creativecommons.org/licenses/by-nc-sa/4.0/" target="_blank" rel="noreferrer">CC BY-NC-SA 4.0</a></p>
 </section>;
}
