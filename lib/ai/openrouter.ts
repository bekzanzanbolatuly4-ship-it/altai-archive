import {AIError} from './errors.ts';
import {readBounded} from './limits.ts';
import {instructions} from './instructions.ts';
export async function complete(message:string,context:string,locale:string,options:{key?:string;model?:string;fetcher?:typeof fetch;timeout?:number;maxTokens?:number}={}){
 const key=options.key,model=options.model;
 if(!key||!model)throw new AIError('unconfigured');
 if(!/^[\w./-]+:free$/.test(model))throw new AIError('configuration');
 const messages=[{role:'system',content:instructions},{role:'user',content:JSON.stringify({language:locale,question:message,untrustedPublicMetadata:JSON.parse(context)})}];
 // UTF-8 byte budget is a conservative upper bound for byte-level tokenizers.
 if(Buffer.byteLength(JSON.stringify(messages),'utf8')>14000)throw new AIError('too_large',413);
 const controller=new AbortController();
 const timer=setTimeout(()=>controller.abort(),options.timeout??20_000);
 try{
  const maxTokens=Number.isInteger(options.maxTokens)?Math.max(1,Math.min(900,options.maxTokens!)):900;
  const response=await (options.fetcher??fetch)('https://openrouter.ai/api/v1/chat/completions',{
   method:'POST',signal:controller.signal,headers:{Authorization:`Bearer ${key}`,'Content-Type':'application/json'},
   body:JSON.stringify({model,messages,max_tokens:maxTokens,temperature:0.1,stream:false,provider:{allow_fallbacks:false,max_price:{prompt:0,completion:0},data_collection:'deny'}})
  });
  if(!response.ok){await response.body?.cancel();throw new AIError(response.status===429?'provider_limit':'provider_error',response.status===429?429:503);}
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
