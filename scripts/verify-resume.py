"""Run against the built, loopback-only Worker; uses a separate disposable QA user."""
import json, uuid, urllib.request, urllib.error
from pathlib import Path
base='http://127.0.0.1:8787/api/study'
uid='regression-'+str(uuid.uuid4())
vocab=json.loads(Path('data/vocabulary.json').read_text(encoding='utf-8'))
words={w['id']:w for p in vocab for w in p['words']}
def request(data=None,sid=None,user=uid):
 req=urllib.request.Request(base+('?session='+sid if sid else ''),data=json.dumps(data).encode() if data else None,headers={'Content-Type':'application/json','oai-authenticated-user-id':user})
 with urllib.request.urlopen(req) as r:return json.load(r)
def answer(sid,choice='correct',expected=0):
 p=request(sid=sid);assert p['index']==expected
 q=p['question'];assert words[q['id']]['meaning'] in q['options']
 return request({'action':'answer','sessionId':sid,'position':p['index'],'wordId':q['id'],'choice':words[q['id']]['meaning'] if choice=='correct' else None,'duration':1000})
first=request({'action':'start','mode':'passage','passageId':'2010-1','limit':10})['id']
answer(first,'unknown',0)
# A completely new HTTP request (no browser state) recovers the next question.
assert request(sid=first)['index']==1
assert request({'action':'start','mode':'passage','passageId':'2010-1'})['id']==first
request({'action':'pause','sessionId':first})
assert request(sid=first)['index']==1
other=request({'action':'start','mode':'passage','passageId':'2026-2'})['id']
request({'action':'resume','sessionId':first})
state=request();latest=max(state['sessions'],key=lambda s:s['updatedAt'])
assert latest['id']==first
# Old stop/settle action must not discard resumable partial progress.
request({'action':'stop','sessionId':first})
assert request({'action':'start','mode':'passage','passageId':'2010-1'})['id']==first
assert request(sid=first)['index']==1
try:
 request({'action':'answer','sessionId':first,'position':1,'wordId':'not-this-question','choice':None})
 raise AssertionError('stale word accepted')
except urllib.error.HTTPError as e:assert e.code==409
assert request(sid=first)['index']==1
new=request({'action':'start','mode':'passage','passageId':'2010-1','forceNew':True,'limit':10})['id']
assert new!=first
assert request(sid=first)['index']==1
for i in range(10):answer(new,expected=i)
assert request(sid=new)['status']=='completed'
# Completed latest round does not hide the earlier incomplete round.
assert request({'action':'start','mode':'passage','passageId':'2010-1'})['id']==first
for sid in (first,other,new):
 try:
  request(sid=sid,user=uid+'-other')
  raise AssertionError('cross-user access allowed')
 except urllib.error.HTTPError as e:assert e.code==404
print('PASS: per-reading resume, abrupt reload, pause, last-studied ordering, stopped-session recovery, stale-question rejection, separate new round, completed exclusion, user isolation.')
print('Isolated QA user:',uid)
