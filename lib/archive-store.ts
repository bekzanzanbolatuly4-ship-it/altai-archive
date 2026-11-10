import {randomUUID} from 'node:crypto';
import {copyFile,mkdir,readdir,readFile,rename,unlink,writeFile} from 'node:fs/promises';
import path from 'node:path';

export type StaffRole='SUPERADMIN'|'SITE_ADMIN'|'ARCHIVE_EMPLOYEE'|'EDITOR'|'BRANCH_ADMIN'|'MODERATOR'|'ANALYST';
export type StaffUser={id:string;email:string;name:string;role:StaffRole;passwordHash:string;disabled:boolean;createdAt:string};
export type StoredDocument={id:string;fileName:string;originalName:string;mimeType:string;size:number;title:string;description:string;date:string;fond:string;inventory:string;caseName:string;documentIdentifier:string;keywords:string[];language:string;provenance:string;accessStatus:'public'|'restricted';status:'draft'|'review'|'approved'|'published'|'archived';createdAt:string;updatedAt:string;createdBy:string};
export type ArchiveStore={users:StaffUser[];documents:StoredDocument[];sessions:{id:string;userId:string;expiresAt:number}[];audit:{id:string;actor:string;action:string;target:string;at:string}[]};

const root=path.join(process.cwd(),'.data');
export const storePath=path.join(root,'archive-store.json');
export const backupPath=path.join(root,'archive-store.backup.json');
export const backupsDir=path.join(root,'backups');
export const uploadPath=path.join(root,'uploads');

let writeQueue=Promise.resolve();

function emptyStore():ArchiveStore{
 return {users:[],documents:[],sessions:[],audit:[]};
}

function normalizeStore(raw:unknown):ArchiveStore{
 if(!raw||typeof raw!=='object'||Array.isArray(raw))throw new Error('Archive store must be a JSON object');
 const s=raw as Partial<ArchiveStore>;
 for(const key of ['users','documents','sessions','audit'] as const){
  if(!Array.isArray(s[key]))throw new Error(`Archive store has an invalid ${key} collection`);
 }

 if(s.users!.some(user=>!user||typeof user!=='object'||typeof user.id!=='string'||typeof user.email!=='string'||typeof user.role!=='string')){
  throw new Error('Archive store has invalid staff records');
 }
 if(s.documents!.some(document=>!document||typeof document!=='object'||typeof document.id!=='string'||typeof document.fileName!=='string'||typeof document.title!=='string'||!['draft','review','approved','published','archived'].includes(document.status)||!['public','restricted'].includes(document.accessStatus)||!Array.isArray(document.keywords))){
  throw new Error('Archive store has invalid document records');
 }
 if(s.sessions!.some(session=>!session||typeof session!=='object'||typeof session.id!=='string'||typeof session.userId!=='string'||typeof session.expiresAt!=='number')){
  throw new Error('Archive store has invalid sessions');
 }
 if(s.audit!.some(entry=>!entry||typeof entry!=='object'||typeof entry.id!=='string'||typeof entry.actor!=='string'||typeof entry.action!=='string')){
  throw new Error('Archive store has invalid audit records');
 }
 return {
  users:s.users as StaffUser[],
  documents:s.documents as StoredDocument[],
  sessions:s.sessions as ArchiveStore['sessions'],
  audit:s.audit as ArchiveStore['audit']
 };
}

export async function readStore():Promise<ArchiveStore>{
 await mkdir(uploadPath,{recursive:true});
 await mkdir(backupsDir,{recursive:true});

 let primaryContent:string|null=null;
 try{
  primaryContent=await readFile(storePath,'utf8');
 }catch(error){
  if((error as NodeJS.ErrnoException).code!=='ENOENT')throw new Error('Unable to read archive store');
 }

 if(primaryContent!==null){
  try{
   const parsed=normalizeStore(JSON.parse(primaryContent));
   return structuredClone(parsed);
  }catch{
   let recovered:ArchiveStore;
   try{
    recovered=normalizeStore(JSON.parse(await readFile(backupPath,'utf8')));
   }catch{
    throw new Error('Archive store is invalid and no valid backup is available; original data was preserved');
   }
   const corruptTarget=path.join(root,`archive-store.corrupt.${Date.now()}.${randomUUID()}.json`);
   try{
    await writeFile(corruptTarget,primaryContent,{flag:'wx',mode:0o600});
   }catch{
    throw new Error('Archive store recovery stopped because the damaged file could not be preserved');
   }
   await atomicWrite(recovered,{preserveBackup:true});
   return structuredClone(recovered);
  }
 }

 try{
  const recovered=normalizeStore(JSON.parse(await readFile(backupPath,'utf8')));
  await atomicWrite(recovered,{preserveBackup:true});
  return structuredClone(recovered);
 }catch(error){
  if((error as NodeJS.ErrnoException).code==='ENOENT'){
   const initial=emptyStore();
   await atomicWrite(initial);
   return structuredClone(initial);
  }
  throw new Error('Archive store is missing and its backup is invalid; no empty store was created');
 }
}

