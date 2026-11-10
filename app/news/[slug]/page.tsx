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
        <span className="eyebrow">{item.category} · {item.date} · DEMO</span>
        <h1>{item.title}</h1>
        <p className="editorial-lead">{item.excerpt}</p>
        <div className="article-callout">
          {locale==='ru'
            ?'Демонстрационная публикация. Содержание, даты и события не являются официальной информацией архива.'
            :locale==='kk'
            ?'Демонстрациялық жарияланым. Мазмұны, күндері мен оқиғалары архивтің ресми ақпараты болып табылмайды.'
            :'Demonstration publication. Content, dates, and events are not official archive announcements.'}
        </div>
        <p>
          {locale==='ru'
            ?'Эта демонстрационная статья показывает типографику и формат публикации. Материалы цифрового архива должны сохранять ссылку на происхождение, корректное описание и контекст.'
            :locale==='kk'
            ?'Бұл демонстрациялық мақала типографика мен жарияланым форматын көрсетеді. Цифрлық архив материалдары дереккөзге сілтемені, дұрыс сипаттама мен мәнмәтінді сақтауы қажет.'
            :'This demonstration article showcases publication typography and layout. Digital archive materials preserve provenance links, accurate descriptions, and contextual records.'}
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
