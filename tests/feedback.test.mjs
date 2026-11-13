import assert from 'node:assert/strict';
import {test} from 'node:test';
import {readFile} from 'node:fs/promises';
import {pathToFileURL} from 'node:url';
import path from 'node:path';
import {randomBytes} from 'node:crypto';
import ts from 'typescript';

async function loadTs(relative){
 let source=await readFile(relative,'utf8');
 source=source.replace(/from '\.\/([^']+)'/g,(_,name)=>`from '${pathToFileURL(path.resolve(path.dirname(relative),name.endsWith('.ts')?name:`${name}.ts`)).href}'`);
 const compiled=ts.transpileModule(source,{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.ESNext}}).outputText;
 return import(`data:text/javascript,${encodeURIComponent(compiled)}`);
}
const {validateFeedbackInput,readFeedbackJson}=await loadTs('lib/feedback-validation.ts');
const {storeFeedback,feedbackConsentVersion}=await loadTs('lib/feedback-store.ts');
const {storeFeedbackModeration}=await loadTs('lib/feedback-moderation-store.ts');
const {enforceFeedbackRateLimit}=await loadTs('lib/feedback-rate-limit.ts');
const {messages}=await loadTs('locales/messages.ts');
const {validateRegistrationInput}=await loadTs('lib/visitor-auth-validation.ts');
const {moderateFeedback}=await loadTs('lib/ai/moderation.ts');
const valid={type:'site_feedback',firstName:'Archive',lastName:'Visitor',email:'visitor@example.org',rating:5,message:'Make the catalog easier to use',feedbackConsent:true,website:''};
const normalized={type:'site_feedback',name:'Archive Visitor',email:'visitor@example.org',rating:5,message:valid.message,contactConsent:true};

test('visitor registration validates name, email, strong password, confirmation and informed consent',()=>{
 const pass=randomBytes(24).toString('base64url');const input={name:'Archive visitor',email:'visitor@example.org',password:pass,confirmPassword:pass,consent:true};
 assert.equal(validateRegistrationInput(input),null);
 assert.equal(validateRegistrationInput({...input,name:' '}),'invalid_name');
 assert.equal(validateRegistrationInput({...input,email:'bad'}),'invalid_email');
 assert.equal(validateRegistrationInput({...input,password:'short'}),'weak_password');
 assert.equal(validateRegistrationInput({...input,confirmPassword:'different'}),'password_mismatch');
 assert.equal(validateRegistrationInput({...input,consent:false}),'consent_required');
});

test('anonymous feedback validates names, optional contact, stars, consent and anti-spam fields',()=>{
 assert.deepEqual(validateFeedbackInput(valid),normalized);
 assert.equal(validateFeedbackInput({...valid,type:'suggestion',rating:null,email:null}).rating,null);
 for(const input of [{...valid,message:'  '},{...valid,message:'x'.repeat(2001)},{...valid,type:'official_request'},{...valid,firstName:''},{...valid,email:'bad'},{...valid,rating:0},{...valid,name:'forged'},{...valid,feedbackConsent:false},{...valid,website:'spam'},{...valid,captchaToken:'unexpected'},{...valid,unexpected:'value'}])assert.throws(()=>validateFeedbackInput(input),error=>error.name==='FeedbackError');
});

test('feedback body reader enforces byte limit and rejects malformed JSON',async()=>{
 const headers={'content-type':'application/json'};
 await assert.rejects(readFeedbackJson(new Request('https://archive.test',{method:'POST',headers,body:'x'.repeat(20)}),10),/request_too_large/);
 await assert.rejects(readFeedbackJson(new Request('https://archive.test',{method:'POST',headers,body:'not json'})),/invalid_feedback/);
 assert.deepEqual(await readFeedbackJson(new Request('https://archive.test',{method:'POST',headers,body:JSON.stringify(valid)})),valid);
});

