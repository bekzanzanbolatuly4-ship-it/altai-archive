import {supabaseUrl} from '@/lib/supabase/config';
import {redact} from '@/lib/ai/context';

export const runtime='nodejs';
export const dynamic='force-dynamic';

export async function GET(){
 const secret=process.env.SUPABASE_SECRET_KEY||process.env.SUPABASE_SERVICE_ROLE_KEY;
 const headers={'Cache-Control':'no-store'};
 if(!secret)return Response.json({reviews:[],unavailable:true},{status:503,headers});
 let base:URL;
 try{base=new URL(supabaseUrl);}catch{return Response.json({reviews:[],unavailable:true},{status:503,headers});}
 if(base.protocol!=='https:'||base.hostname!=='isokkxsuqmcsaumbtxlt.supabase.co'||base.username||base.password||base.search||base.hash)return Response.json({reviews:[],unavailable:true},{status:503,headers});
 const endpoint=new URL('/rest/v1/feedback_messages',base.origin);
 endpoint.searchParams.set('select','public_display_name,rating,message,created_at');
 endpoint.searchParams.set('type','eq.site_feedback');
 endpoint.searchParams.set('public_consent','eq.true');
 endpoint.searchParams.set('publication_status','eq.published');
 endpoint.searchParams.set('order','publication_reviewed_at.desc,created_at.desc');
 endpoint.searchParams.set('limit','100');
 const requestHeaders:Record<string,string>={apikey:secret};
 if(!secret.startsWith('sb_secret_'))requestHeaders.Authorization=`Bearer ${secret}`;
 try{
  const response=await fetch(endpoint,{headers:requestHeaders,cache:'no-store',signal:AbortSignal.timeout(6000)});
  if(!response.ok)return Response.json({reviews:[],unavailable:true},{status:503,headers});
  const rows:unknown=await response.json();
  if(!Array.isArray(rows))return Response.json({reviews:[],unavailable:true},{status:503,headers});
  const reviews=rows.flatMap(row=>{
   if(!row||typeof row!=='object')return [];
   const value=row as Record<string,unknown>;
   if(typeof value.public_display_name!=='string'||typeof value.message!=='string'||!Number.isInteger(value.rating)||Number(value.rating)<1||Number(value.rating)>5||typeof value.created_at!=='string')return [];
   return [{name:redact(value.public_display_name).slice(0,80),rating:Number(value.rating),message:redact(value.message).slice(0,2000),createdAt:value.created_at}];
  });
  return Response.json({reviews},{headers});
 }catch{return Response.json({reviews:[],unavailable:true},{status:503,headers});}
}
