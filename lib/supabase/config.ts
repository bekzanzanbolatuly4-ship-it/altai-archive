/** Publishable Supabase settings are designed for browser use; RLS protects data. */
export const supabaseUrl=process.env.NEXT_PUBLIC_SUPABASE_URL||'https://isokkxsuqmcsaumbtxlt.supabase.co';
export const supabasePublishableKey=process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY||'sb_publishable_gy1EJ59dODbfd0HJzPXKrA_GsZW7G_m';

export function visitorAuthEnabled(){
 return Boolean(supabaseUrl&&supabasePublishableKey);
}
