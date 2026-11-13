import {ensureOwner,issueSession,roles,safeUser,sessionCookieName,verifyPassword} from '@/lib/archive-auth';
import {clearLoginFailures,isLoginRateLimited,recordLoginFailure} from '@/lib/login-rate-limit';
import {sameOriginFailure} from '@/lib/request-security';
import {readStore} from '@/lib/archive-store';
import {createSupabaseServerClient} from '@/lib/supabase/server';
import type {StaffRole} from '@/lib/archive-store';

export async function POST(request:Request){
 const originFailure=sameOriginFailure(request);
 if(originFailure)return originFailure;
 const rawBody=await request.json().catch(()=>({}));
 const body=rawBody&&typeof rawBody==='object'&&!Array.isArray(rawBody)?rawBody as Record<string,unknown>:{};
 const rawEmail=typeof body.email==='string'?body.email:'';
 const rawPassword=typeof body.password==='string'?body.password:'';
 const rateIdentity=rawEmail.trim().toLowerCase()||'invalid-login';
 const rate=isLoginRateLimited(rateIdentity);
 if(rate.limited){
  return Response.json(
   {error:'Try again later'},
   {status:429,headers:{'Retry-After':String(rate.retrySeconds),'Cache-Control':'no-store'}}
  );
 }

 try{
  if(process.env.VERCEL==='1'){
   const supabase=await createSupabaseServerClient();
   if(!supabase)return Response.json({error:'Staff authentication is not configured'},{status:503,headers:{'Cache-Control':'no-store'}});
   if(!rawEmail||!rawPassword||rawEmail.length>254||rawPassword.length>1024){
    recordLoginFailure(rateIdentity);
    return Response.json({error:'Invalid email or password'},{status:401,headers:{'Cache-Control':'no-store'}});
   }
   const{data,error}=await supabase.auth.signInWithPassword({email:rawEmail.trim().toLowerCase(),password:rawPassword});
   if(error||!data.user?.email_confirmed_at){
    recordLoginFailure(rateIdentity);
    return Response.json({error:'Invalid email or password'},{status:401,headers:{'Cache-Control':'no-store'}});
   }
   const{data:profile,error:profileError}=await supabase.from('profiles').select('id,display_name,role,disabled,created_at').eq('auth_user_id',data.user.id).maybeSingle();
   if(profileError||!profile||profile.disabled||!roles.includes(profile.role as StaffRole)){
    await supabase.auth.signOut({scope:'local'});
    return Response.json({error:'This account has no active staff access'},{status:403,headers:{'Cache-Control':'no-store'}});
   }
   clearLoginFailures(rateIdentity);
   return Response.json({user:{id:profile.id,email:data.user.email,name:profile.display_name,role:profile.role,disabled:false,createdAt:profile.created_at}},{headers:{'Cache-Control':'no-store'}});
  }
  // A read-only demo must not bootstrap a new account as a side effect of login.
  // Existing configured accounts can still sign in for read-only admin browsing.
  if(process.env.DEMO_READ_ONLY!=='true')await ensureOwner();

  if(!rawEmail||!rawPassword||rawEmail.length>254||rawPassword.length>1024){
   recordLoginFailure(rateIdentity);
   return Response.json({error:'Invalid email or password'},{status:401});
  }

  const email=rawEmail.trim().toLowerCase();
  const store=await readStore();
  const user=store.users.find(x=>x.email===email&&!x.disabled);

  const passwordValid=await verifyPassword(rawPassword,user?user.passwordHash:null);
  if(!user||!passwordValid){
   recordLoginFailure(rateIdentity);
   return Response.json({error:'Invalid email or password'},{status:401});
  }

  clearLoginFailures(rateIdentity);
  const session=await issueSession(user.id,user.email);

  return Response.json(
   {user:safeUser(user)},
   {
    headers:{
     'Set-Cookie':`${sessionCookieName}=${session.cookie}; HttpOnly; SameSite=Strict; Path=/; Max-Age=28800${process.env.NODE_ENV==='production'?'; Secure':''}`,
     'Cache-Control':'no-store'
    }
   }
  );
 }catch{
  return Response.json(
   {error:'Login unavailable'},
   {status:500}
  );
 }
}
