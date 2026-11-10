import {revokeSession,sessionCookieName} from '@/lib/archive-auth';
import {sameOriginFailure} from '@/lib/request-security';

export async function POST(request:Request){
 const headers={
  'Set-Cookie':`${sessionCookieName}=; HttpOnly; SameSite=Strict; Path=/; Max-Age=0${process.env.NODE_ENV==='production'?'; Secure':''}`,
  'Cache-Control':'no-store'
 };
 const originFailure=sameOriginFailure(request);
 if(originFailure)return originFailure;
 try{
  await revokeSession();
  return Response.json({ok:true},{headers});
 }catch{
  return Response.json({error:'Session revocation failed'},{status:500,headers});
 }
}
