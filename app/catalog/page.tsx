'use client';
import Link from 'next/link';
import Image from 'next/image';
import {useEffect,useMemo,useState} from 'react';
import {ArrowDownWideNarrow,ArrowUpRight,ChevronDown,ChevronLeft,ChevronRight,Filter,Search,SlidersHorizontal,Sparkles} from 'lucide-react';
import {documents,type ArchiveDocument} from '@/data/archive';
import {useApp} from '@/components/providers';

const PAGE_SIZE=12;

function scoreDocument(d:ArchiveDocument,words:string[]):number{
 let score=0;
 const titleLower=d.title.toLowerCase();
 const descLower=d.description.toLowerCase();
 const tagsLower=d.tags.join(' ').toLowerCase();
 const refLower=`${d.fonds} ${d.inventory} ${d.caseName}`.toLowerCase();

 for(const w of words){
  if(titleLower.includes(w))score+=40;
  if(tagsLower.includes(w))score+=25;
  if(refLower.includes(w))score+=20;
  if(descLower.includes(w))score+=5;
 }
 return score;
}

export default function Catalog(){
 const{msg,locale}=useApp();
 const[q,setQ]=useState('');
 const[category,setCategory]=useState('');
 const[from,setFrom]=useState('');
 const[to,setTo]=useState('');
 const[sort,setSort]=useState('relevance');
 const[filters,setFilters]=useState(false);
 const[uploaded,setUploaded]=useState<ArchiveDocument[]>([]);
 const[loading,setLoading]=useState(true);
 const[loadError,setLoadError]=useState(false);
 const[page,setPage]=useState(1);

 useEffect(()=>{
  if(typeof window==='undefined')return;
  const p=new URLSearchParams(window.location.search);
  const initialQ=p.get('q')||'';
  const initialCategory=p.get('category')||'';
  if(initialQ)setQ(initialQ);
  if(initialCategory)setCategory(initialCategory);

  fetch('/api/documents')
   .then(r=>{if(!r.ok)throw new Error('catalog_unavailable');return r.json();})
   .then(({documents:items})=>{
    if(Array.isArray(items)){
     setUploaded(
      items.map((d:Record<string,unknown>):ArchiveDocument=>{
       const tags=Array.isArray(d.keywords)?d.keywords.map(String):[];
       const title=String(d.title||'');
       const isMap=tags.some(t=>/карт|карталар|map/i.test(t))||/карта|план|атлас/i.test(title);
       const inferredCategory=isMap?'Карты':d.mimeType==='application/pdf'?'Документы':'Фотографии';

       return {
        id:String(d.id),
        title,
        category:inferredCategory,
        date:String(d.date||(locale==='kk'?'Күні көрсетілмеген':locale==='en'?'Date not specified':'Дата не указана')),
        year:Number(String(d.date||'').match(/\b(1[789]\d\d|20\d\d)\b/)?.[0])||0,
        description:String(d.description||''),
        fonds:String(d.fond||(locale==='kk'?'Көрсетілмеген':locale==='en'?'Not specified':'Не указано')),
        inventory:String(d.inventory||(locale==='kk'?'Көрсетілмеген':locale==='en'?'Not specified':'Не указано')),
        caseName:String(d.caseName||(locale==='kk'?'Көрсетілмеген':locale==='en'?'Not specified':'Не указано')),
        creator:'',
        place:'',
        status:'Описание доступно онлайн',
        source:String(d.provenance||(locale==='kk'?'Дереккөз көрсетілмеген':locale==='en'?'Source not specified':'Источник не указан')),
        image:`/api/documents/${d.id}/file`,
        tags
       };
      })
     );
    }
   })
   .catch(()=>{setLoadError(true);})
   .finally(()=>setLoading(false));
 },[locale]);

 useEffect(()=>{
  if(typeof window==='undefined')return;
  const p=new URLSearchParams();
  if(q)p.set('q',q);
  if(category)p.set('category',category);
  const qs=p.toString();
  const nextUrl=qs?`${window.location.pathname}?${qs}`:window.location.pathname;
  window.history.replaceState(null,'',nextUrl);
  setPage(1);
 },[q,category,from,to,sort]);

 const allDocs=useMemo(()=>[...uploaded,...documents],[uploaded]);

 const visible=useMemo(()=>{
  const rawWords=q.toLowerCase().trim().split(/\s+/).filter(Boolean);
  const numFrom=from?Number(from):null;
  const numTo=to?Number(to):null;

  const filtered=allDocs.filter(d=>{
   if(rawWords.length>0){
    const corpus=`${d.title} ${d.description} ${d.category} ${d.fonds} ${d.inventory} ${d.caseName} ${d.date} ${d.tags.join(' ')}`.toLowerCase();
    const matchesAll=rawWords.every(w=>corpus.includes(w));
    if(!matchesAll)return false;
   }

   if(category&&d.category!==category)return false;

   if(numFrom!==null||numTo!==null){
    if(d.year===0)return false;
    if(numFrom!==null&&d.year<numFrom)return false;
    if(numTo!==null&&d.year>numTo)return false;
   }

   return true;
  });

  return filtered.sort((a,b)=>{
   if(sort==='newest'){
    if(a.year>0&&b.year>0)return b.year-a.year;
    if(a.year>0)return -1;
    if(b.year>0)return 1;
    return a.title.localeCompare(b.title);
   }
   if(sort==='oldest'){
    if(a.year>0&&b.year>0)return a.year-b.year;
    if(a.year>0)return -1;
    if(b.year>0)return 1;
    return a.title.localeCompare(b.title);
   }
   if(sort==='relevance'&&rawWords.length>0){
    const scoreA=scoreDocument(a,rawWords);
    const scoreB=scoreDocument(b,rawWords);
    if(scoreB!==scoreA)return scoreB-scoreA;
   }
   return 0;
  });
 },[q,category,from,to,sort,allDocs]);

 const totalPages=Math.max(1,Math.ceil(visible.length/PAGE_SIZE));
 const pagedDocs=useMemo(()=>{
  const start=(page-1)*PAGE_SIZE;
  return visible.slice(start,start+PAGE_SIZE);
 },[visible,page]);

 const label=(name:string)=>
  locale==='kk'
   ?name==='Фотографии'?'Фотосуреттер':name==='Карты'?'Карталар':'Құжаттар'
   :locale==='en'
   ?name==='Фотографии'?'Photographs':name==='Карты'?'Maps':'Documents'
   :name;

 const hierarchy=
  locale==='kk'
   ?['Архив','Қор','Тізімдеме','Іс','Құжат','Беттер']
   :locale==='en'
   ?['Archive','Fond','Inventory','Case','Document','Pages']
   :['Архив','Фонд','Опись','Дело','Документ','Страницы'];

 return (
  <div className="page-wrap">
   <div className="page-hero compact">
    <div className="breadcrumb">
     ALTAI ARCHIVE <span>/</span> {msg('catalog')}
    </div>
    <span className="eyebrow">
     {locale==='ru'?'КАТАЛОГ ОПИСАНИЙ':locale==='kk'?'СИПАТТАМАЛАР КАТАЛОГЫ':'CATALOGUE'}
    </span>
    <h1>{msg('catalog')}</h1>
    <p>
     {locale==='ru'
      ?'Исследуйте демонстрационные описания и структуру каталога.'
      :locale==='kk'
      ?'Демонстрациялық сипаттамалар мен каталог құрылымын зерттеңіз.'
      :'Explore demonstration descriptions and the catalogue structure.'}
    </p>
    <span className="demo-stamp">{msg('demo').toUpperCase()}</span>
   </div>

   {loadError&&<p className="catalog-load-warning" role="status">{msg('catalogueSourceError')}</p>}

   <form className="catalog-search" onSubmit={e=>e.preventDefault()}>
    <Search size={19}/>
    <input
     value={q}
     onChange={e=>setQ(e.target.value)}
     placeholder={msg('searchPlaceholder')}
     aria-label={msg('searchPlaceholder')}
    />
    <button type="submit">{msg('find')}</button>
    <button
     type="button"
     className="filter-toggle"
     onClick={()=>setFilters(!filters)}
     aria-expanded={filters}
    >
     <SlidersHorizontal size={16}/>
     {msg('filters')}
     <ChevronDown size={14}/>
    </button>
   </form>

   <div className="catalog-toolbar">
    <span>
     {loading?(
      locale==='ru'?'Загрузка…':locale==='kk'?'Жүктелуде…':'Loading…'
     ):(
      <>
       {visible.length} <i>·</i> {msg('searchResults')}{' '}
       {uploaded.length>0?(
        <span className="mini-demo">{locale==='ru'?`${uploaded.length} в архиве`:locale==='kk'?`${uploaded.length} архивте`:`${uploaded.length} in archive`}</span>
       ):(
        <span className="mini-demo">DEMO</span>
       )}
      </>
     )}
    </span>
    <label>
     <ArrowDownWideNarrow size={15}/>
     <select value={sort} onChange={e=>setSort(e.target.value)} aria-label={msg('sort')}>
      <option value="relevance">{msg('relevance')}</option>
      <option value="newest">{msg('newest')}</option>
      <option value="oldest">{msg('oldest')}</option>
     </select>
    </label>
   </div>

   <Link className="catalog-ai-link" href={`/assistant?q=${encodeURIComponent(q||msg('askPlaceholder'))}`}>
    <Sparkles size={17}/>{msg('aiHelpCatalog')}<ArrowUpRight size={15}/>
   </Link>

   {filters&&(
    <div className="filter-panel">
     <label>
      {msg('category')}
      <select value={category} onChange={e=>setCategory(e.target.value)}>
       <option value="">{msg('allCategories')}</option>
       {['Документы','Фотографии','Карты'].map(x=>(
        <option value={x} key={x}>{label(x)}</option>
       ))}
      </select>
     </label>
     <label>
      {msg('from')}
      <input type="number" placeholder="1900" value={from} onChange={e=>setFrom(e.target.value)}/>
     </label>
     <label>
      {msg('to')}
      <input type="number" placeholder="2000" value={to} onChange={e=>setTo(e.target.value)}/>
     </label>
     <button
      type="button"
      className="text-button"
      onClick={()=>{setCategory('');setFrom('');setTo('');}}
     >
      <Filter size={14}/>
      {msg('resetFilters')}
     </button>
    </div>
   )}

   <div className="hierarchy-strip">
    <span className="hierarchy-label">
     {locale==='ru'?'СТРУКТУРА ОПИСАНИЯ':locale==='kk'?'СИПАТТАМА ҚҰРЫЛЫМЫ':'DESCRIPTION HIERARCHY'}
    </span>
    <span>
     {hierarchy.map((step, idx)=>(
      <span key={step}>
       {idx>0&&<b> → </b>}
       {step}
      </span>
     ))}
    </span>
    <span className="mini-demo">DEMO</span>
   </div>

   {pagedDocs.length>0?(
    <>
     <div className="document-grid">
      {pagedDocs.map(d=>(
       <Link href={`/document/${d.id}`} className="document-card" key={d.id}>
        <div className="document-image">
         <Image src={d.image} alt="" fill/>
         <span className="doc-category">{label(d.category)}</span>
         <ArrowUpRight className="doc-arrow" size={18}/>
        </div>
        <div className="document-copy">
         <span className="doc-meta">{d.date}</span>
         <h2>{d.title}</h2>
         <p>{d.description}</p>
         <div className="archive-ref">
          <span>{d.fonds}</span>
          <span>·</span>
          <span>{d.inventory}</span>
          <span>·</span>
          <span>{d.caseName}</span>
         </div>
         <div className="status-line">
          <span className="status-dot"/>
          {uploaded.some(record=>record.id===d.id)?msg('published'):msg('demo')}
         </div>
        </div>
       </Link>
      ))}
     </div>

     {totalPages>1&&(
      <div className="catalog-toolbar" style={{justifyContent:'center',gap:'1rem',marginTop:'2rem'}}>
       <button
        type="button"
        className="text-button"
        disabled={page<=1}
        onClick={()=>setPage(p=>Math.max(1,p-1))}
        aria-label="Previous page"
       >
        <ChevronLeft size={16}/>
        {locale==='ru'?'Назад':locale==='kk'?'Артқа':'Previous'}
       </button>
       <span>
        {page} / {totalPages}
       </span>
       <button
        type="button"
        className="text-button"
        disabled={page>=totalPages}
        onClick={()=>setPage(p=>Math.min(totalPages,p+1))}
        aria-label="Next page"
       >
        {locale==='ru'?'Вперёд':locale==='kk'?'Алға':'Next'}
        <ChevronRight size={16}/>
       </button>
      </div>
     )}
    </>
   ):(
    <div className="empty-state">
     <Search size={25}/>
     <h2>{msg('noResults')}</h2>
     <p>{msg('searchEmptyHint')}</p>
     <button
      type="button"
      onClick={()=>{setQ('');setCategory('');setFrom('');setTo('');}}
     >
      {msg('resetFilters')}
     </button>
    </div>
   )}
  </div>
 );
}
