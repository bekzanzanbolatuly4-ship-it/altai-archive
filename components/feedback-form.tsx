'use client';
import Link from 'next/link';
import {useCallback,useEffect,useRef,useState,type FormEvent} from 'react';
import {useApp} from './providers';
import {Turnstile} from './turnstile';

type FeedbackType='site_feedback'|'suggestion'|'site_bug';
type Visitor={name:string;email:string;confirmed:boolean};
export function FeedbackForm(){
 const{msg,locale,dark}=useApp();
 const ru=locale==='ru',kk=locale==='kk';
 const t=(r:string,k:string,e:string)=>ru?r:kk?k:e;
 const[visitor,setVisitor]=useState<Visitor|null>(null);const[checked,setChecked]=useState(false);
 const[type,setType]=useState<FeedbackType|''>('');const[message,setMessage]=useState('');const[token,setToken]=useState('');
 const[consent,setConsent]=useState(false);
 const[resetKey,setResetKey]=useState(0);
 const[state,setState]=useState<'idle'|'sending'|'success'|'error'|'invalid'>('idle');const[detail,setDetail]=useState('');const busy=useRef(false);
 const loadVisitor=useCallback(()=>{fetch('/api/visitor/me',{cache:'no-store'}).then(async r=>r.ok?(await r.json()).user as Visitor|null:null).then(user=>{setVisitor(user);setChecked(true)}).catch(()=>{setVisitor(null);setChecked(true)})},[]);
 useEffect(()=>{loadVisitor();const timer=window.setInterval(loadVisitor,60000);return()=>window.clearInterval(timer)},[loadVisitor]);
 async function submit(event:FormEvent<HTMLFormElement>){
  event.preventDefault();if(busy.current)return;
  if(!type||message.trim().length<10||message.trim().length>2000||!token){setState('invalid');return;}
  busy.current=true;setState('sending');setDetail('');
  try{
   const response=await fetch('/api/feedback',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({type,message:message.trim(),captchaToken:token,feedbackConsent:consent}),cache:'no-store'});
   const result=await response.json().catch(()=>null) as {received?:unknown;error?:string}|null;
   if(response.status!==201||result?.received!==true){setState('error');setDetail(errorText(result?.error||'unknown'));return;}
   setMessage('');setType('');setConsent(false);setState('success');
  }catch{setState('error');setDetail(errorText('unknown'))}finally{busy.current=false;setToken('');setResetKey(x=>x+1)}
 }
 function errorText(code:string){
  const dictionary:Record<string,[string,string,string]>={
   sign_in_required:['Войдите в аккаунт, чтобы отправить отзыв.','Пікір жіберу үшін аккаунтқа кіріңіз.','Sign in to submit feedback.'],
   email_confirmation_required:['Сначала подтвердите email.','Алдымен email мекенжайын растаңыз.','Confirm your email first.'],
   captcha_failed:['CAPTCHA не пройдена или её токен истёк. Повторите проверку.','CAPTCHA тексеруі өтпеді немесе токен мерзімі аяқталды. Қайталаңыз.','CAPTCHA failed or expired. Please try again.'],
   captcha_unavailable:['Проверка CAPTCHA не настроена на сервере.','Серверде CAPTCHA бапталмаған.','Server CAPTCHA is not configured.'],
   feedback_limiter_unavailable:['Сервис ограничения запросов недоступен; отзыв не принят.','Сұрау жиілігін шектеу қызметі қолжетімсіз; пікір қабылданбады.','Rate limiting is unavailable; the feedback was not accepted.'],
   auth_unavailable:['Авторизация не настроена.','Авторизация бапталмаған.','Authentication is not configured.'],
   profile_unavailable:['Профиль недоступен. Обратитесь к администратору сайта.','Профиль қолжетімсіз. Сайт әкімшісіне хабарласыңыз.','Profile unavailable. Contact the site administrator.'],
   feedback_storage_unavailable:['Хранилище не подтвердило сохранение. Сообщение не принято.','Қойма сақтауды растаған жоқ. Хабар қабылданбады.','Storage did not confirm saving. The message was not accepted.'],
   feedback_rate_limit:['Слишком много запросов. Попробуйте позже.','Сұрау тым көп. Кейінірек қайталаңыз.','Too many requests. Try again later.']
  };
  return (dictionary[code]||['Не удалось подтвердить отправку. Попробуйте позже.','Жіберуді растау мүмкін болмады. Кейінірек қайталаңыз.','Submission could not be confirmed. Try again later.'])[locale==='ru'?0:locale==='kk'?1:2];
 }
 if(!checked)return <p role="status">{t('Проверяем аккаунт…','Аккаунт тексерілуде…','Checking account…')}</p>;
 if(!visitor)return <div className="feedback-auth-required"><p>{t('Войдите или зарегистрируйтесь, чтобы оставить отзыв.','Пікір қалдыру үшін кіріңіз немесе тіркеліңіз.','Sign in or register to leave feedback.')}</p><Link className="feedback-submit" href="/account">{t('Войти или зарегистрироваться','Кіру немесе тіркелу','Sign in or register')}</Link></div>;
 if(!visitor.confirmed)return <div className="feedback-auth-required"><p>{t('Подтвердите email из письма, чтобы оставить отзыв.','Пікір қалдыру үшін хаттағы email мекенжайын растаңыз.','Confirm your email using the message we sent before leaving feedback.')}</p><Link href="/account">{t('Перейти к аккаунту','Аккаунтқа өту','Open account')}</Link></div>;
 return <form className="feedback-form" onSubmit={submit}>
  <div className="feedback-contact-fields"><label className="feedback-field"><span>{msg('feedbackName')}</span><input value={visitor.name} readOnly aria-readonly="true"/></label><label className="feedback-field"><span>{msg('feedbackEmail')}</span><input value={visitor.email} readOnly aria-readonly="true"/></label></div>
  <label className="feedback-field"><span>{msg('feedbackType')} *</span><select required value={type} disabled={state==='sending'} onChange={e=>{setType(e.target.value as FeedbackType|'');setState('idle')}}><option value="" disabled>{msg('feedbackChooseType')}</option><option value="site_feedback">{msg('feedbackTypeReview')}</option><option value="suggestion">{msg('feedbackTypeSuggestion')}</option><option value="site_bug">{msg('feedbackTypeBug')}</option></select></label>
  <label className="feedback-field"><span>{msg('feedbackMessage')} *</span><textarea required minLength={10} maxLength={2000} rows={6} value={message} disabled={state==='sending'} onChange={e=>{setMessage(e.target.value);setState('idle')}}/><small className="feedback-count">{message.length} / 2000 {msg('feedbackCharacters')}</small></label>
  <label className="feedback-consent"><input type="checkbox" required checked={consent} disabled={state==='sending'} onChange={e=>{setConsent(e.target.checked);setState('idle')}}/><span>{t('Согласен(на) на обработку имени и подтверждённого email вместе с текстом отзыва для его рассмотрения.','Пікірді қарастыру үшін аты-жөнім, расталған email және пікір мәтінін өңдеуге келісемін.','I consent to processing my name, confirmed email, and feedback text to review this submission.')}</span></label>
  <Turnstile theme={dark?'dark':'light'} onToken={setToken} resetKey={resetKey}/><p className="feedback-warning" role="note">{msg('feedbackWarning')}</p>
  {state==='success'&&<p className="feedback-result success" role="status">{msg('feedbackSuccess')}</p>}{state==='error'&&<p className="feedback-result error" role="alert">{detail}</p>}{state==='invalid'&&<p className="feedback-result error" role="alert">{msg('feedbackValidationError')}</p>}
  <button className="feedback-submit" type="submit" disabled={state==='sending'||!token}>{state==='sending'?msg('feedbackSending'):msg('feedbackSubmit')}</button>
 </form>;
}
