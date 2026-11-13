import {sameOriginFailure} from '@/lib/request-security';
import {enforceFeedbackRateLimit} from '@/lib/feedback-rate-limit';
import {FeedbackError,safeFeedbackError} from '@/lib/feedback-errors';
import {readFeedbackJson,validateFeedbackInput} from '@/lib/feedback-validation';
import {storeFeedback} from '@/lib/feedback-store';
import {moderateFeedback} from '@/lib/ai/moderation';
import {createSupabaseServerClient} from '@/lib/supabase/server';

export const runtime='nodejs';

export async function POST(request:Request){
 const denied=sameOriginFailure(request);
 if(denied)return denied;
 try{
  if(!request.headers.get('content-type')?.toLowerCase().startsWith('application/json')){
   return Response.json({error:'invalid_feedback'},{status:400,headers:{'Cache-Control':'no-store'}});
  }
  const supabase=await createSupabaseServerClient();
  if(!supabase)throw new FeedbackError('feedback_auth_unavailable',503);
  const{data:{user},error:authError}=await supabase.auth.getUser();
  if(authError||!user)throw new FeedbackError('feedback_auth_required',401);
  if(!user.email_confirmed_at||!user.email)throw new FeedbackError('feedback_email_unconfirmed',403);
  const{data:profile,error:profileError}=await supabase.from('visitor_profiles').select('display_name').eq('auth_user_id',user.id).maybeSingle();
  if(profileError||!profile)throw new FeedbackError('feedback_profile_unavailable',403);
  const identity={userId:user.id,name:profile.display_name,email:user.email};
  const raw=await readFeedbackJson(request);
  const submission=validateFeedbackInput(raw,identity);
  await enforceFeedbackRateLimit(request,{identity:submission.email,content:submission.message});
  if(!process.env.SUPABASE_SECRET_KEY&&!process.env.SUPABASE_SERVICE_ROLE_KEY)return Response.json({error:'feedback_storage_unavailable'},{status:503,headers:{'Cache-Control':'no-store'}});
  // Moderation receives only the message text; names and contact details stay out of the model request.
  const moderation=await moderateFeedback(submission.message);
  await storeFeedback(submission,{userId:user.id},{moderation});
  return Response.json({received:true,publicationStatus:submission.publicConsent?'pending':'private'},{status:201,headers:{'Cache-Control':'no-store'}});
 }catch(error){
  const {code,status}=safeFeedbackError(error);
  return Response.json({error:code},{status,headers:{'Cache-Control':'no-store',...(status===429?{'Retry-After':'3600'}:{})}});
 }
}
