import {createSupabaseServerClient} from '@/lib/supabase/server';
import {sameOriginFailure} from '@/lib/request-security';

export async function POST(request:Request){
 const originFailure=sameOriginFailure(request);
 if(originFailure)return originFailure;
 const supabase=await createSupabaseServerClient();
 if(!supabase)return Response.json({error:'Staff authentication is not configured'},{status:503,headers:{'Cache-Control':'no-store'}});
 const{error}=await supabase.auth.signOut({scope:'local'});
 if(error)return Response.json({error:'Sign out failed'},{status:503,headers:{'Cache-Control':'no-store'}});
 return Response.json({ok:true},{headers:{'Cache-Control':'no-store'}});
}
