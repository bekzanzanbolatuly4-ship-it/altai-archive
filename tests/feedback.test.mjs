import assert from 'node:assert/strict';
import {test} from 'node:test';
import {readFile} from 'node:fs/promises';
import {pathToFileURL} from 'node:url';
import path from 'node:path';
import ts from 'typescript';

async function loadTs(relative){
 let source=await readFile(relative,'utf8');
 source=source.replace(/from '\.\/([^']+)'/g,(_,name)=>`from '${pathToFileURL(path.resolve(path.dirname(relative),`${name}.ts`)).href}'`);
 const compiled=ts.transpileModule(source,{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.ESNext}}).outputText;
 return import(`data:text/javascript,${encodeURIComponent(compiled)}`);
}
const {validateFeedbackInput,readFeedbackJson}=await loadTs('lib/feedback-validation.ts');
const {storeFeedback,feedbackConsentVersion}=await loadTs('lib/feedback-store.ts');
const {enforceFeedbackRateLimit}=await loadTs('lib/feedback-rate-limit.ts');
const {messages}=await loadTs('locales/messages.ts');

const valid={type:'suggestion',name:null,email:null,message:'Make the catalog easier to use',contactConsent:false};

test('feedback validation accepts minimal input and requires consent for contact data',()=>{
 assert.deepEqual(validateFeedbackInput(valid),valid);
 assert.deepEqual(validateFeedbackInput({...valid,name:' A ',email:'USER@example.org',contactConsent:true}),{...valid,name:'A',email:'user@example.org',contactConsent:true});
 for(const input of [{...valid,message:'  '},{...valid,email:'bad'},{...valid,message:'x'.repeat(2001)},{...valid,type:'official_request'},{...valid,name:'x'.repeat(81)},{...valid,name:'A',contactConsent:false},{...valid,website:'spam'},{...valid,unexpected:'value'}]){
  assert.throws(()=>validateFeedbackInput(input),error=>error instanceof Error&&error.name==='FeedbackError');
 }
});

test('feedback body reader enforces byte limit and rejects malformed JSON',async()=>{
 const headers={'content-type':'application/json'};
 await assert.rejects(readFeedbackJson(new Request('https://archive.test',{method:'POST',headers,body:'x'.repeat(20)}),10),/request_too_large/);
 await assert.rejects(readFeedbackJson(new Request('https://archive.test',{method:'POST',headers,body:'not json'})),/invalid_feedback/);
 assert.deepEqual(await readFeedbackJson(new Request('https://archive.test',{method:'POST',headers,body:JSON.stringify(valid)})),valid);
});

test('Supabase store sends only server-controlled fields and confirms upstream success',async()=>{
 let sent,url;
 await storeFeedback({...valid,name:'Visitor',contactConsent:true},{url:'https://project.supabase.co',secret:'sb_secret_server_only_test_secret',fetcher:async(target,init)=>{url=String(target);sent={headers:init.headers,row:JSON.parse(init.body)};return new Response(null,{status:201});}});
 assert.equal(url,'https://project.supabase.co/rest/v1/feedback_messages');
 assert.equal(sent.headers.apikey,'sb_secret_server_only_test_secret');
 assert.equal(sent.headers.Authorization,undefined,'Opaque Supabase secret keys are not bearer tokens');
 assert.equal(sent.row.status,'new');
 assert.equal(sent.row.consent_version,feedbackConsentVersion);
 await storeFeedback(valid,{url:'https://project.supabase.co',secret:'legacy-service-role-jwt',fetcher:async(_target,init)=>{assert.equal(init.headers.Authorization,'Bearer legacy-service-role-jwt');return new Response(null,{status:201});}});
 await assert.rejects(storeFeedback(valid,{url:'',secret:''}),/feedback_storage_unavailable/);
 await assert.rejects(storeFeedback(valid,{url:'https://project.supabase.co',secret:'private-key',fetcher:async()=>new Response('sensitive database detail',{status:500})}),error=>error.code==='feedback_storage_unavailable'&&!error.message.includes('sensitive'));
});

test('feedback rate limit uses isolated Upstash keys and fails closed in production',async()=>{
 let command;
 const request=new Request('https://archive.test/api/feedback',{headers:{'x-forwarded-for':'203.0.113.5'}});
 const options={url:'https://redis.example',token:'server-only-token',production:true,vercel:true,now:()=>3_600_000,fetcher:async(_url,init)=>{command=JSON.parse(init.body);return Response.json({result:[3,80]});}};
 await enforceFeedbackRateLimit(request,options);
 assert.match(command[3],/^altai:feedback:ip:[a-f0-9]{64}:1$/);
 await assert.rejects(enforceFeedbackRateLimit(request,{...options,fetcher:async()=>Response.json({result:[4,80]})}),error=>error.code==='feedback_rate_limit');
 await assert.rejects(enforceFeedbackRateLimit(request,{...options,fetcher:async()=>{throw new Error('network');}}),error=>error.code==='feedback_limiter_unavailable');
 await assert.rejects(enforceFeedbackRateLimit(request,{...options,url:'',token:''}),error=>error.code==='feedback_limiter_unavailable');
});

