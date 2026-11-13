'use client';

import Link from 'next/link';
import {useEffect,useMemo,useState,type FormEvent} from 'react';
import {useRouter} from 'next/navigation';
import {useApp} from './providers';
import {createSupabaseBrowserClient} from '@/lib/supabase/browser';
import {validateRegistrationInput} from '@/lib/visitor-auth-validation';

type Mode='login'|'register'|'reset'|'update';
export function AccountForm({initialMode='login'}:{initialMode?:Mode}){
 const{locale}=useApp();const ru=locale==='ru',kk=locale==='kk';const t=(r:string,k:string,e:string)=>ru?r:kk?k:e;
 const router=useRouter();
 const[mode,setMode]=useState<Mode>(initialMode),[name,setName]=useState(''),[email,setEmail]=useState(''),[password,setPassword]=useState(''),[confirm,setConfirm]=useState(''),[consent,setConsent]=useState(false),[status,setStatus]=useState(''),[busy,setBusy]=useState(false);
 const supabase=useMemo(()=>createSupabaseBrowserClient(),[]);
 useEffect(()=>{if(!supabase)return;const{data:{subscription}}=supabase.auth.onAuthStateChange(event=>{if(event==='PASSWORD_RECOVERY')setMode('update')});return()=>subscription.unsubscribe()},[supabase]);
 async function submit(event:FormEvent<HTMLFormElement>){
  event.preventDefault();setStatus('');
  if(!supabase){setStatus(t('Авторизация временно недоступна: настройки Supabase отсутствуют.','Supabase параметрлері жоқ.','Authentication is unavailable: Supabase configuration is missing.'));return;}
  const cleanEmail=email.trim().toLowerCase();
  if(mode==='register'){
   const issue=validateRegistrationInput({name,email,password,confirmPassword:confirm,consent});
   if(issue){setStatus(issue==='invalid_email'?t('Введите корректный email.','Дұрыс email енгізіңіз.','Enter a valid email.'):t('Проверьте имя, пароль (не менее 12 символов), подтверждение и согласие.','Аты-жөнін, кемінде 12 таңбалы құпиясөзді, растауды және келісімді тексеріңіз.','Check the name, password (at least 12 characters), confirmation and consent.'));return;}
  }
  if(mode==='update'&&(password.length<12||password!==confirm)){setStatus(t('Новый пароль должен содержать не менее 12 символов, а подтверждение должно совпадать.','Жаңа құпиясөз кемінде 12 таңбадан тұруы және растаумен сәйкес келуі керек.','New password must be at least 12 characters and match confirmation.'));return;}
  if((mode==='register'||mode==='update')&&(password.length<12||password!==confirm)){setStatus(t('Пароли должны совпадать и содержать не менее 12 символов.','Құпиясөздер бірдей және кемінде 12 таңбалы болуы керек.','Passwords must match and contain at least 12 characters.'));return;}
  setBusy(true);
  try{
   if(mode==='register'){
    const{error}=await supabase.auth.signUp({email:cleanEmail,password,options:{emailRedirectTo:`${location.origin}/auth/callback?next=/about`,data:{display_name:name.trim(),consent_version:'visitor-privacy-v1',terms_accepted_at:new Date().toISOString()}}});if(error)throw error;await fetch('/api/auth/logout',{method:'POST'}).catch(()=>{});
    setStatus(t('Проверьте почту и подтвердите адрес, чтобы завершить регистрацию.','Тіркелуді аяқтау үшін поштаңызды тексеріп, мекенжайды растаңыз.','Check your email and confirm the address to finish registration.'));
   }else if(mode==='login'){
    const{error}=await supabase.auth.signInWithPassword({email:cleanEmail,password});if(error)throw error;await fetch('/api/auth/logout',{method:'POST'}).catch(()=>{});router.push('/about#feedback');router.refresh();
   }else if(mode==='reset'){
    const{error}=await supabase.auth.resetPasswordForEmail(cleanEmail,{redirectTo:`${location.origin}/auth/callback?next=/reset-password`});if(error)throw error;
    setStatus(t('Если для адреса существует аккаунт, письмо для восстановления отправлено.','Бұл мекенжайға аккаунт тіркелген болса, қалпына келтіру хаты жіберілді.','If an account exists for this address, a recovery email has been sent.'));
   }else{
    const{error}=await supabase.auth.updateUser({password});if(error)throw error;await supabase.auth.signOut({scope:'others'});setStatus(t('Пароль изменён. Войдите с новым паролем.','Құпиясөз өзгертілді. Жаңа құпиясөзбен кіріңіз.','Password changed. Sign in with the new password.'));setMode('login');setPassword('');setConfirm('');
   }
  }catch(error){setStatus(error instanceof Error?friendly(error.message,locale):t('Запрос не выполнен. Проверьте данные и настройки сервиса.','Сұрау орындалмады. Деректер мен қызмет параметрлерін тексеріңіз.','Request failed. Check the details and service configuration.'));}
  finally{setBusy(false)}
 }
 const tab=(item:Mode,label:string)=><Link key={item} aria-current={mode===item?'page':undefined} href={item==='login'?'/login':item==='register'?'/register':'/forgot-password'}>{label}</Link>;
 return <form className="feedback-form account-form" onSubmit={submit}>
  {mode!=='update'&&<nav className="account-mode">{tab('login',t('Вход','Кіру','Sign in'))}{tab('register',t('Регистрация','Тіркелу','Create account'))}{tab('reset',t('Восстановить пароль','Құпиясөзді қалпына келтіру','Reset password'))}</nav>}
  {mode==='update'&&<h2>{t('Задайте новый пароль','Жаңа құпиясөз орнатыңыз','Set a new password')}</h2>}
  {mode==='register'&&<label className="feedback-field"><span>{t('Имя','Аты','Name')} *</span><input required maxLength={80} autoComplete="name" value={name} onChange={e=>setName(e.target.value)}/></label>}
  {mode!=='update'&&<label className="feedback-field"><span>Email *</span><input type="email" required maxLength={254} autoComplete="email" value={email} onChange={e=>setEmail(e.target.value)}/></label>}
  {mode!=='reset'&&<label className="feedback-field"><span>{t('Пароль','Құпиясөз','Password')} *</span><input type="password" required minLength={mode==='login'?1:12} autoComplete={mode==='login'?'current-password':'new-password'} value={password} onChange={e=>setPassword(e.target.value)}/>{mode!=='login'&&<small>{t('Не менее 12 символов.','Кемінде 12 таңба.','At least 12 characters.')}</small>}</label>}
  {(mode==='register'||mode==='update')&&<label className="feedback-field"><span>{t('Подтверждение пароля','Құпиясөзді растау','Confirm password')} *</span><input type="password" required minLength={12} autoComplete="new-password" value={confirm} onChange={e=>setConfirm(e.target.value)}/></label>}
  {mode==='register'&&<><p className="account-privacy">{t('Для аккаунта сохраняются имя и дата согласия; Supabase Auth хранит email и пароль. Отзыв о сайте можно отдельно разрешить к публикации; он появится только после ручного одобрения. Email и фамилия не публикуются, предложения и сообщения об ошибках остаются закрытыми. Форма не принимает официальные обращения.','Аккаунт үшін аты-жөні мен келісім күні сақталады; Supabase Auth email мен құпиясөзді сақтайды. Сайт туралы пікірді бөлек жариялауға келісуге болады; ол тек қолмен мақұлданғаннан кейін көрсетіледі. Email мен тегі жарияланбайды, ұсыныстар мен қате туралы хабарламалар жабық қалады. Форма ресми өтініштерді қабылдамайды.','The account stores your name and consent time; Supabase Auth stores your email and password. You may separately opt in to publishing a website review; it appears only after manual approval. Email and surname are never displayed, and suggestions and bug reports stay private. This form does not accept official requests.')}</p><label className="feedback-consent"><input type="checkbox" checked={consent} required onChange={e=>setConsent(e.target.checked)}/><span>{t('Согласен(на) на обработку имени и email для создания аккаунта и связи отзывов с моим аккаунтом.','Аккаунт жасау үшін аты-жөнім мен email мекенжайымды өңдеуге және пікірлерді аккаунтыма байланыстыруға келісемін.','I consent to processing my name and email to create an account and associate feedback with it.')}</span></label></>}
  {status&&<p role="status" className="feedback-result">{status}</p>}
  <button className="feedback-submit" disabled={busy} type="submit">{busy?t('Выполняется…','Орындалуда…','Working…'):mode==='login'?t('Войти','Кіру','Sign in'):mode==='register'?t('Зарегистрироваться','Тіркелу','Register'):mode==='update'?t('Изменить пароль','Құпиясөзді өзгерту','Change password'):t('Отправить ссылку','Сілтемені жіберу','Send recovery link')}</button>
  {mode==='register'&&<small>{t('Публичные разделы сайта доступны без регистрации.','Сайттың ашық бөлімдерін тіркелмей пайдалануға болады.','Public sections are available without an account.')}</small>}
  <p><Link href="/">{t('Вернуться на сайт','Сайтқа оралу','Return to site')}</Link></p>
 </form>;
}
function friendly(message:string,locale:'ru'|'kk'|'en'){
 const ru=locale==='ru',kk=locale==='kk';
 if(/already registered|user already registered/i.test(message))return ru?'Этот email уже зарегистрирован.':kk?'Бұл email тіркелген.':'This email is already registered.';
 if(/invalid login credentials/i.test(message))return ru?'Неверный email или пароль.':kk?'Email немесе құпиясөз қате.':'Email or password is incorrect.';
 if(/password/i.test(message))return ru?'Пароль не соответствует требованиям сервиса.':kk?'Құпиясөз қызмет талаптарына сәйкес емес.':'Password does not meet the service requirements.';
 return ru?'Запрос отклонён сервисом авторизации.':kk?'Авторизация қызметі сұрауды қабылдамады.':'The authentication service rejected the request.';
}
