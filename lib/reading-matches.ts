export type WordMatch={start:number;end:number};
export type ReadingSegment={text:string;start:number;wordId?:string};
const irregular:Record<string,string[]>={
 be:['am','is','are','was','were','been','being'],have:['has','had','having'],do:['does','did','done','doing'],
 take:['takes','took','taken','taking'],buy:['buys','bought','buying'],eat:['eats','ate','eaten','eating'],
 go:['goes','went','gone','going'],come:['comes','came','coming'],find:['finds','found','finding'],
 stand:['stands','stood','standing'],see:['sees','saw','seen','seeing'],put:['puts','putting'],
 give:['gives','gave','given','giving'],mean:['means','meant','meaning'],lead:['leads','led','leading'],
 pay:['pays','paid','paying'],get:['gets','got','gotten','getting'],run:['runs','ran','running'],
 write:['writes','wrote','written','writing'],think:['thinks','thought','thinking'],break:['breaks','broke','broken','breaking'],
 bear:['bears','bore','borne','bearing'],rise:['rises','rose','risen','rising'],seek:['seeks','sought','seeking'],
 draw:['draws','drew','drawn','drawing'],teach:['teaches','taught','teaching'],grow:['grows','grew','grown','growing'],
 hold:['holds','held','holding'],set:['sets','setting'],hit:['hits','hitting'],
 criterion:['criteria'],curriculum:['curricula','curriculums'],man:['men'],woman:['women'],person:['people'],
 child:['children'],analysis:['analyses'],foot:['feet'],tooth:['teeth'],phenomenon:['phenomena'],
};
const aliases:Record<string,string[]>={
 'catalog(ue)':['catalog','catalogue'],favorable:['favourable'],favorably:['favourably'],
 favor:['favour'],fulfilment:['fulfillment'],fulfillment:['fulfilment'],
 'telephone-number-si zed':['telephone-number-sized'], 'the writing is on the well':['the writing is on the wall'],
 'recorder-high':['record-high'], 'historically-low':['historically low'],discernible:['discernable'],
};
const escape=(s:string)=>s.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
function forms(token:string):string[]{
 const set=new Set([token,...(irregular[token]||[])]);
 if(/^[a-z]+$/.test(token)&&token.length>2){
  set.add(token+'s');
  if(/(?:s|x|z|ch|sh|o)$/.test(token))set.add(token+'es');
  if(/[^aeiou]y$/.test(token)){set.add(token.slice(0,-1)+'ies');set.add(token.slice(0,-1)+'ied');}
  else set.add(token+(token.endsWith('e')?'d':'ed'));
  set.add(token.endsWith('ie')?token.slice(0,-2)+'ying':token.endsWith('e')&&!token.endsWith('ee')?token.slice(0,-1)+'ing':token+'ing');
  // Only a small explicit list: generic consonant doubling produces false forms.
  if(['plan','ban','stop','drop','flip','refer','occur','admit','permit','prefer','regret','control','commit'].includes(token)){
   set.add(token+token.at(-1)+'ed');set.add(token+token.at(-1)+'ing');
  }
 }
 return [...set];
}
function expression(term:string):string|null{
 // Grammar examples/ellipsis aren't continuous quotations. Do not guess spans.
 if(/\bsth\b|\bsb\b|…|\.\.\./i.test(term))return null;
 const tokens=term.toLowerCase().replace(/[’‘]/g,"'").trim().split(/\s+/);
 return tokens.map(token=>{
  if(token==="one's")return "(?:one['’]s|his|her|their|our|your|my|its)";
  const variants=new Set(forms(token));
  if(token.includes('iz'))for(const v of forms(token.replace('iz','is')))variants.add(v);
  if(token.includes('is')&&/(?:ise|ised|ising)$/.test(token))for(const v of forms(token.replace('is','iz')))variants.add(v);
  return '(?:'+[...variants].sort((a,b)=>b.length-a.length).map(v=>escape(v).replaceAll("'","['’]").replaceAll('-','[-‐‑–—]')).join('|')+')';
 }).join('\\s+');
}
const regexCache=new Map<string,RegExp|null>();
export function findWordMatches(text:string,word:string):WordMatch[]{
 let regex=regexCache.get(word);
 if(regex===undefined){
  const terms=[word,...(aliases[word.toLowerCase()]||[])].flatMap(s=>s.split('/'));
  const patterns=[...new Set(terms)].map(expression).filter((x):x is string=>!!x);
  regex=patterns.length?new RegExp('(?<![a-zA-Z])(?:'+patterns.join('|')+')(?![a-zA-Z])','gi'):null;
  regexCache.set(word,regex);
 }
 if(!regex)return [];
 regex.lastIndex=0;
 return Array.from(text.matchAll(regex),m=>({start:m.index,end:m.index+m[0].length}));
}
export function segmentParagraph(text:string,words:{id:string;word:string}[],selectedId?:string):ReadingSegment[]{
 const matches=words.flatMap(w=>findWordMatches(text,w.word).map(m=>({...m,wordId:w.id})));
 matches.sort((a,b)=>Number(b.wordId===selectedId)-Number(a.wordId===selectedId)||(b.end-b.start)-(a.end-a.start)||a.start-b.start);
 const accepted:typeof matches=[];
 for(const m of matches)if(!accepted.some(a=>m.start<a.end&&m.end>a.start))accepted.push(m);
 accepted.sort((a,b)=>a.start-b.start);
 const result:ReadingSegment[]=[];let pos=0;
 for(const m of accepted){if(m.start>pos)result.push({text:text.slice(pos,m.start),start:pos});result.push({text:text.slice(m.start,m.end),start:m.start,wordId:m.wordId});pos=m.end;}
 if(pos<text.length)result.push({text:text.slice(pos),start:pos});
 return result;
}
