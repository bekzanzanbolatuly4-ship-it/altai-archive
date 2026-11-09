import {revokeSession,sessionCookieName} from '@/lib/archive-auth';
export async function POST(){await revokeSession();return Response.json({ok:true},{headers:{'Set-Cookie':`${sessionCookieName}=; HttpOnly; SameSite=Strict; Path=/; Max-Age=0${process.env.NODE_ENV==='production'?'; Secure':''}`,'Cache-Control':'no-store'}})}
