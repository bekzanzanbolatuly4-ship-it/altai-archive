import type {Language} from './context.ts';
import type {Source} from './context.ts';

export type ReferenceIntent='greeting'|'platform'|'fund'|'catalogue'|'branches'|'official-documents'|'institution'|'site-sections';
type KnowledgeEntry={id:string;title:Record<Language,string>;description:Record<Language,string>;url:string;intent:ReferenceIntent};

const entries:KnowledgeEntry[]=[
 {id:'fund-definition',intent:'fund',url:'https://adilet.zan.kz/rus/docs/Z980000326_',title:{ru:'Законодательное определение архивного фонда',kk:'Архивтік қордың заңдағы анықтамасы',en:'Legal definition of an archive fund'},description:{ru:'Закон Республики Казахстан определяет архивный фонд как совокупность исторически или логически связанных между собой архивных документов.',kk:'Қазақстан Республикасының заңында архивтік қор тарихи немесе логикалық байланысы бар архивтік құжаттардың жиынтығы деп анықталған.',en:'Kazakhstan law defines an archive fund as a set of archival documents connected historically or logically.'}},
 {id:'catalogue-guide',intent:'catalogue',url:'/catalog',title:{ru:'Каталог ALTAI ARCHIVE',kk:'ALTAI ARCHIVE каталогы',en:'ALTAI ARCHIVE catalogue'},description:{ru:'Раздел /catalog — демонстрационный интерфейс. Карточки с пометкой «демо» не являются подлинными архивными делами. Поиск проверяет название, описание, категорию, фонд, опись, дело, дату и теги; доступны фильтры категории и диапазона дат, сортировка по релевантности и дате.',kk:'/catalog бөлімі — демонстрациялық интерфейс. «Демо» деп белгіленген карточкалар түпнұсқа архивтік істер емес. Іздеу атауды, сипаттаманы, санатты, қорды, тізімді, істі, күнді және тегтерді қарайды; санат пен күн аралығын сүзуге және сәйкестік не күн бойынша сұрыптауға болады.',en:'/catalog is a demonstration interface. Cards marked “demo” are not authentic archival files. Search covers title, description, category, fond, inventory, case, date and tags; category and date filters and relevance/date sorting are available.'}},
 {id:'branch-directory',intent:'branches',url:'/branches',title:{ru:'Каталог филиалов',kk:'Филиалдар каталогы',en:'Branch directory'},description:{ru:'Раздел /branches показывает справочник филиалов и происхождение сведений. Карточки, требующие проверки, так и помечены; точные координаты не подтверждены. Перед поездкой сверяйте адрес и актуальность с указанным источником.',kk:'/branches бөлімінде филиалдар анықтамалығы және мәліметтердің шығу тегі көрсетілген. Тексеруді қажет ететін карточкалар солай белгіленген; нақты координаттар расталмаған. Бармас бұрын мекенжай мен өзектілігін дереккөзден тексеріңіз.',en:'/branches shows a branch directory and the provenance of its entries. Records needing review are labelled, and exact coordinates are unconfirmed. Check the address and current status against the cited source before visiting.'}},
 {id:'official-documents-guide',intent:'official-documents',url:'/official-documents',title:{ru:'Официальные документы и государственные ссылки',kk:'Ресми құжаттар мен мемлекеттік сілтемелер',en:'Official documents and government links'},description:{ru:'Раздел /official-documents содержит ссылки на официальную ИПС «Әділет» и gov.kz. ALTAI ARCHIVE не принимает государственные заявления, не оформляет заказы на архивные копии и не проводит оплату.',kk:'/official-documents бөлімінде «Әділет» ресми ақпараттық-құқықтық жүйесіне және gov.kz сайтына сілтемелер бар. ALTAI ARCHIVE мемлекеттік өтініштерді қабылдамайды, архивтік көшірмелерге тапсырыс рәсімдемейді және төлем қабылдамайды.',en:'/official-documents lists links to the official Adilet legal system and gov.kz. ALTAI ARCHIVE does not accept government applications, order archive copies or take payments.'}},
 {id:'institution-platform',intent:'institution',url:'/about',title:{ru:'ALTAI ARCHIVE и Государственный архив ВКО',kk:'ALTAI ARCHIVE және Шығыс Қазақстан облысының мемлекеттік архиві',en:'ALTAI ARCHIVE and the State Archive of East Kazakhstan Region'},description:{ru:'ALTAI ARCHIVE — цифровая платформа, а не новое официальное наименование архива. На странице /about учреждение названо Государственным архивом Восточно-Казахстанской области.',kk:'ALTAI ARCHIVE — цифрлық платформа, архивтің жаңа ресми атауы емес. /about бетінде мекеме Шығыс Қазақстан облысының мемлекеттік архиві деп аталған.',en:'ALTAI ARCHIVE is a digital platform, not a new official name for the archive. The /about page identifies the institution as the State Archive of East Kazakhstan Region.'}},
 {id:'institution-history',intent:'institution',url:'https://www.gov.kz/org/vko-cultura-arhiv/press/events/details/1292',title:{ru:'Официальная историческая справка об архиве',kk:'Архив туралы ресми тарихи мәлімет',en:'Official historical information about the archive'},description:{ru:'Публикация управления культуры на gov.kz сообщает, что Государственный архив ВКО образован в 1940 году. В той же публикации от 2020 года указаны шесть филиалов; это не подтверждает их нынешнее количество или состав.',kk:'gov.kz сайтындағы мәдениет басқармасының жарияланымы Шығыс Қазақстан облысының мемлекеттік архиві 1940 жылы құрылғанын хабарлайды. 2020 жылғы осы жарияланымда алты филиал көрсетілген; бұл олардың қазіргі саны мен құрамын растамайды.',en:'A gov.kz Culture Department publication says the State Archive of East Kazakhstan Region was established in 1940. The same 2020 publication lists six branches; this does not establish the current number or network.'}},
 {id:'section-home',intent:'site-sections',url:'/',title:{ru:'Главная ALTAI ARCHIVE',kk:'ALTAI ARCHIVE басты беті',en:'ALTAI ARCHIVE home page'},description:{ru:'Главная страница: /.',kk:'Басты бет: /.',en:'Home page: /.'}},
 {id:'section-catalogue',intent:'site-sections',url:'/catalog',title:{ru:'Каталог ALTAI ARCHIVE',kk:'ALTAI ARCHIVE каталогы',en:'ALTAI ARCHIVE catalogue'},description:{ru:'Каталог описаний и поиск: /catalog.',kk:'Сипаттамалар каталогы және іздеу: /catalog.',en:'Catalogue descriptions and search: /catalog.'}},
 {id:'section-assistant',intent:'site-sections',url:'/assistant',title:{ru:'ИИ-помощник ALTAI ARCHIVE',kk:'ALTAI ARCHIVE ЖИ-көмекшісі',en:'ALTAI ARCHIVE assistant'},description:{ru:'Справочные вопросы и поиск: /assistant.',kk:'Анықтамалық сұрақтар және іздеу: /assistant.',en:'Reference questions and search: /assistant.'}},
 {id:'section-official-documents',intent:'site-sections',url:'/official-documents',title:{ru:'Официальные документы',kk:'Ресми құжаттар',en:'Official documents'},description:{ru:'Официальные нормативные и государственные ссылки: /official-documents.',kk:'Ресми нормативтік және мемлекеттік сілтемелер: /official-documents.',en:'Official legal and government links: /official-documents.'}},
 {id:'section-about',intent:'site-sections',url:'/about',title:{ru:'Об архиве',kk:'Архив туралы',en:'About the archive'},description:{ru:'Сведения об учреждении и цифровой платформе: /about.',kk:'Мекеме мен цифрлық платформа туралы мәлімет: /about.',en:'Information about the institution and digital platform: /about.'}},
 {id:'section-branches',intent:'site-sections',url:'/branches',title:{ru:'Архив и филиалы',kk:'Архив және филиалдар',en:'Archive and branches'},description:{ru:'Справочник филиалов и происхождение сведений: /branches.',kk:'Филиалдар анықтамалығы және мәліметтердің шығу тегі: /branches.',en:'Branch directory and information provenance: /branches.'}},
 {id:'section-history',intent:'site-sections',url:'/history',title:{ru:'История региона',kk:'Өңір тарихы',en:'Regional history'},description:{ru:'Раздел истории региона: /history.',kk:'Өңір тарихы бөлімі: /history.',en:'Regional history section: /history.'}},
 {id:'section-exhibitions',intent:'site-sections',url:'/exhibitions',title:{ru:'Выставки',kk:'Көрмелер',en:'Exhibitions'},description:{ru:'Демонстрационные выставочные маршруты: /exhibitions.',kk:'Демонстрациялық көрме маршруттары: /exhibitions.',en:'Demonstration exhibition paths: /exhibitions.'}}
];

