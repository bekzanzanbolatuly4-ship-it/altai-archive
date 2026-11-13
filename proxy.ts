import {createServerClient} from '@supabase/ssr';
import {NextResponse,type NextRequest} from 'next/server';
import {supabasePublishableKey,supabaseUrl} from './lib/supabase/config';

export async function proxy(request:NextRequest){
 if(process.env.VERCEL!=='1'&&process.env.VISITOR_AUTH_ENABLED!=='true')return NextResponse.next({request});
 const url=process.env.NEXT_PUBLIC_SUPABASE_URL||supabaseUrl;
 const key=process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY||supabasePublishableKey;
 if(!url||!key)return NextResponse.next({request});
 let response=NextResponse.next({request});
 const supabase=createServerClient(url,key,{cookies:{
  getAll:()=>request.cookies.getAll(),
  setAll(values){
   values.forEach(({name,value})=>request.cookies.set(name,value));
   response=NextResponse.next({request});
   values.forEach(({name,value,options})=>response.cookies.set(name,value,options));
  }
 }});
 try{await supabase.auth.getUser();}catch{/* Authentication remains fail-closed in protected APIs if the provider is unavailable. */}
 return response;
}

export const config={matcher:['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)']};
