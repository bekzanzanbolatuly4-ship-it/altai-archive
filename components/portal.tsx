'use client';
import Link from 'next/link';
import Image from 'next/image';
import {useMemo, useState} from 'react';
import {ArrowRight,ArrowUpRight,BookOpen,MapPin,MessageCircle,Search,Send,Sparkles} from 'lucide-react';
import {
  documents,
  exhibitions,
  news,
  places,
  getLocalizedPlace,
  getLocalizedExhibition,
  getLocalizedNews
} from '@/data/archive';
import {InstitutionPage} from './institution';
import {BranchesDirectory as BranchesMapDirectory} from './branches-directory';
import {Calendar2026} from './calendar-2026';
import {AIAssistant} from './ai-assistant';
import {AdminWorkspace} from './admin-workspace';
import {useApp} from './providers';

type Kind='atlas'|'branches'|'exhibitions'|'history'|'news'|'about'|'assistant'|'admin';

export function Portal({kind,demoReadOnly=false}:{kind:Kind;demoReadOnly?:boolean}){
  const{msg,locale}=useApp();
  const[query,setQuery]=useState('');
  const[active,setActive]=useState('');
  const[filter,setFilter]=useState('');

  const tr=(ru:string,kk:string,en:string)=>locale==='ru'?ru:locale==='kk'?kk:en;

  const localizedPlaces = useMemo(() => places.map(p => getLocalizedPlace(p, locale)), [locale]);
  const localizedExhibitions = useMemo(() => exhibitions.map(e => getLocalizedExhibition(e, locale)), [locale]);
  const localizedNews = useMemo(() => news.map(n => getLocalizedNews(n, locale)), [locale]);

  if(kind==='assistant')return <AIAssistant demo={<Assistant/>}/>;
  if(kind==='admin')return <AdminWorkspace readOnly={demoReadOnly}/>;
  if(kind==='about')return <InstitutionPage/>;
  if(kind==='branches')return <BranchesMapDirectory/>;

  if(kind==='atlas'){
    const matchingPlaces = localizedPlaces.filter(p =>
      (!query || `${p.name} ${p.region} ${p.description}`.toLowerCase().includes(query.toLowerCase())) &&
      (!filter || p.period.toLowerCase().includes(filter.toLowerCase()))
    );

    const activePlace = localizedPlaces.find(x => x.id === active);

    return (
      <div className="page-wrap">
        <PageHead
          eyebrow={tr('МЕСТО · ВРЕМЯ · ИСТОЧНИК','ОРЫН · УАҚЫТ · ДЕРЕККӨЗ','PLACE · TIME · SOURCE')}
          title={msg('atlas')}
          lead={tr('Иллюстративная схема помогает исследовать темы региона. Положения точек условны, точные координаты не подтверждены.','Өңір тақырыптарын зерттеуге арналған иллюстрациялық схема. Нүктелердің орны шартты, нақты координаттар расталмаған.','An illustrative map for exploring regional themes. Marker positions are indicative and coordinates are unverified.')}
        />
        <div className="map-tools">
          <label className="catalog-search">
            <Search size={17}/>
            <input
              value={query}
              onChange={e=>setQuery(e.target.value)}
              placeholder={tr('Поиск места…','Орын іздеу…','Search places…')}
              aria-label={tr('Поиск места','Орын іздеу','Search places')}
            />
          </label>
          <select value={filter} onChange={e=>setFilter(e.target.value)} aria-label={msg('category')}>
            <option value="">{tr('Все периоды','Барлық кезеңдер','All periods')}</option>
            <option value={tr('XX век','XX ғасыр','20th c.')}>{tr('XX век','XX ғасыр','20th century')}</option>
            <option value={tr('не подтверждён','расталмаған','unverified')}>{tr('Без подтверждённой даты','Күні белгісіз','Undated')}</option>
          </select>
        </div>
        <div className="atlas-layout">
          <SchematicMap active={active} onPick={setActive} markers={matchingPlaces}/>
          <aside className="place-list">
            <span className="eyebrow">{tr('ТОЧКИ НА СХЕМЕ','СХЕМАДАҒЫ НҮКТЕЛЕР','SCHEMATIC LOCATIONS')}</span>
            {matchingPlaces.map(p=>(
              <button
                type="button"
                className={`place-row ${active===p.id?'selected':''}`}
                key={p.id}
                onClick={()=>setActive(p.id)}
                aria-pressed={active===p.id}
              >
                <MapPin size={16}/>
                <span>
                  <b>{p.name}</b>
                  <small>{p.period}</small>
                </span>
                <ArrowUpRight size={14}/>
              </button>
            ))}
            {matchingPlaces.length===0&&<p className="place-list-empty">{msg('noResults')}</p>}
            {activePlace&&(
              <div className="place-detail">
                <button type="button" className="detail-close" onClick={()=>setActive('')} aria-label={msg('close')}>×</button>
                <span className="eyebrow">{msg('illustrativeMaterial')}</span>
                <h3>{activePlace.name}</h3>
                <p>{activePlace.description}</p>
                <Link href={`/catalog?q=${encodeURIComponent(activePlace.name)}`}>
                  {msg('related')} <ArrowRight size={13}/>
                </Link>
              </div>
            )}
          </aside>
        </div>
      </div>
    );
  }

  if(kind==='exhibitions'){
    const exhibitionFilterOptions = [
      tr('Все','Барлығы','All'),
      tr('Пространство','Кеңістік','Space'),
      tr('Документы','Құжаттар','Documents'),
      tr('Карты','Карталар','Maps')
    ];

    const matchingExhibitions = localizedExhibitions.filter(x =>
      !filter || filter === tr('Все','Барлығы','All') || x.category === filter
    );

    return (
      <div className="page-wrap">
        <PageHead
          eyebrow={tr('ТЕМАТИЧЕСКИЕ ВЫСТАВКИ','ТАҚЫРЫПТЫҚ КӨРМЕЛЕР','THEMATIC EXHIBITIONS')}
          title={msg('exhibitions')}
          lead={tr('Представлены редакционные концепции и иллюстрации. Они не являются официальными выставками архива.','Редакциялық тұжырымдамалар мен иллюстрациялар берілген. Олар архивтің ресми көрмелері болып табылмайды.','Editorial concepts and illustrations are shown here. They are not official archive exhibitions.')}
        />
        <div className="filter-chips">
          {exhibitionFilterOptions.map(x=>(
            <button
              type="button"
              className={filter===x || (!filter && x === tr('Все','Барлығы','All')) ? 'selected' : ''}
              key={x}
              onClick={()=>setFilter(x === tr('Все','Барлығы','All') ? '' : x)}
            >
              {x}
            </button>
          ))}
        </div>
        {matchingExhibitions.length? <div className="exhibition-grid">
          {matchingExhibitions.map((x,i)=>(
            <Link className={`exhibition-card ${i===0?'featured-exhibition':''}`} href={`/exhibitions/${x.slug}`} key={x.slug}>
              <div className="exhibition-image">
                <Image src={x.image} alt={tr('Иллюстративный материал к концепции выставки','Көрме тұжырымдамасына арналған иллюстрациялық материал','Illustration for the exhibition concept')} fill/>
                <span>{msg('exhibitionDemo').toUpperCase()}</span>
              </div>
              <div className="exhibition-copy">
                <span className="eyebrow">{x.category} · {x.year}</span>
                <h2>{x.title}</h2>
                <p>{x.intro}</p>
                <span className="text-link">
                  {tr('Открыть выставку','Көрмені ашу','Explore exhibition')} <ArrowUpRight size={14}/>
                </span>
              </div>
            </Link>
          ))}
        </div>:<div className="empty-state"><h2>{msg('noResults')}</h2><p>{msg('searchEmptyHint')}</p><button type="button" onClick={()=>setFilter('')}>{msg('resetFilters')}</button></div>}
      </div>
    );
  }

  if(kind==='news'){
    const matchingNews = localizedNews.filter(x =>
      (!filter || x.category === filter) &&
      (!query || `${x.title} ${x.excerpt}`.toLowerCase().includes(query.toLowerCase()))
    );

    return (
      <div className="page-wrap">
        <PageHead
          eyebrow={tr('ПУБЛИКАЦИИ','ЖАРИЯЛАНЫМДАР','PUBLICATIONS')}
          title={msg('news')}
          lead={tr('Ниже представлены редакционные образцы. Они не являются официальными сообщениями архива.','Төменде редакциялық үлгілер берілген. Олар архивтің ресми хабарламалары болып табылмайды.','Editorial samples are shown below. They are not official archive announcements.')}
        />
        <div className="news-toolbar">
          <label className="catalog-search">
            <Search size={16}/>
            <input
              value={query}
              onChange={e=>setQuery(e.target.value)}
              placeholder={tr('Поиск публикаций','Жарияланымдарды іздеу','Search articles')}
              aria-label={tr('Поиск публикаций','Жарияланымдарды іздеу','Search articles')}
            />
          </label>
          <select value={filter} onChange={e=>setFilter(e.target.value)} aria-label={msg('category')}>
            <option value="">{tr('Все рубрики','Барлық санаттар','All categories')}</option>
            {Array.from(new Set(localizedNews.map(x=>x.category))).map(x=>(
              <option key={x} value={x}>{x}</option>
            ))}
          </select>
        </div>
        {matchingNews.length? <div className="news-grid">
          {matchingNews.map((n)=>(
            <Link href={`/news/${n.slug}`} className="news-card" key={n.slug}>
              <span className="eyebrow">{n.category} · {n.date}</span>
              <h2>{n.title}</h2>
              <p>{n.excerpt}</p>
              <span className="text-link">
                {tr('Читать','Оқу','Read')} <ArrowUpRight size={14}/>
              </span>
            </Link>
          ))}
        </div>:<div className="empty-state"><h2>{msg('noResults')}</h2><p>{msg('searchEmptyHint')}</p><button type="button" onClick={()=>{setFilter('');setQuery('');}}>{msg('resetFilters')}</button></div>}
      </div>
    );
  }

  if(kind==='history'){
    return (
      <div className="page-wrap">
        <PageHead
          eyebrow={msg('historyRegionEyebrow')}
          title={msg('history')}
          lead={tr('Мультимедийный путеводитель по темам истории Восточного Казахстана. Проверенные истории и источники появятся после редакционной проверки.','Шығыс Қазақстан тарихы тақырыптарына арналған мультимедиалық жолбасшы. Тексерілген тарихтар редакциялық сараптамадан кейін жарияланады.','A thematic guide to East Kazakhstan history. Verified stories and sources await editorial review.')}
        />
        <div className="history-intro">
          <div>
            <span className="eyebrow">{tr('РЕГИОН В РАЗНЫХ ИСТОРИЯХ','ӨҢІР ТАРИХЫНЫҢ САН ҚЫРЫ','A REGION IN MANY STORIES')}</span>
            <h2>{tr('История складывается из голосов, мест и свидетельств.','Тарих дауыстардан, орындардан және деректерден құралады.','History is made of voices, places, and records.')}</h2>
          </div>
          <p>{msg('historyCalendarIntro')}</p>
        </div>
        <div className="history-topics">
          {['Города и поселения','Люди и биографии','Промышленность','Образование и наука','Культура','Исторические события','Сообщества и семьи'].map((t,i)=>(
            <Link href={`/catalog?q=${encodeURIComponent(t)}`} className="history-topic" key={t}>
              <h3>
                {locale==='en'
                  ?['Cities & settlements','People & biographies','Industry','Education & science','Culture','Historical events','Communities & families'][i]
                  :locale==='kk'
                  ?['Қалалар мен елді мекендер','Тұлғалар мен өмірбаяндар','Өнеркәсіп','Білім және ғылым','Мәдениет','Тарихи оқиғалар','Қауымдар мен отбасылар'][i]
                  :t}
              </h3>
              <ArrowUpRight size={16}/>
            </Link>
          ))}
        </div>
        <Calendar2026/>
        <div className="topic-materials">
          <span className="eyebrow">{msg('historySampleMaterials')}</span>
          <h2>{tr('Из каталога','Каталогтан','From the catalogue')}</h2>
          <div className="related-grid">
            {documents.slice(0,3).map(d=>(
              <Link href={`/document/${d.id}`} key={d.id}>
                <Image src={d.image} alt="" width={200} height={120}/>
                <span>{d.category} · {msg('sampleRecord')}</span>
                <b>{d.title}</b>
              </Link>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return null;
}

function PageHead({eyebrow,title,lead}:{eyebrow:string;title:string;lead:string}){
  return (
    <header className="page-hero">
      <div className="breadcrumb">
        <Link href="/">ALTAI ARCHIVE</Link> <span>/</span> {title}
      </div>
      <span className="eyebrow">{eyebrow}</span>
      <h1>{title}</h1>
      <p>{lead}</p>
    </header>
  );
}

function SchematicMap({active,onPick,markers}:{active:string;onPick:(id:string)=>void;markers:{id:string;name:string;x:number;y:number}[]}){
  const{locale}=useApp();
  return (
    <div className="schematic-map" role="group" aria-label={locale==='ru'?'Схематическая карта региона':locale==='kk'?'Өңірдің схемалық картасы':'Schematic map of the region'}>
      <div className="map-water"/>
      <svg className="map-lines" viewBox="0 0 800 500" preserveAspectRatio="none" aria-hidden="true">
        <path d="M0 330 Q130 235 210 294T390 250 580 294 800 125"/>
        <path d="M0 155Q120 210 214 163T432 190 640 114 800 180"/>
        <path d="M92 0Q164 120 117 203T140 500M387 0q-58 114 0 203t-5 297M644 0q57 129-2 229t54 271"/>
        <path d="M0 420Q196 360 295 388T514 390 800 330"/>
      </svg>
      <span className="map-title">ALTAI<br/>REGION</span>
      <span className="map-disclaimer">
        {locale==='ru'?'СХЕМАТИЧЕСКАЯ КАРТА · БЕЗ ТОЧНЫХ КООРДИНАТ':locale==='kk'?'СХЕМАЛЫҚ КАРТА · ДӘЛ КООРДИНАТТАРСЫЗ':'ILLUSTRATIVE MAP · NO VERIFIED COORDINATES'}
      </span>
      {markers.map((m,i)=>(
        <button
          key={m.id}
          type="button"
          className={`map-pin ${active===m.id?'active':''}`}
          style={{left:`${m.x}%`,top:`${m.y}%`}}
          onClick={()=>onPick(m.id)}
          aria-label={m.name}
          aria-pressed={active===m.id}
        >
          <i/>
          {i===0&&<span>{m.name}</span>}
        </button>
      ))}
      <div className="map-scale">N ↑<br/>SCHEMATIC</div>
    </div>
  );
}

function Assistant(){
  const{msg,locale}=useApp();
  const[query,setQuery]=useState('');
  const[answer,setAnswer]=useState<{text:string;ids:string[];guide:boolean}|null>(null);

  const topics =
    locale==='kk'
      ?['Каталог қалай құрылған?','Фотосуреттерді табу','Тізімдеме деген не?']
      :locale==='en'
      ?['How is catalogue structured?','Find photographs','What is an inventory?']
      :['Как устроен каталог?','Найти фотографии','Что такое опись?'];

  const submit=(e:React.FormEvent)=>{
    e.preventDefault();
    const q=query.toLowerCase();
    const guide=/(каталог|структур|фонд|опись|дело|catalog|fond|inventory|hierarch|архив|қор|тізімдеме|іс)/i.test(q);
    const results=documents.filter(d=>`${d.title} ${d.description} ${d.category} ${d.tags}`.toLowerCase().split(/[ ,]+/).some(t=>t.length>2&&q.includes(t)));
    const text=guide
      ?(locale==='ru'
        ?'В справочном примере показана цепочка: архив → фонд → опись → дело → документ → страницы. Это схема описания в интерфейсе, а не подтверждённая структура учёта архива.'
        :locale==='kk'
        ?'Анықтамалық мысалда мына тізбек көрсетілген: архив → қор → тізімдеме → іс → құжат → беттер. Бұл интерфейстегі сипаттама схемасы, архивтің расталған есеп жүйесі емес.'
        :'The guidance example shows this sequence: archive → fond → inventory → case → document → pages. It illustrates the interface, not a verified archival arrangement.')
      :results.length
      ?(locale==='ru'
        ?'В образцах описаний есть совпадения. Это локальный поиск без AI; он не подтверждает наличие архивного дела.'
        :locale==='kk'
        ?'Сипаттама үлгілерінен сәйкестіктер табылды. Бұл AI қолданбайтын жергілікті іздеу, архивтік істің бар екенін растамайды.'
        :'There are matches in the description samples. This is local search without AI; it does not confirm the existence of an archival file.')
      :(locale==='ru'
        ?'В образцах описаний совпадений нет. Этот локальный поиск не охватывает полный состав архивных фондов.'
        :locale==='kk'
        ?'Сипаттама үлгілерінен сәйкестік табылмады. Бұл жергілікті іздеу архив қорларының толық құрамын қамтымайды.'
        :'No matches were found in the description samples. This local search does not cover the archive’s full holdings.');
    setAnswer({text,ids:results.map(x=>x.id).slice(0,3),guide});
  };

  return (
    <div className="page-wrap assistant-page">
      <PageHead
        eyebrow={msg('aiLocalSearch')}
        title={msg('assistant')}
        lead={msg('ask')}
      />
      <div className="assistant-disclosure">
        <Sparkles size={17}/>
        <span>{msg('assistantDisclosure')}</span>
      </div>
      <div className="assistant-layout">
        <aside className="assistant-aside">
          <div className="assistant-emblem">
            <MessageCircle size={28}/>
          </div>
          <span className="eyebrow">ALTAI ARCHIVE · {msg('aiLocalSearch')}</span>
          <h2>
            {locale==='ru'
              ?'Помогаю ориентироваться в материалах'
              :locale==='kk'
              ?'Материалдарды бағдарлауға көмектесемін'
              :'Explore sample records with local guidance'}
          </h2>
          <p>
            {locale==='ru'
              ?'Можно спросить о каталоге, архивной иерархии или поиске опубликованных материалов.'
              :locale==='kk'
              ?'Каталог құрылымы, архивтік иерархия немесе жарияланған материалдар туралы сұрауға болады.'
              :'Ask about the catalogue, archival hierarchy, or finding published materials.'}
          </p>
          <div className="assistant-topics">
            {topics.map(t=>(
              <button type="button" key={t} onClick={()=>setQuery(t)}>
                {t}
                <ArrowUpRight size={13}/>
              </button>
            ))}
          </div>
        </aside>
        <section className="chat-panel">
          <div className="chat-head">
            <span className="online-dot"/>
            {locale==='ru'?'Локальный поиск':locale==='kk'?'Жергілікті іздеу':'Local search'} <small>{locale==='en'?'NO AI':locale==='kk'?'AI қолданылмайды':'БЕЗ AI'}</small>
          </div>
          <div className="chat-messages">
            <div className="chat-bubble assistant-bubble">
              {locale==='ru'
                ?'Здравствуйте. Я могу показать примеры описаний и объяснить структуру каталога. Поиск выполняется локально без AI.'
                :locale==='kk'
                ?'Сәлеметсіз бе. Сипаттама үлгілерін көрсетіп, каталог құрылымын түсіндіре аламын. Іздеу AI қолданбай жергілікті орындалады.'
                :'Hello. I can show sample descriptions and explain the catalogue structure. Search runs locally without AI.'}
            </div>
            {answer&&(
              <>
                <div className="chat-bubble user-bubble">{query}</div>
                <div className="chat-bubble assistant-bubble">
                  {answer.text}
                  {answer.ids.length>0&&(
                    <div className="assistant-results">
                      {answer.ids.map(id=>{
                        const d=documents.find(x=>x.id===id)!;
                        return (
                          <Link href={`/document/${id}`} key={id}>
                            <BookOpen size={14}/>
                            <span>
                              {d.title}
                              <small>{d.category} · {msg('sampleRecord')}</small>
                            </span>
                            <ArrowUpRight size={13}/>
                          </Link>
                        );
                      })}
                    </div>
                  )}
                  {answer.guide&&(
                    <Link className="assistant-guide-link" href="/catalog">
                      {msg('catalog')} <ArrowRight size={13}/>
                    </Link>
                  )}
                </div>
              </>
            )}
          </div>
          <form className="chat-input" onSubmit={submit}>
            <input
              value={query}
              onChange={e=>setQuery(e.target.value)}
              placeholder={msg('askPlaceholder')}
              aria-label={msg('askPlaceholder')}
            />
            <button type="submit" aria-label={msg('send')}>
              <Send size={16}/>
            </button>
          </form>
          <small className="chat-foot">
            {locale==='ru'
              ?'Справочные ответы и поиск по образцам · внешняя AI-служба не используется'
              :locale==='kk'
              ?'Үлгілер бойынша анықтама және іздеу · сыртқы AI қызметі пайдаланылмайды'
              :'Guidance and sample search · no external AI service is used'}
          </small>
        </section>
      </div>
    </div>
  );
}
