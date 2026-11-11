import {AIError} from './errors.ts';
import {readBounded} from './limits.ts';
import {instructions} from './instructions.ts';
export type AIProvider='openrouter'|'gemini';
export async function complete(message:string,context:string,locale:string,options:{key?:string;model?:string;provider?:AIProvider;fetcher?:typeof fetch;timeout?:number;maxTokens?:number}={}){
 const key=options.key,model=options.model,provider=options.provider??'openrouter';
 if(!key||!model)throw new AIError('unconfigured');
 if(provider!=='openrouter'&&provider!=='gemini')throw new AIError('configuration');
 if(provider==='openrouter'&&model!=='openrouter/free'&&!/^[\w./-]+:free$/.test(model))throw new AIError('configuration');
 if(provider==='gemini'&&model!=='gemini-2.5-flash-lite')throw new AIError('configuration');
 const messages=[{role:'system',content:instructions},{role:'user',content:JSON.stringify({language:locale,question:message,untrustedPublicMetadata:JSON.parse(context)})}];
 // UTF-8 byte budget is a conservative upper bound for byte-level tokenizers.
 if(Buffer.byteLength(JSON.stringify(messages),'utf8')>14000)throw new AIError('too_large',413);
 const controller=new AbortController();
 const timer=setTimeout(()=>controller.abort(),options.timeout??20_000);
 try{
  const maxTokens=Number.isInteger(options.maxTokens)?Math.max(1,Math.min(900,options.maxTokens!)):900;
  const endpoint=provider==='gemini'?'https://generativelanguage.googleapis.com/v1beta/openai/chat/completions':'https://openrouter.ai/api/v1/chat/completions';
  const response=await (options.fetcher??fetch)(endpoint,{
   method:'POST',signal:controller.signal,headers:{Authorization:`Bearer ${key}`,'Content-Type':'application/json'},
   body:JSON.stringify({model,messages,max_tokens:maxTokens,temperature:0.1,stream:false,...(provider==='openrouter'?{provider:{allow_fallbacks:true,max_price:{prompt:0,completion:0},data_collection:'deny'}}:{})})
  });
  if(!response.ok){
   const code=await readProviderErrorCode(response.body);
   console.error('AI provider request failed',{provider,status:response.status,code});
   throw new AIError(response.status===429?'provider_limit':'provider_error',response.status===429?429:503);
  }
  const data=JSON.parse(await readBounded(response.body,32000));
  const choice=data?.choices?.[0];
  if(choice?.finish_reason!=='stop'||typeof choice?.message?.content!=='string'||choice.message.tool_calls)throw new AIError('invalid_response');
  return choice.message.content as string;
 }catch(error){
  if(controller.signal.aborted)throw new AIError('timeout');
  if(error instanceof AIError)throw error;
  throw new AIError('provider_error');
 }finally{clearTimeout(timer);}
}

async function readProviderErrorCode(body:ReadableStream<Uint8Array>|null):Promise<string>{
 try{
  if(!body)return 'unknown';
  const payload=JSON.parse(await readBounded(body,4096)) as {error?:{code?:unknown}};
  const code=payload?.error?.code;
  if(typeof code==='number'&&Number.isSafeInteger(code))return String(code);
  if(typeof code==='string'&&/^[a-zA-Z0-9_-]{1,64}$/.test(code))return code;
 }catch{/* Error bodies are untrusted and must not mask the provider status. */}
 return 'unknown';
}
