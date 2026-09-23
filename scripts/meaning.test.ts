import test from 'node:test';
import assert from 'node:assert/strict';
import {splitMeaning} from '../lib/meaning.ts';

test('separates glued noun and verb senses without changing their text',()=>{
 assert.deepEqual(splitMeaning('n.宝藏；财富；珍宝v.珍藏；珍视'),[
  {label:'n.',text:'宝藏；财富；珍宝'},{label:'v.',text:'珍藏；珍视'}
 ]);
});
test('keeps compound parts of speech together',()=>{
 assert.deepEqual(splitMeaning('v./n.改变 adj.可变的'),[
  {label:'v./n.',text:'改变'},{label:'adj.',text:'可变的'}
 ]);
});
test('supports every requested part of speech and English word boundaries',()=>{
 const labels=['n.','v.','adj.','adv.','prep.','conj.','pron.','vt.','vi.','num.','aux.','int.'];
 assert.deepEqual(splitMeaning(labels.map(label=>label+'释义').join('')).map(s=>s.label),labels);
 assert.deepEqual(splitMeaning('在 Washington. 有用；例如 turn.'),[{label:'',text:'在 Washington. 有用；例如 turn.'}]);
});
test('retains unlabeled definitions, introductory text and empty input',()=>{
 assert.deepEqual(splitMeaning('短语释义'),[{label:'',text:'短语释义'}]);
 assert.deepEqual(splitMeaning('【熟词生义】 n. 财富'),[{label:'',text:'【熟词生义】'},{label:'n.',text:'财富'}]);
 assert.deepEqual(splitMeaning(''),[]);
});
