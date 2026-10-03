import {ChevronDown,Volume2} from 'lucide-react';
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
 const visible=expanded?candidates:candidates.slice(0,4);
 const notes=[...new Set(visible.flatMap(candidate=>candidate.note?[candidate.note]:[]))];
 return <section className="similar-words" aria-label={`${word} 的形近词与易混词`}>
  <header className="similar-words-heading"><h3>形近 / 易混</h3>{candidates.length>0&&<span>{candidates.length}</span>}</header>
  {candidates.length?<>
   <ul className="similar-list">{visible.map(candidate=><li key={`${word}-${candidate.id}`}>
    <strong className="similar-spelling" title={`${word} → ${candidate.word} · ${candidate.kind==='confusable'?'易混词':'拼写相近'}`} aria-label={candidate.word}><Spelling parts={spellingDifference(word,candidate.word).candidate}/></strong>
    <p className="similar-meaning" title={candidate.source}><Meaning text={candidate.meaning}/></p>
    {speak&&speechAvailable&&<button className="similar-speak" type="button" aria-label={`朗读 ${candidate.word}`} onClick={()=>speak(candidate.word)}><Volume2 size={14}/></button>}
   </li>)}</ul>
   {candidates.length>4&&<button className="similar-expand" type="button" aria-expanded={expanded} onClick={()=>setExpandedWord(expanded?'':word)}>{expanded?'收起':`还有 ${candidates.length-4} 个`}<ChevronDown size={12} aria-hidden="true"/></button>}
   {notes.length>0&&<details key={word} className="similar-distinction"><summary>易混辨析<ChevronDown size={12} aria-hidden="true"/></summary>{notes.map(note=><p key={note}>{note}</p>)}</details>}
  </>:<p className="similar-empty">暂无合适的对照词</p>}
  <details className="similar-words-source"><summary>来源</summary><p>释义优先采用你的阅读词库。词表：<a href="https://github.com/exam-data/NETEMVocabulary" target="_blank" rel="noreferrer">NETEMVocabulary · 2024 大纲整理</a>；许可：<a href="https://creativecommons.org/licenses/by-nc-sa/4.0/" target="_blank" rel="noreferrer">CC BY-NC-SA 4.0</a>。</p></details>
 </section>;
}
