import assert from 'node:assert/strict';
import {test} from 'node:test';
import {readFile} from 'node:fs/promises';
import {pathToFileURL} from 'node:url';
import path from 'node:path';
import ts from 'typescript';

// Execute the real route with in-memory public metadata; never import the live store.
const document={id:'public',title:'Archive photographs',description:'Photographs of mountains.',status:'published',accessStatus:'public',provenance:'demonstration',keywords:[]};
let source=await readFile('app/api/assistant/route.ts','utf8');
source=source.replace("import {readPublishedPublicDocuments} from '@/lib/archive-store';",`const readPublishedPublicDocuments=async()=>globalThis.__assistantDocuments??${JSON.stringify([document,{...document,id:'private',accessStatus:'restricted'}])};`);
source=source.replace(/from '@\/([^']+)'/g,(_,name)=>`from '${pathToFileURL(path.resolve(`${name}.ts`)).href}'`);
const compiled=ts.transpileModule(source,{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.ESNext}}).outputText;
const {POST}=await import(`data:text/javascript,${encodeURIComponent(compiled)}`);

test('real route integrates input, public retrieval, provider, validation and safe errors',async()=>{
 const names=['OPENROUTER_API_KEY','OPENROUTER_MODEL','AI_PROVIDER','AI_API_KEY','AI_MODEL','APP_ORIGIN'];
 const previous=Object.fromEntries(names.map(name=>[name,process.env[name]]));
 const previousFetch=globalThis.fetch;
 const previousDocuments=globalThis.__assistantDocuments;
 let providerCalls=0;
 const request=(body,origin='https://archive.test')=>new Request('https://archive.test/api/assistant',{method:'POST',headers:{origin,'Content-Type':'application/json'},body:JSON.stringify(body)});
 try{
  process.env.APP_ORIGIN='https://archive.test';
  delete process.env.AI_PROVIDER;delete process.env.AI_API_KEY;delete process.env.AI_MODEL;
  delete process.env.OPENROUTER_API_KEY;
  globalThis.fetch=async()=>{providerCalls++;assert.fail('No live network permitted');};
  const missing=await POST(request({message:'Find photographs',locale:'en'}));
  assert.equal(missing.status,200);assert.equal((await missing.json()).mode,'local-search');
  process.env.AI_PROVIDER='unlisted-provider';process.env.AI_API_KEY='synthetic-key';process.env.AI_MODEL='test/model:free';
  const unsupported=await POST(request({message:'Find photographs',locale:'en'}));
  assert.equal(unsupported.status,503);assert.deepEqual(await unsupported.json(),{mode:'unavailable',error:'configuration'});
  assert.equal(providerCalls,0,'Unsupported provider configuration must fail before making a request');
  delete process.env.AI_PROVIDER;delete process.env.AI_API_KEY;delete process.env.AI_MODEL;
  const denied=await POST(request({message:'Find photographs',locale:'en'},'https://attacker.test'));
  assert.equal(denied.status,403);
  const crossSite=request({message:'Find photographs',locale:'en'});crossSite.headers.set('sec-fetch-site','cross-site');
  assert.equal((await POST(crossSite)).status,403);
  assert.equal((await POST(request({message:'x'.repeat(2001),locale:'en'}))).status,400);
  globalThis.__assistantDocuments=[];
  const empty=await POST(request({message:'квантовая обсерватория на Марсе',locale:'ru'}));
  assert.equal(empty.status,200);assert.deepEqual(await empty.json(),{mode:'no-match',locale:'ru',answer:'По вашему запросу не найдено опубликованных архивных материалов.',citations:[]});
  assert.equal(providerCalls,0,'No provider request should run when there are no public documents');
  delete globalThis.__assistantDocuments;
  process.env.OPENROUTER_API_KEY='synthetic-key';process.env.OPENROUTER_MODEL='test/model:free';
  globalThis.fetch=async(url,options)=>{
   assert.equal(url,'https://openrouter.ai/api/v1/chat/completions');
   assert.equal(JSON.parse(JSON.parse(options.body).messages[1].content).untrustedPublicMetadata.length,1);
   return Response.json({choices:[{finish_reason:'stop',message:{content:JSON.stringify({answer:'Public metadata describes photographs.',citations:[{id:'S1',quote:'Photographs of mountains.'}]})}}]});
  };
  const success=await POST(request({message:'Find photographs',locale:'en'}));
  assert.equal(success.status,200);assert.equal(success.headers.get('Cache-Control'),'no-store');
  const body=await success.json();assert.equal(body.citations[0].url,'/document/public');assert.equal(body.mode,'ai');
  process.env.AI_PROVIDER='gemini';process.env.AI_API_KEY='synthetic-gemini-key';process.env.AI_MODEL='gemini-2.5-flash-lite';
  globalThis.fetch=async(url,options)=>{
   assert.equal(url,'https://generativelanguage.googleapis.com/v1beta/openai/chat/completions');
   assert.equal(JSON.parse(options.body).provider,undefined);
   return Response.json({choices:[{finish_reason:'stop',message:{content:JSON.stringify({answer:'Public metadata describes photographs.',citations:[{id:'S1',quote:'Photographs of mountains.'}]})}}]});
  };
  assert.equal((await POST(request({message:'Find photographs',locale:'en'}))).status,200);
  process.env.AI_PROVIDER='openrouter';delete process.env.AI_API_KEY;delete process.env.AI_MODEL;
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
