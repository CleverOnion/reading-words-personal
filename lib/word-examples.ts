import {usageExamples,usageNotes} from '../data/usage-examples.ts';
import {findWordMatches} from './reading-matches.ts';

export type Example={text:string;translation:string;source:'reading'|'dictionary'|'practice';attribution?:string;sourceUrl?:string;translationScope?:'sentence'|'paragraph'};
export const EXAMPLES_VERSION='usage-v3';
export const normalizeWord=(word:string)=>word.trim().toLowerCase().replace(/[‘’]/g,"'").replace(/\s+/g,' ');
const escape=(text:string)=>text.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
function sentences(text:string,language='en'){
 return [...new Intl.Segmenter(language,{granularity:'sentence'}).segment(text)].map(part=>part.segment.trim()).filter(Boolean);
}
export function sentenceForWord(text:string,word:string){
 const parts=sentences(text);
 const exact=new RegExp(`(?:^|[^A-Za-z])${escape(word.trim())}(?:$|[^A-Za-z])`,'i');
 return parts.find(part=>exact.test(part))??parts.find(part=>findWordMatches(part,word).length)??null;
}
export function readingExampleForWord(paragraphs:{en:string;zh:string}[],word:string):Example|null{
 for(const paragraph of paragraphs){
  const sentence=sentenceForWord(paragraph.en,word);
  if(!sentence||!paragraph.zh.trim())continue;
  const english=sentences(paragraph.en),chinese=sentences(paragraph.zh,'zh');
  // When sentence counts differ, preserve the complete bilingual context.
  if(english.length===chinese.length)return {text:sentence,translation:chinese[english.indexOf(sentence)],source:'reading',translationScope:'sentence'};
  return {text:paragraph.en,translation:paragraph.zh,source:'reading',translationScope:'paragraph'};
 }
 return null;
}

export function uniqueExamples(examples:string[]):string[]{
 const seen=new Set<string>();
 return examples.map(value=>value.trim()).filter(value=>value&&value.length>5&&!seen.has(value.toLowerCase())&&seen.add(value.toLowerCase())).slice(0,3);
}

export function practiceExamples(word:string):string[]{return (usageExamples[normalizeWord(word)]??[]).map(pair=>pair[0]);}
export function practiceExampleTranslations(word:string):string[]{return (usageExamples[normalizeWord(word)]??[]).map(pair=>pair[1]);}
export function originalExamples(word:string):Example[]{return (usageExamples[normalizeWord(word)]??[]).map(([text,translation])=>({text,translation,source:'practice'}));}
export function usageNoteForWord(word:string):string|undefined{return usageNotes[normalizeWord(word)];}
export function isTemplateExample(text:string){return /(?:I reviewed [“"']|Try using [“"']|The surrounding words can help you remember|in a sentence of your own|wrote down its meaning|请结合上方释义|例句参考：|查询失败|QUERY LENGTH LIMIT|MYMEMORY WARNING|INVALID LANGUAGE PAIR)/i.test(text);}
export function isUsableExample(example:Pick<Example,'text'|'translation'>,word?:string){
 if(typeof example.text!=='string'||typeof example.translation!=='string')return false;
 if(example.text.length<10||example.text.length>700||example.translation.length>700)return false;
 if(!/[\u3400-\u9fff]/u.test(example.translation)||isTemplateExample(example.text)||isTemplateExample(example.translation))return false;
 if(!/[.!?][”"']?$/.test(example.text.trim())||example.text.trim().split(/\s+/).length<3)return false;
 return !word||findWordMatches(example.text,word).length>0;
}
export function selectExamples(reading:Example|null,supplementary:Example[]):Example[]{
 const result:Example[]=[],seen=new Set<string>();
 for(const example of [...(reading?[reading]:[]),...supplementary]){
  if(example.source==='reading'){
   if(!example.text.trim()||!example.translation.trim())continue;
  }else if(!isUsableExample(example))continue;
  const key=example.text.toLowerCase().replace(/[^a-z0-9]/g,'');
  if(seen.has(key))continue;
  seen.add(key);result.push(example);
  if(result.length===3)break;
 }
 return result;
}
