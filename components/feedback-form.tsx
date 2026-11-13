'use client';
import Link from 'next/link';
import {useEffect,useRef,useState,type FormEvent} from 'react';
import {Star} from 'lucide-react';
import {useApp} from './providers';

type FeedbackType='site_feedback'|'suggestion'|'site_bug';
type VisitorState='loading'|'guest'|'unconfirmed'|'unavailable'|'authenticated';
export function FeedbackForm(){
 const{msg}=useApp();
 const[type,setType]=useState<FeedbackType|''>('');
 const[message,setMessage]=useState('');const[rating,setRating]=useState(0);const[consent,setConsent]=useState(false);const[publicConsent,setPublicConsent]=useState(false);const[website,setWebsite]=useState('');
 const[state,setState]=useState<'idle'|'sending'|'success'|'error'|'invalid'>('idle');const[detail,setDetail]=useState('');const[publicationStatus,setPublicationStatus]=useState<'pending'|'private'|null>(null);const busy=useRef(false);
 const[visitor,setVisitor]=useState<{state:VisitorState;name?:string;email?:string}>({state:'loading'});
 useEffect(()=>{
  let active=true;
  fetch('/api/visitor/me',{cache:'no-store'}).then(async response=>{
   const result=await response.json().catch(()=>null) as {user?:{name?:string;email?:string;confirmed?:boolean}|null}|null;
   if(!active)return;
   if(response.status===503||!result){setVisitor({state:'unavailable'});return;}
   if(!result.user){setVisitor({state:'guest'});return;}
   if(result.user.confirmed!==true){setVisitor({state:'unconfirmed',email:result.user.email});return;}
   if(!result.user.name||!result.user.email){setVisitor({state:'unavailable'});return;}
   setVisitor({state:'authenticated',name:result.user.name,email:result.user.email});
  }).catch(()=>{if(active)setVisitor({state:'unavailable'});});
  return()=>{active=false;};
 },[]);
 async function submit(event:FormEvent<HTMLFormElement>){
  event.preventDefault();if(busy.current)return;
  if(visitor.state!=='authenticated'){setState('error');setDetail(msg('feedbackErrorAuth'));return;}
  if(!type||message.trim().length<10||message.trim().length>2000||(type==='site_feedback'&&rating<1)){setState('invalid');return;}
  busy.current=true;setState('sending');setDetail('');
  try{
   const response=await fetch('/api/feedback',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({type,rating:type==='site_feedback'?rating:null,message:message.trim(),feedbackConsent:consent,publicConsent:type==='site_feedback'&&publicConsent,website}),cache:'no-store'});
   const result=await response.json().catch(()=>null) as {received?:unknown;error?:string;publicationStatus?:'pending'|'private'}|null;
   if(response.status!==201||result?.received!==true){setState('error');setDetail(errorText(result?.error||'unknown'));return;}
   setPublicationStatus(result.publicationStatus==='pending'?'pending':'private');setMessage('');setType('');setRating(0);setConsent(false);setPublicConsent(false);setState('success');
  }catch{setState('error');setDetail(errorText('unknown'))}finally{busy.current=false}
 }
 function errorText(code:string){
  const dictionary:Record<string,Parameters<typeof msg>[0]>={
   feedback_limiter_unavailable:'feedbackErrorLimiter',feedback_storage_unavailable:'feedbackErrorStorage',feedback_auth_required:'feedbackErrorAuth',feedback_email_unconfirmed:'feedbackErrorEmail',feedback_profile_unavailable:'feedbackErrorProfile',feedback_rate_limit:'feedbackErrorRate',feedback_consent_required:'feedbackErrorConsent',invalid_feedback:'feedbackErrorInvalid',
  };
  return msg(dictionary[code]||'feedbackError');
 }
 if(visitor.state==='loading')return <p className="feedback-result" role="status">{msg('feedbackAuthChecking')}</p>;
 if(visitor.state==='guest')return <div className="feedback-auth-prompt"><p>{msg('feedbackAuthPrompt')}</p><div><Link className="outline-link" href="/login">{msg('feedbackSignIn')}</Link><Link className="outline-link" href="/register">{msg('feedbackRegister')}</Link></div></div>;
 if(visitor.state==='unconfirmed')return <p className="feedback-result" role="status">{msg('feedbackConfirmEmail')}</p>;
 if(visitor.state==='unavailable')return <p className="feedback-result error" role="alert">{msg('feedbackAuthUnavailable')}</p>;
 return <form className="feedback-form" onSubmit={submit}>
  <p className="feedback-account-identity">{msg('feedbackName')}: <b>{visitor.name}</b><br/>{msg('feedbackEmail')}: <b>{visitor.email}</b></p>
  <label className="feedback-field"><span>{msg('feedbackType')} *</span><select required value={type} disabled={state==='sending'} onChange={e=>{setType(e.target.value as FeedbackType|'');setState('idle')}}><option value="" disabled>{msg('feedbackChooseType')}</option><option value="site_feedback">{msg('feedbackTypeReview')}</option><option value="suggestion">{msg('feedbackTypeSuggestion')}</option><option value="site_bug">{msg('feedbackTypeBug')}</option></select></label>
  {type==='site_feedback'&&<fieldset className="feedback-rating" disabled={state==='sending'}><legend>{msg('feedbackRating')} *</legend><div className="feedback-stars" role="radiogroup" aria-label={msg('feedbackRating')}>
   {[1,2,3,4,5].map(value=><button key={value} id={`feedback-rating-${value}`} type="button" role="radio" aria-checked={rating===value} aria-label={`${value} ${msg('feedbackStars')}`} tabIndex={rating===value||(!rating&&value===1)?0:-1} className={rating>=value?'active':''} onClick={()=>{setRating(value);setState('idle')}} onKeyDown={event=>{if(event.key==='ArrowRight'||event.key==='ArrowUp'||event.key==='ArrowLeft'||event.key==='ArrowDown'){event.preventDefault();const next=Math.max(1,Math.min(5,value+(event.key==='ArrowRight'||event.key==='ArrowUp'?1:-1)));setRating(next);document.getElementById(`feedback-rating-${next}`)?.focus();}}}><Star size={26} aria-hidden="true" fill={rating>=value?'currentColor':'none'}/></button>)}
  </div><small aria-live="polite">{rating?`${rating} / 5`:msg('feedbackRatingRequired')}</small></fieldset>}
  <label className="feedback-field"><span>{msg('feedbackMessage')} *</span><textarea required minLength={10} maxLength={2000} rows={6} value={message} disabled={state==='sending'} onChange={e=>{setMessage(e.target.value);setState('idle')}}/><small className="feedback-count">{message.length} / 2000 {msg('feedbackCharacters')}</small></label>
  <label className="feedback-trap" aria-hidden="true" tabIndex={-1}>Website<input tabIndex={-1} autoComplete="off" value={website} onChange={e=>setWebsite(e.target.value)}/></label>
  <label className="feedback-consent"><input type="checkbox" required checked={consent} disabled={state==='sending'} onChange={e=>{setConsent(e.target.checked);setState('idle')}}/><span>{msg('feedbackConsent')}</span></label>
  {type==='site_feedback'&&<label className="feedback-consent"><input type="checkbox" checked={publicConsent} disabled={state==='sending'} onChange={e=>{setPublicConsent(e.target.checked);setState('idle')}}/><span>{msg('feedbackPublishConsent')}</span></label>}
  <p className="feedback-warning" role="note">{msg('feedbackWarning')}</p>
  {state==='success'&&<p className="feedback-result success" role="status">{msg('feedbackSuccess')} {publicationStatus==='pending'?msg('feedbackPublicPending'):msg('feedbackPublicPrivate')}</p>}{state==='error'&&<p className="feedback-result error" role="alert">{detail}</p>}{state==='invalid'&&<p className="feedback-result error" role="alert">{msg('feedbackValidationError')}</p>}
  <button className="feedback-submit" type="submit" disabled={state==='sending'}>{state==='sending'?msg('feedbackSending'):msg('feedbackSubmit')}</button>
 </form>;
}
