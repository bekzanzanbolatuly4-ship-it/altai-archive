import {createHash} from 'node:crypto';
import {AIError} from './errors.ts';

const script="local a=redis.call('INCR',KEYS[1]); if a==1 then redis.call('EXPIRE',KEYS[1],ARGV[1]) end; local g=redis.call('INCR',KEYS[2]); if g==1 then redis.call('EXPIRE',KEYS[2],ARGV[1]) end; return {a,g}";

export async function enforceSharedRateLimit(
 request:Request,
 {url=process.env.UPSTASH_REDIS_REST_URL,token=process.env.UPSTASH_REDIS_REST_TOKEN,vercel=process.env.VERCEL==='1',production=process.env.NODE_ENV==='production',fetcher=fetch,now=Date.now}:{url?:string;token?:string;vercel?:boolean;production?:boolean;fetcher?:typeof fetch;now?:()=>number}={},
):Promise<void>{
 if(!url||!token){if(production)throw new AIError('rate_limit_unavailable',503);return;}
 if(production&&!vercel)throw new AIError('client_ip_unavailable',503);
 let endpoint:URL;
 try{endpoint=new URL(url);}catch{throw new AIError('rate_limit_unavailable',503);}
 if(endpoint.protocol!=='https:'||endpoint.username||endpoint.password||endpoint.search||endpoint.hash){
  throw new AIError('rate_limit_unavailable',503);
 }
 const rawIp=vercel?request.headers.get('x-forwarded-for'):null;
 if(production&&!rawIp)throw new AIError('client_ip_unavailable',503);
 const ipDigest=createHash('sha256').update(rawIp||'local-development').digest('hex');
 const window=Math.floor(now()/60_000);
 endpoint.pathname=endpoint.pathname.replace(/\/$/,'')||'/';
 let response:Response;
 try{
  response=await fetcher(endpoint,{method:'POST',headers:{Authorization:`Bearer ${token}`,'Content-Type':'application/json'},body:JSON.stringify(['EVAL',script,2,`altai:assistant:ip:${ipDigest}:${window}`,`altai:assistant:global:${window}`,120]),signal:AbortSignal.timeout(2500),cache:'no-store'});
 }catch{throw new AIError('rate_limit_unavailable',503);}
 if(!response.ok)throw new AIError('rate_limit_unavailable',503);
 let payload:unknown;
 try{payload=await response.json();}catch{throw new AIError('rate_limit_unavailable',503);}
 const counts=(payload as {result?:unknown})?.result;
 if(!Array.isArray(counts)||counts.length!==2||!counts.every(Number.isFinite))throw new AIError('rate_limit_unavailable',503);
 if(Number(counts[0])>5||Number(counts[1])>20)throw new AIError('rate_limit',429);
}
