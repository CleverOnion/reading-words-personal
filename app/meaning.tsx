import {splitMeaning} from '../lib/meaning';

/** Phrasing-only markup, valid inside existing paragraphs and inline wrappers. */
export default function Meaning({text}:{text:string|undefined}){
 return <span className="meaning-sections">{splitMeaning(text??'').map((section,index)=><span className={'meaning-section'+(section.label?'':' meaning-unlabeled')} key={index}>{section.label&&<span className="meaning-pos">{section.label}</span>}<span className="meaning-text">{section.text}</span></span>)}</span>;
}