async function atomicWrite(data:ArchiveStore,{preserveBackup=false}:{preserveBackup?:boolean}={}){
 await mkdir(root,{recursive:true});
 const temp=`${storePath}.${randomUUID()}.tmp`;
 const backupTemp=`${backupPath}.${randomUUID()}.tmp`;
 const serialized=JSON.stringify(data,null,2);
 try{
  await writeFile(temp,serialized,{mode:0o600});
  if(!preserveBackup){
   try{
    await copyFile(storePath,backupTemp);
    await rename(backupTemp,backupPath);
   }catch(error){
    if((error as NodeJS.ErrnoException).code!=='ENOENT')throw error;
   }
  }
  await rename(temp,storePath);
 }finally{
  await unlink(temp).catch(()=>{});
  await unlink(backupTemp).catch(()=>{});
 }
}

export async function updateStore<T>(fn:(store:ArchiveStore)=>T|Promise<T>):Promise<T>{
 let release!:()=>void;
 const previous=writeQueue;
 writeQueue=new Promise<void>(resolve=>{release=resolve});
 try{
  await previous;
 }catch{
  // Proceed despite prior unhandled error
 }
 try{
  const store=structuredClone(await readStore());
  const result=await fn(store);
  await atomicWrite(store);
  return result;
 }finally{
  release();
 }
}

export async function recordAudit(actor:string,action:string,target:string){
 await updateStore(s=>appendAudit(s,actor,action,target));
}

export function appendAudit(store:ArchiveStore,actor:string,action:string,target:string){
 store.audit.unshift({id:randomUUID(),actor,action,target,at:new Date().toISOString()});
 store.audit=store.audit.slice(0,200);
}

export async function createBackup():Promise<string>{
 await readStore();
 await mkdir(backupsDir,{recursive:true});
 const timestamp=new Date().toISOString().replace(/[:.]/g,'-');
 const snapshotFile=path.join(backupsDir,`archive-store-${timestamp}.json`);
 await copyFile(storePath,snapshotFile);
 await copyFile(storePath,backupPath);

 try{
  const entries=await readdir(backupsDir);
  const jsonFiles=entries.filter(f=>f.startsWith('archive-store-')&&f.endsWith('.json')).sort().reverse();
  for(const old of jsonFiles.slice(10)){
   await unlink(path.join(backupsDir,old)).catch(()=>{});
  }
 }catch{
  // Rotation error non-fatal
 }

 return snapshotFile;
}

export async function recoverStore():Promise<ArchiveStore>{
 const backupContent=await readFile(backupPath,'utf8');
 const recovered=normalizeStore(JSON.parse(backupContent));
 try{
  const current=await readFile(storePath,'utf8');
  await writeFile(path.join(root,`archive-store.pre-recovery.${Date.now()}.${randomUUID()}.json`),current,{flag:'wx',mode:0o600});
 }catch(error){
  if((error as NodeJS.ErrnoException).code!=='ENOENT')throw new Error('Unable to preserve the current archive store before recovery');
 }
 await atomicWrite(recovered,{preserveBackup:true});
 return recovered;
}

export async function exportArchiveData(){
 const store=await readStore();
 return {
  exportedAt:new Date().toISOString(),
  documentsCount:store.documents.length,
  documents:store.documents,
  audit:store.audit,
  staff:store.users.map(u=>({
   id:u.id,
   email:u.email,
   name:u.name,
   role:u.role,
   disabled:u.disabled,
   createdAt:u.createdAt
  }))
 };
}
