import assert from 'node:assert/strict';
import {test} from 'node:test';
import {readFileSync} from 'node:fs';
import {usageExamples} from '../data/usage-examples.ts';
import {practiceExamples,practiceExampleTranslations,sentenceForWord,uniqueExamples,readingExampleForWord,selectExamples,isUsableExample,originalExamples,highlightWord,type Example} from '../lib/word-examples.ts';
import {createExampleService,parseDictionaryExamples,plainText} from '../lib/example-provider.ts';

test('finds the source sentence without matching a substring',()=>{
 assert.equal(sentenceForWord('A patent can protect an invention. The patient reader waits.','patent'),'A patent can protect an invention.');
 assert.equal(sentenceForWord('A patient reader waits.','patent'),null);
});

test('all original examples are bilingual uses, and every grammar entry has three',()=>{
 for(const [word,pairs] of Object.entries(usageExamples)){
  assert.equal(pairs.length,3,word);
  for(const [text,translation] of pairs){
   assert.ok(isUsableExample({text,translation}),word+': '+text);
   assert.ok(!/\b(?:sb|sth)\b|\.\.\./.test(text),word);
  }
 }
 const passages=JSON.parse(readFileSync(new URL('../data/vocabulary.json',import.meta.url),'utf8')) as {words:{word:string}[]}[];
 for(const {word} of passages.flatMap(p=>p.words).filter(w=>/\b(?:sb|sth)\b|\.\.\.|[()/]/.test(w.word)))assert.equal(originalExamples(word).length,3,word);
});

test('the source sentence gets only its corresponding Chinese sentence',()=>{
 const reading=JSON.parse(readFileSync(new URL('../public/readings/2024-1.json',import.meta.url),'utf8'));
 const example=readingExampleForWord(reading.paragraphs,'nail');
 assert.equal(example?.text,'The nail hoard was discovered in 1960 in a four-metre-deep pit covered by two metres of gravel.');
 assert.equal(example?.translation,'1960年，人们在一个四米深、上面覆盖着两米厚砾石的坑中发现了这批铁钉。');
 assert.equal(example?.translationScope,'sentence');
});

test('every gap found in the full vocabulary audit has three original examples',()=>{
 const gaps=JSON.parse(readFileSync(new URL('./fixtures/word-example-gaps.json',import.meta.url),'utf8')) as string[];
 for(const word of gaps)assert.equal(originalExamples(word).length,3,word);
});

test('unaligned translations preserve the full paragraph and label its scope',()=>{
 const paragraphs=[{en:'We found a nail. It was made of iron.',zh:'我们找到了一枚铁钉。'}];
 const example=readingExampleForWord(paragraphs,'nail');
 assert.equal(example?.text,paragraphs[0].en);
 assert.equal(example?.translationScope,'paragraph');
});

test('source sentence matching handles inflections, decimals and abbreviations',()=>{
 assert.equal(sentenceForWord('The board was 4.5 metres long. We nailed it in place.','nail'),'We nailed it in place.');
 assert.equal(sentenceForWord('A patient is waiting.','patent'),null);
});

test('highlights the target word and its matched word forms in example text',()=>{
 assert.deepEqual(highlightWord('The nail board was discovered, and the nails were counted.','nail'),[
  {text:'The ',highlight:false},
  {text:'nail',highlight:true},
  {text:' board was discovered, and the ',highlight:false},
  {text:'nails',highlight:true},
  {text:' were counted.',highlight:false},
 ]);
 assert.deepEqual(highlightWord('They nailed it down.','nail'),[
  {text:'They ',highlight:false},
  {text:'nailed',highlight:true},
  {text:' it down.',highlight:false},
 ]);
});

test('source example stays visible without supplementary data; templates never fill gaps',()=>{
 const reading:Example={text:'We found a nail under the table.',translation:'我们在桌子下面找到了一枚钉子。',source:'reading'};
 assert.deepEqual(selectExamples(reading,[]),[reading]);
 assert.equal(selectExamples(reading,[{text:'Try using “nail” in a sentence of your own.',translation:'试着使用这个词。',source:'practice'}]).length,1);
 assert.equal(selectExamples(reading,originalExamples('nail')).length,3);
});

function providerBody(word='nail'){
 return {blng_sents_part:{'sentence-pair':originalExamples(word).map(example=>({sentence:example.text,'sentence-translation':example.translation,source:'测试双语来源'}))}};
}

test('dictionary parsing preserves translations, prioritizes PDF senses and links provenance',()=>{
 const results=parseDictionaryExamples(providerBody(),'nail','n.指甲');
 assert.equal(results.length,3);
 assert.ok(results[0].translation.includes('指甲'));
 assert.ok(results.every(x=>x.source==='dictionary'&&x.sourceUrl==='https://dict.youdao.com/w/nail/'&&x.attribution==='测试双语来源'));
 assert.equal(plainText('The <b>nail</b> is &#34;loose&#34; &amp; rusty.'),'The nail is "loose" & rusty.');
});

