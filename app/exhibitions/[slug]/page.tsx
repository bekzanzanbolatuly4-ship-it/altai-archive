'use client';
import Link from 'next/link';
import Image from 'next/image';
import {useParams} from 'next/navigation';
import {ArrowLeft,ArrowUpRight} from 'lucide-react';
import {exhibitions, documents, getLocalizedExhibition} from '@/data/archive';
import {useApp} from '@/components/providers';

export default function ExhibitionDetail(){
  const{msg,locale}=useApp();
  const{slug}=useParams<{slug:string}>();
  const rawItem=exhibitions.find(x=>x.slug===slug);
  const item = rawItem ? getLocalizedExhibition(rawItem, locale) : null;

  if(!item){
    return (
      <div className="page-wrap">
        <h1>{msg('noResults')}</h1>
        <Link href="/exhibitions">{msg('back')}</Link>
      </div>
    );
  }

  return (
    <div className="page-wrap editorial-detail">
      <div className="breadcrumb">
        <Link href="/exhibitions"><ArrowLeft size={13}/>{msg('exhibitions')}</Link>
        <span>/</span>
        DEMO
      </div>
      <div className="editorial-hero">
        <Image src={item.image} alt="Иллюстративный визуал демонстрационной выставки" fill/>
        <span>DEMONSTRATION EXHIBITION</span>
      </div>
      <div className="editorial-copy">
        <span className="eyebrow">{item.category} · {item.year}</span>
        <h1>{item.title}</h1>
        <p className="editorial-lead">{item.intro}</p>
        <div className="integrity-note">
          <span className="note-dot"/>
          <span>
            {locale==='ru'
              ?'Демонстрационная редакционная концепция. Не является официальной выставкой.'
              :locale==='kk'
              ?'Демонстрациялық редакциялық тұжырымдама. Ресми көрме болып табылмайды.'
              :'Demonstration editorial concept. Not an official exhibition.'}
          </span>
        </div>
        <h2>
          {locale==='ru'?'О маршруте':locale==='kk'?'Маршрут туралы':'About this exhibition'}
        </h2>
        <p>
          {locale==='ru'
            ?'Этот макет показывает редакционный формат цифровой выставки: вступительный текст, изображения, связь с каталогом и указание на происхождение материалов. Архивные источники не приложены; тематическое содержание и исторические утверждения требуют проверки редактором архива.'
            :locale==='kk'
            ?'Бұл макет цифрлық көрменің редакциялық форматын көрсетеді: кіріспе мәтін, иллюстрациялар, каталогпен байланыс және материалдардың шығу тегі. Архивтік түпнұсқалар тіркелмеген; тақырыптық мазмұн тексеруді қажет етеді.'
            :'This mockup demonstrates the format of a digital exhibition: an introduction, visuals, catalogue links, and provenance labels. Archival sources are not attached; historical claims require archive editorial review.'}
        </p>
        <div className="editorial-sources">
          <span className="eyebrow">
            {locale==='ru'?'МАТЕРИАЛЫ КАТАЛОГА · ДЕМО':locale==='kk'?'КАТАЛОГ МАТЕРИАЛДАРЫ · ДЕМО':'RELATED CATALOGUE MATERIALS · DEMO'}
          </span>
          {documents.slice(0,2).map(d=>(
            <Link href={`/document/${d.id}`} key={d.id}>
              <Image src={d.image} alt="" width={120} height={74}/>
              <span>
                <b>{d.title}</b>
                <small>{d.category} · {d.status}</small>
              </span>
              <ArrowUpRight size={14}/>
            </Link>
          ))}
        </div>
        <Link className="outline-link" href="/exhibitions">
          <ArrowLeft size={14}/>{msg('back')}
        </Link>
      </div>
    </div>
  );
}