test('feedback endpoint checks origin, validates, and returns success only after Supabase confirms storage',async()=>{
 let source=await readFile('app/api/feedback/route.ts','utf8');
 source=source.replace("import {storeFeedback} from '@/lib/feedback-store';",`const storeFeedback=async(value)=>{globalThis.__feedbackStored=value;if(globalThis.__feedbackStoreFails)throw new Error('database failure');};`);
 source=source.replace("import {enforceFeedbackRateLimit} from '@/lib/feedback-rate-limit';",`const enforceFeedbackRateLimit=async()=>{if(globalThis.__feedbackRateLimited)throw Object.assign(new Error('limited'),{code:'feedback_rate_limit',status:429});};`);
 source=source.replace("import {readFeedbackJson,validateFeedbackInput} from '@/lib/feedback-validation';",`const {readFeedbackJson,validateFeedbackInput}=globalThis.__feedbackValidation;`);
 source=source.replace("import {safeFeedbackError} from '@/lib/feedback-errors';",`const safeFeedbackError=(error)=>({code:error.code||'feedback_storage_unavailable',status:error.status||503});`);
 source=source.replace(/from '@\/([^']+)'/g,(_,name)=>`from '${pathToFileURL(path.resolve(`${name}.ts`)).href}'`);
 const compiled=ts.transpileModule(source,{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.ESNext}}).outputText;
 const previous={origin:process.env.APP_ORIGIN,fetch:globalThis.fetch,stored:globalThis.__feedbackStored,fail:globalThis.__feedbackStoreFails,limited:globalThis.__feedbackRateLimited,validation:globalThis.__feedbackValidation};
 globalThis.__feedbackValidation={readFeedbackJson,validateFeedbackInput};
 const {POST}=await import(`data:text/javascript,${encodeURIComponent(compiled)}`);
 const makeRequest=(body=valid,origin='https://archive.test')=>new Request('https://archive.test/api/feedback',{method:'POST',headers:{origin,'sec-fetch-site':'same-origin','content-type':'application/json'},body:JSON.stringify(body)});
 try{
  process.env.APP_ORIGIN='https://archive.test';
  const denied=await POST(makeRequest(valid,'https://attacker.test'));assert.equal(denied.status,403);
  const bad=await POST(makeRequest({...valid,type:'other'}));assert.equal(bad.status,400);
  globalThis.__feedbackRateLimited=true;assert.equal((await POST(makeRequest())).status,429);globalThis.__feedbackRateLimited=false;
  globalThis.__feedbackStoreFails=true;assert.equal((await POST(makeRequest())).status,503);globalThis.__feedbackStoreFails=false;
  const accepted=await POST(makeRequest());assert.equal(accepted.status,201);assert.deepEqual(await accepted.json(),{received:true});assert.equal(globalThis.__feedbackStored.message,valid.message);
 }finally{
  if(previous.origin===undefined)delete process.env.APP_ORIGIN;else process.env.APP_ORIGIN=previous.origin;
  globalThis.fetch=previous.fetch;
  for(const [key,value] of [['__feedbackStored',previous.stored],['__feedbackStoreFails',previous.fail],['__feedbackRateLimited',previous.limited],['__feedbackValidation',previous.validation]])if(value===undefined)delete globalThis[key];else globalThis[key]=value;
 }
});

test('feedback labels, warning, consent, success and errors are localized in RU/KK/EN',()=>{
 const keys=['feedbackTitle','feedbackText','feedbackType','feedbackChooseType','feedbackTypeReview','feedbackTypeSuggestion','feedbackTypeBug','feedbackName','feedbackEmail','feedbackMessage','feedbackConsent','feedbackWarning','feedbackSubmit','feedbackSending','feedbackSuccess','feedbackError','feedbackValidationError','feedbackCharacters'];
 for(const locale of ['ru','kk','en'])for(const key of keys)assert.equal(typeof messages[locale][key],'string',`${locale}.${key}`);
});

test('feedback SQL enables RLS and contains no public read policy or grants',async()=>{
 const sql=await readFile('supabase/migrations/20261111183714_feedback_messages.sql','utf8');
 assert.match(sql,/enable row level security/i);assert.match(sql,/force row level security/i);
 assert.match(sql,/revoke all on table public\.feedback_messages from public, anon, authenticated, service_role/i);
 assert.match(sql,/grant insert on table public\.feedback_messages to service_role/i);
 assert.doesNotMatch(sql,/for select|grant select|grant all/i);
});
