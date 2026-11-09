import {ensureOwner,issueSession,safeUser,sessionCookieName,verifyPassword} from '@/lib/archive-auth';
import {readStore} from '@/lib/archive-store';
const attempts=new Map<string,{n:number;until:number}>();
export async function POST(request:Request){
 const ip=request.headers.get('x-forwarded-for')?.split(',')[0]||'local';const prev=attempts.get(ip);if(prev&&prev.n>=8&&prev.until>Date.now())return Response.json({error:'Try again later'},{status:429});
 try{await ensureOwner();const body=await request.json();const email=String(body.email||'').trim().toLowerCase();const password=String(body.password||'');const store=await readStore();const user=store.users.find(x=>x.email===email&&!x.disabled);if(!user||!(await verifyPassword(password,user.passwordHash))){attempts.set(ip,{n:(prev?.n||0)+1,until:Date.now()+15*60_000});return Response.json({error:'Invalid email or password'},{status:401})}attempts.delete(ip);const session=await issueSession(user.id);return Response.json({user:safeUser(user)},{headers:{'Set-Cookie':`${sessionCookieName}=${session.cookie}; HttpOnly; SameSite=Strict; Path=/; Max-Age=28800${process.env.NODE_ENV==='production'?'; Secure':''}`,'Cache-Control':'no-store'}})}catch(e){return Response.json({error:e instanceof Error?e.message:'Login unavailable'},{status:500})}
}
