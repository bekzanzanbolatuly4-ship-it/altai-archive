import {createHash} from 'node:crypto';
import {isIP} from 'node:net';
import {FeedbackError} from './feedback-errors';

const windowSeconds=3600;
const ipLimit=3;
const identityLimit=3;
const duplicateLimit=1;
const globalLimit=100;
const localCounts=new Map<string,{count:number;expiresAt:number}>();

export async function enforceFeedbackRateLimit(
 request:Request,
 {url=process.env.UPSTASH_REDIS_REST_URL,token=process.env.UPSTASH_REDIS_REST_TOKEN,vercel=process.env.VERCEL==='1',production=process.env.NODE_ENV==='production',fetcher=fetch,now=Date.now,identity,content}:{url?:string;token?:string;vercel?:boolean;production?:boolean;fetcher?:typeof fetch;now?:()=>number;identity?:string|null;content?:string}={},
):Promise<void>{
 if(!url||!token){
  if(production)throw new FeedbackError('feedback_limiter_unavailable',503);
  enforceLocalLimit(request,now(),identity,content);
  return;
 }
 if(production&&!vercel)throw new FeedbackError('feedback_limiter_unavailable',503);
 const forwardedFor=request.headers.get('x-forwarded-for');
 // Use the rightmost proxy-added address instead of hashing the entire header,
 // which may contain a client-supplied prefix.
 const clientAddress=forwardedFor?.split(',').map(value=>value.trim()).filter(Boolean).at(-1);
 if(production&&(!clientAddress||!isIP(clientAddress)))throw new FeedbackError('feedback_limiter_unavailable',503);
 let endpoint:URL;
 try{
  endpoint=new URL(url);
  if(endpoint.protocol!=='https:'||endpoint.username||endpoint.password||endpoint.search||endpoint.hash)throw new Error('invalid URL');
 }catch{throw new FeedbackError('feedback_limiter_unavailable',503);}
 const digest=createHash('sha256').update(clientAddress||'local-development').digest('hex');
 const identityDigest=identity?.trim()?createHash('sha256').update(identity.trim().toLocaleLowerCase()).digest('hex'):null;
 const contentDigest=content?.trim()?createHash('sha256').update(content.trim().toLocaleLowerCase().replace(/\s+/g,' ')).digest('hex'):null;
 const window=Math.floor(now()/1000/windowSeconds);
 const script="local r={}; for i=1,#KEYS do local n=redis.call('INCR',KEYS[i]); if n==1 then redis.call('EXPIRE',KEYS[i],ARGV[1]) end; r[i]=n end; return r";
 const keys=[`altai:feedback:ip:${digest}:${window}`,`altai:feedback:global:${window}`];
 if(identityDigest)keys.push(`altai:feedback:identity:${identityDigest}:${window}`);
 if(contentDigest)keys.push(`altai:feedback:content:${digest}:${contentDigest}:${window}`);
 endpoint.pathname=endpoint.pathname.replace(/\/$/,'')||'/';
 let response:Response;
 try{
  response=await fetcher(endpoint,{method:'POST',headers:{Authorization:`Bearer ${token}`,'Content-Type':'application/json'},body:JSON.stringify(['EVAL',script,keys.length,...keys,windowSeconds]),signal:AbortSignal.timeout(2500),cache:'no-store'});
 }catch{throw new FeedbackError('feedback_limiter_unavailable',503);}
 if(!response.ok)throw new FeedbackError('feedback_limiter_unavailable',503);
 let payload:unknown;
 try{payload=await response.json();}catch{throw new FeedbackError('feedback_limiter_unavailable',503);}
 const counts=(payload as {result?:unknown})?.result;
 if(!Array.isArray(counts)||counts.length!==keys.length||!counts.every(Number.isFinite))throw new FeedbackError('feedback_limiter_unavailable',503);
 const limits=[ipLimit,globalLimit,...(identityDigest?[identityLimit]:[]),...(contentDigest?[duplicateLimit]:[])];
 if(counts.some((count,index)=>Number(count)>limits[index]))throw new FeedbackError('feedback_rate_limit',429);
}

function enforceLocalLimit(request:Request,now:number,identity?:string|null,content?:string){
 const window=Math.floor(now/1000/windowSeconds);
 const forwardedFor=request.headers.get('x-forwarded-for');
 const clientAddress=forwardedFor?.split(',').map(value=>value.trim()).filter(Boolean).at(-1)||'local-development';
 const digest=createHash('sha256').update(clientAddress).digest('hex');
 incrementLocal(`ip:${digest}:${window}`,now,ipLimit);
 incrementLocal(`global:${window}`,now,globalLimit);
 if(identity?.trim())incrementLocal(`identity:${createHash('sha256').update(identity.trim().toLocaleLowerCase()).digest('hex')}:${window}`,now,identityLimit);
 if(content?.trim())incrementLocal(`content:${digest}:${createHash('sha256').update(content.trim().toLocaleLowerCase().replace(/\s+/g,' ')).digest('hex')}:${window}`,now,duplicateLimit);
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
