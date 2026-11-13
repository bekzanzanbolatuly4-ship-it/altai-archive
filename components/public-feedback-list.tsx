'use client';
import {useEffect,useState} from 'react';
import {Star} from 'lucide-react';
import {useApp} from './providers';

type Review={name:string;rating:number;message:string;createdAt:string};
export function PublicFeedbackList(){
 const{msg,locale}=useApp();
 const[state,setState]=useState<'loading'|'ready'|'unavailable'>('loading');
 const[reviews,setReviews]=useState<Review[]>([]);
 useEffect(()=>{
  let active=true;
  fetch('/api/public-feedback',{cache:'no-store'}).then(async response=>{
   const body=await response.json().catch(()=>null) as {reviews?:unknown}|null;
   if(!active)return;
   if(!response.ok||!body||!Array.isArray(body.reviews)){setState('unavailable');return;}
   setReviews(body.reviews as Review[]);setState('ready');
  }).catch(()=>{if(active)setState('unavailable');});
  return()=>{active=false;};
 },[]);
 return <section className="public-feedback" aria-labelledby="public-feedback-title">
  <h3 id="public-feedback-title">{msg('feedbackPublicTitle')}</h3>
  {state==='loading'&&<p role="status">{msg('feedbackPublicLoading')}</p>}
  {state==='unavailable'&&<p role="status">{msg('feedbackPublicUnavailable')}</p>}
  {state==='ready'&&!reviews.length&&<p>{msg('feedbackPublicEmpty')}</p>}
  {reviews.length>0&&<div className="public-feedback-grid">{reviews.map((review,index)=><article className="public-feedback-card" key={`${review.createdAt}-${index}`}>
   <div className="public-feedback-rating" aria-label={`${review.rating} / 5`}>{Array.from({length:5},(_,i)=><Star key={i} size={16} aria-hidden="true" fill={i<review.rating?'currentColor':'none'}/>)}</div>
   <p>{review.message}</p><footer><b>{review.name}</b><time dateTime={review.createdAt}>{new Intl.DateTimeFormat(locale==='kk'?'kk-KZ':locale==='ru'?'ru-RU':'en-GB',{dateStyle:'medium'}).format(new Date(review.createdAt))}</time></footer>
  </article>)}</div>}
 </section>;
}
