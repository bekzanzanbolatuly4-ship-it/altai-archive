import 'server-only';
import {createClient} from '@supabase/supabase-js';
import {supabaseUrl} from './config';

export function createStaffAdminClient(){
 const secret=process.env.SUPABASE_SECRET_KEY||process.env.SUPABASE_SERVICE_ROLE_KEY;
 let base:URL;
 try{base=new URL(supabaseUrl);}catch{return null;}
 if(!secret||base.protocol!=='https:'||base.hostname!=='isokkxsuqmcsaumbtxlt.supabase.co'||base.username||base.password||base.search||base.hash)return null;
 return createClient(base.origin,secret,{auth:{autoRefreshToken:false,persistSession:false,detectSessionInUrl:false}});
}
