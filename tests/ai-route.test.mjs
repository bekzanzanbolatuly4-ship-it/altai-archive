import assert from 'node:assert/strict';
import {test} from 'node:test';
import {readFile} from 'node:fs/promises';
import {pathToFileURL} from 'node:url';
import path from 'node:path';
import ts from 'typescript';
import {approvedReferenceSources} from '../lib/ai/reference-knowledge.ts';

// Execute the real route with in-memory public metadata; never import the live store.
const document={id:'public',title:'Archive photographs',description:'Photographs of mountains.',status:'published',accessStatus:'public',provenance:'verified',keywords:[]};
const gemini=(value)=>Response.json({candidates:[{finishReason:'STOP',content:{parts:[{text:JSON.stringify(value)}]}}]});
let source=await readFile('app/api/assistant/route.ts','utf8');
source=source.replace("import {readPublishedPublicDocuments} from '@/lib/archive-store';",`const readPublishedPublicDocuments=async()=>globalThis.__assistantDocuments??${JSON.stringify([document,{...document,id:'private',accessStatus:'restricted'}])};`);
source=source.replace(/from '@\/([^']+)'/g,(_,name)=>`from '${pathToFileURL(path.resolve(`${name}.ts`)).href}'`);
const compiled=ts.transpileModule(source,{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.ESNext}}).outputText;
const {POST}=await import(`data:text/javascript,${encodeURIComponent(compiled)}`);

test('real route integrates input, public retrieval, provider, validation and safe errors',async()=>{
 const names=['GEMINI_API_KEY','AI_PROVIDER','AI_API_KEY','AI_MODEL','OPENROUTER_API_KEY','OPENROUTER_MODEL','APP_ORIGIN'];
 const previous=Object.fromEntries(names.map(name=>[name,process.env[name]]));
 const previousFetch=globalThis.fetch;
 const previousDocuments=globalThis.__assistantDocuments;
 let providerCalls=0;
 const request=(body,origin='https://archive.test')=>new Request('https://archive.test/api/assistant',{method:'POST',headers:{origin,'Content-Type':'application/json'},body:JSON.stringify(body)});
 try{
  process.env.APP_ORIGIN='https://archive.test';
  delete process.env.GEMINI_API_KEY;
  globalThis.fetch=async()=>{providerCalls++;assert.fail('No live network permitted');};
  const missing=await POST(request({message:'Find photographs',locale:'en'}));
  assert.equal(missing.status,200);assert.equal((await missing.json()).mode,'local-search');
  const denied=await POST(request({message:'Find photographs',locale:'en'},'https://attacker.test'));
  assert.equal(denied.status,403);
  const crossSite=request({message:'Find photographs',locale:'en'});crossSite.headers.set('sec-fetch-site','cross-site');
  assert.equal((await POST(crossSite)).status,403);
  assert.equal((await POST(request({message:'x'.repeat(2001),locale:'en'}))).status,400);
  globalThis.__assistantDocuments=[];
  const empty=await POST(request({message:'квантовая обсерватория на Марсе',locale:'ru'}));
  assert.equal(empty.status,200);assert.deepEqual(await empty.json(),{mode:'no-match',locale:'ru',answer:'По вашему запросу не найдено опубликованных архивных материалов.',citations:[]});
  assert.equal(providerCalls,0,'No provider request should run when there are no public documents');
  for(const [message,locale,url] of [['привет','ru','/assistant'],['Что такое Государственный архив Восточно-Казахстанской области?','ru','/about'],['Где каталог?','ru','/catalog']]){
   const response=await POST(request({message,locale}));assert.equal(response.status,200);
   const body=await response.json();assert.equal(body.mode,'reference');assert.ok(body.citations.some(source=>source.url===url));
  }
  const missingDocument=await POST(request({message:'Найди архивный документ с шифром 999-XYZ',locale:'ru'}));
  assert.equal(missingDocument.status,200);assert.equal((await missingDocument.json()).mode,'no-match');
  const missingReferenceConfig=await POST(request({message:'How do I use the archive catalogue?',locale:'en'}));
  assert.equal(missingReferenceConfig.status,200);assert.equal((await missingReferenceConfig.json()).mode,'reference');
  assert.equal(providerCalls,0,'Local references and no-match must not call a model');
  process.env.GEMINI_API_KEY='synthetic-key';
  globalThis.fetch=async(url,options)=>{
   assert.equal(url,'https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-lite:generateContent');
   assert.equal(options.headers['x-goog-api-key'],'synthetic-key');
   const context=JSON.parse(JSON.parse(options.body).contents[0].parts[0].text).untrustedPublicMetadata;
   assert.equal(context.length,1);assert.ok(context[0].description.includes('demonstration interface'));
   const reference=approvedReferenceSources('catalogue','en')[0];
   return gemini({answer:'Use the catalogue search and filters.',citations:[{id:reference.id,quote:reference.description}]});
  };
  const referenceSuccess=await POST(request({message:'How do I use the archive catalogue?',locale:'en'}));
  assert.equal(referenceSuccess.status,200);const referenceBody=await referenceSuccess.json();
  assert.equal(referenceBody.mode,'ai');assert.equal(referenceBody.citations[0].url,'/catalog');
  globalThis.__assistantDocuments=[];
  globalThis.fetch=async()=>new Response(JSON.stringify({error:{status:'RESOURCE_EXHAUSTED'}}),{status:429,headers:{'Retry-After':'0'}});
  const referenceLimited=await POST(request({message:'How do I use the archive catalogue?',locale:'en'}));
  assert.equal(referenceLimited.status,200);assert.equal((await referenceLimited.json()).mode,'reference');
  delete globalThis.__assistantDocuments;
  process.env.GEMINI_API_KEY='synthetic-key';
  globalThis.fetch=async(url,options)=>{
   assert.equal(url,'https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-lite:generateContent');
   assert.equal(JSON.parse(JSON.parse(options.body).contents[0].parts[0].text).untrustedPublicMetadata.length,1);
   return gemini({answer:'Public metadata describes photographs.',citations:[{id:'S1',quote:'Photographs of mountains.'}]});
  };
  const success=await POST(request({message:'Find photographs',locale:'en'}));
  assert.equal(success.status,200);assert.equal(success.headers.get('Cache-Control'),'no-store');
  const body=await success.json();assert.equal(body.citations[0].url,'/document/public');assert.equal(body.mode,'ai');
  delete process.env.GEMINI_API_KEY;
  globalThis.fetch=async()=>new Response('DO NOT EXPOSE provider internal secret',{status:429});
  const limited=await POST(request({message:'Find photographs',locale:'en'}));
  assert.equal(limited.status,200);
  assert.equal((await limited.json()).mode,'local-search');
  globalThis.fetch=async()=>new Response('secret provider body',{status:503});
  const unavailable=await POST(request({message:'Find photographs',locale:'en'}));
  assert.equal(unavailable.status,200);assert.equal((await unavailable.json()).mode,'local-search');
 }finally{
  globalThis.fetch=previousFetch;
  if(previousDocuments===undefined)delete globalThis.__assistantDocuments;else globalThis.__assistantDocuments=previousDocuments;
  for(const name of names){if(previous[name]===undefined)delete process.env[name];else process.env[name]=previous[name];}
 }
});
