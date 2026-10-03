import {ArrowRight,ChevronDown,Volume2} from 'lucide-react';
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
  <div className="similar-words-heading"><div><span className="similar-eyebrow">WORD COMPANIONS</span><h3>形近 · 易混</h3></div>{candidates.length>0&&<span className="similar-count">{candidates.length} 个对照</span>}</div>
  {candidates.length?<><p className="similar-words-note">留意一点差别，记得更清楚。</p><ul>{(expanded?candidates:candidates.slice(0,3)).map(candidate=>{
   const diff=spellingDifference(word,candidate.word);
   return <li key={`${word}-${candidate.id}`}><div className="similar-entry-top"><span className="similar-kind">{candidate.kind==='confusable'?'易混词':'形近词'}</span>{speak&&speechAvailable&&<button className="similar-speak" type="button" aria-label={`朗读形近词 ${candidate.word}`} onClick={()=>speak(candidate.word)}><Volume2 size={15}/></button>}</div><div className="similar-spelling"><span className="similar-original" aria-label={`本词 ${word}`}><Spelling parts={diff.original}/></span><ArrowRight size={12} aria-hidden="true"/><strong aria-label={`形近词 ${candidate.word}`}><Spelling parts={diff.candidate}/></strong></div><p className="similar-meaning" title={candidate.source}><Meaning text={candidate.meaning}/></p>{candidate.note&&<details className="similar-distinction"><summary>查看区别<ChevronDown size={13} aria-hidden="true"/></summary><p>{candidate.note}</p></details>}</li>;
  })}</ul>{candidates.length>3&&<button className="similar-expand" type="button" aria-expanded={expanded} onClick={()=>setExpandedWord(expanded?'':word)}>{expanded?'收起对照':`展开其余 ${candidates.length-3} 个`}<ChevronDown size={14} aria-hidden="true"/></button>}</>:<p className="similar-empty">暂未找到合适的对照词<br/><span>继续记住眼前这个词就好。</span></p>}
  <details className="similar-words-source"><summary>词表与释义来源</summary><p>释义优先采用你的阅读词库。<a href="https://github.com/exam-data/NETEMVocabulary" target="_blank" rel="noreferrer">词表：NETEMVocabulary · 2024 大纲整理</a> · <a href="https://creativecommons.org/licenses/by-nc-sa/4.0/" target="_blank" rel="noreferrer">CC BY-NC-SA 4.0</a>。</p></details>
 </section>;
}
