import {can,requireUser} from '@/lib/archive-auth';
import {supabaseUrl} from '@/lib/supabase/config';
import {sameOriginFailure} from '@/lib/request-security';
import {demoReadOnlyFailure} from '@/lib/demo-read-only';

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
 const type=url.searchParams.get('type');
 const moderation=url.searchParams.get('moderation');
 let base:URL;
 try{base=new URL(supabaseUrl);}catch{return Response.json({error:'Feedback review storage is not configured'},{status:503,headers:{'Cache-Control':'no-store'}});}
 if(base.protocol!=='https:'||base.hostname!=='isokkxsuqmcsaumbtxlt.supabase.co'||base.username||base.password||base.search||base.hash)return Response.json({error:'Feedback review storage is not configured'},{status:503,headers:{'Cache-Control':'no-store'}});
 const endpoint=new URL('/rest/v1/feedback_messages',base.origin);
 endpoint.searchParams.set('select','id,type,name,email,message,rating,status,moderation_category,moderation_summary,moderation_reason,moderation_status,created_at,public_consent,public_display_name,publication_status,publication_reviewed_at');
 if(type&&['site_feedback','suggestion','site_bug'].includes(type))endpoint.searchParams.set('type',`eq.${type}`);
 if(moderation&&['classified','needs_review'].includes(moderation))endpoint.searchParams.set('moderation_status',`eq.${moderation}`);
 endpoint.searchParams.set('order',sort==='oldest'?'created_at.asc':sort==='highest'?'rating.desc.nullslast,created_at.desc':sort==='lowest'?'rating.asc.nullslast,created_at.desc':'created_at.desc');
 endpoint.searchParams.set('limit','1000');
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

export async function PATCH(request:Request){
 if(process.env.VERCEL!=='1'){
  const readOnly=demoReadOnlyFailure();
  if(readOnly)return readOnly;
 }
 const originFailure=sameOriginFailure(request);
 if(originFailure)return originFailure;
 if(!request.headers.get('content-type')?.toLowerCase().startsWith('application/json'))return Response.json({error:'Invalid request'},{status:400});
 const auth=await requireUser('edit');
 if(auth.response)return auth.response;
 if(!can(auth.user!,'edit')||!['SUPERADMIN','SITE_ADMIN','MODERATOR'].includes(auth.user!.role))return Response.json({error:'Insufficient permission'},{status:403});
 const length=Number(request.headers.get('content-length'));
 if(Number.isFinite(length)&&length>2048)return Response.json({error:'Invalid request'},{status:413});
 let input:unknown;
 try{input=await request.json();}catch{return Response.json({error:'Invalid request'},{status:400});}
 if(!input||typeof input!=='object'||Array.isArray(input))return Response.json({error:'Invalid request'},{status:400});
 const{ id, status }=input as Record<string,unknown>;
 if(typeof id!=='string'||! /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id)||!['private','published'].includes(String(status)))return Response.json({error:'Invalid request'},{status:400});
 const secret=process.env.SUPABASE_SECRET_KEY||process.env.SUPABASE_SERVICE_ROLE_KEY;
 let base:URL;
 try{base=new URL(supabaseUrl);}catch{return Response.json({error:'Feedback review storage is not configured'},{status:503});}
 if(!secret||base.protocol!=='https:'||base.hostname!=='isokkxsuqmcsaumbtxlt.supabase.co'||base.username||base.password||base.search||base.hash)return Response.json({error:'Feedback review storage is not configured'},{status:503});
 const endpoint=new URL('/rest/v1/feedback_messages',base.origin);
 endpoint.searchParams.set('id',`eq.${id}`);
 if(status==='published'){
  endpoint.searchParams.set('type','eq.site_feedback');
  endpoint.searchParams.set('public_consent','eq.true');
  endpoint.searchParams.set('rating','not.is.null');
 }
 const headers:Record<string,string>={apikey:secret,'Content-Type':'application/json',Prefer:'return=representation'};
 if(!secret.startsWith('sb_secret_'))headers.Authorization=`Bearer ${secret}`;
 try{
  const response=await fetch(endpoint,{method:'PATCH',headers,body:JSON.stringify({publication_status:status,publication_reviewed_at:new Date().toISOString(),publication_reviewed_by:auth.user!.id}),cache:'no-store',signal:AbortSignal.timeout(8000)});
  if(!response.ok)return Response.json({error:'Feedback could not be updated'},{status:503});
  const updated:unknown=await response.json();
  if(!Array.isArray(updated)||updated.length!==1)return Response.json({error:'Review needs publication consent and a star rating before it can be published'},{status:409});
  return Response.json({updated:true,status},{headers:{'Cache-Control':'no-store'}});
 }catch{return Response.json({error:'Feedback could not be updated'},{status:503});}
}

export async function DELETE(request:Request){
 if(process.env.VERCEL!=='1'){
  const readOnly=demoReadOnlyFailure();
  if(readOnly)return readOnly;
 }
 const originFailure=sameOriginFailure(request);
 if(originFailure)return originFailure;
 if(!request.headers.get('content-type')?.toLowerCase().startsWith('application/json'))return Response.json({error:'Invalid request'},{status:400});
 const length=Number(request.headers.get('content-length'));
 if(Number.isFinite(length)&&length>2048)return Response.json({error:'Invalid request'},{status:413});
 const auth=await requireUser('edit');
 if(auth.response)return auth.response;
 if(!can(auth.user!,'edit')||!['SUPERADMIN','SITE_ADMIN'].includes(auth.user!.role))return Response.json({error:'Insufficient permission'},{status:403});
 let input:unknown;
 try{input=await request.json();}catch{return Response.json({error:'Invalid request'},{status:400});}
 if(!input||typeof input!=='object'||Array.isArray(input))return Response.json({error:'Invalid request'},{status:400});
 const{id}=input as Record<string,unknown>;
 if(typeof id!=='string'||! /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id))return Response.json({error:'Invalid request'},{status:400});
 const secret=process.env.SUPABASE_SECRET_KEY||process.env.SUPABASE_SERVICE_ROLE_KEY;
 let base:URL;
 try{base=new URL(supabaseUrl);}catch{return Response.json({error:'Feedback review storage is not configured'},{status:503});}
 if(!secret||base.protocol!=='https:'||base.hostname!=='isokkxsuqmcsaumbtxlt.supabase.co'||base.username||base.password||base.search||base.hash)return Response.json({error:'Feedback review storage is not configured'},{status:503});
 const endpoint=new URL('/rest/v1/feedback_messages',base.origin);
 endpoint.searchParams.set('id',`eq.${id}`);
 const headers:Record<string,string>={apikey:secret,Prefer:'return=representation'};
 if(!secret.startsWith('sb_secret_'))headers.Authorization=`Bearer ${secret}`;
 try{
  const response=await fetch(endpoint,{method:'DELETE',headers,cache:'no-store',signal:AbortSignal.timeout(8000)});
  if(!response.ok)return Response.json({error:'Feedback could not be deleted'},{status:503});
  const deleted:unknown=await response.json();
  if(!Array.isArray(deleted)||deleted.length!==1)return Response.json({error:'Feedback was not found'},{status:404});
  return Response.json({deleted:true},{headers:{'Cache-Control':'no-store'}});
 }catch{return Response.json({error:'Feedback could not be deleted'},{status:503});}
}
