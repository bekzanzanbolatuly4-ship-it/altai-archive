import {NextResponse,type NextRequest} from 'next/server';
import {createSupabaseServerClient} from '@/lib/supabase/server';
import {getPublicSiteUrl} from '@/lib/site-url';

export async function GET(request:NextRequest){
 const supabase=await createSupabaseServerClient();
 if(!supabase)return NextResponse.redirect(new URL('/account?error=auth_unavailable',getPublicSiteUrl()));
 const code=request.nextUrl.searchParams.get('code');
 const next=request.nextUrl.searchParams.get('next')||'/account';
 const safeNext=next.startsWith('/')&&!next.startsWith('//')?next:'/account';
 if(code){const{error}=await supabase.auth.exchangeCodeForSession(code);if(!error)return NextResponse.redirect(new URL(safeNext,getPublicSiteUrl()));}
 return NextResponse.redirect(new URL('/account?error=confirmation_failed',getPublicSiteUrl()));
}
