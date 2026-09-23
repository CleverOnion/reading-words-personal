export type MeaningSection={label:string;text:string};
export function splitMeaning(meaning:string):MeaningSection[]{
 // A Chinese sense can touch the next POS directly; an English word cannot.
 // Consume slash-combined labels as one unit (v./n., vt. / vi.).
 const pos='(?:adj|adv|prep|conj|pron|num|aux|int|vt|vi|n|v)\\.';
 const markers=[...meaning.matchAll(new RegExp('(?<![A-Za-z])'+pos+'(?:\\s*/\\s*'+pos+')*','g'))];
 if(!markers.length)return meaning.trim()?[{label:'',text:meaning.trim()}]:[];
 const sections:MeaningSection[]=[];
 const prefix=meaning.slice(0,markers[0].index).trim();
 if(prefix)sections.push({label:'',text:prefix});
 markers.forEach((marker,index)=>sections.push({
  label:marker[0],
  text:meaning.slice(marker.index+marker[0].length,markers[index+1]?.index??meaning.length).trim(),
 }));
 return sections;
}
