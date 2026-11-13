import {createSupabaseServerClient} from '@/lib/supabase/server';
import {visitorAuthEnabled} from '@/lib/supabase/config';
export const dynamic='force-dynamic';
export async function GET(){
 if(!visitorAuthEnabled())return Response.json({error:'auth_unavailable'},{status:503,headers:{'Cache-Control':'no-store'}});
 const supabase=await createSupabaseServerClient();
 if(!supabase)return Response.json({error:'auth_unavailable'},{status:503,headers:{'Cache-Control':'no-store'}});
 const{data:{user},error}=await supabase.auth.getUser();
 if(error||!user)return Response.json({user:null},{headers:{'Cache-Control':'no-store'}});
 if(!user.email_confirmed_at)return Response.json({user:{email:user.email,confirmed:false}},{headers:{'Cache-Control':'no-store'}});
 const{data:profile,error:profileError}=await supabase.from('visitor_profiles').select('display_name').eq('auth_user_id',user.id).maybeSingle();
 if(profileError||!profile)return Response.json({error:'profile_unavailable'},{status:503,headers:{'Cache-Control':'no-store'}});
 return Response.json({user:{email:user.email,confirmed:true,name:profile.display_name}},{headers:{'Cache-Control':'no-store'}});
}