test('Supabase feedback store persists anonymous identity and rating and reports upstream failure',async()=>{
 let sent,url;
 await storeFeedback(normalized,undefined,{url:'https://project.supabase.co',secret:'sb_secret_test',fetcher:async(target,init)=>{url=String(target);sent={headers:init.headers,row:JSON.parse(init.body)};return new Response(null,{status:201});}});
 assert.equal(url,'https://project.supabase.co/rest/v1/feedback_messages');
 assert.equal(sent.headers.apikey,'sb_secret_test');assert.equal(sent.headers.Authorization,undefined);
 assert.equal(sent.row.status,'new');assert.equal(sent.row.consent_version,feedbackConsentVersion);assert.equal(sent.row.auth_user_id,null);assert.equal(sent.row.name,'Archive Visitor');assert.equal(sent.row.email,'visitor@example.org');assert.equal(sent.row.rating,5);
 assert.equal(sent.row.contact_consent,true);assert.equal('contactConsent' in sent.row,false,'Database writes must use the actual snake_case column name');
 assert.equal(sent.row.moderation_status,'needs_review');assert.equal(sent.row.moderation_category,null);
 const marked={category:'suggestion',summary:'Improve catalogue search',reason:'Concrete improvement idea',status:'classified'};
 await storeFeedback(normalized,undefined,{url:'https://project.supabase.co',secret:'sb_secret_test',moderation:marked,fetcher:async(_url,init)=>{sent={row:JSON.parse(init.body)};return new Response(null,{status:201});}});
 assert.equal(sent.row.moderation_category,'suggestion');assert.equal(sent.row.moderation_status,'classified');
 await assert.rejects(storeFeedback(normalized,undefined,{url:'',secret:''}),/feedback_storage_unavailable/);
 await assert.rejects(storeFeedback(normalized,undefined,{url:'https://project.supabase.co',secret:'private-key',fetcher:async()=>new Response('sensitive database detail',{status:500})}),error=>error.code==='feedback_storage_unavailable'&&!error.message.includes('sensitive'));
});

test('AI moderation metadata is written only through the restricted server credential',async()=>{
 let request;
 const moderation={category:'suggestion',summary:'Improve catalogue search',reason:'Specific proposal',status:'classified'};
 await storeFeedbackModeration('10000000-0000-4000-8000-000000000001','20000000-0000-4000-8000-000000000002',moderation,{url:'https://isokkxsuqmcsaumbtxlt.supabase.co',secret:'sb_secret_test',fetcher:async(target,init)=>{request={url:String(target),init,body:JSON.parse(init.body)};return new Response(null,{status:204});}});
 assert.match(request.url,/id=eq\.10000000-0000-4000-8000-000000000001/);assert.match(request.url,/auth_user_id=eq\.20000000-0000-4000-8000-000000000002/);
 assert.equal(request.init.method,'PATCH');assert.equal(request.init.headers.apikey,'sb_secret_test');assert.equal(request.init.headers.Authorization,undefined);assert.equal(request.body.moderation_category,'suggestion');
 await assert.rejects(storeFeedbackModeration('bad','20000000-0000-4000-8000-000000000002',moderation,{secret:'sb_secret_test',fetcher:async()=>assert.fail('Invalid identifiers must not be sent')}),/invalid_moderation_target/);
 await assert.rejects(storeFeedbackModeration('10000000-0000-4000-8000-000000000001','20000000-0000-4000-8000-000000000002',moderation,{url:'https://attacker.example',secret:'sb_secret_test',fetcher:async()=>assert.fail('Credential must never be sent off-project')}),/feedback_storage_unavailable/);
});

test('feedback rate limit uses isolated IP, identity, duplicate and global keys and fails closed in production',async()=>{
 let command;const request=new Request('https://archive.test/api/feedback',{headers:{'x-forwarded-for':'203.0.113.5'}});
 const options={url:'https://redis.example',token:'server-only-token',production:true,vercel:true,now:()=>3_600_000,identity:'visitor@example.org',content:'same feedback text',fetcher:async(_url,init)=>{command=JSON.parse(init.body);return Response.json({result:[1,80,1,1]});}};
 await enforceFeedbackRateLimit(request,options);const ipKey=command[3];assert.match(ipKey,/^altai:feedback:ip:[a-f0-9]{64}:1$/);assert.equal(command[2],4);assert.match(command[5],/^altai:feedback:identity:[a-f0-9]{64}:1$/);assert.match(command[6],/^altai:feedback:content:[a-f0-9]{64}:[a-f0-9]{64}:1$/);assert.doesNotMatch(JSON.stringify(command),/visitor@example\.org|same feedback text/);
 await assert.rejects(enforceFeedbackRateLimit(request,{...options,fetcher:async()=>Response.json({result:[4,80,1,1]})}),error=>error.code==='feedback_rate_limit');
 await assert.rejects(enforceFeedbackRateLimit(request,{...options,fetcher:async()=>Response.json({result:[1,80,1,2]})}),error=>error.code==='feedback_rate_limit');
 await enforceFeedbackRateLimit(new Request('https://archive.test',{headers:{'x-forwarded-for':'198.51.100.10, 203.0.113.5'}}),{...options,fetcher:async(_url,init)=>{command=JSON.parse(init.body);return Response.json({result:[1,80,1,1]});}});
 assert.equal(command[3],ipKey,'a client-controlled X-Forwarded-For prefix must not change the bucket');
 await assert.rejects(enforceFeedbackRateLimit(request,{...options,fetcher:async()=>{throw new Error('network');}}),error=>error.code==='feedback_limiter_unavailable');
 await assert.rejects(enforceFeedbackRateLimit(request,{...options,url:'',token:''}),error=>error.code==='feedback_limiter_unavailable');
 await assert.rejects(enforceFeedbackRateLimit(new Request('https://archive.test'),options),error=>error.code==='feedback_limiter_unavailable');
});

