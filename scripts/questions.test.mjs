import {test} from 'node:test';
import assert from 'node:assert/strict';
import {build} from 'esbuild';
const bundle=await build({entryPoints:['lib/vocabulary.ts'],bundle:true,platform:'node',format:'esm',write:false});
const {words,optionsFor,assertQuestion}=await import('data:text/javascript;base64,'+Buffer.from(bundle.outputFiles[0].text).toString('base64'));
test('all active PDF entries retain one correct answer across 32 question shuffles',()=>{
 assert.ok(words.length>3000);
 for(const word of words)for(let i=0;i<32;i++){
  const options=optionsFor(word.id,'audit-session-'+i,i);
  assert.equal(options.length,4,word.id);
  assert.equal(new Set(options).size,4,word.id);
  assert.equal(options.filter(o=>o===word.meaning).length,1,word.id);
 }
});
test('reject mismatched word labels, missing correct answer, and repeated options',()=>{
 const w=words[0],options=optionsFor(w.id,'check',0);
 assert.doesNotThrow(()=>assertQuestion({id:w.id,word:w.word,options}));
 assert.throws(()=>assertQuestion({id:w.id,word:'a different word',options}));
 assert.throws(()=>assertQuestion({id:w.id,word:w.word,options:options.map(o=>o===w.meaning?'错误的释义':o)}));
 assert.throws(()=>assertQuestion({id:w.id,word:w.word,options:[w.meaning,w.meaning,w.meaning,w.meaning]}));
});
