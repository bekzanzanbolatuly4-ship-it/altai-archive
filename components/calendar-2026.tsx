'use client';

import {useEffect,useMemo,useState} from 'react';
import Link from 'next/link';
import {ArrowUpRight,ExternalLink} from 'lucide-react';
import {useApp} from './providers';
import records from '@/data/calendar-2026.json';
import olderRecords from '@/data/calendar-2022-2025.json';
import {calendarEvidence} from '@/lib/provenance';

type Entry={sourceDate:string;year:number;month:number|null;day:number|null;language:'ru'|'kk';text:string;sourceDocument:string;needsReview:boolean;reviewNotes:string[];pairId?:string};
const entries=[...records,...olderRecords] as Entry[];
const years=[...new Set(entries.map(entry=>entry.year))].sort((a,b)=>b-a);
const monthsRu=['Январь','Февраль','Март','Апрель','Май','Июнь','Июль','Август','Сентябрь','Октябрь','Ноябрь','Декабрь'];
const monthsKk=['Қаңтар','Ақпан','Наурыз','Сәуір','Мамыр','Маусым','Шілде','Тамыз','Қыркүйек','Қазан','Қараша','Желтоқсан'];
const monthsEn=['January','February','March','April','May','June','July','August','September','October','November','December'];

export function Calendar2026(){
 const{locale,msg}=useApp();
 const[month,setMonth]=useState('all');
 const[year,setYear]=useState('2026');
 const[language,setLanguage]=useState(locale==='kk'?'kk':'ru');
 const[topic,setTopic]=useState('all');
 useEffect(()=>setLanguage(locale==='kk'?'kk':'ru'),[locale]);
 const monthNames=locale==='kk'?monthsKk:locale==='en'?monthsEn:monthsRu;
 const filtered=useMemo(()=>entries.filter(e=>String(e.year)===year&&(month==='all'||String(e.month||0)===month)&&e.language===language&&(topic==='all'||(topic==='people'?/рождени|дүниеге келген|birth/i.test(e.text):topic==='institutions'?/школ|училищ|газет|кітапхана|мұражай|станци|техникум|учрежден|ашыл|құрылған/i.test(e.text):/город|қала|регион|облыс|казахстан|қазақстан/i.test(e.text)))),[year,month,language,topic]);
 return <section className="calendar-section" aria-labelledby="calendar-heading">
  <div className="calendar-heading"><span className="eyebrow">{msg('calendarEyebrow')}</span><h2 id="calendar-heading">{msg('calendarTitle')}</h2><p>{msg('calendarIntro')}</p></div>
  <div className="calendar-filters">
   <label>{msg('calendarYear')}<select value={year} onChange={e=>setYear(e.target.value)}>{years.map(value=><option value={String(value)} key={value}>{value}</option>)}</select></label>
   <label>{msg('calendarMonth')}<select value={month} onChange={e=>setMonth(e.target.value)}><option value="all">{msg('calendarAllMonths')}</option>{monthNames.map((name,i)=><option value={String(i+1)} key={name}>{name}</option>)}</select></label>
   <label>{msg('calendarTopic')}<select value={topic} onChange={e=>setTopic(e.target.value)}><option value="all">{msg('calendarAllTopics')}</option><option value="people">{msg('calendarPeople')}</option><option value="institutions">{msg('calendarInstitutions')}</option><option value="places">{msg('calendarPlaces')}</option></select></label>
   <label>{msg('calendarSourceLanguage')}<select value={language} onChange={e=>setLanguage(e.target.value)}><option value="ru">{msg('russianLanguage')} · RU</option><option value="kk">{msg('kazakhLanguage')} · KK</option></select></label>
  </div>
  {locale==='en'&&<p className="calendar-fallback-note">{msg('calendarEnglishUnavailable')}</p>}
  <div className="calendar-list" aria-live="polite">{filtered.map((entry,i)=>{
   const libraryMatch=/130.*областной библиотеки|кітапханасының.*130/i.test(entry.text);
   const independent=libraryMatch?calendarEvidence.library130:null;
   const conflictPair=entry.needsReview?entries.find(candidate=>candidate.language!==entry.language&&(entry.pairId?candidate.pairId===entry.pairId:candidate.reviewNotes.length===entry.reviewNotes.length&&candidate.reviewNotes.every((note,index)=>note===entry.reviewNotes[index]))):null;
   const status=independent?.status==='confirmed'?'confirmed':entry.needsReview?'conflicting':'source-provided';
   return <article className="calendar-entry" key={`${entry.language}-${entry.sourceDate}-${i}`}>
    <div className="calendar-date"><span>{entry.day?String(entry.day).padStart(2,'0'):entry.month?monthNames[entry.month-1]:entry.sourceDate}</span><small>{entry.month?monthNames[entry.month-1]:entry.year}</small></div>
    <div><p lang={entry.language}>{entry.text}</p><small>{msg('provenanceArchivalDocument')}: {entry.sourceDocument} · {entry.language.toUpperCase()}</small>
     <div className={`calendar-provenance status-${status}`}><b>{msg(status==='confirmed'?'provenanceConfirmed':status==='conflicting'?'branchStatusConflict':'calendarSourceProvided')}</b>
      {independent?independent.evidence.filter(item=>item.kind==='official-independent').map(item=><div key={item.url||item.label}><span>{item.note}</span><a href={item.url||'#'} target="_blank" rel="noreferrer">{item.label} <ExternalLink size={13}/></a><small>{msg('provenancePublished')}: {item.publishedAt||msg('unconfirmed')} · {msg('branchCheckedAt')}: {item.checkedAt}</small></div>):conflictPair?<div className="calendar-conflict-version"><span>{msg('calendarSourceVersion')} · {conflictPair.language.toUpperCase()}</span><p lang={conflictPair.language}>{conflictPair.text}</p><small>{msg('provenanceArchivalDocument')}: {conflictPair.sourceDocument}</small></div>:entry.needsReview?<span>{entry.pairId?msg('calendarSourceNumbersDiffer'):entry.reviewNotes.join(' ')}</span>:<span>{msg('calendarSourceProvidedNote')}</span>}
     </div>
     <Link className="calendar-ai-link" href={`/assistant?q=${encodeURIComponent(`${msg('calendarAskAI')}: ${entry.text}`)}`}>{msg('calendarAskAI')} <ArrowUpRight size={14}/></Link>
    </div>
   </article>})}</div>
  {filtered.length===0&&<p>{msg('calendarNoEntries')}</p>}
 </section>;
}
