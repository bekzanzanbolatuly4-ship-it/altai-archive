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

function withArchiveData<T extends {answer:string;citations:{title:string;quote:string;provenance:string}[]}>(reply:T,locale:'ru'|'kk'|'en'){
 const heading=locale==='kk'?'Архивтің қолжетімді деректері:':locale==='ru'?'Доступные данные архива:':'Available archive data:';
 const none=locale==='kk'?'Бұл сұраққа сәйкес расталған жария материал табылмады.':locale==='ru'?'По этому вопросу в доступных материалах архива подтверждённых совпадений нет.':'No confirmed published archive material matches this question.';
 const review=locale==='kk'?' (тексеруді қажет етеді)':locale==='ru'?' (требует проверки)':' (requires review)';
 const details=reply.citations.slice(0,2).map(source=>`• ${source.title}: ${source.quote}${source.provenance.includes('needs-review')?review:''}`).join('\n');
 return {...reply,answer:`${reply.answer.trim()}\n\n${heading}\n${details||none}`};
}

function noMatch(locale:'ru'|'kk'|'en'){
 const answer=locale==='kk'?'Сұрауыңызға сәйкес расталған жария архив материалы табылмады.':locale==='ru'?'По запросу не найдено подтверждённых опубликованных архивных материалов.':'No confirmed published archive material matched this request.';
 return withArchiveData({mode:'no-match' as const,locale,answer,citations:[]},locale);
}

function unavailable(locale:'ru'|'kk'|'en'){
 const answer=locale==='kk'?'ЖИ қызметі уақытша қолжетімсіз, сондықтан жауап жасалмады. Кейінірек қайталап көріңіз.':locale==='ru'?'AI временно недоступен, поэтому ответ не сформирован. Попробуйте позже.':'AI is temporarily unavailable, so no answer was generated. Please try again later.';
 return withArchiveData({mode:'reference' as const,locale,answer,citations:[]},locale);
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
 return withArchiveData({mode:'local-search' as const,locale,answer,citations:current.map(source=>({id:source.id,title:source.title,quote:source.description||source.title,url:`/document/${encodeURIComponent(source.documentId!)}`,provenance:'verified'}))},locale);
}

export async function runAgent(raw:unknown,dependencies:{documents:()=>Promise<StoredDocument[]>;key?:string;model?:string;provider?:AIProvider;fetcher?:typeof fetch;timeout?:number;limiter?:()=>()=>void}){
 const input=parseInput(raw);
 const release=(dependencies.limiter??acquire)();
 try{
  if(asksForNonPublicContent(input.message))return noMatch(input.locale);
  const referenceIntent=classifyReferenceQuestion(input.message);
  if(referenceIntent){
   const references=approvedReferenceSources(referenceIntent,input.locale);
   try{
    const response=await complete(input.message,buildContext(references),input.locale,{...dependencies,history:input.history});
    return withArchiveData({mode:'ai' as const,locale:input.locale,...validateResponse(response,references,[])},input.locale);
   }catch(error){
    const local=localReferenceReply(referenceIntent,input.locale,input.message);
    if(local){
     const notice=input.locale==='kk'?'Gemini уақытша қолжетімсіз. Жергілікті анықтамалық жауап көрсетілді.':input.locale==='ru'?'Gemini временно недоступен. Показан локальный справочный ответ.':'Gemini is temporarily unavailable. A local reference answer is shown.';
     return withArchiveData({...local,answer:`${notice} ${local.answer}`},input.locale);
    }
    throw error;
   }
  }
  const documents=await dependencies.documents();
  // Keep retrieval tied to the current request. Prior turns are supplied separately
  // to Gemini as untrusted dialogue and must not broaden the evidence search.
  const sources=searchPublic(documents,input.message);
  if(!sources.length){
   const asksCustomerHistory=/(?:calendar|commemorative|date|year|history|historical|памятн[\p{L}]*|календар[\p{L}]*|дат[\p{L}]*|год[\p{L}]*|истор[\p{L}]*|күнтізбе|жыл|тарих)/iu.test(input.message);
   const customerSources=asksCustomerHistory?searchCustomerKnowledge(input.message,input.locale):[];
   if(customerSources.length){
    try{
     const response=await complete(input.message,buildContext(customerSources),input.locale,{...dependencies,history:input.history});
     return withArchiveData({mode:'ai' as const,locale:input.locale,...validateResponse(response,customerSources,documents)},input.locale);
    }catch{
     return withArchiveData(localCustomerReply(customerSources,input.locale)!,input.locale);
    }
   }
   try{
    const response=await complete(input.message,buildContext([]),input.locale,{...dependencies,history:input.history});
    return withArchiveData({mode:'ai' as const,locale:input.locale,...validateResponse(response,[],[])},input.locale);
   }catch{return unavailable(input.locale);}
  }
  try{
   const response=await complete(input.message,buildContext(sources),input.locale,{...dependencies,history:input.history});
   return withArchiveData({mode:'ai' as const,locale:input.locale,...validateResponse(response,sources,await dependencies.documents())},input.locale);
  }catch{
   return localPublicSearch(sources,input.locale,await dependencies.documents());
  }
 }finally{release();}
}
export function safeError(error:unknown){
 const known=error instanceof AIError?error:new AIError('unavailable');
 return {code:known.code,status:known.status};
}
