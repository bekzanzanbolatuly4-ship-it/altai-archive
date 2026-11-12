'use client';
import Link from 'next/link';
import Image from 'next/image';
import {useEffect,useState} from 'react';
import {ArrowLeft,ArrowUpRight,Check,Copy,Download,FileText,Info,Minus,Plus,Share2} from 'lucide-react';
import {useParams} from 'next/navigation';
import {documents,type ArchiveDocument} from '@/data/archive';
import {useApp} from '@/components/providers';

type PublicRecord = ArchiveDocument & {
 mimeType?: string;
 size?: number;
 provenance?: string;
 documentIdentifier?: string;
 keywords?: string[];
 language?: string;
 originalName?: string;
};

export default function DocumentPage(){
 const{msg,locale}=useApp();
 const{id}=useParams<{id:string}>();
 const demo=documents.find(x=>x.id===id);
 const[uploaded,setUploaded]=useState<PublicRecord|null>(null);
 const[loading,setLoading]=useState(!demo);
 const[loadError,setLoadError]=useState(false);
 const[zoom,setZoom]=useState(100);
 const[copied,setCopied]=useState(false);
 const doc=demo||uploaded;
 const isUploaded=!demo&&!!uploaded;

 useEffect(()=>{
  if(demo)return;
  setLoadError(false);
  fetch(`/api/documents/${id}`)
   .then(r=>{
    if(!r.ok)throw new Error('Not found');
    return r.json();
   })
   .then(x=>{
    const d=x?.document;
    if(!d){
     setUploaded(null);
     return;
    }
    const tags=Array.isArray(d.keywords)?d.keywords.map(String):[];
    const isMap=tags.some((t:string)=>/карт|карталар|map/i.test(t))||/карта|план|атлас/i.test(String(d.title||''));
    const category=isMap?'Карты':d.mimeType==='application/pdf'?'Документы':'Фотографии';

    setUploaded({
     id:d.id,
     title:d.title,
     category,
     date:d.date||(locale==='kk'?'Күні көрсетілмеген':locale==='en'?'Date not specified':'Дата не указана'),
     year:Number(String(d.date||'').match(/\b(1[789]\d\d|20\d\d)\b/)?.[0])||0,
     description:d.description||'',
     fonds:d.fond||(locale==='kk'?'Көрсетілмеген':locale==='en'?'Not specified':'Не указано'),
     inventory:d.inventory||(locale==='kk'?'Көрсетілмеген':locale==='en'?'Not specified':'Не указано'),
     caseName:d.caseName||(locale==='kk'?'Көрсетілмеген':locale==='en'?'Not specified':'Не указано'),
     creator:'',
     place:'',
     status:'Описание доступно онлайн',
     source:d.provenance||(locale==='kk'?'Дереккөз көрсетілмеген':locale==='en'?'Source not specified':'Источник не указан'),
     image:`/api/documents/${d.id}/file`,
     tags,
     mimeType:d.mimeType,
     size:d.size,
     originalName:d.originalName,
     provenance:d.provenance,
     language:d.language,
     documentIdentifier:d.documentIdentifier
    });
   })
   .catch(()=>{
    setLoadError(true);
    setUploaded(null);
   })
   .finally(()=>setLoading(false));
 },[demo,id,locale]);

 useEffect(()=>{
  if(doc){
   try{
    const old=JSON.parse(localStorage.getItem('altai-recent')||'[]') as string[];
    localStorage.setItem('altai-recent',JSON.stringify([doc.id,...old.filter(x=>x!==doc.id)].slice(0,8)));
   }catch{}
  }
 },[doc]);

 const copy=async()=>{
  try{
   await navigator.clipboard.writeText(window.location.href);
   setCopied(true);
   setTimeout(()=>setCopied(false),1800);
  }catch{}
 };

 if(!doc){
  return (
   <div className="page-wrap">
    <div className="empty-state">
     <h1>
      {loading
       ?(locale==='ru'?'Загрузка…':locale==='kk'?'Жүктелуде…':'Loading…')
       :loadError
       ?(locale==='ru'?'Документ не найден или ограничен':locale==='kk'?'Құжат табылмады немесе шектелген':'Document not found or restricted')
       :msg('noResults')}
     </h1>
     <p>
      {loadError
       ?(locale==='ru'?'Запрошенный документ отсутствует в публичном каталоге.':locale==='kk'?'Сұралған құжат ашық каталогта жоқ.':'The requested document is not available in the public catalog.')
       :''}
     </p>
     <Link href="/catalog">{msg('back')}</Link>
    </div>
   </div>
  );
 }

 const localizedCategory =
  locale==='kk'
   ?doc.category==='Фотографии'?'Фотосуреттер':doc.category==='Карты'?'Карталар':'Құжаттар'
   :locale==='en'
   ?doc.category==='Фотографии'?'Photographs':doc.category==='Карты'?'Maps':'Documents'
   :doc.category;
 const displayId=doc.id.match(/^demo-(\d+)$/i)
  ?`${msg('sampleRecord')} ${doc.id.slice(-2)}`
  :doc.id;

 const downloadUrl=isUploaded?`/api/documents/${doc.id}/file?download=1`:doc.image;

 return (
  <div className="page-wrap document-detail">
   <div className="breadcrumb">
    <Link href="/catalog"><ArrowLeft size={13}/>{msg('catalog')}</Link>
    <span>/</span>
    {localizedCategory}
    <span>/</span>
    {displayId}
   </div>

   <div className="detail-heading">
    <div>
     <span className="eyebrow">
      {localizedCategory} · {isUploaded?(locale==='ru'?'ОПУБЛИКОВАНО':locale==='kk'?'ЖАРИЯЛАНДЫ':'PUBLISHED'):msg('sampleRecord')}
     </span>
     <h1>{doc.title}</h1>
     <p>{doc.description}</p>
    </div>
    <div style={{display:'flex',gap:'0.5rem',flexWrap:'wrap'}}>
     <Link href={`/assistant?q=${encodeURIComponent(`${msg('aiHelpDocument')}: ${doc.title}`)}`} className="outline-link">{msg('assistant')}</Link>
     {isUploaded
      ?<a
        href={downloadUrl}
        download={uploaded?.originalName||`${doc.id}`}
        className="outline-link"
        style={{display:'inline-flex',alignItems:'center',gap:'0.4rem'}}
       >
        <Download size={15}/>
        {locale==='ru'?'Скачать':locale==='kk'?'Жүктеу':'Download'}
       </a>
      :<span className="outline-link" role="note">{msg('sampleFileUnavailable')}</span>}
     <button type="button" className="outline-link" onClick={copy}>
      {copied?<Check size={15}/>:<Copy size={15}/>}
      {copied?msg('copied'):msg('citation')}
     </button>
    </div>
   </div>

   <div className="detail-layout">
    <section className="viewer-column">
     <div className="viewer-toolbar">
      <span><span className="status-dot"/> {isUploaded?doc.status:msg('sampleRecord')}</span>
      <div>
       <button type="button" onClick={()=>setZoom(Math.max(60,zoom-10))} aria-label="Zoom out">
        <Minus size={15}/>
       </button>
       <span>{zoom}%</span>
       <button type="button" onClick={()=>setZoom(Math.min(160,zoom+10))} aria-label="Zoom in">
        <Plus size={15}/>
       </button>
       <a
        href={downloadUrl}
        download={isUploaded?(uploaded?.originalName||`${doc.id}`):undefined}
        aria-label={locale==='ru'?'Скачать файл':locale==='kk'?'Файлды жүктеу':'Download file'}
        style={{display:'inline-flex',alignItems:'center',padding:'0 0.35rem',color:'inherit'}}
       >
        <Download size={15}/>
       </a>
       <button type="button" aria-label={msg('share')} onClick={copy}>
        <Share2 size={15}/>
       </button>
      </div>
     </div>

     <div className="document-viewer">
      {isUploaded&&uploaded?.mimeType==='image/tiff'?(
       <div className="viewer-page" style={{display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',padding:'2rem',textAlign:'center'}}>
        <FileText size={48} style={{opacity:0.6,marginBottom:'1rem'}}/>
        <h3>TIFF · {uploaded.originalName||doc.title}</h3>
        <p style={{fontSize:'0.85rem',maxWidth:'400px',opacity:0.8,margin:'0.5rem 0 1rem'}}>
         {locale==='ru'
          ?'Файлы формата TIFF требуют скачивания для просмотра в оригинальном архивном разрешении.'
          :locale==='kk'
          ?'TIFF пішіміндегі файлдарды толық ажыратымдылықта көру үшін жүктеу қажет.'
          :'TIFF archive scans require downloading to view at full archival resolution.'}
        </p>
        <a href={downloadUrl} download={uploaded.originalName} className="outline-link">
         <Download size={15}/> {locale==='ru'?'Скачать TIFF':locale==='kk'?'TIFF жүктеу':'Download TIFF'}
        </a>
       </div>
      ):isUploaded&&uploaded?.mimeType==='application/pdf'?(
       <iframe title={doc.title} src={doc.image} className="uploaded-pdf"/>
      ):(
       <div className="viewer-page" style={{transform:`scale(${zoom/100})`}}>
        <Image
         src={doc.image}
         alt={isUploaded?doc.title:locale==='ru'?'Иллюстрация к образцу документа, не архивный источник':locale==='kk'?'Құжат үлгісінің иллюстрациясы, архив дереккөзі емес':'Illustration for a document sample, not an archival source'}
         fill
         unoptimized={isUploaded}
        />
        {!isUploaded&&(
         <div className="viewer-label">
          {locale==='ru'?'ИЛЛЮСТРАЦИЯ · НЕ ИСТОЧНИК':locale==='kk'?'ИЛЛЮСТРАЦИЯ · ДЕРЕККӨЗ ЕМЕС':'ILLUSTRATION · NOT A SOURCE'}
         </div>
        )}
       </div>
      )}
     </div>

     <div className="viewer-pagination">
      <span>{msg('page')} 1 / 1</span>
      <span>
       {isUploaded
        ?(locale==='ru'?'Оригинал загруженного файла':locale==='kk'?'Жүктелген файл түпнұсқасы':'Uploaded file original')
        :(locale==='ru'?'Иллюстративный просмотр':locale==='kk'?'Иллюстрациялық көрініс':'Illustrative preview')}
      </span>
     </div>

     <div className="integrity-note">
      <Info size={14} className="note-icon"/>
      <span>
       <b>{msg('translationNotice')}</b> {msg('interfaceLanguageNotice')}
      </span>
     </div>
    </section>

    <aside className="metadata-panel">
     <span className="eyebrow">
      {isUploaded
       ?(locale==='ru'?'ОПИСАНИЕ · ПУБЛИЧНАЯ ЗАПИСЬ':locale==='kk'?'СИПАТТАМА · ЖАРИЯЛАНҒАН':'DESCRIPTION · PUBLIC RECORD')
       :msg('sampleDescription').toUpperCase()}
     </span>
     <h2>{msg('source')}</h2>

     <dl>
      <div key="fond">
       <dt>{locale==='kk'?'Қор':locale==='en'?'Fond':'Фонд'}</dt>
       <dd>{doc.fonds}</dd>
      </div>
      <div key="inv">
       <dt>{locale==='kk'?'Тізімдеме':locale==='en'?'Inventory':'Опись'}</dt>
       <dd>{doc.inventory}</dd>
      </div>
      <div key="case">
       <dt>{locale==='kk'?'Іс':locale==='en'?'Case':'Дело'}</dt>
       <dd>{doc.caseName}</dd>
      </div>
      <div key="ident">
       <dt>{locale==='kk'?'Идентификатор':locale==='en'?'Identifier':'Идентификатор'}</dt>
        <dd>{isUploaded?uploaded?.documentIdentifier||(locale==='kk'?'Көрсетілмеген':locale==='en'?'Not specified':'Не указан'):msg('sampleRecord')}</dd>
      </div>
      <div key="date">
       <dt>{locale==='kk'?'Күні':locale==='en'?'Date':'Дата'}</dt>
       <dd>{doc.date}</dd>
      </div>
      <div key="orig-lang">
       <dt>{msg('originalLanguage')}</dt>
       <dd>
        {isUploaded&&uploaded?.language
         ?uploaded.language
         :`${msg('russianLanguage')} · ${msg('sourceLanguageOriginal')}`}
       </dd>
      </div>
      <div key="desc-lang">
       <dt>{msg('descriptionLanguage')}</dt>
       <dd>
        {locale==='kk'?msg('kazakhLanguage'):locale==='en'?msg('englishLanguage'):msg('russianLanguage')}
        {' '}(UI: {locale.toUpperCase()})
       </dd>
      </div>
      {isUploaded&&uploaded?.size?(
       <div key="size">
        <dt>{locale==='kk'?'Көлемі':locale==='en'?'File size':'Размер файла'}</dt>
        <dd>{Math.ceil(uploaded.size/1024)} KB · {uploaded.mimeType?.split('/')[1]?.toUpperCase()||'FILE'}</dd>
       </div>
      ):null}
     </dl>

     {doc.tags&&doc.tags.length>0&&(
      <div style={{marginTop:'1.25rem',display:'flex',flexWrap:'wrap',gap:'0.35rem'}}>
       {doc.tags.filter(tag=>!/^демо$|^demo$/iu.test(tag)).map(tag=>(
        <Link
         key={tag}
         href={`/catalog?q=${encodeURIComponent(tag)}`}
         style={{fontSize:'0.75rem',padding:'0.2rem 0.5rem',border:'1px solid var(--border)',borderRadius:'2px',textDecoration:'none',color:'inherit',opacity:0.85}}
        >
         #{tag}
        </Link>
       ))}
      </div>
     )}

     <div className="metadata-access">
      <small>{msg('access')}</small>
      <b>
       <span className="status-dot"/>
       {isUploaded
        ?(locale==='ru'?'Публичный доступ · опубликовано':locale==='kk'?'Ашық қолжетімділік · жарияланды':'Public access · published')
        :msg('sampleRecord')}
      </b>
     </div>

     <div className="provenance">
      <span>{msg('source')}</span>
      <p>
       {isUploaded
        ?uploaded?.provenance||(locale==='kk'?'Дереккөз көрсетілмеген':locale==='en'?'Source not specified':'Источник не указан')
        :`${msg('catalogSamplesNote')} ${locale==='ru'?'Архивный шифр и оригинальный источник не указаны.':locale==='kk'?'Архивтік шифр мен түпнұсқа дереккөз көрсетілмеген.':'No archival reference or original source is provided.'}`}
      </p>
     </div>

     <div className="detail-actions">
      <Link href="/catalog">
       <ArrowLeft size={14}/> {msg('back')}
      </Link>
      <button type="button" onClick={copy}>
       {msg('citation')} <ArrowUpRight size={14}/>
      </button>
     </div>
    </aside>
   </div>

   <section className="related-section">
    <div className="section-heading">
     <div>
      <span className="eyebrow">
       {locale==='ru'?'СВЯЗАННЫЕ МАТЕРИАЛЫ':locale==='kk'?'БАЙЛАНЫСТЫ МАТЕРИАЛДАР':'DISCOVER MORE'}
      </span>
      <h2>{msg('related')}</h2>
     </div>
    </div>
    <div className="related-grid">
     {documents.filter(x=>x.id!==doc.id).slice(0,3).map(x=>(
      <Link href={`/document/${x.id}`} key={x.id}>
       <Image src={x.image} alt="" width={200} height={120}/>
       <span>{x.category} · {msg('sampleRecord')}</span>
       <b>{x.title}</b>
      </Link>
     ))}
    </div>
   </section>
  </div>
 );
}
