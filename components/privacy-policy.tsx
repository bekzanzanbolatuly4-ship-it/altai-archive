'use client';

import Link from 'next/link';
import {useApp} from './providers';

export function PrivacyPolicy(){
 const{msg}=useApp();
 return <article className="privacy-page">
  <header className="privacy-page-heading">
   <span className="eyebrow">{msg('privacyGateEyebrow')}</span>
   <h1>{msg('privacyTitle')}</h1>
   <p>{msg('privacySummary')}</p>
  </header>
  <p className="privacy-page-region">{msg('privacyRegionNotice')}</p>
  <section><h2>{msg('privacyDataTitle')}</h2><p>{msg('privacyDataAccount')}</p><p>{msg('privacyDataFeedback')}</p><p>{msg('privacyDataAI')}</p></section>
  <section><h2>{msg('privacyUseTitle')}</h2><p>{msg('privacyUseText')}</p></section>
  <section><h2>{msg('privacyPublicTitle')}</h2><p>{msg('privacyPublicText')}</p></section>
  <section><h2>{msg('privacySecurityTitle')}</h2><p>{msg('privacySecurityText')}</p></section>
  <section><h2>{msg('privacyRetentionTitle')}</h2><p>{msg('privacyRetentionText')}</p></section>
  <p className="privacy-page-contact"><a href="mailto:arhiv-ukg@yandex.kz">arhiv-ukg@yandex.kz</a></p>
  <Link className="outline-link" href="/">{msg('privacyGateContinue')}</Link>
 </article>;
}
