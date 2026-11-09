import {randomUUID} from 'node:crypto';
import {mkdir,readFile,rename,writeFile} from 'node:fs/promises';
import path from 'node:path';

export type StaffRole='SUPERADMIN'|'SITE_ADMIN'|'ARCHIVE_EMPLOYEE'|'EDITOR'|'BRANCH_ADMIN'|'MODERATOR'|'ANALYST';
export type StaffUser={id:string;email:string;name:string;role:StaffRole;passwordHash:string;disabled:boolean;createdAt:string};
export type StoredDocument={id:string;fileName:string;originalName:string;mimeType:string;size:number;title:string;description:string;date:string;fond:string;inventory:string;caseName:string;documentIdentifier:string;keywords:string[];language:string;provenance:string;accessStatus:'public'|'restricted';status:'draft'|'review'|'approved'|'published'|'archived';createdAt:string;updatedAt:string;createdBy:string};
export type ArchiveStore={users:StaffUser[];documents:StoredDocument[];sessions:{id:string;userId:string;expiresAt:number}[];audit:{id:string;actor:string;action:string;target:string;at:string}[]};
const root=path.join(process.cwd(),'.data');
export const storePath=path.join(root,'archive-store.json');
export const uploadPath=path.join(root,'uploads');
let writeQueue=Promise.resolve();

export async function readStore():Promise<ArchiveStore>{
 await mkdir(uploadPath,{recursive:true});
 try{return JSON.parse(await readFile(storePath,'utf8')) as ArchiveStore}catch(e){if((e as NodeJS.ErrnoException).code!=='ENOENT')throw e;const initial:ArchiveStore={users:[],documents:[],sessions:[],audit:[]};await atomicWrite(initial);return initial}
}
async function atomicWrite(data:ArchiveStore){const temp=`${storePath}.${randomUUID()}.tmp`;await writeFile(temp,JSON.stringify(data,null,2),{mode:0o600});await rename(temp,storePath)}
export async function updateStore<T>(fn:(store:ArchiveStore)=>T|Promise<T>):Promise<T>{
 let release!:()=>void;const previous=writeQueue;writeQueue=new Promise<void>(resolve=>{release=resolve});await previous;
 try{const store=await readStore();const result=await fn(store);await atomicWrite(store);return result}finally{release()}
}
export async function recordAudit(actor:string,action:string,target:string){await updateStore(s=>{s.audit.unshift({id:randomUUID(),actor,action,target,at:new Date().toISOString()});s.audit=s.audit.slice(0,200)})}
