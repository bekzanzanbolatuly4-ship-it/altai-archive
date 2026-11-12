import type {StoredDocument} from '../archive-store';
import {parseInput,searchPublic,buildContext} from './context.ts';
import {complete,type AIProvider} from './gemini.ts';
import {validateResponse} from './validation.ts';
import {AIError} from './errors.ts';
import {acquire} from './limits.ts';
import {isPublicDocument} from '../public-access.ts';
import {redact,type Source} from './context.ts';
import {approvedReferenceSources,classifyReferenceQuestion,localReferenceReply} from './reference-knowledge.ts';
import {searchCustomerKnowledge,localCustomerReply} from './customer-knowledge.ts';

function noMatch(locale:'ru'|'kk'|'en'){
 const answer=locale==='kk'?'Сұрауыңызға сәйкес жарияланған архив материалы табылмады.':locale==='ru'?'По вашему запросу не найдено опубликованных архивных материалов.':'No matching published archive material was found.';
 return {mode:'no-match' as const,locale,answer,citations:[]};
}

function asksForNonPublicContent(message:string){
 return /(?:\b(?:closed|restricted|confidential|private|personnel)\b|закрыт[\p{L}]*|ограничен[\p{L}]*|конфиденциал[\p{L}]*|личн[\p{L}]*|персональн[\p{L}]*|жабық[\p{L}]*|құпия[\p{L}]*|жеке[\p{L}]*)/iu.test(message);
}

function isSpecificArchiveSearch(message:string){
 return /(?:archiv[\p{L}]*\s+(?:record|document|file|case)|(?:fonds?|fond|inventory|case|document)\s+(?:no\.?|number|id|\d)|архивн[\p{L}]*\s+(?:документ|дело|шифр|фонд)|(?:фонд|опись|дело|документ)\s*(?:№|номер|шифр|\d)|қор\s*\d|мұрағаттық\s+(?:құжат|іс))/iu.test(message);
}

function isCatalogueLocationQuestion(message:string){
 return /(?:^|[^\p{L}])(?:где|where|қайда)(?=$|[^\p{L}])/iu.test(message);
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
   if(referenceIntent==='greeting'||referenceIntent==='platform'||referenceIntent==='institution'||referenceIntent==='site-sections'||(referenceIntent==='catalogue'&&isCatalogueLocationQuestion(input.message)))return localReferenceReply(referenceIntent,input.locale,input.message)!;
   const references=approvedReferenceSources(referenceIntent,input.locale);
   try{
    const response=await complete(input.message,buildContext(references),input.locale,{...dependencies,history:input.history});
    return {mode:'ai' as const,locale:input.locale,...validateResponse(response,references,[])};
   }catch(error){
    const local=localReferenceReply(referenceIntent,input.locale,input.message);
    if(local)return local;
    throw error;
   }
  }
  const documents=await dependencies.documents();
  // Keep retrieval tied to the current request. Prior turns are supplied separately
  // to Gemini as untrusted dialogue and must not broaden the evidence search.
  const sources=searchPublic(documents,input.message);
  if(!sources.length){
   if(isSpecificArchiveSearch(input.message))return noMatch(input.locale);
   const asksCustomerHistory=/(?:calendar|commemorative|date|year|history|historical|памятн[\p{L}]*|календар[\p{L}]*|дат[\p{L}]*|год[\p{L}]*|истор[\p{L}]*|күнтізбе|жыл|тарих)/iu.test(input.message);
   const customerSources=asksCustomerHistory?searchCustomerKnowledge(input.message,input.locale):[];
   if(customerSources.length){
    try{
     const response=await complete(input.message,buildContext(customerSources),input.locale,{...dependencies,history:input.history});
     return {mode:'ai' as const,locale:input.locale,...validateResponse(response,customerSources,documents)};
    }catch{
     return localCustomerReply(customerSources,input.locale)!;
    }
   }
   return noMatch(input.locale);
  }
  try{
   const response=await complete(input.message,buildContext(sources),input.locale,{...dependencies,history:input.history});
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
