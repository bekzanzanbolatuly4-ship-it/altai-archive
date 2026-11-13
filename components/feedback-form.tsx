'use client';
import {useRef,useState,type FormEvent} from 'react';
import {Star} from 'lucide-react';
import {useApp} from './providers';

type FeedbackType='site_feedback'|'suggestion'|'site_bug';
export function FeedbackForm(){
 const{msg,locale}=useApp();
 const ru=locale==='ru',kk=locale==='kk';
 const[type,setType]=useState<FeedbackType|''>('');
 const[firstName,setFirstName]=useState('');const[lastName,setLastName]=useState('');const[email,setEmail]=useState('');
 const[message,setMessage]=useState('');const[rating,setRating]=useState(0);const[consent,setConsent]=useState(false);const[website,setWebsite]=useState('');
 const[state,setState]=useState<'idle'|'sending'|'success'|'error'|'invalid'>('idle');const[detail,setDetail]=useState('');const busy=useRef(false);
 async function submit(event:FormEvent<HTMLFormElement>){
  event.preventDefault();if(busy.current)return;
  if(!type||message.trim().length<10||message.trim().length>2000||(type==='site_feedback'&&rating<1)){setState('invalid');return;}
  busy.current=true;setState('sending');setDetail('');
  try{
   const response=await fetch('/api/feedback',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({type,firstName:firstName.trim(),lastName:lastName.trim(),email:email.trim()||null,rating:type==='site_feedback'?rating:null,message:message.trim(),feedbackConsent:consent,website}),cache:'no-store'});
   const result=await response.json().catch(()=>null) as {received?:unknown;error?:string}|null;
   if(response.status!==201||result?.received!==true){setState('error');setDetail(errorText(result?.error||'unknown'));return;}
   setMessage('');setType('');setFirstName('');setLastName('');setEmail('');setRating(0);setConsent(false);setState('success');
  }catch{setState('error');setDetail(errorText('unknown'))}finally{busy.current=false}
 }
 function errorText(code:string){
  const dictionary:Record<string,[string,string,string]>={
   feedback_limiter_unavailable:['Защита от спама временно недоступна; отзыв не принят. Попробуйте позже.','Спамнан қорғау уақытша қолжетімсіз; пікір қабылданбады. Кейінірек қайталаңыз.','Spam protection is temporarily unavailable; the feedback was not accepted. Try again later.'],
   feedback_storage_unavailable:['Не удалось сохранить отзыв. Сообщение не отправлено; попробуйте позже.','Пікір сақталмады. Хабар жіберілмеді; кейінірек қайталаңыз.','The feedback could not be saved, so it was not submitted. Try again later.'],
   feedback_rate_limit:['Слишком много отправок. Попробуйте позже.','Жіберілім тым көп. Кейінірек қайталаңыз.','Too many submissions. Try again later.'],
   feedback_consent_required:['Подтвердите согласие на обработку данных.','Деректерді өңдеуге келісімді растаңыз.','Please confirm consent to data processing.'],
   invalid_feedback:['Проверьте имя, контакт и сообщение.','Аты-жөніңізді, байланыс дерегін және хабарламаны тексеріңіз.','Check your name, contact, and message.'],
  };
  return (dictionary[code]||['Не удалось отправить отзыв. Попробуйте позже.','Пікір жіберілмеді. Кейінірек қайталаңыз.','The feedback could not be submitted. Try again later.'])[ru?0:kk?1:2];
 }
 return <form className="feedback-form" onSubmit={submit}>
  <div className="feedback-contact-fields">
   <label className="feedback-field"><span>{msg('feedbackFirstName')} *</span><input required maxLength={40} autoComplete="given-name" value={firstName} disabled={state==='sending'} onChange={e=>{setFirstName(e.target.value);setState('idle')}}/></label>
   <label className="feedback-field"><span>{msg('feedbackLastName')} *</span><input required maxLength={40} autoComplete="family-name" value={lastName} disabled={state==='sending'} onChange={e=>{setLastName(e.target.value);setState('idle')}}/></label>
  </div>
  <label className="feedback-field"><span>{msg('feedbackContactOptional')}</span><input type="email" maxLength={254} autoComplete="email" value={email} disabled={state==='sending'} onChange={e=>{setEmail(e.target.value);setState('idle')}}/></label>
  <label className="feedback-field"><span>{msg('feedbackType')} *</span><select required value={type} disabled={state==='sending'} onChange={e=>{setType(e.target.value as FeedbackType|'');setState('idle')}}><option value="" disabled>{msg('feedbackChooseType')}</option><option value="site_feedback">{msg('feedbackTypeReview')}</option><option value="suggestion">{msg('feedbackTypeSuggestion')}</option><option value="site_bug">{msg('feedbackTypeBug')}</option></select></label>
  {type==='site_feedback'&&<fieldset className="feedback-rating" disabled={state==='sending'}><legend>{msg('feedbackRating')} *</legend><div className="feedback-stars" role="radiogroup" aria-label={msg('feedbackRating')}>
   {[1,2,3,4,5].map(value=><button key={value} id={`feedback-rating-${value}`} type="button" role="radio" aria-checked={rating===value} aria-label={`${value} ${msg('feedbackStars')}`} tabIndex={rating===value||(!rating&&value===1)?0:-1} className={rating>=value?'active':''} onClick={()=>{setRating(value);setState('idle')}} onKeyDown={event=>{if(event.key==='ArrowRight'||event.key==='ArrowUp'||event.key==='ArrowLeft'||event.key==='ArrowDown'){event.preventDefault();const next=Math.max(1,Math.min(5,value+(event.key==='ArrowRight'||event.key==='ArrowUp'?1:-1)));setRating(next);document.getElementById(`feedback-rating-${next}`)?.focus();}}}><Star size={26} aria-hidden="true" fill={rating>=value?'currentColor':'none'}/></button>)}
  </div><small aria-live="polite">{rating?`${rating} / 5`:msg('feedbackRatingRequired')}</small></fieldset>}
  <label className="feedback-field"><span>{msg('feedbackMessage')} *</span><textarea required minLength={10} maxLength={2000} rows={6} value={message} disabled={state==='sending'} onChange={e=>{setMessage(e.target.value);setState('idle')}}/><small className="feedback-count">{message.length} / 2000 {msg('feedbackCharacters')}</small></label>
  <label className="feedback-trap" aria-hidden="true" tabIndex={-1}>Website<input tabIndex={-1} autoComplete="off" value={website} onChange={e=>setWebsite(e.target.value)}/></label>
  <label className="feedback-consent"><input type="checkbox" required checked={consent} disabled={state==='sending'} onChange={e=>{setConsent(e.target.checked);setState('idle')}}/><span>{msg('feedbackConsent')}</span></label>
  <p className="feedback-warning" role="note">{msg('feedbackWarning')}</p>
  {state==='success'&&<p className="feedback-result success" role="status">{msg('feedbackSuccess')}</p>}{state==='error'&&<p className="feedback-result error" role="alert">{detail}</p>}{state==='invalid'&&<p className="feedback-result error" role="alert">{msg('feedbackValidationError')}</p>}
  <button className="feedback-submit" type="submit" disabled={state==='sending'}>{state==='sending'?msg('feedbackSending'):msg('feedbackSubmit')}</button>
 </form>;
}
