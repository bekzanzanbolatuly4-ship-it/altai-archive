'use client';
import {useRef,useState,type FormEvent} from 'react';
import {useApp} from './providers';

type FeedbackType='site_feedback'|'suggestion'|'site_bug';
type FeedbackValues={type:FeedbackType|'';name:string;email:string;message:string;contactConsent:boolean;website:string};
const initialValues:FeedbackValues={type:'',name:'',email:'',message:'',contactConsent:false,website:''};
const emailPattern=/^[^\s@]+@[^\s@]+\.[^\s@]+$/u;

export function FeedbackForm(){
 const{msg}=useApp();
 const[values,setValues]=useState(initialValues);
 const[state,setState]=useState<'idle'|'sending'|'success'|'error'|'invalid'>('idle');
 const busy=useRef(false);
 const hasContact=Boolean(values.name.trim()||values.email.trim());

 function update<K extends keyof FeedbackValues>(key:K,value:FeedbackValues[K]){
  setValues(old=>({...old,[key]:value}));
  setState(old=>old==='sending'?'sending':'idle');
 }

 async function submit(event:FormEvent<HTMLFormElement>){
  event.preventDefault();
  if(busy.current)return;
  if(!values.type||values.name.trim().length>80||(values.email.trim()&&!emailPattern.test(values.email.trim()))||values.message.trim().length<10||values.message.trim().length>2000||(hasContact&&!values.contactConsent)){
   setState('invalid');
   return;
  }
  busy.current=true;
  setState('sending');
  try{
   const response=await fetch('/api/feedback',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(values),cache:'no-store'});
   const result=await response.json().catch(()=>null) as {received?:unknown}|null;
   if(response.status!==201||result?.received!==true)throw new Error('not_saved');
   setValues(initialValues);
   setState('success');
  }catch{
   setState('error');
  }finally{
   busy.current=false;
  }
 }

 return <form className="feedback-form" onSubmit={submit} noValidate>
  <label className="feedback-field">
   <span>{msg('feedbackType')} *</span>
   <select name="type" required value={values.type} disabled={state==='sending'} onChange={event=>update('type',event.target.value as FeedbackType| '')}>
    <option value="" disabled>{msg('feedbackChooseType')}</option>
    <option value="site_feedback">{msg('feedbackTypeReview')}</option>
    <option value="suggestion">{msg('feedbackTypeSuggestion')}</option>
    <option value="site_bug">{msg('feedbackTypeBug')}</option>
   </select>
  </label>
  <div className="feedback-contact-fields">
   <label className="feedback-field">
    <span>{msg('feedbackName')}</span>
    <input name="name" type="text" autoComplete="name" maxLength={80} value={values.name} disabled={state==='sending'} onChange={event=>update('name',event.target.value)}/>
   </label>
   <label className="feedback-field">
    <span>{msg('feedbackEmail')}</span>
    <input name="email" type="email" autoComplete="email" maxLength={254} value={values.email} disabled={state==='sending'} onChange={event=>update('email',event.target.value)}/>
   </label>
  </div>
  <label className="feedback-field">
   <span>{msg('feedbackMessage')} *</span>
   <textarea name="message" required minLength={10} maxLength={2000} rows={6} value={values.message} disabled={state==='sending'} onChange={event=>update('message',event.target.value)}/>
   <small className="feedback-count">{values.message.length} / 2000 {msg('feedbackCharacters')}</small>
  </label>
  {hasContact&&<label className="feedback-consent">
   <input type="checkbox" name="contactConsent" required checked={values.contactConsent} disabled={state==='sending'} onChange={event=>update('contactConsent',event.target.checked)}/>
   <span>{msg('feedbackConsent')} *</span>
  </label>}
  <label className="feedback-honeypot" aria-hidden="true" tabIndex={-1}>
   Website
   <input name="website" value={values.website} tabIndex={-1} autoComplete="off" onChange={event=>update('website',event.target.value)}/>
  </label>
  <p className="feedback-warning" role="note">{msg('feedbackWarning')}</p>
  {state==='success'&&<p className="feedback-result success" role="status">{msg('feedbackSuccess')}</p>}
  {state==='error'&&<p className="feedback-result error" role="alert">{msg('feedbackError')}</p>}
  {state==='invalid'&&<p className="feedback-result error" role="alert">{msg('feedbackValidationError')}</p>}
  <button className="feedback-submit" type="submit" disabled={state==='sending'}>{state==='sending'?msg('feedbackSending'):msg('feedbackSubmit')}</button>
 </form>;
}
