import type {StoredDocument} from '../archive-store';
import {parseInput,searchPublic,buildContext} from './context.ts';
import {complete} from './openrouter.ts';
import {validateResponse} from './validation.ts';
import {AIError} from './errors.ts';
import {acquire} from './limits.ts';
export async function runAgent(raw:unknown,dependencies:{documents:()=>Promise<StoredDocument[]>;key?:string;model?:string;fetcher?:typeof fetch;timeout?:number;limiter?:()=>()=>void}){
 const input=parseInput(raw);
 const release=(dependencies.limiter??acquire)();
 try{
  const sources=searchPublic(await dependencies.documents(),input.message);
  const response=await complete(input.message,buildContext(sources),input.locale,dependencies);
  return {mode:'ai' as const,locale:input.locale,...validateResponse(response,sources,await dependencies.documents())};
 }finally{release();}
}
export function safeError(error:unknown){
 const known=error instanceof AIError?error:new AIError('unavailable');
 return {code:known.code,status:known.status};
}
