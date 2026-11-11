'use client';
import Link from 'next/link';
import {useEffect,useRef,useState} from 'react';
import {ArrowRight,Send,Sparkles} from 'lucide-react';
import {useApp} from './providers';

type Reply={mode:'ai'|'reference'|'local-search'|'no-match';answer:string;citations:{id:string;title:string;quote:string;url:string;provenance:string}[]};
type Turn={question:string;reply?:Reply;error?:string};
const AI_ERROR_MESSAGES:Record<string,'aiProviderLimit'|'aiRateLimit'|'aiUnconfigured'|'aiConfiguration'|'aiLimiterUnavailable'|'aiProviderUnavailable'|'aiTimeout'|'aiInvalidResponse'>={provider_limit:'aiProviderLimit',rate_limit:'aiRateLimit',unconfigured:'aiUnconfigured',configuration:'aiConfiguration',rate_limit_unavailable:'aiLimiterUnavailable',client_ip_unavailable:'aiLimiterUnavailable',provider_error:'aiProviderUnavailable',timeout:'aiTimeout',invalid_response:'aiInvalidResponse',source_changed:'aiInvalidResponse'};
export function AIAssistant({demo}:{demo:React.ReactNode}){
 const {msg,locale}=useApp();
 const [query,setQuery]=useState('');
 const [turns,setTurns]=useState<Turn[]>([]);
 const [loading,setLoading]=useState(false);
 const [showDemo,setShowDemo]=useState(false);
 const busy=useRef(false);
 const input=useRef<HTMLTextAreaElement>(null);
 useEffect(()=>{
  const prompt=new URLSearchParams(window.location.search).get('q');
  if(prompt)setQuery(prompt.slice(0,2000));
 },[]);
 async function send(question:string,retry?:number){
  if(!question.trim()||busy.current)return;
  busy.current=true;setLoading(true);
  const index=retry??turns.length;
  setTurns(old=>retry===undefined?[...old,{question}]:old.map((t,i)=>i===index?{question}:t));
  setQuery('');
  const controller=new AbortController();const timer=setTimeout(()=>controller.abort(),25000);
  try{
   const response=await fetch('/api/assistant',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({message:question,locale}),signal:controller.signal});
   const reply=await response.json();
   if(!response.ok)throw new Error(typeof reply?.error==='string'?reply.error:'unavailable');
   if(!['ai','reference','local-search','no-match'].includes(reply.mode)||typeof reply.answer!=='string'||!Array.isArray(reply.citations))throw new Error('invalid');
   setTurns(old=>old.map((t,i)=>i===index?{question,reply}:t));
  }catch(error){setTurns(old=>old.map((t,i)=>i===index?{question,error:error instanceof Error?error.message:'unavailable'}:t));}
  finally{clearTimeout(timer);busy.current=false;setLoading(false);input.current?.focus();}
 }
 return <div className="page-wrap assistant-page">
  <header className="page-head"><span className="eyebrow">ALTAI ARCHIVE · AI</span><h1>{msg('assistant')}</h1><p>{msg('aiIntro')}</p></header>
  <div className="assistant-disclosure"><Sparkles size={18}/><span>{msg('aiPrivacy')}</span></div>
  <p className="ai-search-scope">{msg('aiWebSearchUnavailable')} <Link href="/catalog">{msg('catalog')} <ArrowRight size={14}/></Link></p>
  <section className="chat-panel" aria-label={msg('assistant')}>
   <div className="chat-head">ALTAI AI <small>{msg('aiLabel')}</small></div>
   <div className="chat-messages ai-messages" role="log" aria-live="polite" aria-busy={loading}>
    <div className="chat-bubble assistant-bubble">{msg('aiWelcome')}</div>
    {!turns.length&&<div className="ai-example-questions"><b>{msg('aiExamples')}</b><div>{(['aiExampleOne','aiExampleTwo','aiExampleThree'] as const).map(key=><button type="button" key={key} disabled={loading} onClick={()=>void send(msg(key))}>{msg(key)}</button>)}</div></div>}
    {turns.map((turn,i)=><div key={i}>
     <div className="chat-bubble user-bubble ai-text">{turn.question}</div>
     {turn.reply&&<div className="chat-bubble assistant-bubble">
      <strong>{msg(turn.reply.mode==='ai'?'aiLabel':turn.reply.mode==='reference'?'aiReferenceAnswer':turn.reply.mode==='local-search'?'aiLocalSearch':'aiSearchResult')}</strong><p className="ai-text">{turn.reply.answer}</p>
      {turn.reply.mode==='ai'&&<p>{msg('aiEvidenceNote')}</p>}
      <section className="assistant-results" aria-label={msg('aiSources')}><h3>{msg('aiSources')}</h3>
       {turn.reply.citations.length?turn.reply.citations.map(source=><div key={source.id}>
        <Link href={source.url}>{source.title}</Link><blockquote className="ai-text">{source.quote}</blockquote>
        <small>{source.provenance==='demonstration'?msg('aiDemoSource'):msg('aiMetadata')}</small>
       </div>):<p>{msg('aiNoSources')}</p>}
      </section>
     </div>}
     {turn.error&&<div className="chat-bubble assistant-bubble" role="alert"><p>{msg(AI_ERROR_MESSAGES[turn.error]||'aiError')}</p><button type="button" disabled={loading} onClick={()=>void send(turn.question,i)}>{msg('aiRetry')}</button><button type="button" onClick={()=>setShowDemo(true)}>{msg('aiDemo')}</button><Link href="/catalog">{msg('catalog')} <ArrowRight size={14}/></Link></div>}
    </div>)}
    {loading&&<p role="status">{msg('aiLoading')}</p>}
   </div>
   <form className="chat-input" onSubmit={e=>{e.preventDefault();void send(query);}}>
    <textarea ref={input} value={query} maxLength={2000} rows={3} aria-label={msg('askPlaceholder')} placeholder={msg('askPlaceholder')} onChange={e=>setQuery(e.target.value)} onKeyDown={e=>{if(e.key==='Enter'&&!e.shiftKey&&!e.nativeEvent.isComposing){e.preventDefault();void send(query);}}}/>
    <button disabled={loading||!query.trim()} aria-label={msg('send')} type="submit"><Send size={16}/></button>
   </form>
   <small className="chat-foot">{msg('aiKeyboard')}</small>
   {!!turns.length&&<button type="button" className="ai-clear-history" disabled={loading} onClick={()=>setTurns([])}>{msg('aiClearHistory')}</button>}
  </section>
  <button type="button" className="ai-demo-toggle" aria-expanded={showDemo} onClick={()=>setShowDemo(!showDemo)}>{msg('aiDemo')}</button>
  {showDemo&&demo}
 </div>;
}