test('anonymous feedback endpoint enforces same origin, spam controls, moderation and confirmed storage',async()=>{
 let source=await readFile('app/api/feedback/route.ts','utf8');
 source=source.replace("import {sameOriginFailure} from '@/lib/request-security';",`const sameOriginFailure=globalThis.__sameOriginFailure;`);
 source=source.replace("import {enforceFeedbackRateLimit} from '@/lib/feedback-rate-limit';",`const enforceFeedbackRateLimit=globalThis.__enforceFeedbackRateLimit;`);
 source=source.replace("import {safeFeedbackError} from '@/lib/feedback-errors';",`const safeFeedbackError=(error)=>({code:error.code||'feedback_storage_unavailable',status:error.status||503});`);
 source=source.replace("import {readFeedbackJson,validateFeedbackInput} from '@/lib/feedback-validation';",`const {readFeedbackJson,validateFeedbackInput}=globalThis.__feedbackValidation;`);
 source=source.replace("import {storeFeedback} from '@/lib/feedback-store';",`const storeFeedback=globalThis.__storeFeedback;`);
 source=source.replace("import {moderateFeedback} from '@/lib/ai/moderation';",`const moderateFeedback=globalThis.__moderateFeedback;`);
 source=source.replace(/from '@\/([^']+)'/g,(_,name)=>`from '${pathToFileURL(path.resolve(`${name}.ts`)).href}'`);
 const compiled=ts.transpileModule(source,{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.ESNext}}).outputText;
 const saved={origin:process.env.APP_ORIGIN,secret:process.env.SUPABASE_SECRET_KEY,gemini:process.env.GEMINI_API_KEY,validation:globalThis.__feedbackValidation,sameOrigin:globalThis.__sameOriginFailure,limit:globalThis.__enforceFeedbackRateLimit,store:globalThis.__storeFeedback,moderate:globalThis.__moderateFeedback,stored:globalThis.__feedbackStored,failed:globalThis.__feedbackStoreFails,limited:globalThis.__feedbackRateLimited};
 globalThis.__feedbackValidation={readFeedbackJson,validateFeedbackInput};
 globalThis.__sameOriginFailure=(request)=>request.headers.get('origin')!=='https://archive.test'?Response.json({error:'forbidden'},{status:403}):null;
 globalThis.__enforceFeedbackRateLimit=async(_request,options)=>{globalThis.__rateOptions=options;if(globalThis.__feedbackRateLimited)throw Object.assign(new Error('limited'),{code:'feedback_rate_limit',status:429});};
 let moderated,stored;
 globalThis.__moderateFeedback=async message=>{moderated=message;return {category:'suggestion',summary:'Improve the catalogue',reason:'Constructive proposal',status:'classified'};};
 globalThis.__storeFeedback=async(submission,_identity,options)=>{stored={submission,options};if(globalThis.__feedbackStoreFails)throw Object.assign(new Error('failed'),{code:'feedback_storage_unavailable',status:503});};
 const {POST}=await import(`data:text/javascript,${encodeURIComponent(compiled)}`);
 const makeRequest=(body=valid,origin='https://archive.test')=>new Request('https://archive.test/api/feedback',{method:'POST',headers:{origin,'sec-fetch-site':'same-origin','content-type':'application/json'},body:JSON.stringify(body)});
 try{
  process.env.APP_ORIGIN='https://archive.test';
  assert.equal((await POST(makeRequest(valid,'https://attacker.test'))).status,403);
  assert.equal((await POST(makeRequest({...valid,type:'other'}))).status,400);
  globalThis.__feedbackRateLimited=true;assert.equal((await POST(makeRequest())).status,429);globalThis.__feedbackRateLimited=false;
  globalThis.__feedbackStoreFails=true;assert.equal((await POST(makeRequest())).status,503);globalThis.__feedbackStoreFails=false;
  process.env.SUPABASE_SECRET_KEY='sb_secret_server_only_test';process.env.GEMINI_API_KEY='synthetic-test-key';
  const accepted=await POST(makeRequest());assert.equal(accepted.status,201);assert.deepEqual(await accepted.json(),{received:true});assert.deepEqual(stored.submission,normalized);assert.equal(stored.options.moderation.category,'suggestion');
  assert.equal(moderated,valid.message);assert.equal(globalThis.__rateOptions.identity,valid.email);assert.equal(globalThis.__rateOptions.content,valid.message);
 }finally{
  for(const[k,v]of Object.entries({APP_ORIGIN:saved.origin,SUPABASE_SECRET_KEY:saved.secret,GEMINI_API_KEY:saved.gemini}))if(v===undefined)delete process.env[k];else process.env[k]=v;
  for(const[key,value]of[['__feedbackValidation',saved.validation],['__sameOriginFailure',saved.sameOrigin],['__enforceFeedbackRateLimit',saved.limit],['__storeFeedback',saved.store],['__moderateFeedback',saved.moderate],['__feedbackStored',saved.stored],['__feedbackStoreFails',saved.failed],['__feedbackRateLimited',saved.limited],['__rateOptions',undefined]])if(value===undefined)delete globalThis[key];else globalThis[key]=value;
 }
});