export function classifyReferenceQuestion(message:string):ReferenceIntent|null{
 const q=message.toLocaleLowerCase();
 if(/^(?:(?:привет|здравствуй[\p{L}]*|доброе утро|добрый день|добрый вечер|сәлем|салем|қайырлы таң|қайырлы күн|қайырлы кеш|hello|hi|hey|good morning|good afternoon|good evening)(?=$|[\s!,.?]))/iu.test(q))return 'greeting';
 if(/(?:что такое|что представляет собой|what is|define|деген не|не болып табылады).{0,60}altai\s+archive|altai\s+archive.{0,60}(?:что такое|what is|деген не)/iu.test(q))return 'platform';
 if(/(?:\b(?:что такое|что значит|определение|what is|define|анықтамасы|деген не)\b).{0,60}(?:архивн[\p{L}]* фонд|архивтік қор|archive fund)|(?:архивн[\p{L}]* фонд|архивтік қор|archive fund).{0,50}(?:что такое|what is|деген не)/u.test(q))return 'fund';
 if(/(?:что представляет собой|что такое|what is|who is|кто такой|мекеме қандай|не представляет собой).{0,100}(?:государственн[\p{L}]* архив|госархив|архив вко|архив восточно-казахстан|state archive|вко архив)/u.test(q))return 'institution';
 if(/(?:филиал|branches|branch|филиалдар)/u.test(q)&&/(?:где|найти|показ|список|where|find|show|қайда|табу|көрсету)/u.test(q))return 'branches';
 if(/(?:каталог|catalogue|catalog|каталогтан|каталогты)/u.test(q)&&/(?:как|пользоват|искать|найти|поиск|где|how|use|search|find|where|қайда|қалай|ізде|пайдалан)/u.test(q))return 'catalogue';
 if(/(?:официальн[\p{L}]* документ|ресми құжат|official document|адилет|әділет)/u.test(q)&&/(?:где|найти|искать|как|where|find|search|how|қайда|табу|қалай)/u.test(q))return 'official-documents';
 if(/(?:раздел[\p{L}]*|страниц[\p{L}]*|сайт|sections|pages|website|бөлімдер|бет|сайтта|платформа)/u.test(q)&&/(?:какие|какой|список|есть|что умеет|возможност[\p{L}]*|what|which|list|available|can .* do|қандай|не істей алады|мүмкіндіктер|бар|тізім)/u.test(q))return 'site-sections';
 return null;
}

