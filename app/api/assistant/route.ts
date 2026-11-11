import {readPublishedPublicDocuments} from '@/lib/archive-store';
import {sameOriginFailure} from '@/lib/request-security';
import {runAgent,safeError} from '@/lib/ai/agent';
import {readBounded,acquire} from '@/lib/ai/limits';
import {AIError} from '@/lib/ai/errors';
import {enforceSharedRateLimit} from '@/lib/ai/shared-rate-limit';
import type {AIProvider} from '@/lib/ai/openrouter';
export const runtime='nodejs';
export async function POST(request:Request){
 const denied=sameOriginFailure(request);if(denied)return denied;
 let release:(()=>void)|undefined;
 try{
  release=acquire();
  await enforceSharedRateLimit(request);
  if(!request.headers.get('content-type')?.startsWith('application/json'))throw new AIError('invalid_request',400);
  const raw=await readBounded(request.body,10000);
  let input;try{input=JSON.parse(raw);}catch{throw new AIError('invalid_request',400);}
  const configuredProvider=process.env.AI_PROVIDER||'openrouter';
  if(configuredProvider!=='openrouter'&&configuredProvider!=='gemini')throw new AIError('configuration');
  const provider:AIProvider=configuredProvider;
  const key=process.env.AI_API_KEY||(provider==='openrouter'?process.env.OPENROUTER_API_KEY:undefined);
  const model=process.env.AI_MODEL||(provider==='openrouter'?process.env.OPENROUTER_MODEL:undefined);
  const result=await runAgent(input,{documents:readPublishedPublicDocuments,key,model,provider,limiter:()=>()=>{}});
  return Response.json(result,{headers:{'Cache-Control':'no-store'}});
 }catch(error){
  const {code,status}=safeError(error);
  return Response.json({mode:'unavailable',error:code},{status,headers:{'Cache-Control':'no-store',...(status===429?{'Retry-After':'60'}:{})}});
 }finally{release?.();}
}
