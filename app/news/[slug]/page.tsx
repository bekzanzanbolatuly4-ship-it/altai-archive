'use client';
import Link from 'next/link';
import {useParams} from 'next/navigation';
import {ArrowLeft,ArrowUpRight,Copy,Check} from 'lucide-react';
import {useState} from 'react';
import {news, getLocalizedNews} from '@/data/archive';
import {useApp} from '@/components/providers';

export default function NewsDetail(){
  const{msg,locale}=useApp();
  const{slug}=useParams<{slug:string}>();
  const rawItem=news.find(x=>x.slug===slug);
  const item = rawItem ? getLocalizedNews(rawItem, locale) : null;
  const[copied,setCopied]=useState(false);

  if(!item){
    return (
      <div className="page-wrap">
        <h1>{msg('noResults')}</h1>
        <Link href="/news">{msg('back')}</Link>
      </div>
    );
  }

  const copy=async()=>{
    try{
      await navigator.clipboard.writeText(location.href);
      setCopied(true);
      setTimeout(()=>setCopied(false),1600);
    }catch{}
  };

  return (
    <div className="page-wrap editorial-detail">
      <div className="breadcrumb">
        <Link href="/news"><ArrowLeft size={13}/>{msg('news')}</Link>
        <span>/</span>
        {item.category}
      </div>
      <article className="news-article">
        <span className="eyebrow">{item.category} · {item.date}</span>
        <h1>{item.title}</h1>
        <p className="editorial-lead">{item.excerpt}</p>
        <div className="article-callout">
          {msg('notOfficialPublication')}
        </div>
        <p>
          {locale==='ru'
            ?'Этот редакционный пример показывает формат публикации. Публикуемые материалы должны сохранять ссылку на происхождение, точное описание и контекст.'
            :locale==='kk'
            ?'Бұл редакциялық үлгі жарияланым пішімін көрсетеді. Жарияланатын материалдар дереккөз сілтемесін, дәл сипаттаманы және мәнмәтінді сақтауы керек.'
            :'This editorial example shows a publication format. Published materials should preserve provenance links, accurate descriptions, and context.'}
        </p>
        <button type="button" className="outline-link" onClick={copy}>
          {copied?<Check size={14}/>:<Copy size={14}/>}
          {copied?msg('copied'):msg('citation')}
        </button>
        <div className="article-related">
          <span className="eyebrow">
            {locale==='ru'?'СВЯЗАННЫЕ РАЗДЕЛЫ':locale==='kk'?'БАЙЛАНЫСТЫ БӨЛІМДЕР':'RELATED SECTIONS'}
          </span>
          <Link href="/catalog">{msg('catalog')} <ArrowUpRight size={14}/></Link>
          <Link href="/exhibitions">{msg('exhibitions')} <ArrowUpRight size={14}/></Link>
        </div>
      </article>
    </div>
  );
}
