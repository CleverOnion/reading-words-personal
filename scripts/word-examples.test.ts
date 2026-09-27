import assert from 'node:assert/strict';
import {test} from 'node:test';
import {practiceExamples,sentenceForWord,uniqueExamples} from '../lib/word-examples.ts';

test('finds the source sentence without matching a substring',()=>{
 assert.equal(sentenceForWord('A patent can protect an invention. The patient reader waits.','patent'),'A patent can protect an invention.');
 assert.equal(sentenceForWord('A patient reader waits.','patent'),null);
});
test('deduplicates examples and caps the display at three',()=>{
 assert.deepEqual(uniqueExamples(['A useful example sentence.','a useful example sentence.','Another example appears here.','Third example appears here.','Fourth example appears here.']),['A useful example sentence.','Another example appears here.','Third example appears here.']);
 assert.equal(practiceExamples('treasure').length,3);
});
