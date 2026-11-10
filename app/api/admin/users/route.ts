import {randomUUID} from 'node:crypto';
import {hashPassword,requireUser,roles,safeUser} from '@/lib/archive-auth';
import {sameOriginFailure} from '@/lib/request-security';
import {appendAudit,readStore,updateStore,type StaffRole} from '@/lib/archive-store';
import {demoReadOnlyFailure} from '@/lib/demo-read-only';

const EMAIL_RE=/^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function GET(){
 const auth=await requireUser('accounts');
 if(auth.response)return auth.response;
 const s=await readStore();
 return Response.json(
  {users:s.users.map(safeUser)},
  {headers:{'Cache-Control':'no-store'}}
 );
}

export async function POST(request:Request){
 const readOnly=demoReadOnlyFailure();
 if(readOnly)return readOnly;
 const originFailure=sameOriginFailure(request);
 if(originFailure)return originFailure;
 const auth=await requireUser('accounts');
 if(auth.response)return auth.response;

 try{
  const b=await request.json().catch(()=>({}));
  const email=String(b.email||'').trim().toLowerCase().slice(0,254);
  const name=String(b.name||'').replace(/[\x00-\x1F]/g,'').trim().slice(0,100);
  const password=String(b.password||'');
  const role=b.role as StaffRole;

  if(!EMAIL_RE.test(email)||!name||password.length<12||password.length>1024||!roles.includes(role)||role==='SUPERADMIN'){
   return Response.json(
    {error:'Provide valid name, email, 12+ char password, and staff role (excluding SUPERADMIN)'},
    {status:400}
   );
  }

  let error='';
  let created:unknown;

  await updateStore(async s=>{
   if(s.users.some(u=>u.email===email)){
    error='Email already exists';
    return;
   }
   const user={
    id:randomUUID(),
    email,
    name,
    role,
    passwordHash:await hashPassword(password),
    disabled:false,
    createdAt:new Date().toISOString()
   };
   s.users.push(user);
   appendAudit(s,auth.user!.email,'staff.create',email);
   created=safeUser(user);
  });

  if(error)return Response.json({error},{status:409});

  return Response.json({user:created},{status:201});
 }catch{
  return Response.json({error:'Invalid account data'},{status:400});
 }
}

export async function PATCH(request:Request){
 const readOnly=demoReadOnlyFailure();
 if(readOnly)return readOnly;
 const originFailure=sameOriginFailure(request);
 if(originFailure)return originFailure;
 const auth=await requireUser('accounts');
 if(auth.response)return auth.response;

 try{
  const body:unknown=await request.json();
  if(!body||typeof body!=='object'||Array.isArray(body)){
   return Response.json({error:'Invalid account update'},{status:400});
  }
  const b=body as Record<string,unknown>;
  if(Object.keys(b).some(key=>!['id','role','disabled'].includes(key))||typeof b.id!=='string'||!b.id.trim()){
   return Response.json({error:'Invalid account update'},{status:400});
  }
  if(!Object.hasOwn(b,'role')&&!Object.hasOwn(b,'disabled')){
   return Response.json({error:'No account changes were provided'},{status:400});
  }
  if(Object.hasOwn(b,'role')&&(typeof b.role!=='string'||!roles.includes(b.role as StaffRole)||b.role==='SUPERADMIN')){
   return Response.json({error:'Invalid staff role'},{status:400});
  }
  if(Object.hasOwn(b,'disabled')&&typeof b.disabled!=='boolean'){
   return Response.json({error:'Invalid disabled status'},{status:400});
  }
  const userId=b.id as string;
  let error='';

  await updateStore(s=>{
   const u=s.users.find(x=>x.id===userId);
   if(!u){
    error='User not found';
    return;
   }
   if(u.role==='SUPERADMIN'){
    error='Owner role cannot be reassigned or modified';
    return;
   }
   if(typeof b.role==='string'){
    u.role=b.role as StaffRole;
   }
   if(typeof b.disabled==='boolean'){
    u.disabled=b.disabled;
   }
   appendAudit(s,auth.user!.email,'staff.update',userId);
  });

  if(error)return Response.json({error},{status:error==='User not found'?404:403});

  return Response.json({ok:true});
 }catch{
  return Response.json({error:'Invalid account update'},{status:400});
 }
}
