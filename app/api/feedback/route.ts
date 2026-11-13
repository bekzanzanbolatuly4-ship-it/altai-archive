import {sameOriginFailure} from '@/lib/request-security';
import {enforceFeedbackRateLimit} from '@/lib/feedback-rate-limit';
import {safeFeedbackError} from '@/lib/feedback-errors';
import {readFeedbackJson,validateFeedbackInput} from '@/lib/feedback-validation';
import {storeFeedback} from '@/lib/feedback-store';
import {moderateFeedback} from '@/lib/ai/moderation';

export const runtime='nodejs';

export async function POST(request:Request){
 const denied=sameOriginFailure(request);
 if(denied)return denied;
 try{
  if(!request.headers.get('content-type')?.toLowerCase().startsWith('application/json')){
   return Response.json({error:'invalid_feedback'},{status:400,headers:{'Cache-Control':'no-store'}});
  }
  const raw=await readFeedbackJson(request);
  const submission=validateFeedbackInput(raw);
  await enforceFeedbackRateLimit(request,{identity:submission.email,content:submission.message});
  if(!process.env.SUPABASE_SECRET_KEY&&!process.env.SUPABASE_SERVICE_ROLE_KEY)return Response.json({error:'feedback_storage_unavailable'},{status:503,headers:{'Cache-Control':'no-store'}});
  // Moderation receives only the message text; names and contact details stay out of the model request.
  const moderation=await moderateFeedback(submission.message);
  await storeFeedback(submission,undefined,{moderation});
  return Response.json({received:true},{status:201,headers:{'Cache-Control':'no-store'}});
 }catch(error){
  const {code,status}=safeFeedbackError(error);
  return Response.json({error:code},{status,headers:{'Cache-Control':'no-store',...(status===429?{'Retry-After':'3600'}:{})}});
 }
}
