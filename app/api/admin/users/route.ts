import {randomUUID} from 'node:crypto';
import {hashPassword,requireUser,roles,safeUser} from '@/lib/archive-auth';
import {sameOriginFailure} from '@/lib/request-security';
import {appendAudit,readStore,updateStore,type StaffRole} from '@/lib/archive-store';
import {demoReadOnlyFailure} from '@/lib/demo-read-only';
import {createStaffAdminClient} from '@/lib/supabase/staff-admin';

const EMAIL_RE=/^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function GET(){
 const auth=await requireUser('accounts');
 if(auth.response)return auth.response;
 if(process.env.VERCEL==='1'){
  const admin=createStaffAdminClient();
  if(!admin)return Response.json({error:'Persistent staff storage is not configured'},{status:503,headers:{'Cache-Control':'no-store'}});
  const{data:profiles,error}=await admin.from('profiles').select('id,auth_user_id,display_name,role,disabled,created_at').not('auth_user_id','is',null).order('created_at',{ascending:true});
  if(error||!profiles)return Response.json({error:'Staff list is unavailable'},{status:503,headers:{'Cache-Control':'no-store'}});
  const users=await Promise.all(profiles.map(async profile=>{
   const result=await admin.auth.admin.getUserById(profile.auth_user_id);
   return {id:profile.id,email:result.data.user?.email||'',name:profile.display_name,role:profile.role,disabled:profile.disabled,createdAt:profile.created_at};
  }));
  return Response.json({users:users.filter(user=>user.email)},{headers:{'Cache-Control':'no-store'}});
 }
 const s=await readStore();
 return Response.json(
  {users:s.users.map(safeUser)},
  {headers:{'Cache-Control':'no-store'}}
 );
}

export async function POST(request:Request){
 const originFailure=sameOriginFailure(request);
 if(originFailure)return originFailure;
 const auth=await requireUser('accounts');
 if(auth.response)return auth.response;

 if(process.env.VERCEL==='1'){
  if(!request.headers.get('content-type')?.toLowerCase().startsWith('application/json'))return Response.json({error:'Invalid request'},{status:400});
  const admin=createStaffAdminClient();
  if(!admin)return Response.json({error:'Persistent staff storage is not configured'},{status:503});
  try{
   const body:unknown=await request.json();
   if(!body||typeof body!=='object'||Array.isArray(body))return Response.json({error:'Invalid staff assignment'},{status:400});
   const value=body as Record<string,unknown>;
   const email=typeof value.email==='string'?value.email.trim().toLowerCase():'';
   const role=value.role as StaffRole;
   if(!EMAIL_RE.test(email)||email.length>254||!roles.includes(role)||role==='SUPERADMIN'||Object.keys(value).some(key=>!['email','role'].includes(key)))return Response.json({error:'Provide a valid confirmed account email and staff role'},{status:400});
   let target:{id:string;email?:string}|null=null;
   for(let page=1;page<=20&&!target;page++){
    const{data,error}=await admin.auth.admin.listUsers({page,perPage:1000});
    if(error)return Response.json({error:'Account lookup unavailable'},{status:503});
    const match=data.users.find(user=>user.email?.toLowerCase()===email&&user.email_confirmed_at);
    if(match)target=match;
    if(data.users.length<1000)break;
   }
   if(!target)return Response.json({error:'No confirmed account matches that email'},{status:404});
   const{data:existing,error:existingError}=await admin.from('profiles').select('id,role,disabled').eq('auth_user_id',target.id).maybeSingle();
   if(existingError)return Response.json({error:'Staff storage is unavailable'},{status:503});
   if(existing)return Response.json({error:'This account already has a staff membership; change it from the staff list'},{status:409});
   const{data:visitor,error:visitorError}=await admin.from('visitor_profiles').select('display_name').eq('auth_user_id',target.id).maybeSingle();
   if(visitorError||!visitor?.display_name)return Response.json({error:'The account has no verified visitor profile'},{status:409});
   const{error}=await admin.from('profiles').insert({id:target.id,auth_user_id:target.id,display_name:visitor.display_name,role,disabled:false,granted_by:auth.user!.id,updated_at:new Date().toISOString()});
   if(error)return Response.json({error:'Staff membership could not be saved'},{status:503});
   return Response.json({user:{id:target.id,email:target.email,name:visitor.display_name,role,disabled:false}},{status:201,headers:{'Cache-Control':'no-store'}});
  }catch{return Response.json({error:'Invalid staff assignment'},{status:400});}
 }
 const readOnly=demoReadOnlyFailure();
 if(readOnly)return readOnly;

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
 const originFailure=sameOriginFailure(request);
 if(originFailure)return originFailure;
 const auth=await requireUser('accounts');
 if(auth.response)return auth.response;
 if(process.env.VERCEL==='1'){
  if(!request.headers.get('content-type')?.toLowerCase().startsWith('application/json'))return Response.json({error:'Invalid request'},{status:400});
  const admin=createStaffAdminClient();
  if(!admin)return Response.json({error:'Persistent staff storage is not configured'},{status:503});
  try{
   const body:unknown=await request.json();
   if(!body||typeof body!=='object'||Array.isArray(body))return Response.json({error:'Invalid account update'},{status:400});
   const value=body as Record<string,unknown>;
   if(Object.keys(value).some(key=>!['id','role','disabled'].includes(key))||typeof value.id!=='string'||! /^[0-9a-f-]{36}$/i.test(value.id))return Response.json({error:'Invalid account update'},{status:400});
   if((value.role===undefined&&value.disabled===undefined)||(value.role!==undefined&&(typeof value.role!=='string'||!roles.includes(value.role as StaffRole)||value.role==='SUPERADMIN'))||(value.disabled!==undefined&&typeof value.disabled!=='boolean'))return Response.json({error:'Invalid staff role update'},{status:400});
   const{data:existing,error:lookupError}=await admin.from('profiles').select('id,role,disabled').eq('id',value.id).maybeSingle();
   if(lookupError)return Response.json({error:'Staff list is unavailable'},{status:503});
   if(!existing)return Response.json({error:'Staff member not found'},{status:404});
   if(existing.role==='SUPERADMIN')return Response.json({error:'The SUPERADMIN membership cannot be changed here'},{status:403});
   const patch:Record<string,unknown>={granted_by:auth.user!.id,updated_at:new Date().toISOString()};
   if(value.role!==undefined)patch.role=value.role;
   if(value.disabled!==undefined)patch.disabled=value.disabled;
   const{error}=await admin.from('profiles').update(patch).eq('id',value.id);
   if(error)return Response.json({error:'Staff membership could not be updated'},{status:409});
   return Response.json({ok:true},{headers:{'Cache-Control':'no-store'}});
  }catch{return Response.json({error:'Invalid account update'},{status:400});}
 }
 const readOnly=demoReadOnlyFailure();
 if(readOnly)return readOnly;

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
