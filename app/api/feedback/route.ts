import {randomUUID} from 'node:crypto';
import {sameOriginFailure} from '@/lib/request-security';
import {enforceFeedbackRateLimit} from '@/lib/feedback-rate-limit';
import {safeFeedbackError} from '@/lib/feedback-errors';
import {readFeedbackJson,validateFeedbackInput} from '@/lib/feedback-validation';
import {createSupabaseServerClient} from '@/lib/supabase/server';
import {visitorAuthEnabled} from '@/lib/supabase/config';
import {moderateFeedback} from '@/lib/ai/moderation';
import {storeFeedbackModeration} from '@/lib/feedback-moderation-store';

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
  if(!visitorAuthEnabled())return Response.json({error:'auth_unavailable'},{status:503,headers:{'Cache-Control':'no-store'}});
  const auth=await createSupabaseServerClient();
  if(!auth)return Response.json({error:'auth_unavailable'},{status:503,headers:{'Cache-Control':'no-store'}});
  const{data:{user},error:authError}=await auth.auth.getUser();
  if(authError||!user)return Response.json({error:'sign_in_required'},{status:401,headers:{'Cache-Control':'no-store'}});
  if(!user.email_confirmed_at||!user.email)return Response.json({error:'email_confirmation_required'},{status:403,headers:{'Cache-Control':'no-store'}});
  const{data:profile,error:profileError}=await auth.from('visitor_profiles').select('display_name').eq('auth_user_id',user.id).maybeSingle();
  if(profileError||!profile)return Response.json({error:'profile_unavailable'},{status:503,headers:{'Cache-Control':'no-store'}});
  const feedbackId=randomUUID();
  const{error:insertError}=await auth.from('feedback_messages').insert({
   id:feedbackId,type:submission.type,message:submission.message,name:profile.display_name,email:user.email,
   auth_user_id:user.id,status:'new',contact_consent:true,consent_version:'feedback-contact-v1',
   moderation_category:null,moderation_summary:null,moderation_reason:null,moderation_status:'needs_review'
  });
  if(insertError)return Response.json({error:'feedback_storage_unavailable'},{status:503,headers:{'Cache-Control':'no-store'}});
  if((process.env.SUPABASE_SECRET_KEY||process.env.SUPABASE_SERVICE_ROLE_KEY)&&process.env.GEMINI_API_KEY){
   try{
    const moderation=await moderateFeedback(submission.message);
    if(moderation.category)await storeFeedbackModeration(feedbackId,user.id,moderation);
   }catch{/* Preserve the submitted message; the row remains marked for staff review. */}
  }
  return Response.json({received:true},{status:201,headers:{'Cache-Control':'no-store'}});
 }catch(error){
  const {code,status}=safeFeedbackError(error);
  return Response.json({error:code},{status,headers:{'Cache-Control':'no-store',...(status===429?{'Retry-After':'3600'}:{})}});
 }
}
