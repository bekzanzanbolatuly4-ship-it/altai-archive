import {AIError} from './errors.ts';
import {readBounded} from './limits.ts';
import {instructions} from './instructions.ts';

export type AIProvider='gemini';
export const GEMINI_MODEL='gemini-3.1-flash-lite';
const endpoint=`https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;

type Options={key?:string;model?:string;provider?:AIProvider;fetcher?:typeof fetch;timeout?:number;maxTokens?:number;history?:{question:string;answer:string}[]};

export async function complete(message:string,context:string,locale:string,options:Options={}){
 const {key}=options;
 const provider=options.provider??'gemini';
 const model=options.model??GEMINI_MODEL;
 if(provider!=='gemini'||model!==GEMINI_MODEL)throw new AIError('configuration');
 if(!key)throw new AIError('unconfigured');
 const maxTokens=Number.isInteger(options.maxTokens)?Math.max(1,Math.min(900,options.maxTokens!)):700;
 const payload={
  systemInstruction:{parts:[{text:instructions}]},
  contents:[{role:'user',parts:[{text:JSON.stringify({language:locale,question:message,untrustedPriorDialogue:options.history??[],untrustedPublicMetadata:JSON.parse(context)})}]}],
  generationConfig:{temperature:0.1,maxOutputTokens:maxTokens,responseMimeType:'application/json'},
 };
 if(Buffer.byteLength(JSON.stringify(payload),'utf8')>14000)throw new AIError('too_large',413);
 const timeout=options.timeout??20_000;
 const controller=new AbortController();
 const timer=setTimeout(()=>controller.abort(),timeout);
 const started=Date.now();
 try{
  for(let attempt=0;attempt<2;attempt++){
   let response:Response;
   try{
    response=await (options.fetcher??fetch)(endpoint,{method:'POST',headers:{'Content-Type':'application/json','x-goog-api-key':key},body:JSON.stringify(payload),cache:'no-store',signal:controller.signal});
   }catch{
    if(controller.signal.aborted)throw new AIError('timeout');
    if(attempt===0){await sleep(100+Math.floor(Math.random()*150),controller.signal);continue;}
    throw new AIError('provider_error');
   }
   if(response.ok){
    const data=JSON.parse(await readBounded(response.body,32000));
    const candidate=data?.candidates?.[0];
    if(candidate?.finishReason!=='STOP'||!Array.isArray(candidate?.content?.parts))throw new AIError('invalid_response');
    const content=candidate.content.parts.map((part:{text?:unknown})=>typeof part.text==='string'?part.text:'').join('');
    if(!content)throw new AIError('invalid_response');
    return content;
   }
   const code=await providerErrorCode(response.body);
   if((response.status===429||[500,502,503,504].includes(response.status))&&attempt===0){
    const delay=retryAfterMs(response.headers.get('retry-after'))??100+Math.floor(Math.random()*150);
    if(Date.now()-started+delay<timeout){await sleep(delay,controller.signal);continue;}
   }
   console.error('Gemini request failed',{status:response.status,code});
   if(response.status===429)throw new AIError('provider_limit',429);
   if(response.status===400||response.status===401||response.status===403)throw new AIError('configuration');
   throw new AIError('provider_error');
  }
  throw new AIError('provider_error');
 }catch(error){
  if(controller.signal.aborted)throw new AIError('timeout');
  if(error instanceof AIError)throw error;
  throw new AIError('provider_error');
 }finally{clearTimeout(timer);}
}

function sleep(ms:number,signal:AbortSignal){
 return new Promise<void>((resolve,reject)=>{
  if(signal.aborted)return reject(new AIError('timeout'));
  const timer=setTimeout(()=>{signal.removeEventListener('abort',abort);resolve();},ms);
  const abort=()=>{clearTimeout(timer);reject(new AIError('timeout'));};
  signal.addEventListener('abort',abort,{once:true});
 });
}

function retryAfterMs(raw:string|null):number|undefined{
 if(!raw)return undefined;
 const seconds=Number(raw);
 if(Number.isFinite(seconds)&&seconds>=0)return seconds*1000;
 const date=Date.parse(raw);
 return Number.isFinite(date)?Math.max(0,date-Date.now()):undefined;
}

async function providerErrorCode(body:ReadableStream<Uint8Array>|null):Promise<string>{
 try{
  if(!body)return 'unknown';
  const payload=JSON.parse(await readBounded(body,4096)) as {error?:{status?:unknown;code?:unknown}};
  const code=payload?.error?.status??payload?.error?.code;
  if(typeof code==='number'&&Number.isSafeInteger(code))return String(code);
  if(typeof code==='string'&&/^[A-Z0-9_-]{1,64}$/.test(code))return code;
 }catch{/* Provider details are untrusted and must never reach logs or users. */}
 return 'unknown';
}
