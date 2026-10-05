import test from 'node:test';
import assert from 'node:assert/strict';
import {normalizeBase,parseInsight,sealKey,openKey} from '../lib/native-ai-format.ts';

test('base URL preserves provider prefixes and blocks credentials, private literals and redirects in URLs',()=>{
 assert.equal(normalizeBase('https://api.example.com/v1/chat/completions/'),'https://api.example.com/v1');
 assert.equal(normalizeBase('https://api.example.com/api/openai/v1/'),'https://api.example.com/api/openai/v1');
 for(const value of ['http://api.example.com','https://127.0.0.1','https://0x7f000001','https://localhost','https://service.local','https://user:secret@example.com','https://example.com?key=secret','https://[::1]','https://api.example.com:8080'])assert.throws(()=>normalizeBase(value),value);
});
test('API key is encrypted, authenticated and bound to the user',async()=>{
 const secret='test-secret-not-a-real-credential'.repeat(2);
 const sealed=await sealKey('test-api-key',secret,'user-a');
 assert.ok(!sealed.includes('test-api-key'));assert.equal(await openKey(sealed,secret,'user-a'),'test-api-key');
 await assert.rejects(openKey(sealed,secret,'user-b'));
 await assert.rejects(openKey(sealed,secret+'wrong','user-a'));
});
test('AI content requires bounded Chinese explanations and bilingual collocations',()=>{
 const value={intuition:'理解这个词的核心画面。',register:'日常和正式场合都可以使用。',collocations:[{en:'drive a nail',zh:'钉钉子'},{en:'a rusty nail',zh:'生锈的钉子'}],pitfall:'注意名词和动词的区别。',example:{en:'He drove a nail into the wall.',zh:'他把一枚钉子钉进墙里。'}};
 assert.deepEqual(parseInsight('```json\n'+JSON.stringify(value)+'\n```'),value);
 for(const invalid of [{...value,intuition:'English only'},{...value,collocations:[]},{...value,example:{en:'Hello',zh:''}},{...value,pitfall:'中'.repeat(451)}])assert.throws(()=>parseInsight(JSON.stringify(invalid)));
 assert.throws(()=>parseInsight('not json'));
});
