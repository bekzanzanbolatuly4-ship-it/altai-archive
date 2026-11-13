import {createSupabaseServerClient} from '@/lib/supabase/server';
import {createStaffAdminClient} from '@/lib/supabase/staff-admin';

export const dynamic='force-dynamic';

export async function GET(){
 const supabase=await createSupabaseServerClient();
 if(!supabase)return Response.json({error:'auth_unavailable'},{status:503,headers:{'Cache-Control':'no-store'}});
 try{
  const{data:{user},error}=await supabase.auth.getUser();
  if(error||!user)return Response.json({profile:null},{headers:{'Cache-Control':'no-store'}});
  const{data:visitor,error:visitorError}=await supabase.from('visitor_profiles').select('display_name,consent_version,terms_accepted_at').eq('auth_user_id',user.id).maybeSingle();
  if(visitorError)return Response.json({error:'profile_unavailable'},{status:503,headers:{'Cache-Control':'no-store'}});
  const admin=createStaffAdminClient();
  const staffResult=admin
   ?await admin.from('profiles').select('display_name,role,disabled,created_at').eq('auth_user_id',user.id).maybeSingle()
   :await supabase.from('profiles').select('display_name,role,disabled,created_at').eq('auth_user_id',user.id).maybeSingle();
  const{data:staff,error:staffError}=staffResult;
  if(staffError)return Response.json({error:'profile_unavailable'},{status:503,headers:{'Cache-Control':'no-store'}});
  return Response.json({profile:{
   email:user.email||'',
   name:visitor?.display_name||staff?.display_name||'',
   emailConfirmed:Boolean(user.email_confirmed_at),
   accountStatus:staff?.disabled?'suspended':!user.email_confirmed_at?'unconfirmed':'active',
   role:staff?.role||'PUBLIC_USER',
   createdAt:user.created_at,
   staffSince:staff?.created_at||null,
   consentAt:visitor?.terms_accepted_at||null,
   consentVersion:visitor?.consent_version||null
  }},{headers:{'Cache-Control':'no-store'}});
 }catch{return Response.json({error:'profile_unavailable'},{status:503,headers:{'Cache-Control':'no-store'}});}
}
