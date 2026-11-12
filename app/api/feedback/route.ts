import {sameOriginFailure} from '@/lib/request-security';
import {enforceFeedbackRateLimit} from '@/lib/feedback-rate-limit';
import {safeFeedbackError} from '@/lib/feedback-errors';
import {readFeedbackJson,validateFeedbackInput} from '@/lib/feedback-validation';
import {storeFeedback} from '@/lib/feedback-store';
import {createSupabaseServerClient} from '@/lib/supabase/server';
import {moderateFeedback} from '@/lib/ai/moderation';

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
  if(process.env.VISITOR_AUTH_ENABLED!=='true')return Response.json({error:'auth_unavailable'},{status:503,headers:{'Cache-Control':'no-store'}});
  const auth=await createSupabaseServerClient();
  if(!auth)return Response.json({error:'auth_unavailable'},{status:503,headers:{'Cache-Control':'no-store'}});
  const{data:{user},error:authError}=await auth.auth.getUser();
  if(authError||!user)return Response.json({error:'sign_in_required'},{status:401,headers:{'Cache-Control':'no-store'}});
  if(!user.email_confirmed_at||!user.email)return Response.json({error:'email_confirmation_required'},{status:403,headers:{'Cache-Control':'no-store'}});
  const{data:profile,error:profileError}=await auth.from('visitor_profiles').select('display_name').eq('auth_user_id',user.id).maybeSingle();
  if(profileError||!profile)return Response.json({error:'profile_unavailable'},{status:503,headers:{'Cache-Control':'no-store'}});
  const moderation=await moderateFeedback(submission.message);
  await storeFeedback({...submission,name:profile.display_name,email:user.email,contactConsent:true},{userId:user.id,name:profile.display_name,email:user.email},{moderation});
  return Response.json({received:true},{status:201,headers:{'Cache-Control':'no-store'}});
 }catch(error){
  const {code,status}=safeFeedbackError(error);
  return Response.json({error:code},{status,headers:{'Cache-Control':'no-store',...(status===429?{'Retry-After':'3600'}:{})}});
 }
}