test('rejects unrelated sentences, missing Chinese, duplicate sentences and fake translations',()=>{
 const valid=providerBody().blng_sents_part['sentence-pair'][0];
 const results=parseDictionaryExamples({blng_sents_part:{'sentence-pair':[
  valid,valid,
  {sentence:'The patient is sitting in the hall.','sentence-translation':'病人坐在大厅里。'},
  {sentence:'The nail fell from the wall.','sentence-translation':'Please read the definition.'},
  {sentence:'The nail is made of iron.','sentence-translation':'例句参考：请结合上方释义理解这个词。'},
  {sentence:'A loose nail','sentence-translation':'一枚松动的钉子'},
 ]}},'nail');
 assert.equal(results.length,1);
 assert.deepEqual(parseDictionaryExamples(null,'nail'),[]);
});

test('uses detailed dictionary examples when the top-level list is short',()=>{
 const results=parseDictionaryExamples({collins:{collins_entries:[{entries:{entry:[{tran_entry:[{exam_sents:{sent:[{eng_sent:'The nail fell from the wall.',chn_sent:'钉子从墙上掉了下来。'}]}}]}]}}]}},'nail');
 assert.equal(results.length,1);
 assert.ok(results[0].attribution?.includes('柯林斯'));
});

test('original examples do not depend on a remote dictionary',async()=>{
 const service=createExampleService((async()=>{throw new Error('Offline')}) as typeof fetch);
 assert.equal((await service('nail')).length,3);
 assert.equal((await service("be in the best interest of sb./in sb's best interest to do sth.")).length,3);
});

const patentBody={blng_sents_part:{'sentence-pair':[
 {sentence:'She applied for a patent on the new device.','sentence-translation':'她为这台新设备申请了专利。'},
 {sentence:'The company holds a patent for the design.','sentence-translation':'公司拥有这项设计的专利。'},
 {sentence:'The engineer decided to patent the invention.','sentence-translation':'工程师决定为这项发明申请专利。'},
]}};

test('concurrent requests share a lookup and successful results are cached',async()=>{
 let calls=0;
 const service=createExampleService((async()=>{calls++;return Response.json(patentBody)}) as typeof fetch);
 const results=await Promise.all([service('patent'),service('patent'),service('patent')]);
 assert.equal(calls,1);assert.equal(results[0].length,3);
 await service('patent');assert.equal(calls,1);
});

test('failed lookups are retryable and never cached as fake successes',async()=>{
 let calls=0;
 const service=createExampleService((async()=>{calls++;if(calls===1)throw new Error('Offline');return Response.json(patentBody)}) as typeof fetch);
 await assert.rejects(service('patent'));
 assert.equal((await service('patent')).length,3);
 assert.equal(calls,2);
});

test('partial results are not cached, so an immediate retry can fill the gap',async()=>{
 let clock=0,calls=0;
 const service=createExampleService((async()=>{calls++;return Response.json(calls===1?{blng_sents_part:{'sentence-pair':patentBody.blng_sents_part['sentence-pair'].slice(0,1)}}:patentBody)}) as typeof fetch,()=>clock);
 assert.equal((await service('patent')).length,1);
 assert.equal((await service('patent')).length,3);
});

test('a long source paragraph is retained when its translation needs paragraph context',()=>{
 const reading:Example={text:'The nail is made of iron. '.repeat(35),translation:'这枚钉子由铁制成。'.repeat(35),source:'reading',translationScope:'paragraph'};
 assert.deepEqual(selectExamples(reading,[]),[reading]);
});

test('supplementary examples use nail in a situation instead of talking about the word',()=>{
 const texts=practiceExamples('nail');
 assert.equal(texts.length,3);
 assert.ok(texts.every(text=>!/(?:reviewed|try using|remember).*nail/i.test(text)), 'A vocabulary exercise prompt is not a usage example');
 assert.ok(texts.some(text=>/hammer|board|wall|wood/i.test(text)));
 assert.equal(practiceExampleTranslations('nail').length,3);
});

test('an unknown word never receives fabricated template sentences',()=>{
 assert.deepEqual(practiceExamples('not-a-real-dictionary-entry'),[]);
 assert.deepEqual(practiceExampleTranslations('not-a-real-dictionary-entry'),[]);
});
test('deduplicates examples and caps the display at three',()=>{
 assert.deepEqual(uniqueExamples(['A useful example sentence.','a useful example sentence.','Another example appears here.','Third example appears here.','Fourth example appears here.']),['A useful example sentence.','Another example appears here.','Third example appears here.']);
 assert.equal(practiceExamples('treasure').length,3);
});
