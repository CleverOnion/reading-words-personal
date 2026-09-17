export type Reading={id:string;year:number;text:number;translationSource:string;sourceNote:string;paragraphs:{en:string;zh:string}[]};
export const passageIdForWord=(wordId:string)=>wordId.split('-').slice(0,2).join('-');
export function hasReading(id:string){return /^(201\d|202[0-6])-[1-4]$/.test(id);}
