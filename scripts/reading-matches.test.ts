import test from 'node:test';
import assert from 'node:assert/strict';
import {findWordMatches, segmentParagraph} from '../lib/reading-matches.ts';

test('matches whole words without matching substrings',()=>{
 assert.deepEqual(findWordMatches('The art of starting an article. Art!', 'art').map(m=>[m.start,m.end]),[[4,7],[32,35]]);
});
test('locates regular and irregular inflections and preserves source offsets',()=>{
 const text='Companies were buying books; a company bought one and buys again.';
 assert.deepEqual(findWordMatches(text,'company').map(m=>text.slice(m.start,m.end)),['Companies','company']);
 assert.deepEqual(findWordMatches(text,'buy').map(m=>text.slice(m.start,m.end)),['buying','bought','buys']);
 assert.equal(findWordMatches('Her plan was planned carefully.','plan').length,2);
});
test('handles phrase inflection, apostrophes and spelling variants without arbitrary gaps',()=>{
 assert.equal(findWordMatches('They took off. Then take the coat off.','take off').length,1);
 assert.equal(findWordMatches('He ate his words.','eat one’s words').length,1);
 assert.equal(findWordMatches('It was idealised and subsidized.','idealize').length,1);
 assert.equal(findWordMatches('They subsidised it.','subsidize/subsidise').length,1);
 assert.equal(findWordMatches('to de facto hotels','de facto').length,1);
 assert.deepEqual(findWordMatches('nothing similar here','have trouble doing sth'),[]);
});
test('never invents a match; selected overlapping word wins and no text is lost',()=>{
 assert.deepEqual(findWordMatches('There is no such expression.','unmatched phrase'),[]);
 const words=[{id:'long',word:'climate change'},{id:'short',word:'change'}];
 const text='Climate change is change.';
 const segments=segmentParagraph(text,words,'short');
 assert.equal(segments.map(s=>s.text).join(''),text);
 assert.deepEqual(segments.filter(s=>s.wordId==='short').map(s=>s.text),['change','change']);
 assert.equal(segmentParagraph(text,words).find(s=>s.wordId)?.wordId,'long');
});
