import {createHmac,randomBytes,randomUUID,scrypt as scryptCb,timingSafeEqual} from 'node:crypto';
import {promisify} from 'node:util';
import {cookies} from 'next/headers';
import {appendAudit,readStore,updateStore,type StaffRole,type StaffUser} from './archive-store';
import {createSupabaseServerClient} from './supabase/server';

const scrypt=promisify(scryptCb);
const cookieName='altai_session';
const ttlMs=8*60*60*1000;
const DUMMY_HASH='0123456789abcdef0123456789abcdef:0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef';

export type SafeUser=Omit<StaffUser,'passwordHash'>;

export function safeUser(user:StaffUser):SafeUser{
 return {
  id:user.id,
  email:user.email,
  name:user.name,
  role:user.role,
  disabled:user.disabled,
  createdAt:user.createdAt
 };
}

export const roles:StaffRole[]=['SUPERADMIN','SITE_ADMIN','ARCHIVE_EMPLOYEE','EDITOR','BRANCH_ADMIN','MODERATOR','ANALYST'];

export function can(user:SafeUser,permission:'read'|'upload'|'edit'|'publish'|'accounts'|'audit'){
 const matrix:Record<StaffRole,string[]>={
  SUPERADMIN:['read','upload','edit','publish','accounts','audit'],
  SITE_ADMIN:['read','upload','edit','publish','audit'],
  ARCHIVE_EMPLOYEE:['read','upload','edit'],
  EDITOR:['read','edit','publish'],
  BRANCH_ADMIN:['read','upload','edit'],
  MODERATOR:['read','edit'],
  ANALYST:['read','audit']
 };
 return Boolean(matrix[user.role]?.includes(permission));
}

export async function hashPassword(password:string){
 const salt=randomBytes(16);
 const key=await scrypt(password,salt,64) as Buffer;
 return `${salt.toString('hex')}:${key.toString('hex')}`;
}

export async function verifyPassword(password:string,stored?:string|null){
 try{
  const target=stored||DUMMY_HASH;
  const [salt,key]=target.split(':');
  if(!salt||!key)return false;
  const actual=await scrypt(password,Buffer.from(salt,'hex'),64) as Buffer;
  const expected=Buffer.from(key,'hex');
  if(actual.length!==expected.length)return false;
  const match=timingSafeEqual(actual,expected);
  return Boolean(stored&&match);
 }catch{
  return false;
 }
}

export async function ensureOwner(){
 const email=process.env.ARCHIVE_OWNER_EMAIL,password=process.env.ARCHIVE_OWNER_PASSWORD;
 if(!email||!password||!process.env.SESSION_SECRET){
  throw new Error('Owner and session environment variables are required');
 }
 const store=await readStore();
 if(store.users.some(u=>u.role==='SUPERADMIN'))return;
 await updateStore(async s=>{
  if(!s.users.some(u=>u.role==='SUPERADMIN')){
   s.users.push({
    id:'owner',
    email:email.toLowerCase().trim(),
    name:'Archive owner',
    role:'SUPERADMIN',
    passwordHash:await hashPassword(password),
    disabled:false,
    createdAt:new Date().toISOString()
   });
  }
 });
}

function sign(value:string){
 const secret=process.env.SESSION_SECRET;
 if(!secret||secret.length<32)throw new Error('SESSION_SECRET must contain at least 32 characters');
 return createHmac('sha256',secret).update(value).digest('base64url');
}

export async function issueSession(userId:string,actor?:string){
 const id=randomUUID();
 const expiresAt=Date.now()+ttlMs;
 const value=`${id}.${expiresAt}`;
 const cookie=`${value}.${sign(value)}`;
 await updateStore(s=>{
  s.sessions=s.sessions.filter(sess=>sess.expiresAt>Date.now());
  s.sessions.push({id,userId,expiresAt});
  if(actor)appendAudit(s,actor,'auth.login',userId);
 });
 return {cookie,expiresAt};
}

export async function currentUser():Promise<SafeUser|null>{
 const cookieJar=await cookies();
 const hasVisitorAuthCookie=cookieJar.getAll().some(({name})=>/^sb-.+-auth-token(?:\.\d+)?$/u.test(name));
 if(hasVisitorAuthCookie){
  const auth=await createSupabaseServerClient();
  if(!auth)return null;
  try{
   const{data:{user},error}=await auth.auth.getUser();
   // The current legacy employee session is not a staff grant. A valid visitor
   // Supabase session must never inherit a separate stale .data staff cookie.
   if(error||user)return null;
  }catch{return null;}
 }
 const token=cookieJar.get(cookieName)?.value;
 if(!token)return null;
 const [id,expiry,sig,...extra]=token.split('.');
 if(!id||!expiry||!sig||extra.length||Number(expiry)<Date.now())return null;
 const value=`${id}.${expiry}`;
 const expected=Buffer.from(sign(value));
 const actual=Buffer.from(sig);
 if(actual.length!==expected.length||!timingSafeEqual(actual,expected))return null;
 const store=await readStore();
 const session=store.sessions.find(s=>s.id===id&&s.expiresAt===Number(expiry)&&s.expiresAt>Date.now());
 const user=store.users.find(u=>u.id===session?.userId&&!u.disabled);
 if(!user)return null;
 return safeUser(user);
}

export async function requireUser(permission:'read'|'upload'|'edit'|'publish'|'accounts'|'audit'){
 const user=await currentUser();
 if(!user)return {user:null,response:Response.json({error:'Authentication required'},{status:401})};
 if(!can(user,permission))return {user:null,response:Response.json({error:'Insufficient permission'},{status:403})};
 return {user,response:null};
}

export async function revokeSession(){
 const token=(await cookies()).get(cookieName)?.value;
 const id=token?.split('.')[0];
 if(id){
  await updateStore(s=>{
   const session=s.sessions.find(x=>x.id===id);
   const user=s.users.find(x=>x.id===session?.userId);
   s.sessions=s.sessions.filter(x=>x.id!==id&&x.expiresAt>Date.now());
   if(session&&user)appendAudit(s,user.email,'auth.logout',user.id);
  });
 }
}

export const sessionCookieName=cookieName;
