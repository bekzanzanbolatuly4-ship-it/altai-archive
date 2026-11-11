import type {StoredDocument} from '../archive-store';
import {parseInput,searchPublic,buildContext} from './context.ts';
import {complete,type AIProvider} from './openrouter.ts';
import {validateResponse} from './validation.ts';
import {AIError} from './errors.ts';
import {acquire} from './limits.ts';
import {searchDemonstration} from './demo-search.ts';
export async function runAgent(raw:unknown,dependencies:{documents:()=>Promise<StoredDocument[]>;key?:string;model?:string;provider?:AIProvider;fetcher?:typeof fetch;timeout?:number;limiter?:()=>()=>void}){
 const input=parseInput(raw);
 const release=(dependencies.limiter??acquire)();
 try{
  const sources=searchPublic(await dependencies.documents(),input.message);
  if(!sources.length){
   const local=searchDemonstration(input.message,input.locale);
   if(local)return local;
   const answer=input.locale==='kk'?'Сұрауыңызға сәйкес жарияланған архив материалы табылмады.':input.locale==='ru'?'По вашему запросу не найдено опубликованных архивных материалов.':'No matching published archive material was found.';
   return {mode:'no-match' as const,locale:input.locale,answer,citations:[]};
  }
  try{
   const response=await complete(input.message,buildContext(sources),input.locale,dependencies);
   return {mode:'ai' as const,locale:input.locale,...validateResponse(response,sources,await dependencies.documents())};
  }catch(error){
   const local=searchDemonstration(input.message,input.locale);
   if(local)return local;
   throw error;
  }
 }finally{release();}
}
export function safeError(error:unknown){
 const known=error instanceof AIError?error:new AIError('unavailable');
 return {code:known.code,status:known.status};
}
