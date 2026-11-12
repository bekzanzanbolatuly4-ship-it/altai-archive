import {FeedbackError} from './feedback-errors';
import type {FeedbackSubmission} from './feedback-validation';

export const feedbackConsentVersion='feedback-contact-v1';

export type FeedbackRow=FeedbackSubmission&{
 auth_user_id:string;
 name:string;
 email:string;
 status:'new';
 consent_version:string|null;
};

export async function storeFeedback(
 submission:FeedbackSubmission,
 identity:{userId:string;name:string;email:string},
 {url=process.env.SUPABASE_URL,secret=process.env.SUPABASE_SECRET_KEY||process.env.SUPABASE_SERVICE_ROLE_KEY,fetcher=fetch}:{url?:string;secret?:string;fetcher?:typeof fetch}={},
):Promise<void>{
 if(!url||!secret)throw new FeedbackError('feedback_storage_unavailable',503);
 let endpoint:URL;
 try{
  const base=new URL(url);
  if(base.protocol!=='https:'||base.username||base.password||base.pathname!=='/'||base.search||base.hash)throw new Error('invalid base URL');
  endpoint=new URL('/rest/v1/feedback_messages',base.origin);
 }catch{throw new FeedbackError('feedback_storage_unavailable',503);}
 const row:FeedbackRow={
  ...submission,
  auth_user_id:identity.userId,
  name:identity.name,
  email:identity.email,
  status:'new',
  consent_version:submission.contactConsent?feedbackConsentVersion:null,
 };
 const headers:Record<string,string>={
  apikey:secret,
  'Content-Type':'application/json',
  Prefer:'return=minimal',
 };
 // Opaque sb_secret keys are API-key headers, not bearer JWTs. The legacy
 // service_role key is a JWT and still needs Authorization for PostgREST.
 if(!secret.startsWith('sb_secret_'))headers.Authorization=`Bearer ${secret}`;
 try{
  const response=await fetcher(endpoint,{method:'POST',headers,body:JSON.stringify(row),cache:'no-store',signal:AbortSignal.timeout(8000)});
  if(!response.ok)throw new FeedbackError('feedback_storage_unavailable',503);
 }catch(error){
  if(error instanceof FeedbackError)throw error;
  throw new FeedbackError('feedback_storage_unavailable',503);
 }
}
