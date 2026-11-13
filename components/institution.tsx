'use client';
import Link from 'next/link';
import {useState} from 'react';
import {ArrowRight,ArrowUpRight,Clock3,ExternalLink,MapPin,Phone,BookOpen,Search} from 'lucide-react';
import {branches,mainArchive,getLocalizedBranchTitle,type ArchiveLocation} from '@/data/archive';
import {useApp} from './providers';
import {FeedbackForm} from './feedback-form';
import {formatCity,formatInstitutionName,formatOfficeHours} from '@/locales/messages';

export function InstitutionPage(){
  const{msg,locale}=useApp();
  const instName=formatInstitutionName(locale);

  return (
    <div className="page-wrap institution-page">
      <header className="page-hero">
        <div className="breadcrumb">
          {formatInstitutionName(locale)} <span>/</span> {msg('about')}
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
          <span className="eyebrow">{locale==='ru'?'ЦИФРОВОЕ НАСЛЕДИЕ':locale==='kk'?'ЦИФРЛЫҚ МҰРА':'DIGITAL HERITAGE'}</span>
          <h2>
            {locale==='ru'
              ?'История, сохранённая для будущего'
              :locale==='kk'
              ?'Болашақ үшін сақталған тарих'
              :'History, preserved for the future'}
          </h2>
          <p>
            {locale==='ru'
              ?'Информационный портал помогает знакомиться с историческими материалами Восточного Казахстана. Он не является официальным сайтом учреждения.'
              :locale==='kk'
              ?'Ақпараттық портал Шығыс Қазақстанның тарихи материалдарымен танысуға көмектеседі. Бұл мекеменің ресми сайты емес.'
              :'This information portal introduces historical materials from East Kazakhstan. It is not the institution’s official website.'}
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
              ?`${branches.length} действующих филиалов по постановлению №142 от 02.06.2026 · адреса указаны по таблице заказчика и требуют проверки`
              :locale==='kk'
              ?`02.06.2026 жылғы №142 қаулы бойынша ${branches.length} филиал · мекенжайларды тексеру қажет`
              :`${branches.length} branches listed by decree No. 142 dated 2 June 2026 · customer-supplied addresses need verification`}
          </p>
        </div>
        <div>
          <h3>{locale==='ru'?'Цифровая платформа':locale==='kk'?'Цифрлық платформа':'Digital platform'}</h3>
          <p>{locale==='ru'?'Информационный портал':locale==='kk'?'Ақпараттық портал':'Information portal'}</p>
        </div>
      </section>

      <section className="institution-notice" aria-labelledby="archive-contacts-title">
        <span className="eyebrow">{locale==='ru'?'КОНТАКТЫ И ГОСУДАРСТВЕННАЯ УСЛУГА':locale==='kk'?'БАЙЛАНЫС ЖӘНЕ МЕМЛЕКЕТТІК ҚЫЗМЕТ':'CONTACTS AND GOVERNMENT SERVICE'}</span>
        <h2 id="archive-contacts-title">{locale==='ru'?'Государственный архив ВКО':locale==='kk'?'ШҚО мемлекеттік архиві':'East Kazakhstan State Archive'}</h2>
        <p><b>{locale==='ru'?'Полное наименование в актуальной записи госзакупок:':locale==='kk'?'Мемлекеттік сатып алу жазбасындағы толық атауы:':'Full name in the current procurement record:'}</b> {mainArchive.name}</p>
        <p>{locale==='ru'?'Адрес и электронная почта приведены в записи государственного портала закупок. Телефон и часы приёма в текущем официальном источнике не указаны.':locale==='kk'?'Мекенжай мен электрондық пошта мемлекеттік сатып алу порталындағы жазбада көрсетілген. Қазіргі ресми дереккөзде телефон мен қабылдау уақыты жоқ.':'The address and email are listed in a government procurement record. The current official record does not list a phone number or public hours.'}</p>
        <address>{locale==='ru'?'Адрес: ':locale==='kk'?'Мекенжайы: ':'Address: '}{mainArchive.address}<br/>{locale==='ru'?'Эл. почта: ':locale==='kk'?'Электрондық пошта: ':'Email: '}<a href={`mailto:${mainArchive.email}`}>{mainArchive.email}</a></address>
        <a href={mainArchive.sourceUrl||'#'} target="_blank" rel="noopener noreferrer">{locale==='ru'?'Источник контактов · портал госзакупок РК':locale==='kk'?'Байланыс дереккөздері · ҚР мемлекеттік сатып алу порталы':'Contact source · Kazakhstan public procurement portal'} <ArrowUpRight size={14}/></a>
        <a href={`https://2gis.kz/oskemen/search/${encodeURIComponent(mainArchive.address||'')}`} target="_blank" rel="noopener noreferrer">{locale==='ru'?'Найти адрес архива в 2ГИС':locale==='kk'?'Архив мекенжайын 2GIS-тен іздеу':'Find the archive address in 2GIS'} <ArrowUpRight size={14}/></a>
        <p>{locale==='ru'?'Курирующий орган — Управление цифровизации и архивов ВКО: ул. Казахстан, 59/1; +7 (7232) 71-33-13; uca@akimvko.gov.kz. Это контакты управления, а не архива.':locale==='kk'?'Жетекшілік ететін орган — ШҚО цифрландыру және архивтер басқармасы: Қазақстан көшесі, 59/1; +7 (7232) 71-33-13; uca@akimvko.gov.kz. Бұл архивтің емес, басқарманың байланысы.':'Supervising authority — East Kazakhstan Department of Digitalization and Archives: 59/1 Kazakhstan Street; +7 (7232) 71-33-13; uca@akimvko.gov.kz. These are the authority’s contacts, not the archive’s.'}</p>
        <a href="https://egov.kz/cms/ru/articles/department_of_archives" target="_blank" rel="noopener noreferrer">{locale==='ru'?'Контакты управлений архивов на eGov.kz':locale==='kk'?'Архив басқармаларының байланыстары · eGov.kz':'Archive authorities directory · eGov.kz'} <ArrowUpRight size={14}/></a>
        <a href="https://egov.kz/services/K002/" target="_blank" rel="noopener noreferrer">{locale==='ru'?'Заказать архивную справку на eGov.kz':locale==='kk'?'Архивтік анықтамаға eGov.kz арқылы өтініш беру':'Apply for an archival certificate on eGov.kz'} <ArrowUpRight size={14}/></a>
      </section>

      <section className="institution-structure" aria-labelledby="institution-structure-title">
        <div className="institution-structure-heading">
          <span className="eyebrow">{locale==='ru'?'ОРГАНИЗАЦИОННАЯ СТРУКТУРА · ИСТОЧНИК ЗАКАЗЧИКА':locale==='kk'?'ҰЙЫМДЫҚ ҚҰРЫЛЫМ · ТАПСЫРЫС БЕРУШІНІҢ ДЕРЕККӨЗІ':'ORGANIZATION STRUCTURE · CUSTOMER SOURCE'}</span>
          <h2 id="institution-structure-title">{locale==='ru'?'Руководство и отделы':locale==='kk'?'Басшылық және бөлімдер':'Management and departments'}</h2>
        </div>
        <div className="institution-director">
          <b>{locale==='ru'?'Директор':locale==='kk'?'Директор':'Director'}</b>
          <span>Жапаров Аскар Кенжебаевич</span>
          <small>{locale==='ru'?'Имя указано в документе о структуре и в государственной закупке от 21.08.2026; эта дата подтверждает только запись в документе, но не гарантирует, что должность не менялась позже.':locale==='kk'?'Аты құрылым құжатында және 2026 жылғы 21 тамыздағы мемлекеттік сатып алу жазбасында көрсетілген. Бұл тек сол жазбадағы деректі растайды, кейін лауазым өзгермегеніне кепіл емес.':'Named in the supplied organization chart and an official procurement record dated 21 Aug 2026. This confirms that record only; it does not guarantee no later change.'}</small>
          <a href="https://procurement.gov.kz/ru/announce/index/17537922" target="_blank" rel="noreferrer">{locale==='ru'?'Проверить запись госзакупки':locale==='kk'?'Мемлекеттік сатып алу жазбасын көру':'View procurement record'} <ArrowRight size={14}/></a>
        </div>
        <div className="institution-org-connector" aria-hidden="true">↓</div>
        <div className="institution-management" aria-label={locale==='ru'?'Заместители директора':locale==='kk'?'Директор орынбасарлары':'Deputy directors'}>
          <article className="institution-org-card">
            <b>{locale==='ru'?'Заместитель директора':locale==='kk'?'Директордың орынбасары':'Deputy Director'}</b>
            <span>Костина Елена Валерьевна</span>
          </article>
          <article className="institution-org-card">
            <b>{locale==='ru'?'Заместитель директора':locale==='kk'?'Директордың орынбасары':'Deputy Director'}</b>
            <span>{locale==='ru'?'Имя в документе не указано':locale==='kk'?'Құжатта аты көрсетілмеген':'Name not provided in the source document'}</span>
          </article>
        </div>
        <div className="institution-org-connector" aria-hidden="true">↓</div>
        <h3 className="institution-departments-title">{locale==='ru'?'Отделы и руководители':locale==='kk'?'Бөлімдер мен басшылары':'Departments and heads'}</h3>
        <div className="institution-departments">
          {([
            {ru:'Отдел финансовой и кадровой работы',kk:'Қаржы және кадр жұмысы бөлімі',en:'Finance and Human Resources',people:[['Главный бухгалтер','Бас бухгалтер','Chief Accountant','Калиева Мадина Саматовна'],['Инспектор по кадрам','Кадр инспекторы','HR Inspector','Увальжанова Кульмира Оспановна']]},
            {ru:'Отдел административно-хозяйственной части',kk:'Әкімшілік-шаруашылық бөлімі',en:'Administrative and Facilities',people:[['Специалист по АХЧ','Әкімшілік-шаруашылық маманы','Facilities Specialist','Мутагалиев Аскат Кумаргалиевич']]},
            {ru:'Сохранность и государственный учёт документов',kk:'Құжаттарды сақтау және мемлекеттік есепке алу',en:'Document Preservation and State Records',people:[['Главный хранитель фондов · руководитель отдела','Қорлардың бас сақтаушысы · бөлім басшысы','Chief Custodian · Department Head','Баелова Альмира Тугельбаевна']]},
            {ru:'Отдел комплектования и контроля за ведомственными архивами',kk:'Жинақтау және ведомстволық архивтерді бақылау бөлімі',en:'Acquisitions and Departmental Archives Oversight',people:[['Руководитель отдела','Бөлім басшысы','Department Head','Сарсембаева Галия Еркеновна']]},
            {ru:'Отдел научно-справочного аппарата, публикации и научного использования документов',kk:'Ғылыми-анықтамалық аппарат, құжаттарды жариялау және ғылыми пайдалану бөлімі',en:'Reference Tools, Publications and Scholarly Use',people:[['Руководитель отдела','Бөлім басшысы','Department Head','Шустова Татьяна Владимировна']]},
            {ru:'Отдел информационных технологий',kk:'Ақпараттық технологиялар бөлімі',en:'Information Technology',people:[['Руководитель отдела','Бөлім басшысы','Department Head','Бекниязқызы Жангуль']]},
            {ru:'Отдел экспертизы ценности документов',kk:'Құжаттардың құндылығын сараптау бөлімі',en:'Records Appraisal',people:[['Руководитель отдела','Бөлім басшысы','Department Head','Рахимбаева Акмарал Токтамысовна']]},
          ] as const).map(unit=><article className="institution-department-card" key={unit.ru}>
            <h4>{locale==='ru'?unit.ru:locale==='kk'?unit.kk:unit.en}</h4>
            {unit.people.map(([roleRu,roleKk,roleEn,name])=><div className="institution-employee" key={name}><b>{locale==='ru'?roleRu:locale==='kk'?roleKk:roleEn}</b><span>{name}</span></div>)}
          </article>)}
        </div>
        <p className="institution-structure-caveat">{locale==='ru'?'Данные приведены по документу «Структура.docx», переданному архивом; дата его актуальности не указана. Документ показывает должности и подразделения, но не уточняет, какие отделы закреплены за каждым заместителем. Второй заместитель указан без имени. Телефоны и электронные адреса сотрудников не публикуются. Названия подразделений на казахском и английском — навигационный перевод, не утверждённый архивом.':locale==='kk'?'Мәліметтер архив берген «Структура.docx» құжаты бойынша келтірілген; оның өзектілік күні көрсетілмеген. Құжатта лауазымдар мен бөлімдер бар, бірақ бөлімдердің әр орынбасарға бекітілуі нақтыланбаған. Екінші орынбасар аты-жөнсіз көрсетілген. Қызметкерлердің телефондары мен электрондық пошталары жарияланбайды. Бөлім атауларының қазақша және ағылшынша нұсқалары — архив бекітпеген навигациялық аударма.':'Based on the archive-supplied “Структура.docx”; its effective date is not stated. The source lists positions and departments but does not specify which departments report to each deputy. The second deputy position has no name in the source. Staff phone numbers and email addresses are omitted. Kazakh and English department names are navigation translations, not archive-approved.'}</p>
        <a className="outline-link" href="https://www.gov.kz/org/vko-uca/about/structure" target="_blank" rel="noreferrer">{locale==='ru'?'Официальная структура курирующего управления':locale==='kk'?'Жетекшілік ететін басқарманың ресми құрылымы':'Official structure of the supervising department'} <ArrowRight size={15}/></a>
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
        <FeedbackForm/>
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
    return getLocalizedBranchTitle(b,locale);
  };

  return (
    <div className="page-wrap branches-page">
      <header className="page-hero">
        <div className="breadcrumb">
          {formatInstitutionName(locale)} <span>/</span> {msg('about')}
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
                <small>{selected.address ? `${selected.address}${selected.postalCode?`, ${selected.postalCode}`:''}` : msg('unconfirmed')}</small>
              </span>
            </div>
            <div>
              <Phone size={16}/>
              <span>
                <b>{msg('phone')}</b>
                <small>{selected.phone ? selected.phone.split(',').map(number=><a key={number} href={`tel:${number.replace(/\D/g,'')}`}>{number.trim()}</a>) : msg('unconfirmed')}</small>
              </span>
            </div>
            <div>
              <Clock3 size={16}/>
              <span>
                <b>{msg('hours')}</b>
                <small>{selected.id==='main'&&selected.hours ? formatOfficeHours(locale) : selected.hours || msg('unconfirmed')}</small>
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

          {selected.kind==='main'&&selected.websiteUrl&&<a className="outline-link branch-route" href={selected.websiteUrl} target="_blank" rel="noreferrer">{msg('archiveOfficialSite')} <ExternalLink size={15}/></a>}

          {selected.address&&selected.addressStatus==='official-listing'&&<a className="outline-link branch-route" href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(selected.address)}`} target="_blank" rel="noreferrer"><MapPin size={15}/>{msg('branchRoute')}</a>}
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
