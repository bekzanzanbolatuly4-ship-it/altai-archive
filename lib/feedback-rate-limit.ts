import {createHash} from 'node:crypto';
import {FeedbackError} from './feedback-errors';

const windowSeconds=3600;
const ipLimit=3;
const globalLimit=100;
const localCounts=new Map<string,{count:number;expiresAt:number}>();

export async function enforceFeedbackRateLimit(
 request:Request,
 {url=process.env.UPSTASH_REDIS_REST_URL,token=process.env.UPSTASH_REDIS_REST_TOKEN,vercel=process.env.VERCEL==='1',production=process.env.NODE_ENV==='production',fetcher=fetch,now=Date.now}:{url?:string;token?:string;vercel?:boolean;production?:boolean;fetcher?:typeof fetch;now?:()=>number}={},
):Promise<void>{
 if(!url||!token){
  if(production)throw new FeedbackError('feedback_limiter_unavailable',503);
  enforceLocalLimit(request,now());
  return;
 }
 if(production&&!vercel)throw new FeedbackError('feedback_limiter_unavailable',503);
 const forwardedFor=request.headers.get('x-forwarded-for');
 if(production&&!forwardedFor)throw new FeedbackError('feedback_limiter_unavailable',503);
 let endpoint:URL;
 try{
  endpoint=new URL(url);
  if(endpoint.protocol!=='https:'||endpoint.username||endpoint.password||endpoint.search||endpoint.hash)throw new Error('invalid URL');
 }catch{throw new FeedbackError('feedback_limiter_unavailable',503);}
 const digest=createHash('sha256').update(forwardedFor||'local-development').digest('hex');
 const window=Math.floor(now()/1000/windowSeconds);
 const script="local i=redis.call('INCR',KEYS[1]); if i==1 then redis.call('EXPIRE',KEYS[1],ARGV[1]) end; local g=redis.call('INCR',KEYS[2]); if g==1 then redis.call('EXPIRE',KEYS[2],ARGV[1]) end; return {i,g}";
 endpoint.pathname=endpoint.pathname.replace(/\/$/,'')||'/';
 let response:Response;
 try{
  response=await fetcher(endpoint,{method:'POST',headers:{Authorization:`Bearer ${token}`,'Content-Type':'application/json'},body:JSON.stringify(['EVAL',script,2,`altai:feedback:ip:${digest}:${window}`,`altai:feedback:global:${window}`,windowSeconds]),signal:AbortSignal.timeout(2500),cache:'no-store'});
 }catch{throw new FeedbackError('feedback_limiter_unavailable',503);}
 if(!response.ok)throw new FeedbackError('feedback_limiter_unavailable',503);
 let payload:unknown;
 try{payload=await response.json();}catch{throw new FeedbackError('feedback_limiter_unavailable',503);}
 const counts=(payload as {result?:unknown})?.result;
 if(!Array.isArray(counts)||counts.length!==2||!counts.every(Number.isFinite))throw new FeedbackError('feedback_limiter_unavailable',503);
 if(Number(counts[0])>ipLimit||Number(counts[1])>globalLimit)throw new FeedbackError('feedback_rate_limit',429);
}

function enforceLocalLimit(request:Request,now:number){
 const window=Math.floor(now/1000/windowSeconds);
 const forwardedFor=request.headers.get('x-forwarded-for')||'local-development';
 const digest=createHash('sha256').update(forwardedFor).digest('hex');
 incrementLocal(`ip:${digest}:${window}`,now,ipLimit);
 incrementLocal(`global:${window}`,now,globalLimit);
 if(localCounts.size>5000){
  for(const [key,value] of localCounts)if(value.expiresAt<=now)localCounts.delete(key);
 }
}

function incrementLocal(key:string,now:number,limit:number){
 const current=localCounts.get(key);
 const count=!current||current.expiresAt<=now?1:current.count+1;
 localCounts.set(key,{count,expiresAt:now+windowSeconds*1000});
 if(count>limit)throw new FeedbackError('feedback_rate_limit',429);
}
