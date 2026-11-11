import {sameOriginFailure} from '@/lib/request-security';
import {enforceFeedbackRateLimit} from '@/lib/feedback-rate-limit';
import {safeFeedbackError} from '@/lib/feedback-errors';
import {readFeedbackJson,validateFeedbackInput} from '@/lib/feedback-validation';
import {storeFeedback} from '@/lib/feedback-store';

export const runtime='nodejs';

export async function POST(request:Request){
 const denied=sameOriginFailure(request);
 if(denied)return denied;
 try{
  await enforceFeedbackRateLimit(request);
  if(!request.headers.get('content-type')?.toLowerCase().startsWith('application/json')){
   return Response.json({error:'invalid_feedback'},{status:400,headers:{'Cache-Control':'no-store'}});
  }
  const submission=validateFeedbackInput(await readFeedbackJson(request));
  await storeFeedback(submission);
  return Response.json({received:true},{status:201,headers:{'Cache-Control':'no-store'}});
 }catch(error){
  const {code,status}=safeFeedbackError(error);
  return Response.json({error:code},{status,headers:{'Cache-Control':'no-store',...(status===429?{'Retry-After':'3600'}:{})}});
 }
}
