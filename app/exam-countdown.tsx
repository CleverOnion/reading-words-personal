'use client';
import {useSyncExternalStore} from 'react';
import './exam-countdown.css';

// Planning date, not an official exam announcement. Update when confirmed.
const target=Date.parse('2026-12-19T00:00:00+08:00');
const day=86400000;
const getDays=()=>Math.max(0,Math.floor((target+8*3600000)/day)-Math.floor((Date.now()+8*3600000)/day));
const serverDays=()=>null;
function subscribe(onChange:()=>void){
 const timer=setInterval(onChange,1000);
 window.addEventListener('focus',onChange);
 document.addEventListener('visibilitychange',onChange);
 return()=>{clearInterval(timer);window.removeEventListener('focus',onChange);document.removeEventListener('visibilitychange',onChange)};
}
export default function ExamCountdown(){
 const days=useSyncExternalStore(subscribe,getDays,serverDays);
 return <aside className="exam-countdown" aria-label="2027 考研倒计时">
  <span>2027 考研</span><span className="exam-countdown-dot" aria-hidden="true">·</span>
  <span>{days===0?'已到预计日期':<>还有 <strong>{days===null?'—':days}</strong> 天</>}</span>
  <a href="https://yz.chsi.com.cn/" target="_blank" rel="noreferrer" title="暂按 2026 年 12 月 19 日计时，按北京时间每日更新，以研招网官方公告为准">预计 12.19 ↗</a>
 </aside>;
}
