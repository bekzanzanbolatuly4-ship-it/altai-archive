import calendarOld from '../../data/calendar-2022-2025.json' with {type:'json'};
import calendar2026 from '../../data/calendar-2026.json' with {type:'json'};
import archiveHistory from '../../data/archive-history.json' with {type:'json'};
import type {Source,Language} from './context.ts';

type CalendarEntry={year:number;sourceDate:string;text:string;language:'ru'|'kk';needsReview:boolean;reviewNotes:string[]};
type HistoryEntry={year:number;text:string;language:string;sourceDocument:string;provenance:string};
const calendar=[...(calendarOld as CalendarEntry[]),...(calendar2026 as CalendarEntry[])];
const history=archiveHistory as HistoryEntry[];

export function searchCustomerKnowledge(query:string,locale:Language):Source[]{
 const words=[...new Set((query.toLocaleLowerCase().match(/[\p{L}\p{N}]{3,}/gu)||[]).filter(word=>!['когда','какие','годы','date','year','what','when','the','and','archive','архив','жыл','қандай'].includes(word)))];
 if(!words.length)return [];
 const entries=[
  ...calendar.map((entry,index)=>({source:{id:`C${index+1}`,kind:'customer-source' as const,title:`${entry.sourceDate} · ${entry.year}`,description:entry.text,provenance:entry.needsReview?'customer-supplied-needs-review':'customer-supplied-primary-source',url:'/history'} as Source,language:entry.language})),
  ...history.map((entry,index)=>({source:{id:`H${index+1}`,kind:'customer-source' as const,title:String(entry.year),description:entry.text,provenance:'customer-supplied-primary-source',url:'/history'} as Source,language:entry.language})),
 ];
 return entries.map(({source,language})=>({source,language,score:words.reduce((sum,word)=>sum+(`${source.title} ${source.description}`.toLocaleLowerCase().includes(word)?1:0),0)}))
  .filter(result=>result.score>0)
  .sort((a,b)=>b.score-a.score||Number(b.language===locale)-Number(a.language===locale)||a.source.id.localeCompare(b.source.id))
  .slice(0,5).map(result=>result.source);
}

export function localCustomerReply(sources:Source[],locale:Language){
 if(!sources.length)return null;
 const answer=locale==='kk'?'AI жауабы жасалмады. Архив берген күнтізбе мен тарихи материалдардан сәйкес үзінділер көрсетілді.':locale==='ru'?'Ответ AI не сформирован. Ниже приведены совпадения в календарях памятных дат и исторических материалах, переданных архивом.':'No AI response was generated. These are matching excerpts from commemorative calendars and historical material supplied by the archive.';
 return {mode:'local-search' as const,locale,answer,citations:sources.map(source=>({id:source.id,title:source.title,quote:source.description,url:'/history',provenance:source.provenance}))};
}
