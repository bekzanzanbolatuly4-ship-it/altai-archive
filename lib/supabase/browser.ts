'use client';

import {createBrowserClient} from '@supabase/ssr';
import {supabasePublishableKey,supabaseUrl,visitorAuthEnabled} from './config';

export function createSupabaseBrowserClient(){
 if(!visitorAuthEnabled()||!supabaseUrl||!supabasePublishableKey)return null;
 return createBrowserClient(supabaseUrl,supabasePublishableKey);
}
