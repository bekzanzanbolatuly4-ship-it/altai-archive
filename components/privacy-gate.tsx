'use client';

import Link from 'next/link';
import {useState} from 'react';
import type {Locale} from '@/locales/messages';
import {privacyConsentStorageKey,privacyPolicyVersion} from '@/lib/privacy-policy';
import {useApp} from './providers';

export function PrivacyGate({checking,onAccept}:{checking:boolean;onAccept:()=>void}){
 const{locale,setLocale,msg}=useApp();
 const[read,setRead]=useState(false);
 const[agree,setAgree]=useState(false);
 const choose=(value:Locale)=>setLocale(value);
 function accept(){
  if(!read||!agree)return;
  localStorage.setItem(privacyConsentStorageKey,JSON.stringify({version:privacyPolicyVersion,acceptedAt:new Date().toISOString()}));
  onAccept();
 }
 return <div className="privacy-gate-backdrop">
  <section className="privacy-gate" role="dialog" aria-modal="true" aria-labelledby="privacy-gate-title">
   <div className="privacy-gate-language" role="group" aria-label={msg('privacyGateLanguage')}>
    {([['kk','KZ'],['ru','RU'],['en','EN']] as const).map(([value,label])=><button key={value} type="button" aria-pressed={locale===value} className={locale===value?'active':''} onClick={()=>choose(value)}>{label}</button>)}
   </div>
   <span className="privacy-gate-eyebrow">{msg('privacyGateEyebrow')}</span>
   <h1 id="privacy-gate-title">{checking?msg('privacyGateChecking'):msg('privacyTitle')}</h1>
   <p className="privacy-gate-summary">{msg('privacySummary')}</p>
   <p className="privacy-gate-region">{msg('privacyRegionNotice')}</p>
   <p className="privacy-gate-security">{msg('privacySecurityText')}</p>
   <Link className="privacy-gate-policy-link" href="/privacy" target="_blank" rel="noreferrer">{msg('privacyLink')}</Link>
   <fieldset className="privacy-gate-checks" disabled={checking}>
    <legend>{msg('privacyTitle')}</legend>
    <label><input type="checkbox" checked={read} onChange={event=>setRead(event.target.checked)}/><span>{msg('privacyGateRead')}</span></label>
    <label><input type="checkbox" checked={agree} onChange={event=>setAgree(event.target.checked)}/><span>{msg('privacyGateAgree')}</span></label>
   </fieldset>
   <button className="privacy-gate-continue" type="button" disabled={checking||!read||!agree} onClick={accept}>{msg('privacyGateContinue')}</button>
  </section>
 </div>;
}