test('AI feedback moderation redacts email, validates Gemini JSON and fails safely to human review',async()=>{
 let sent;
 const response=(value)=>new Response(JSON.stringify({candidates:[{finishReason:'STOP',content:{parts:[{text:JSON.stringify(value)}]}}]}),{status:200,headers:{'content-type':'application/json'}});
 const result=await moderateFeedback('Исправьте поиск, мой email visitor@example.org',{key:'synthetic-key',fetcher:async(_url,init)=>{sent=JSON.parse(init.body);return response({category:'constructive_criticism',summary:'Пожелание улучшить поиск',reason:'Есть конкретное предложение',needsReview:false});}});
 assert.equal(result.status,'classified');assert.equal(result.category,'constructive_criticism');assert.doesNotMatch(JSON.stringify(sent),/visitor@example\.org/);
 const invalid=await moderateFeedback('Сообщение для проверки',{key:'synthetic-key',fetcher:async()=>response({category:'unknown',summary:'x',reason:'y',needsReview:false})});
 assert.deepEqual(invalid,{category:null,summary:null,reason:null,status:'needs_review'});
 const noKey=await moderateFeedback('Обычный отзыв',{key:'',fetcher:async()=>{throw new Error('must not call');}});assert.equal(noKey.status,'needs_review');
});

test('feedback labels, warnings, outcomes and errors are localized in RU/KK/EN',()=>{
 const keys=['feedbackTitle','feedbackText','feedbackType','feedbackChooseType','feedbackTypeReview','feedbackTypeSuggestion','feedbackTypeBug','feedbackName','feedbackEmail','feedbackMessage','feedbackWarning','feedbackSubmit','feedbackSending','feedbackSuccess','feedbackError','feedbackValidationError','feedbackCharacters'];
 for(const locale of ['ru','kk','en'])for(const key of keys)assert.equal(typeof messages[locale][key],'string',`${locale}.${key}`);
});

test('feedback SQL enables RLS, denies public reads, preserves legacy rows and validates moderation metadata',async()=>{
 const sql=await readFile('supabase/migrations/20261111183714_feedback_messages.sql','utf8');
 assert.match(sql,/enable row level security/i);assert.match(sql,/force row level security/i);assert.match(sql,/revoke all on table public\.feedback_messages from public, anon, authenticated, service_role/i);assert.match(sql,/grant insert on table public\.feedback_messages to service_role/i);assert.doesNotMatch(sql,/for select|grant select|grant all/i);
 const identityMigration=await readFile('supabase/migrations/20261112195304_visitor_auth_feedback_identity.sql','utf8');assert.match(identityMigration,/add column if not exists auth_user_id uuid references auth\.users\(id\) on delete set null/i);assert.doesNotMatch(identityMigration,/delete from public\.feedback_messages/i);assert.match(identityMigration,/for select to authenticated[\s\S]*auth\.uid\(\) = auth_user_id/i);assert.match(identityMigration,/for insert to authenticated[\s\S]*auth\.uid\(\) = auth_user_id/i);assert.match(identityMigration,/moderation_category text/i);assert.match(identityMigration,/moderation_status in \('classified','needs_review'\)/i);assert.match(identityMigration,/moderation_category is null[\s\S]*moderation_status = 'needs_review'/i);
 const staffMigration=await readFile('supabase/migrations/20261112204700_feedback_staff_review_access.sql','utf8');assert.match(staffMigration,/grant select on table public\.feedback_messages to service_role/i);assert.match(staffMigration,/grant update \(moderation_category, moderation_summary, moderation_reason, moderation_status\)/i);assert.doesNotMatch(staffMigration,/to anon|to authenticated/i);
 const ratingMigration=await readFile('supabase/migrations/20261113041246_feedback_star_rating.sql','utf8');assert.match(ratingMigration,/add column if not exists rating smallint/i);assert.match(ratingMigration,/rating between 1 and 5/i);assert.doesNotMatch(ratingMigration,/delete from|drop table/i);
});
