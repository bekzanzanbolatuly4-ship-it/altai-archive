import {AIError} from './errors.ts';

export function createLimiter(now=Date.now){
 let start=now(), count=0, active=0;
 return () => {
  if(now()-start>=60_000){start=now();count=0;}
  // Global process budget cannot be bypassed by spoofing proxy/IP headers.
  if(count>=20 || active>=2)throw new AIError('rate_limit',429);
  count++;active++;
  let released=false;
  return ()=>{if(!released){active--;released=true;}};
 };
}
export const acquire=createLimiter();

export async function readBounded(stream:ReadableStream<Uint8Array>|null,max:number,timeout=10000):Promise<string>{
 if(!stream)throw new AIError('invalid_request',400);
 const reader=stream.getReader();let size=0;const parts:Uint8Array[]=[];
 let timedOut=false;
 const timer=setTimeout(()=>{timedOut=true;void reader.cancel().catch(()=>{});},timeout);
 try{
  while(true){const {done,value}=await reader.read();if(timedOut)throw new AIError('timeout');if(done)break;size+=value.length;if(size>max)throw new AIError('too_large',413);parts.push(value);}
 }finally{clearTimeout(timer);await reader.cancel().catch(()=>{});reader.releaseLock();}
 return Buffer.concat(parts).toString('utf8');
}
