'use client';

import Link from 'next/link';
import {useEffect,useState} from 'react';
import {useRouter} from 'next/navigation';
import {useApp} from './providers';
import {createSupabaseBrowserClient} from '@/lib/supabase/browser';
import {AuthPage} from './auth-page';

type Profile={email:string;name:string;emailConfirmed:boolean;accountStatus:'active'|'suspended'|'unconfirmed';role:string;createdAt:string;staffSince:string|null;consentAt:string|null;consentVersion:string|null};
export function AccountProfile(){
 const{locale,msg}=useApp();
 const router=useRouter();
 const[profile,setProfile]=useState<Profile|null>(null);
 const[loading,setLoading]=useState(true);
 const[error,setError]=useState(false);
 const t=(ru:string,kk:string,en:string)=>locale==='ru'?ru:locale==='kk'?kk:en;
 const roleLabels:Record<string,[string,string,string]>={
  PUBLIC_USER:['Посетитель','Келуші','Visitor'],SUPERADMIN:['Главный администратор','Бас әкімші','Super administrator'],SITE_ADMIN:['Администратор сайта','Сайт әкімшісі','Site administrator'],ARCHIVE_EMPLOYEE:['Сотрудник архива','Архив қызметкері','Archive employee'],EDITOR:['Редактор','Редактор','Editor'],BRANCH_ADMIN:['Администратор филиала','Филиал әкімшісі','Branch administrator'],MODERATOR:['Модератор','Модератор','Moderator'],ANALYST:['Аналитик','Сарапшы','Analyst']
 };
 async function load(){
  setLoading(true);setError(false);
  try{
   const response=await fetch('/api/account/profile',{cache:'no-store'});
   const result=await response.json().catch(()=>({}));
   if(!response.ok)throw new Error('profile_unavailable');
   setProfile(result.profile||null);
  }catch{setError(true)}finally{setLoading(false)}
 }
 useEffect(()=>{void load()},[]);
 async function logout(){
  const auth=createSupabaseBrowserClient();
  if(auth)await auth.auth.signOut();
  await fetch('/api/auth/logout',{method:'POST'}).catch(()=>{});
  setProfile(null);router.push('/');router.refresh();
 }
 if(loading)return <section className="feedback-section account-page"><div className="section-heading"><h1>{msg('profileTitle')}</h1><p>{msg('profileLoading')}</p></div></section>;
 if(error)return <section className="feedback-section account-page"><div className="section-heading"><h1>{msg('profileTitle')}</h1><p role="alert">{msg('profileError')}</p><button className="outline-link" type="button" onClick={()=>void load()}>{t('Повторить','Қайталау','Try again')}</button></div></section>;
 if(!profile)return <AuthPage mode="login"/>;
 const role=roleLabels[profile.role]||roleLabels.PUBLIC_USER;
 const formatDate=(value:string|null)=>value?new Intl.DateTimeFormat(locale==='kk'?'kk-KZ':locale==='en'?'en-GB':'ru-RU',{dateStyle:'long'}).format(new Date(value)):t('Не указано','Көрсетілмеген','Not provided');
 const detail=(label:string,value:string)=><div className="account-profile-detail" key={label}><dt>{label}</dt><dd>{value}</dd></div>;
 return <section className="feedback-section account-page">
  <div className="section-heading"><span className="eyebrow">{t('ЛИЧНЫЙ КАБИНЕТ','ЖЕКЕ КАБИНЕТ','ACCOUNT')}</span><h1>{msg('profileTitle')}</h1><p>{msg('profileDescription')}</p></div>
  <div className="account-profile-card">
   <div className="account-profile-heading"><div><span className="account-profile-name">{profile.name||profile.email.split('@')[0]}</span><span className={`account-profile-status ${profile.accountStatus==='active'?'is-active':'is-suspended'}`}>{profile.accountStatus==='active'?msg('profileActive'):profile.accountStatus==='unconfirmed'?msg('profileUnconfirmed'):msg('profileSuspended')}</span></div><span className="account-profile-role">{t(...role)}</span></div>
   <dl className="account-profile-details">
    {detail(msg('profileName'),profile.name||t('Не указано','Көрсетілмеген','Not provided'))}
    {detail(msg('profileEmail'),profile.email)}
    {detail(msg('profileStatus'),profile.emailConfirmed?msg('profileConfirmed'):msg('profileUnconfirmed'))}
    {detail(msg('profileRole'),t(...role))}
    {detail(msg('profileCreated'),formatDate(profile.createdAt))}
    {profile.staffSince&&detail(t('Доступ сотрудника с','Қызметкер рөлі берілген күн','Staff access granted'),formatDate(profile.staffSince))}
    {detail(msg('profileConsentDate'),formatDate(profile.consentAt))}
   </dl>
   <div className="account-profile-actions"><Link className="outline-link" href="/forgot-password">{msg('profilePassword')}</Link><Link className="outline-link" href="/about#feedback">{msg('profileMyFeedback')}</Link><Link className="account-profile-policy" href="/privacy">{msg('profilePrivacy')}</Link><button className="text-button" type="button" onClick={()=>void logout()}>{t('Выйти','Шығу','Sign out')}</button></div>
  </div>
 </section>;
}
