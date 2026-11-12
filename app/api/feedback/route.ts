import {sameOriginFailure} from '@/lib/request-security';
import {enforceFeedbackRateLimit} from '@/lib/feedback-rate-limit';
import {safeFeedbackError} from '@/lib/feedback-errors';
import {readFeedbackJson,validateFeedbackInput} from '@/lib/feedback-validation';
import {storeFeedback} from '@/lib/feedback-store';
import {createSupabaseServerClient} from '@/lib/supabase/server';

export const runtime='nodejs';

export async function POST(request:Request){
 const denied=sameOriginFailure(request);
 if(denied)return denied;
 try{
  await enforceFeedbackRateLimit(request);
  if(!request.headers.get('content-type')?.toLowerCase().startsWith('application/json')){
   return Response.json({error:'invalid_feedback'},{status:400,headers:{'Cache-Control':'no-store'}});
  }
  const raw=await readFeedbackJson(request);
  const submission=validateFeedbackInput(raw);
  const body=raw as Record<string,unknown>;
  if(process.env.VISITOR_AUTH_ENABLED!=='true')return Response.json({error:'auth_unavailable'},{status:503,headers:{'Cache-Control':'no-store'}});
  const auth=await createSupabaseServerClient();
  if(!auth)return Response.json({error:'auth_unavailable'},{status:503,headers:{'Cache-Control':'no-store'}});
  const{data:{user},error:authError}=await auth.auth.getUser();
  if(authError||!user)return Response.json({error:'sign_in_required'},{status:401,headers:{'Cache-Control':'no-store'}});
  if(!user.email_confirmed_at||!user.email)return Response.json({error:'email_confirmation_required'},{status:403,headers:{'Cache-Control':'no-store'}});
  const{data:profile,error:profileError}=await auth.from('visitor_profiles').select('display_name').eq('auth_user_id',user.id).maybeSingle();
  if(profileError||!profile)return Response.json({error:'profile_unavailable'},{status:503,headers:{'Cache-Control':'no-store'}});
  const secret=process.env.TURNSTILE_SECRET_KEY;
  if(!secret)return Response.json({error:'captcha_unavailable'},{status:503,headers:{'Cache-Control':'no-store'}});
  const verifyBody=new URLSearchParams({secret,response:String(body.captchaToken)});
  const captcha=await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify',{method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded'},body:verifyBody,cache:'no-store',signal:AbortSignal.timeout(8000)}).then(r=>r.ok?r.json():null).catch(()=>null) as {success?:boolean;hostname?:string}|null;
  const allowedHosts=(process.env.TURNSTILE_ALLOWED_HOSTNAMES||'').split(',').map(x=>x.trim().toLowerCase()).filter(Boolean);
  if(!allowedHosts.length)return Response.json({error:'captcha_unavailable'},{status:503,headers:{'Cache-Control':'no-store'}});
  if(!captcha?.success||!captcha.hostname||!allowedHosts.includes(captcha.hostname.toLowerCase()))return Response.json({error:'captcha_failed'},{status:400,headers:{'Cache-Control':'no-store'}});
  await storeFeedback({...submission,name:profile.display_name,email:user.email,contactConsent:true},{userId:user.id,name:profile.display_name,email:user.email});
  return Response.json({received:true},{status:201,headers:{'Cache-Control':'no-store'}});
 }catch(error){
  const {code,status}=safeFeedbackError(error);
  return Response.json({error:code},{status,headers:{'Cache-Control':'no-store',...(status===429?{'Retry-After':'3600'}:{})}});
 }
}
