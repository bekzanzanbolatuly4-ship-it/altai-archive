import {FeedbackError} from './feedback-errors';
import type {FeedbackSubmission} from './feedback-validation';
import type {FeedbackModeration} from './ai/moderation';

export const feedbackConsentVersion='feedback-contact-v1';
export const feedbackPublicationConsentVersion='feedback-publication-v1';

export type FeedbackRow=Omit<FeedbackSubmission,'contactConsent'|'publicConsent'>&{
 contact_consent:boolean;
 auth_user_id:string|null;
 name:string;
 email:string|null;
 rating:number|null;
 status:'new';
 consent_version:string|null;
 moderation_category:FeedbackModeration['category'];
 moderation_summary:FeedbackModeration['summary'];
 moderation_reason:FeedbackModeration['reason'];
 moderation_status:FeedbackModeration['status'];
 public_consent:boolean;
 public_consent_version:string|null;
 public_display_name:string|null;
 publication_status:'private'|'pending';
};

export async function storeFeedback(
 submission:FeedbackSubmission,
 identity:{userId:string}|undefined,
 {url=process.env.SUPABASE_URL,secret=process.env.SUPABASE_SECRET_KEY||process.env.SUPABASE_SERVICE_ROLE_KEY,fetcher=fetch,moderation}:{url?:string;secret?:string;fetcher?:typeof fetch;moderation?:FeedbackModeration}={},
):Promise<void>{
 if(!url||!secret)throw new FeedbackError('feedback_storage_unavailable',503);
 let endpoint:URL;
 try{
  const base=new URL(url);
  if(base.protocol!=='https:'||base.username||base.password||base.pathname!=='/'||base.search||base.hash)throw new Error('invalid base URL');
  endpoint=new URL('/rest/v1/feedback_messages',base.origin);
 }catch{throw new FeedbackError('feedback_storage_unavailable',503);}
 const row:FeedbackRow={
  type:submission.type,
  name:submission.name,
  email:submission.email,
  rating:submission.rating,
  message:submission.message,
  contact_consent:submission.contactConsent,
  auth_user_id:identity?.userId??null,
  status:'new',
  consent_version:submission.contactConsent?feedbackConsentVersion:null,
  moderation_category:moderation?.category??null,
  moderation_summary:moderation?.summary??null,
  moderation_reason:moderation?.reason??null,
  moderation_status:moderation?.status??'needs_review',
  public_consent:submission.publicConsent,
  public_consent_version:submission.publicConsent?feedbackPublicationConsentVersion:null,
  public_display_name:submission.publicConsent?submission.name.split(/\s+/u)[0].slice(0,80):null,
  publication_status:submission.publicConsent?'pending':'private',
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
