import {can,requireUser} from '@/lib/archive-auth';
import {supabaseUrl} from '@/lib/supabase/config';

export const runtime='nodejs';
export const dynamic='force-dynamic';

export async function GET(request:Request){
 const auth=await requireUser('edit');
 if(auth.response)return auth.response;
 if(!can(auth.user!,'edit')||!['SUPERADMIN','SITE_ADMIN','MODERATOR'].includes(auth.user!.role))return Response.json({error:'Insufficient permission'},{status:403});
 const secret=process.env.SUPABASE_SECRET_KEY||process.env.SUPABASE_SERVICE_ROLE_KEY;
 if(!secret)return Response.json({error:'Feedback review storage is not configured'},{status:503,headers:{'Cache-Control':'no-store'}});
 const url=new URL(request.url);
 const sort=url.searchParams.get('sort');
 let base:URL;
 try{base=new URL(supabaseUrl);}catch{return Response.json({error:'Feedback review storage is not configured'},{status:503,headers:{'Cache-Control':'no-store'}});}
 if(base.protocol!=='https:'||base.hostname!=='isokkxsuqmcsaumbtxlt.supabase.co'||base.username||base.password||base.search||base.hash)return Response.json({error:'Feedback review storage is not configured'},{status:503,headers:{'Cache-Control':'no-store'}});
 const endpoint=new URL('/rest/v1/feedback_messages',base.origin);
 endpoint.searchParams.set('select','id,type,name,email,message,rating,status,moderation_category,moderation_summary,moderation_reason,moderation_status,created_at');
 endpoint.searchParams.set('order',sort==='oldest'?'created_at.asc':sort==='highest'?'rating.desc.nullslast,created_at.desc':sort==='lowest'?'rating.asc.nullslast,created_at.desc':'created_at.desc');
 endpoint.searchParams.set('limit','100');
 const headers:Record<string,string>={apikey:secret};
 if(!secret.startsWith('sb_secret_'))headers.Authorization=`Bearer ${secret}`;
 try{
  const response=await fetch(endpoint,{headers,cache:'no-store',signal:AbortSignal.timeout(8000)});
  if(!response.ok)return Response.json({error:'Feedback could not be loaded'},{status:503,headers:{'Cache-Control':'no-store'}});
  const rows:unknown=await response.json();
  if(!Array.isArray(rows))return Response.json({error:'Feedback could not be loaded'},{status:503,headers:{'Cache-Control':'no-store'}});
  return Response.json({feedback:rows},{headers:{'Cache-Control':'no-store'}});
 }catch{
  return Response.json({error:'Feedback could not be loaded'},{status:503,headers:{'Cache-Control':'no-store'}});
 }
}
