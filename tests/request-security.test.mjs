import assert from 'node:assert/strict';
import {test} from 'node:test';
import {sameOriginFailure} from '../lib/request-security.ts';

test('cookie-authenticated mutations require a same-origin request',()=>{
 const sameOrigin=new Request('https://archive.example/api/admin/documents',{method:'POST',headers:{origin:'https://archive.example'}});
 const crossOrigin=new Request('https://archive.example/api/admin/documents',{method:'POST',headers:{origin:'https://attacker.example','sec-fetch-site':'same-site'}});
 const crossSite=new Request('https://archive.example/api/admin/documents',{method:'POST',headers:{origin:'https://attacker.example','sec-fetch-site':'cross-site'}});
 const noOrigin=new Request('https://archive.example/api/admin/documents',{method:'POST'});
 const fetchMetadataOnly=new Request('https://archive.example/api/admin/documents',{method:'POST',headers:{'sec-fetch-site':'same-origin'}});
 const behindProxy=new Request('http://localhost:3001/api/auth/login',{method:'POST',headers:{origin:'http://127.0.0.1:3001',host:'127.0.0.1:3001','x-forwarded-proto':'http','sec-fetch-site':'same-origin'}});
 const forgedProxyHeaders=new Request('https://archive.example/api/admin/documents',{method:'POST',headers:{origin:'https://attacker.example','sec-fetch-site':'same-site',host:'attacker.example','x-forwarded-proto':'https'}});

 assert.equal(sameOriginFailure(sameOrigin),null);
 assert.equal(sameOriginFailure(fetchMetadataOnly),null);
 assert.equal(sameOriginFailure(crossOrigin)?.status,403);
 assert.equal(sameOriginFailure(crossSite)?.status,403);
 assert.equal(sameOriginFailure(noOrigin)?.status,403);
 assert.equal(sameOriginFailure(behindProxy),null);
 assert.equal(sameOriginFailure(forgedProxyHeaders)?.status,403);
});

test('production origin validation requires an explicit trusted application origin',()=>{
 const oldNodeEnv=process.env.NODE_ENV;
 const oldAppOrigin=process.env.APP_ORIGIN;
 process.env.NODE_ENV='production';
 delete process.env.APP_ORIGIN;

 try{
  const request=new Request('https://internal-proxy/api/auth/login',{method:'POST',headers:{origin:'https://archive.example','sec-fetch-site':'same-origin',host:'archive.example','x-forwarded-proto':'https'}});
  assert.equal(sameOriginFailure(request)?.status,503);

  process.env.APP_ORIGIN='https://archive.example';
  assert.equal(sameOriginFailure(request),null);
  process.env.APP_ORIGIN='http://archive.example';
  assert.equal(sameOriginFailure(request)?.status,503);
  process.env.APP_ORIGIN='https://archive.example/path';
  assert.equal(sameOriginFailure(request)?.status,503);
  process.env.APP_ORIGIN='https://archive.example';

  const forged=new Request('https://internal-proxy/api/auth/login',{method:'POST',headers:{origin:'https://attacker.example','sec-fetch-site':'same-site',host:'attacker.example','x-forwarded-proto':'https'}});
  assert.equal(sameOriginFailure(forged)?.status,403);
 }finally{
  if(oldNodeEnv===undefined)delete process.env.NODE_ENV;else process.env.NODE_ENV=oldNodeEnv;
  if(oldAppOrigin===undefined)delete process.env.APP_ORIGIN;else process.env.APP_ORIGIN=oldAppOrigin;
 }
});
