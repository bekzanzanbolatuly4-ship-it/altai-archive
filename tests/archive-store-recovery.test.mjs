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
