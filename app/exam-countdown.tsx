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
  <div className="exam-countdown-heading"><span>THE NEXT CHAPTER / 2027</span><h2>把今天，变成靠近的一天。</h2><p>2027 考研初试 · <time dateTime="2026-12-19">预计 2026.12.19</time></p></div>
  <div className="exam-countdown-number"><span>{days===0?'已到预计考试日':'距预计初试还有'}</span><div><strong>{days===null?'—':String(days).padStart(2,'0')}</strong><span>天</span></div></div>
  <div className="exam-countdown-note"><span>一天一篇，一词一步。</span><p>按北京时间每日更新<br/>预计日期，以<a href="https://yz.chsi.com.cn/" target="_blank" rel="noreferrer">研招网官方公告 ↗</a>为准</p></div>
 </aside>;
}
