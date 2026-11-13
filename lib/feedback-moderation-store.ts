import type {FeedbackModeration} from './ai/moderation';

export async function storeFeedbackModeration(
 id:string,
 userId:string,
 moderation:FeedbackModeration,
 {url=process.env.SUPABASE_URL||'https://isokkxsuqmcsaumbtxlt.supabase.co',secret=process.env.SUPABASE_SECRET_KEY||process.env.SUPABASE_SERVICE_ROLE_KEY,fetcher=fetch}:{url?:string;secret?:string;fetcher?:typeof fetch}={},
):Promise<void>{
 if(!secret||!moderation.category)return;
 if(!/^[\da-f-]{36}$/i.test(id)||!/^[\da-f-]{36}$/i.test(userId))throw new Error('invalid_moderation_target');
 let base:URL;
 try{base=new URL(url);}catch{throw new Error('feedback_storage_unavailable');}
 if(base.protocol!=='https:'||base.hostname!=='isokkxsuqmcsaumbtxlt.supabase.co'||base.username||base.password||base.search||base.hash)throw new Error('feedback_storage_unavailable');
 const endpoint=new URL('/rest/v1/feedback_messages',base.origin);
 endpoint.searchParams.set('id',`eq.${id}`);
 endpoint.searchParams.set('auth_user_id',`eq.${userId}`);
 const headers:Record<string,string>={apikey:secret,'Content-Type':'application/json',Prefer:'return=minimal'};
 if(!secret.startsWith('sb_secret_'))headers.Authorization=`Bearer ${secret}`;
 const response=await fetcher(endpoint,{method:'PATCH',headers,body:JSON.stringify({
  moderation_category:moderation.category,
  moderation_summary:moderation.summary,
  moderation_reason:moderation.reason,
  moderation_status:moderation.status,
 }),cache:'no-store',signal:AbortSignal.timeout(8000)});
 if(!response.ok)throw new Error('feedback_storage_unavailable');
}
