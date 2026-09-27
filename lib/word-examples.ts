export type Example={text:string;source:'reading'|'dictionary'|'practice'};

const escapeRegExp=(value:string)=>value.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
export function sentenceForWord(text:string,word:string){
 const parts=text.match(/[^.!?。！？]+[.!?。！？]+(?:['”」』)]*)|[^.!?。！？]+$/g)??[text];
 const matcher=new RegExp(`(?:^|[^A-Za-z])${escapeRegExp(word.trim())}(?:$|[^A-Za-z])`,'i');
 return parts.map(part=>part.trim()).find(part=>matcher.test(part))??null;
}

export function uniqueExamples(examples:string[]):string[]{
 const seen=new Set<string>();
 return examples.map(value=>value.trim()).filter(value=>value&&value.length>5&&!seen.has(value.toLowerCase())&&seen.add(value.toLowerCase())).slice(0,3);
}

export function practiceExamples(word:string):string[]{
 return [
  `I reviewed “${word}” again today and wrote down its meaning.`,
  `Try using “${word}” in a sentence of your own.`,
  `The surrounding words can help you remember “${word}” in context.`,
 ];
}
