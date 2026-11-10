import assert from 'node:assert/strict';
import {mkdir,mkdtemp,readFile,readdir,rm,writeFile} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
import {test} from 'node:test';

const storeUrl=pathToFileURL(path.resolve('lib/archive-store.ts')).href;

test('invalid backups fail without data loss and valid backups recover safely',async()=>{
 const cwd=await mkdtemp(path.join(tmpdir(),'altai-store-test-'));
 const originalCwd=process.cwd;
 try{
  process.cwd=()=>cwd;
  const storeModule=await import(`${storeUrl}?test=${Date.now()}`);
  process.cwd=originalCwd;

  const directory=path.join(cwd,'.data');
  const main=path.join(directory,'archive-store.json');
  const backup=path.join(directory,'archive-store.backup.json');
  const damaged='not valid archive data';
  const validStore={users:[],documents:[],sessions:[],audit:[]};
  const invalidBackup=JSON.stringify({...validStore,documents:'invalid'});
  await mkdir(directory,{recursive:true});
  await writeFile(main,damaged);
  await writeFile(backup,invalidBackup);

  await assert.rejects(storeModule.readStore(),/invalid and no valid backup/);
  assert.equal(await readFile(main,'utf8'),damaged);
  assert.equal(await readFile(backup,'utf8'),invalidBackup);
  let files=await readdir(directory);
  assert.ok(!files.some(name=>name.startsWith('archive-store.corrupt.')));

  const backupContent=JSON.stringify(validStore);
  await writeFile(backup,backupContent);
  assert.deepEqual(await storeModule.readStore(),validStore);
  assert.deepEqual(JSON.parse(await readFile(main,'utf8')),validStore);
  assert.equal(await readFile(backup,'utf8'),backupContent);
  files=await readdir(directory);
  const preserved=files.find(name=>name.startsWith('archive-store.corrupt.'));
  assert.ok(preserved);
  assert.equal(await readFile(path.join(directory,preserved),'utf8'),damaged);
 }finally{
  process.cwd=originalCwd;
  await rm(cwd,{recursive:true,force:true});
 }
});

test('assistant metadata read returns empty without creating a missing .data directory',async()=>{
 const cwd=await mkdtemp(path.join(tmpdir(),'altai-store-readonly-'));
 const originalCwd=process.cwd;
 try{
  process.cwd=()=>cwd;
  const storeModule=await import(`${storeUrl}?readonly-missing=${Date.now()}`);
  process.cwd=originalCwd;

  assert.deepEqual(await storeModule.readPublishedPublicDocuments(),[]);
  await assert.rejects(readdir(path.join(cwd,'.data')),{code:'ENOENT'});
 }finally{
  process.cwd=originalCwd;
  await rm(cwd,{recursive:true,force:true});
 }
});

test('assistant metadata read returns no documents from an empty store',async()=>{
 const cwd=await mkdtemp(path.join(tmpdir(),'altai-store-readonly-empty-'));
 const originalCwd=process.cwd;
 try{
  process.cwd=()=>cwd;
  const storeModule=await import(`${storeUrl}?readonly-empty=${Date.now()}`);
  process.cwd=originalCwd;

  await mkdir(path.join(cwd,'.data'));
  await writeFile(path.join(cwd,'.data','archive-store.json'),JSON.stringify({users:[],documents:[],sessions:[],audit:[]}));
  assert.deepEqual(await storeModule.readPublishedPublicDocuments(),[]);
 }finally{
  process.cwd=originalCwd;
  await rm(cwd,{recursive:true,force:true});
 }
});

test('assistant metadata read exposes only published public documents',async()=>{
 const cwd=await mkdtemp(path.join(tmpdir(),'altai-store-readonly-public-'));
 const originalCwd=process.cwd;
 try{
  process.cwd=()=>cwd;
  const storeModule=await import(`${storeUrl}?readonly-public=${Date.now()}`);
  process.cwd=originalCwd;

  const documents=[
   {id:'public',fileName:'public.pdf',title:'Public',status:'published',accessStatus:'public',keywords:[]},
   {id:'draft',fileName:'draft.pdf',title:'Draft',status:'draft',accessStatus:'public',keywords:[]},
   {id:'restricted',fileName:'restricted.pdf',title:'Restricted',status:'published',accessStatus:'restricted',keywords:[]}
  ];
  await mkdir(path.join(cwd,'.data'));
  const storeFile=path.join(cwd,'.data','archive-store.json');
  const contents=JSON.stringify({users:[],documents,sessions:[],audit:[]});
  await writeFile(storeFile,contents);

  assert.deepEqual(await storeModule.readPublishedPublicDocuments(),[documents[0]]);
  assert.equal(await readFile(storeFile,'utf8'),contents);
 }finally{
  process.cwd=originalCwd;
  await rm(cwd,{recursive:true,force:true});
 }
});

test('assistant metadata read reports a corrupt store instead of treating it as missing',async()=>{
 const cwd=await mkdtemp(path.join(tmpdir(),'altai-store-readonly-corrupt-'));
 const originalCwd=process.cwd;
 const originalError=console.error;
 const logged=[];
 try{
  process.cwd=()=>cwd;
  const storeModule=await import(`${storeUrl}?readonly-corrupt=${Date.now()}`);
  process.cwd=originalCwd;

  await mkdir(path.join(cwd,'.data'));
  const storeFile=path.join(cwd,'.data','archive-store.json');
  await writeFile(storeFile,'not-json');
  console.error=(...args)=>logged.push(args);
  await assert.rejects(storeModule.readPublishedPublicDocuments(),/Unable to read public archive metadata/);
  assert.deepEqual(logged,[['Assistant archive metadata read failed',{type:'SyntaxError',code:'none'}]]);
  assert.equal(await readFile(storeFile,'utf8'),'not-json');
 }finally{
  console.error=originalError;
  process.cwd=originalCwd;
  await rm(cwd,{recursive:true,force:true});
 }
});