export function approvedReferenceSources(intent:ReferenceIntent,locale:Language):Source[]{
 if(intent==='greeting')return sourcesById(['section-assistant','section-catalogue'],locale);
 if(intent==='platform')return sourcesById(['institution-platform','section-catalogue'],locale);
 return entries.filter(entry=>entry.intent===intent).map((entry,index)=>({
  id:`R${index+1}`,kind:'reference',title:entry.title[locale],description:entry.description[locale],provenance:'verified',url:entry.url
 }));
}

function sourcesById(ids:string[],locale:Language):Source[]{
 return ids.flatMap((id,index)=>{
  const entry=entries.find(candidate=>candidate.id===id);
  return entry?[{id:`R${index+1}`,kind:'reference' as const,title:entry.title[locale],description:entry.description[locale],provenance:'verified',url:entry.url}]:[];
 });
}

export function localReferenceReply(intent:ReferenceIntent,locale:Language){
 const sources=intent==='greeting'
  ?approvedReferenceSources('greeting',locale)
  :intent==='platform'
  ?approvedReferenceSources('platform',locale)
  :intent==='catalogue'
  ?approvedReferenceSources('catalogue',locale)
  :intent==='site-sections'
  ?approvedReferenceSources('site-sections',locale)
  :approvedReferenceSources(intent,locale);
 if(!sources.length)return null;
 let answer:string;
 if(intent==='greeting')answer=locale==='kk'?'Сәлем! Мен ALTAI ARCHIVE сайтының анықтамалық көмекшісімін. Сайт бөлімдері туралы айтып, каталогтан жарияланған материалдарды іздеуге көмектесемін.':locale==='ru'?'Здравствуйте! Я справочный помощник ALTAI ARCHIVE. Подскажу разделы сайта и помогу искать опубликованные материалы в каталоге.':'Hello! I can guide you around ALTAI ARCHIVE and help you search published materials in the catalogue.';
 else if(intent==='platform')answer=locale==='kk'?'ALTAI ARCHIVE — архивтің жаңа ресми атауы емес, цифрлық платформа. Каталогты /catalog бетінен ашуға болады.':locale==='ru'?'ALTAI ARCHIVE — цифровая платформа, а не новое официальное название архива. Каталог находится на странице /catalog.':'ALTAI ARCHIVE is a digital platform, not a new official name for the archive. The catalogue is at /catalog.';
 else if(intent==='catalogue')answer=locale==='kk'?'Каталог /catalog бетінде орналасқан. Бұл — демонстрациялық интерфейс; «демо» карточкалары түпнұсқа архивтік істер емес.':locale==='ru'?'Каталог находится на странице /catalog. Это демонстрационный интерфейс; карточки с пометкой «демо» не являются подлинными архивными делами.':'The catalogue is at /catalog. It is a demonstration interface; cards marked “demo” are not authentic archival files.';
 else if(intent==='site-sections')answer=locale==='kk'?'Сайтта басты бет, каталог, көмекші, ресми құжаттар, архив туралы мәлімет, филиалдар, өңір тарихы және көрмелер бөлімдері бар.':locale==='ru'?'На сайте есть главная, каталог, AI-помощник, официальные документы, сведения об архиве, филиалы, история региона и выставки.':'The site includes Home, Catalogue, Assistant, Official Documents, About, Branches, Regional History and Exhibitions.';
 else answer=sources[0].description;
 return {mode:'reference' as const,locale,answer,citations:sources.map(source=>({id:source.id,title:source.title,quote:source.title,provenance:'verified',url:source.url!}))};
}
