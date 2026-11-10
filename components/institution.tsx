'use client';
import Link from 'next/link';
import {useState} from 'react';
import {ArrowRight,ArrowUpRight,Clock3,ExternalLink,MapPin,Phone,BookOpen,Search} from 'lucide-react';
import {branches,mainArchive,type ArchiveLocation} from '@/data/archive';
import {useApp} from './providers';
import {formatCity,formatInstitutionName} from '@/locales/messages';

export function InstitutionPage(){
  const{msg,locale}=useApp();
  const instName=formatInstitutionName(locale);

  return (
    <div className="page-wrap institution-page">
      <header className="page-hero">
        <div className="breadcrumb">
          ALTAI ARCHIVE <span>/</span> {msg('about')}
        </div>
        <span className="eyebrow">
          {locale==='ru'?'ПЛАТФОРМА ЦИФРОВОГО НАСЛЕДИЯ':locale==='kk'?'ЦИФРЛЫҚ МҰРА ПЛАТФОРМАСЫ':'DIGITAL HERITAGE PLATFORM'}
        </span>
        <h1>{instName}</h1>
        <p>
          {locale==='en'
            ?'The institution’s official English name is not confirmed; shown in official form.'
            :locale==='kk'
            ?'Тарих, құрылым және өкілеттіктер туралы мәліметтер расталған ресми дереккөздер бойынша жарияланады.'
            :'Сведения об истории, структуре и полномочиях публикуются по подтверждённым институциональным источникам.'}
        </p>
      </header>

      <section className="institution-story">
        <div className="institution-copy">
          <span className="eyebrow">ALTAI ARCHIVE · {locale==='ru'?'ЦИФРОВАЯ ПЛАТФОРМА':locale==='kk'?'ЦИФРЛЫҚ ПЛАТФОРМА':'DIGITAL PLATFORM'}</span>
          <h2>
            {locale==='ru'
              ?'История, сохранённая для будущего'
              :locale==='kk'
              ?'Болашақ үшін сақталған тарих'
              :'History, preserved for the future'}
          </h2>
          <p>
            {locale==='ru'
              ?'ALTAI ARCHIVE — цифровая платформа для знакомства с историческими материалами Восточного Казахстана. Она не является новым официальным наименованием учреждения.'
              :locale==='kk'
              ?'ALTAI ARCHIVE — Шығыс Қазақстанның тарихи материалдарымен танысуға арналған цифрлық платформа. Бұл мекеменің жаңа ресми атауы емес.'
              :'ALTAI ARCHIVE is the digital heritage platform identity. It is not a new legal or official name for the archive.'}
          </p>
          <Link href="/branches" className="outline-link">
            {msg('branches')} <ArrowRight size={15}/>
          </Link>
        </div>
        <aside className="institution-identity">
          <span className="identity-rule"/>
          <span className="identity-label">
            {locale==='ru'?'ОФИЦИАЛЬНОЕ НАИМЕНОВАНИЕ':locale==='kk'?'РЕСМИ АТАУЫ':'OFFICIAL INSTITUTION NAME'}
          </span>
          <h2>{instName}</h2>
          <p>
            {locale==='en'
              ?'The official institution name is shown in Russian and Kazakh where no verified English translation is available.'
              :locale==='kk'
              ?'Шығыс Қазақстан облысының мемлекеттік архиві.'
              :'Государственный архив Восточно-Казахстанской области.'}
          </p>
        </aside>
      </section>

      <section className="institution-facts">
        <div>
          <h3>{msg('headInstitution')}</h3>
          <p>{instName}</p>
        </div>
        <div>
          <h3>{msg('branches')}</h3>
          <p>
            {locale==='ru'
              ?`${branches.length} строк филиальной таблицы · требуется редакторская проверка`
              :locale==='kk'
              ?`Филиалдар кестесіндегі ${branches.length} жазба · редактор тексеруі қажет`
              :`${branches.length} branch entries from the supplied directory · editorial review pending`}
          </p>
        </div>
        <div>
          <h3>{locale==='ru'?'Цифровая платформа':locale==='kk'?'Цифрлық платформа':'Digital platform'}</h3>
          <p>ALTAI ARCHIVE · {msg('demo')}</p>
        </div>
      </section>

      <div className="institution-notice">
        <p>{msg('archiveHistoryContext')}</p>
        <a href="https://www.gov.kz/org/vko-cultura-arhiv/press/events/details/1292" target="_blank" rel="noreferrer">{msg('archiveHistorySource')} <ArrowUpRight size={14}/></a>
        <small>{msg('branchCheckedAt')}: 10.11.2026 · {msg('archiveHistoryDateNote')}</small>
      </div>

      <Link className="text-link" href="/catalog">
        {msg('viewCatalogRecords')} <ArrowUpRight size={15}/>
      </Link>
      <section id="feedback" className="feedback-panel">
        <span className="eyebrow">{msg('feedback')}</span>
        <h2>{msg('feedbackTitle')}</h2>
        <p>{msg('feedbackText')}</p>
        <Link className="outline-link" href="/branches">{msg('branches')} <ArrowRight size={15}/></Link>
      </section>
    </div>
  );
}

