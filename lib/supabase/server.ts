import {createServerClient} from '@supabase/ssr';
import {cookies} from 'next/headers';
import {supabasePublishableKey,supabaseUrl,visitorAuthEnabled} from './config';

export async function createSupabaseServerClient(){
 if(!visitorAuthEnabled()||!supabaseUrl||!supabasePublishableKey)return null;
 const jar=await cookies();
 return createServerClient(supabaseUrl,supabasePublishableKey,{cookies:{
  getAll(){return jar.getAll();},
  setAll(values){try{values.forEach(({name,value,options})=>jar.set(name,value,options));}catch{/* Server components cannot set cookies; proxy refreshes them. */}}
 }});
}
