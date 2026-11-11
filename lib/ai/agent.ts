import type {StoredDocument} from '../archive-store';
import {parseInput,searchPublic,buildContext} from './context.ts';
import {complete,type AIProvider} from './openrouter.ts';
import {validateResponse} from './validation.ts';
import {AIError} from './errors.ts';
import {acquire} from './limits.ts';
import {searchDemonstration} from './demo-search.ts';
import {isPublicDocument} from '../public-access.ts';
import {redact,type Source} from './context.ts';
import {approvedReferenceSources,classifyReferenceQuestion} from './reference-knowledge.ts';

function noMatch(locale:'ru'|'kk'|'en'){
 const answer=locale==='kk'?'Сұрауыңызға сәйкес жарияланған архив материалы табылмады.':locale==='ru'?'По вашему запросу не найдено опубликованных архивных материалов.':'No matching published archive material was found.';
 return {mode:'no-match' as const,locale,answer,citations:[]};
}

function asksForNonPublicContent(message:string){
 return /(?:\b(?:closed|restricted|confidential|private|personnel)\b|закрыт[\p{L}]*|ограничен[\p{L}]*|конфиденциал[\p{L}]*|личн[\p{L}]*|персональн[\p{L}]*|жабық[\p{L}]*|құпия[\p{L}]*|жеке[\p{L}]*)/iu.test(message);
}

function localPublicSearch(sources:Source[],locale:'ru'|'kk'|'en',documents:StoredDocument[]){
 const current=sources.filter(source=>documents.some(document=>document.id===source.documentId&&isPublicDocument(document)&&document.provenance==='verified'&&redact(document.title).slice(0,180)===source.title&&redact(document.description||'').slice(0,500)===source.description));
 if(!current.length)return noMatch(locale);
 const answer=locale==='kk'
  ?'AI жауабы жасалмады. Жарияланған, тексерілген сипаттамалар бойынша жергілікті іздеу нәтижелері көрсетілді.'
  :locale==='ru'
  ?'AI-ответ не сформирован. Ниже — результаты локального поиска по опубликованным проверенным описаниям.'
  :'No AI response was generated. These are local search results from verified public descriptions.';
 return {mode:'local-search' as const,locale,answer,citations:current.map(source=>({id:source.id,title:source.title,quote:source.description||source.title,url:`/document/${encodeURIComponent(source.documentId!)}`,provenance:'verified'}))};
}

export async function runAgent(raw:unknown,dependencies:{documents:()=>Promise<StoredDocument[]>;key?:string;model?:string;provider?:AIProvider;fetcher?:typeof fetch;timeout?:number;limiter?:()=>()=>void}){
 const input=parseInput(raw);
 const release=(dependencies.limiter??acquire)();
 try{
  if(asksForNonPublicContent(input.message))return noMatch(input.locale);
  const referenceIntent=classifyReferenceQuestion(input.message);
  if(referenceIntent){
   const references=approvedReferenceSources(referenceIntent,input.locale);
   const response=await complete(input.message,buildContext(references),input.locale,dependencies);
   return {mode:'ai' as const,locale:input.locale,...validateResponse(response,references,[])};
  }
  const sources=searchPublic(await dependencies.documents(),input.message);
  if(!sources.length){
   const local=searchDemonstration(input.message,input.locale);
   if(local)return local;
   return noMatch(input.locale);
  }
  try{
   const response=await complete(input.message,buildContext(sources),input.locale,dependencies);
   return {mode:'ai' as const,locale:input.locale,...validateResponse(response,sources,await dependencies.documents())};
  }catch{
   return localPublicSearch(sources,input.locale,await dependencies.documents());
  }
 }finally{release();}
}
export function safeError(error:unknown){
 const known=error instanceof AIError?error:new AIError('unavailable');
 return {code:known.code,status:known.status};
}