export function BranchesDirectory(){
  const{msg,locale}=useApp();
  const[selectedId,setSelectedId]=useState('main');
  const[query,setQuery]=useState('');
  const matchingBranches=branches.filter(x=>`${x.shortName} ${x.city} ${x.address||''}`.toLocaleLowerCase().includes(query.trim().toLocaleLowerCase()));

  const selected: ArchiveLocation =
    selectedId === 'main'
      ? mainArchive
      : branches.find(x => x.id === selectedId) || mainArchive;

  const branchTitle = (b: ArchiveLocation) => {
    if (b.kind === 'main') return formatInstitutionName(locale);
    if (b.id === 'branch-ust-kamenogorsk-personnel') {
      return locale === 'kk'
        ? 'Өскемен жеке құрам бойынша филиалы'
        : locale === 'en'
        ? 'Oskemen Personnel Branch'
        : 'Усть-Каменогорский филиал по личному составу';
    }
    if (b.id === 'branch-zaisan') {
      return locale === 'kk'
        ? 'Зайсан филиалы'
        : locale === 'en'
        ? 'Zaysan Branch'
        : 'Зайсанский филиал';
    }
    if (b.id === 'branch-ridder') {
      return locale === 'kk'
        ? 'Риддер филиалы'
        : locale === 'en'
        ? 'Ridder Branch'
        : 'Риддерский филиал';
    }
    return b.shortName;
  };

  return (
    <div className="page-wrap branches-page">
      <header className="page-hero">
        <div className="breadcrumb">
          ALTAI ARCHIVE <span>/</span> {msg('about')}
        </div>
        <span className="eyebrow">{formatInstitutionName(locale)}</span>
        <h1>{msg('branchesTitle')}</h1>
        <p>{msg('branchesSub')}</p>
      </header>

      <div className="branch-network-layout">
        <section className="branch-network" aria-label={msg('structureNotice')}>
          <label className="catalog-search branch-search"><Search size={16}/><input value={query} onChange={e=>setQuery(e.target.value)} placeholder={msg('branchSearch')} aria-label={msg('branchSearch')}/></label>
          <div className="network-heading">
            <span className="eyebrow">{msg('institutionalStructure')}</span>
          </div>

          <div className="network-root">
            <button
              type="button"
              className={`network-node main-node ${selectedId==='main'?'selected':''}`}
              onClick={()=>setSelectedId('main')}
              aria-pressed={selectedId==='main'}
            >
              <span className="node-kind">{msg('headInstitution')}</span>
              <b>{formatInstitutionName(locale)}</b>
              <small><MapPin size={13}/> {formatCity(mainArchive.city, locale)}</small>
            </button>
          </div>

          <div className="network-branches">
            {matchingBranches.map(branch => {
              const isSelected = selectedId === branch.id;
              const statusLabel = branch.affiliationStatus === 'official-listing'
                ? msg('officialListing')
                : branch.affiliationStatus === 'source-listing'
                  ? msg('branchSourceListing')
                  : msg('lastMentioned2019');

              return (
                <button
                  type="button"
                  key={branch.id}
                  className={`network-node branch-node ${isSelected?'selected':''}`}
                  onClick={()=>setSelectedId(branch.id)}
                  aria-pressed={isSelected}
                >
                  <span className="node-kind">{statusLabel}</span>
                  <b>{branchTitle(branch)}</b>
                  <small><MapPin size={13}/> {formatCity(branch.city, locale)}</small>
                </button>
              );
            })}
          </div>
        </section>

        <section className="branch-detail" aria-live="polite">
          <div className="branch-detail-title">
            <div>
              <span className="eyebrow">
                {selected.kind === 'main'
                  ? msg('headInstitution')
                  : selected.affiliationStatus === 'official-listing'
                  ? msg('officialListing')
                  : selected.affiliationStatus === 'source-listing'
                  ? msg('branchSourceListing')
                  : msg('lastMentioned2019')}
              </span>
              <h2>{branchTitle(selected)}</h2>
            </div>
            <span className="branch-city">
              <MapPin size={16}/>
              {formatCity(selected.city, locale)}
            </span>
          </div>

          <p className="branch-affiliation">
            <b>{msg('affiliation')}</b>
            <br/>
            {selected.affiliation}
          </p>

          <div className="branch-contact-grid">
            <div>
              <MapPin size={16}/>
              <span>
                <b>{msg('address')}</b>
                <small>{selected.address || msg('unconfirmed')}</small>
              </span>
            </div>
            <div>
              <Phone size={16}/>
              <span>
                <b>{msg('phone')}</b>
                <small>{selected.phone || msg('unconfirmed')}</small>
              </span>
            </div>
            <div>
              <Clock3 size={16}/>
              <span>
                <b>{msg('hours')}</b>
                <small>{selected.hours || msg('unconfirmed')}</small>
              </span>
            </div>
            <div>
              <ExternalLink size={16}/>
              <span>
                <b>{msg('email')}</b>
                <small>{selected.email || msg('unconfirmed')}</small>
              </span>
            </div>
          </div>

          {selected.address&&<a className="outline-link branch-route" href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(selected.address)}`} target="_blank" rel="noreferrer"><MapPin size={15}/>{msg('branchRoute')}</a>}
          {selected.needsReview&&<p className="branch-review-note" role="note">{msg('branchReviewNotice')} {selected.reviewNotes.join(' ')}</p>}

          <div className="branch-context-panel">
            {selected.kind === 'main' ? (
              <div className="branch-archive-context">
                <span className="eyebrow">{msg('historicalNote')}</span>
                <p>{msg('mainArchiveHistory')}</p>
                <Link className="text-link" href="/catalog">
                  <BookOpen size={14}/> {msg('viewCatalogRecords')} <ArrowRight size={14}/>
                </Link>
              </div>
            ) : (
              <div className="branch-archive-context">
                <span className="eyebrow">{msg('branchUnit')}</span>
                <p>
                  {locale === 'kk'
                    ? 'Дерек мекеме берген филиалдар кестесінен алынған. Өзектілігі мен жариялауға рұқсаты редактор тарапынан әлі тексерілмеген.'
                    : locale === 'en'
                    ? 'This entry comes from the supplied branch directory. Current accuracy and publication approval are awaiting editorial review.'
                    : 'Запись перенесена из предоставленной таблицы филиалов. Актуальность и разрешение на публикацию ожидают редакторской проверки.'}
                </p>
              </div>
            )}
          </div>

          <div className="branch-provenance">
            <span>{msg('sourceLabel')}: </span>
            {selected.sourceUrl?<a href={selected.sourceUrl} target="_blank" rel="noreferrer">{selected.sourceLabel} <ArrowUpRight size={13}/></a>:<span>{selected.sourceLabel}</span>}
            <span className="provenance-date"> · {selected.sourceDate}</span>
          </div>
        </section>
      </div>

      <aside className="branch-transfer-note">
        <b>{msg('boundaryChangeTitle')}</b>
        <p>{msg('boundaryChangeText')}</p>
        <a href="https://www.gov.kz/org/abay-cultura-arhiv/about/structure/10/1" target="_blank" rel="noreferrer">
          {msg('boundaryChangeLink')} <ArrowUpRight size={14}/>
        </a>
      </aside>
    </div>
  );
}
