'use client';

import Script from 'next/script';
import {useCallback,useEffect,useRef,useState} from 'react';

declare global{interface Window{turnstile?:{render:(el:HTMLElement,options:{sitekey:string;callback:(token:string)=>void;['expired-callback']:()=>void;['error-callback']:()=>void;theme?:'light'|'dark'})=>string;remove:(id:string)=>void;reset:(id:string)=>void}}}

export function Turnstile({onToken,theme='light',resetKey=0}:{onToken:(token:string)=>void;theme?:'light'|'dark';resetKey?:number}){
 const sitekey=process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;
 const host=useRef<HTMLDivElement>(null);
 const widget=useRef<string|null>(null);
 const callback=useRef(onToken);
 const[ready,setReady]=useState(false);
 useEffect(()=>{callback.current=onToken},[onToken]);
 const mount=useCallback(()=>{
  if(!ready||!sitekey||!host.current||!window.turnstile||widget.current)return;
  widget.current=window.turnstile.render(host.current,{sitekey,theme,callback:token=>callback.current(token),['expired-callback']:()=>callback.current(''),['error-callback']:()=>callback.current('')});
 },[ready,sitekey,theme]);
 useEffect(()=>{mount();return()=>{if(widget.current&&window.turnstile){window.turnstile.remove(widget.current);widget.current=null;}}},[mount]);
 useEffect(()=>{if(resetKey>0&&widget.current&&window.turnstile)window.turnstile.reset(widget.current)},[resetKey]);
 if(!sitekey)return <p role="alert" className="feedback-result error">CAPTCHA не настроена: добавьте NEXT_PUBLIC_TURNSTILE_SITE_KEY. / CAPTCHA орнатылмаған. / CAPTCHA is not configured.</p>;
 return <><Script src="https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit" strategy="afterInteractive" onReady={()=>setReady(true)}/><div ref={host} aria-label="Cloudflare Turnstile CAPTCHA"/></>;
}
