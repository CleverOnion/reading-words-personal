import json, urllib.request, urllib.error, http.cookiejar
from pathlib import Path

base='http://localhost:5173'
jar=http.cookiejar.CookieJar()
client=urllib.request.build_opener(urllib.request.HTTPCookieProcessor(jar))
client.open(base+'/signin-with-chatgpt?return_to=%2F').read()
def request(data=None, session=None):
    url=base+'/api/study'+('?session='+session if session else '')
    req=urllib.request.Request(url, data=json.dumps(data).encode() if data else None, headers={'Content-Type':'application/json'})
    return json.loads(client.open(req).read())

vocab=json.loads(Path('data/vocabulary.json').read_text(encoding='utf-8'))
words={w['id']:w for p in vocab for w in p['words']}
ids=[]
s=request({'action':'start','mode':'passage','passageId':'2026-1','limit':10})['id'];ids.append(s)
p=request(session=s);assert p['total']==10 and p['index']==0
first=p['question']['id'];correct=words[first]['meaning']
r=request({'action':'answer','sessionId':s,'position':0,'choice':None,'duration':4000});assert not r['correct']
replay=request({'action':'answer','sessionId':s,'position':0,'choice':correct,'duration':4000});assert not replay['correct']
assert request(session=s)['index']==1
for i in range(1,10):
    p=request(session=s);q=p['question'];assert len(q['options'])==4 and len(set(q['options']))==4
    assert words[q['id']]['meaning'] in q['options']
    request({'action':'answer','sessionId':s,'position':i,'choice':words[q['id']]['meaning'],'duration':3000})
state=request();completed=next(x for x in state['sessions'] if x['id']==s)
assert completed['status']=='completed' and completed['answered']==10 and completed['correct']==9 and completed['duration']==31000
assert state['progress'][first]['mistakes']==1 and state['progress'][first]['seen']==1
for i in range(3):
    sid=request({'action':'start','mode':'wrong','wordIds':[first]})['id'];ids.append(sid)
    q=request(session=sid)['question']
    request({'action':'answer','sessionId':sid,'position':0,'choice':words[q['id']]['meaning'],'duration':1000})
assert request()['progress'][first]['streak']==3
sid=request({'action':'start','mode':'passage','passageId':'2010-4','order':'shuffle'})['id'];ids.append(sid)
q=request(session=sid)['question']
request({'action':'answer','sessionId':sid,'position':0,'choice':None,'duration':1500})
assert request(session=sid)['index']==1
request({'action':'stop','sessionId':sid})
assert request(session=sid)['status']=='stopped'
try:
    urllib.request.urlopen(base+'/api/study')
    raise AssertionError('Anonymous access unexpectedly allowed')
except urllib.error.HTTPError as e:
    assert e.code==401
Path('work').mkdir(exist_ok=True)
Path('work/api-test-sessions.json').write_text(json.dumps(ids))
print('PASS: completion, correctness, duplicate submission, wrong-word mastery, resume, stop, anonymous access, four unique options.')
