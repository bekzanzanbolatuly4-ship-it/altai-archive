'use client';
import Link from 'next/link';
import Image from 'next/image';
import {ArrowRight,ArrowUpRight,BookOpen,Map,Search,History,Landmark,FileCheck2} from 'lucide-react';
import {useApp} from '@/components/providers';
import {formatInstitutionName} from '@/locales/messages';

const quick = [
  {href:'/catalog',key:'catalog' as const,Icon:BookOpen},
  {href:'/branches',key:'branches' as const,Icon:Map},
  {href:'/history',key:'history' as const,Icon:History},
  {href:'/about',key:'about' as const,Icon:Landmark},
];

export default function Home(){
  const{msg,locale}=useApp();
  const localized=(ru:string,kk:string,en:string)=>locale==='ru'?ru:locale==='kk'?kk:en;
  return <div className="home-page home-page-compact">
    <section className="hero hero-compact">
      <Image className="hero-image" src="/images/altai-panorama.svg" alt={localized('Иллюстративная панорама гор Алтая','Алтай тауларының иллюстрациялық панорамасы','Illustrative panorama of the Altai Mountains')} fill priority/>
      <div className="hero-content">
        <div className="eyebrow"><span/>{localized('ЦИФРОВОЙ АРХИВ','ЦИФРЛЫҚ АРХИВ','DIGITAL ARCHIVE')}</div>
        <h1 className="home-institution-title">{formatInstitutionName(locale)}</h1>
        <form className="hero-search" action="/catalog"><Search size={21}/><input name="q" placeholder={msg('searchPlaceholder')} aria-label={msg('searchPlaceholder')}/><button type="submit">{msg('find')}<ArrowRight size={16}/></button></form>
      </div>
    </section>

    <section className="quick-section quick-section-compact" aria-label={localized('Основные разделы','Негізгі бөлімдер','Main sections')}>
      <div className="quick-grid">{quick.map(({href,key,Icon})=><Link href={href} className="quick-tile" key={href}><Icon size={23} strokeWidth={1.6}/><span className="quick-title">{msg(key)}</span><ArrowUpRight className="quick-arrow" size={17}/></Link>)}</div>
    </section>

    <section className="home-shortcuts" aria-label={localized('Другие полезные разделы','Басқа пайдалы бөлімдер','Other useful sections')}>
      <Link href="/news">{msg('news')} <ArrowUpRight size={15}/></Link>
      <Link href="/exhibitions">{msg('exhibitions')} <ArrowUpRight size={15}/></Link>
      <Link href="/official-documents">{msg('officialDocuments')} <ArrowUpRight size={15}/></Link>
      <Link href="/assistant">{msg('assistant')} <ArrowUpRight size={15}/></Link>
      <Link href="/about#feedback">{msg('feedback')} <ArrowUpRight size={15}/></Link>
      <Link className="home-egov" href="https://egov.kz/services/K002/" target="_blank" rel="noreferrer"><FileCheck2 size={17}/>{localized('Заказать архивную справку на eGov.kz','eGov.kz арқылы архивтік анықтамаға тапсырыс беру','Request an archive certificate on eGov.kz')}<ArrowUpRight size={14}/></Link>
    </section>

    <div className="integrity-note"><span className="note-dot"/><span>{msg('catalogSamplesNote')}</span></div>
  </div>;
}
