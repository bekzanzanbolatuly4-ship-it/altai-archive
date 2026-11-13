import type {Language} from './context.ts';
import type {Source} from './context.ts';

export type ReferenceIntent='greeting'|'platform'|'fund'|'catalogue'|'branches'|'official-documents'|'institution'|'site-sections';
type KnowledgeEntry={id:string;title:Record<Language,string>;description:Record<Language,string>;url:string;intent:ReferenceIntent};

const entries:KnowledgeEntry[]=[
 {id:'fund-definition',intent:'fund',url:'https://adilet.zan.kz/rus/docs/Z980000326_',title:{ru:'Законодательное определение архивного фонда',kk:'Архивтік қордың заңдағы анықтамасы',en:'Legal definition of an archive fund'},description:{ru:'Закон Республики Казахстан определяет архивный фонд как совокупность исторически или логически связанных между собой архивных документов.',kk:'Қазақстан Республикасының заңында архивтік қор тарихи немесе логикалық байланысы бар архивтік құжаттардың жиынтығы деп анықталған.',en:'Kazakhstan law defines an archive fund as a set of archival documents connected historically or logically.'}},
 {id:'catalogue-guide',intent:'catalogue',url:'/catalog',title:{ru:'Каталог и опубликованные архивные материалы',kk:'Каталог және жарияланған архив материалдары',en:'Catalogue and published archive materials'},description:{ru:'Раздел /catalog предназначен для поиска опубликованных описаний. Иллюстративные образцы и официальные нормативные PDF отдельно помечены и не выдаются за исторические сканы. Подлинные сканы появляются только после проверки и публикации архива.',kk:'/catalog бөлімі жарияланған сипаттамаларды іздеуге арналған. Иллюстрациялық үлгілер мен ресми нормативтік PDF бөлек белгіленеді және тарихи скан ретінде көрсетілмейді. Түпнұсқа скандар архив тексеріп, жариялағаннан кейін ғана пайда болады.',en:'/catalog is for searching published descriptions. Illustrative samples and official policy PDFs are labelled separately and are not presented as historical scans. Authentic scans appear only after archive review and publication.'}},
 {id:'branch-directory',intent:'branches',url:'/branches',title:{ru:'Каталог филиалов',kk:'Филиалдар каталогы',en:'Branch directory'},description:{ru:'Раздел /branches показывает справочник филиалов и происхождение сведений. Карточки, требующие проверки, так и помечены; точные координаты не подтверждены. Перед поездкой сверяйте адрес и актуальность с указанным источником.',kk:'/branches бөлімінде филиалдар анықтамалығы және мәліметтердің шығу тегі көрсетілген. Тексеруді қажет ететін карточкалар солай белгіленген; нақты координаттар расталмаған. Бармас бұрын мекенжай мен өзектілігін дереккөзден тексеріңіз.',en:'/branches shows a branch directory and the provenance of its entries. Records needing review are labelled, and exact coordinates are unconfirmed. Check the address and current status against the cited source before visiting.'}},
 {id:'official-documents-guide',intent:'official-documents',url:'/official-documents',title:{ru:'Официальные документы и государственные ссылки',kk:'Ресми құжаттар мен мемлекеттік сілтемелер',en:'Official documents and government links'},description:{ru:'Раздел /official-documents содержит ссылки на официальную ИПС «Әділет» и gov.kz. Информационный портал не принимает государственные заявления, не оформляет заказы на архивные копии и не проводит оплату.',kk:'/official-documents бөлімінде «Әділет» ресми ақпараттық-құқықтық жүйесіне және gov.kz сайтына сілтемелер бар. Ақпараттық портал мемлекеттік өтініштерді қабылдамайды, архивтік көшірмелерге тапсырыс рәсімдемейді және төлем қабылдамайды.',en:'/official-documents lists links to the official Adilet legal system and gov.kz. This information portal does not accept government applications, order archive copies or take payments.'}},
 {id:'institution-platform',intent:'institution',url:'/about',title:{ru:'Государственный архив Восточно-Казахстанской области',kk:'Шығыс Қазақстан облысының мемлекеттік архиві',en:'State Archive of East Kazakhstan Region'},description:{ru:'Информационный портал содержит справочные сведения о Государственном архиве Восточно-Казахстанской области и его филиалах. Это не официальный сайт учреждения.',kk:'Ақпараттық порталда Шығыс Қазақстан облысының мемлекеттік архиві мен оның филиалдары туралы анықтамалық мәліметтер бар. Бұл мекеменің ресми сайты емес.',en:'This information portal provides reference information about the State Archive of East Kazakhstan Region and its branches. It is not the institution’s official website.'}},
 {id:'institution-history',intent:'institution',url:'https://www.gov.kz/org/vko-cultura-arhiv/press/events/details/1292',title:{ru:'Официальная историческая справка об архиве',kk:'Архив туралы ресми тарихи мәлімет',en:'Official historical information about the archive'},description:{ru:'Публикация управления культуры на gov.kz сообщает, что Государственный архив ВКО образован в 1940 году. В той же публикации от 2020 года указаны шесть филиалов; это не подтверждает их нынешнее количество или состав.',kk:'gov.kz сайтындағы мәдениет басқармасының жарияланымы Шығыс Қазақстан облысының мемлекеттік архиві 1940 жылы құрылғанын хабарлайды. 2020 жылғы осы жарияланымда алты филиал көрсетілген; бұл олардың қазіргі саны мен құрамын растамайды.',en:'A gov.kz Culture Department publication says the State Archive of East Kazakhstan Region was established in 1940. The same 2020 publication lists six branches; this does not establish the current number or network.'}},
 {id:'section-home',intent:'site-sections',url:'/',title:{ru:'Главная страница архива',kk:'Архивтің басты беті',en:'Archive information portal home'},description:{ru:'Главная страница: /.',kk:'Басты бет: /.',en:'Home page: /.'}},
 {id:'section-catalogue',intent:'site-sections',url:'/catalog',title:{ru:'Каталог архивных материалов',kk:'Архив материалдарының каталогы',en:'Archive materials catalogue'},description:{ru:'Каталог описаний и поиск: /catalog.',kk:'Сипаттамалар каталогы және іздеу: /catalog.',en:'Catalogue descriptions and search: /catalog.'}},
 {id:'section-assistant',intent:'site-sections',url:'/assistant',title:{ru:'Справочный помощник архива',kk:'Архивтің анықтамалық көмекшісі',en:'Archive reference assistant'},description:{ru:'Справочные вопросы и поиск: /assistant.',kk:'Анықтамалық сұрақтар және іздеу: /assistant.',en:'Reference questions and search: /assistant.'}},
 {id:'section-official-documents',intent:'site-sections',url:'/official-documents',title:{ru:'Официальные документы',kk:'Ресми құжаттар',en:'Official documents'},description:{ru:'Официальные нормативные и государственные ссылки: /official-documents.',kk:'Ресми нормативтік және мемлекеттік сілтемелер: /official-documents.',en:'Official legal and government links: /official-documents.'}},
 {id:'section-about',intent:'site-sections',url:'/about',title:{ru:'Об архиве',kk:'Архив туралы',en:'About the archive'},description:{ru:'Сведения об учреждении и цифровой платформе: /about.',kk:'Мекеме мен цифрлық платформа туралы мәлімет: /about.',en:'Information about the institution and digital platform: /about.'}},
 {id:'section-branches',intent:'site-sections',url:'/branches',title:{ru:'Архив и филиалы',kk:'Архив және филиалдар',en:'Archive and branches'},description:{ru:'Справочник филиалов и происхождение сведений: /branches.',kk:'Филиалдар анықтамалығы және мәліметтердің шығу тегі: /branches.',en:'Branch directory and information provenance: /branches.'}},
 {id:'section-history',intent:'site-sections',url:'/history',title:{ru:'История региона',kk:'Өңір тарихы',en:'Regional history'},description:{ru:'Раздел истории региона: /history.',kk:'Өңір тарихы бөлімі: /history.',en:'Regional history section: /history.'}},
 {id:'section-exhibitions',intent:'site-sections',url:'/exhibitions',title:{ru:'Выставки',kk:'Көрмелер',en:'Exhibitions'},description:{ru:'Демонстрационные выставочные маршруты: /exhibitions.',kk:'Демонстрациялық көрме маршруттары: /exhibitions.',en:'Demonstration exhibition paths: /exhibitions.'}}
];

export function classifyReferenceQuestion(message:string):ReferenceIntent|null{
 const q=message.toLocaleLowerCase();
 if(/^(?:(?:(?:ии|ж\s*и|ai|assistant|помощник|бот)[\s,!:—-]*)?(?:кто ты|кто вы|как дела|как ты|как поживаешь|сен кімсің|сіз кімсіз|қалайсың|қал қалай|қалың қалай|who are you|how are you|how's it going)(?=$|[\s!,.?])|(?:привет|здравствуй[\p{L}]*|доброе утро|добрый день|добрый вечер|сәлем|салем|қайырлы таң|қайырлы күн|қайырлы кеш|hello|hi|hey|good morning|good afternoon|good evening)(?=$|[\s!,.?]))/iu.test(q))return 'greeting';
 if(/(?:что такое|что представляет собой|what is|define|деген не|не болып табылады).{0,60}altai\s+archive|altai\s+archive.{0,60}(?:что такое|what is|деген не)/iu.test(q))return 'platform';
 if(/(?:\b(?:что такое|что значит|определение|what is|define|анықтамасы|деген не)\b).{0,60}(?:архивн[\p{L}]* фонд|архивтік қор|archive fund)|(?:архивн[\p{L}]* фонд|архивтік қор|archive fund).{0,50}(?:что такое|what is|деген не)/u.test(q))return 'fund';
 if(/(?:что представляет собой|что такое|what is|who is|кто такой|мекеме қандай|не представляет собой).{0,100}(?:государственн[\p{L}]* архив|госархив|архив вко|архив восточно-казахстан|state archive|вко архив|мемлекеттік архив|мемлекеттік мұрағат)/u.test(q))return 'institution';
 if(/(?:мемлекеттік архив|мемлекеттік мұрағат).{0,50}(?:деген не|қандай)/u.test(q))return 'institution';
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

export function localReferenceReply(intent:ReferenceIntent,locale:Language,question=''){
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
 if(intent==='greeting'){
  const q=question.toLocaleLowerCase();
  if(/(?:кто ты|кто вы|сен кімсің|сіз кімсіз|who are you)/iu.test(q))answer=locale==='kk'?'Мен — архив туралы ақпаратты табуға көмектесетін ЖИ-көмекшімін. Жауаптарымды сайттағы жарияланған деректермен шектеймін.':'ru'===locale?'Я ИИ-помощник портала: помогаю находить информацию об архиве и разделах сайта. Опираюсь на опубликованные материалы и сообщаю, когда данных недостаточно.':'I am the archive information assistant. I help visitors find site and archive information using the available published sources.';
  else if(/(?:как дела|как ты|как поживаешь|қалайсың|қал қалай|қалың қалай|how are you|how's it going)/iu.test(q))answer=locale==='kk'?'Рақмет, көмектесуге дайынмын. Архив пен сайт бөлімдері туралы сұрай аласыз.':locale==='ru'?'Спасибо, готов помочь. Спросите меня об архиве или разделах сайта.':'Thanks for asking. I am ready to help with the archive and the site.';
  else answer=locale==='kk'?'Сәлем! Мен архив туралы ақпарат табуға көмектесетін ЖИ-көмекшімін. Сайт бөлімдері мен жарияланған материалдар туралы сұрай аласыз.':locale==='ru'?'Здравствуйте! Я ИИ-помощник портала. Подскажу разделы сайта и помогу искать опубликованные материалы.':'Hello! I am the archive information assistant. Ask me about the site sections or published materials.';
 }
 else if(intent==='platform')answer=locale==='kk'?'Ақпараттық портал мекеменің ресми сайты емес. Каталог /catalog бетінде орналасқан.':locale==='ru'?'Информационный портал не является официальным сайтом учреждения. Каталог находится на странице /catalog.':'This information portal is not the institution’s official website. The catalogue is at /catalog.';
 else if(intent==='catalogue')answer=locale==='kk'?'Каталог /catalog бетінде орналасқан. Онда жарияланған сипаттамалар ізделеді; иллюстрациялық үлгілер түпнұсқа архив істері ретінде көрсетілмейді.':locale==='ru'?'Каталог находится на странице /catalog. В нём ищутся опубликованные описания; иллюстративные образцы не выдаются за подлинные архивные дела.':'The catalogue is at /catalog. It searches published descriptions; illustrative samples are not presented as authentic archival files.';
 else if(intent==='site-sections')answer=locale==='kk'?'Сайтта басты бет, каталог, көмекші, ресми құжаттар, архив туралы мәлімет, филиалдар, өңір тарихы және көрмелер бөлімдері бар.':locale==='ru'?'На сайте есть главная, каталог, AI-помощник, официальные документы, сведения об архиве, филиалы, история региона и выставки.':'The site includes Home, Catalogue, Assistant, Official Documents, About, Branches, Regional History and Exhibitions.';
 else answer=sources[0].description;
 return {mode:'reference' as const,locale,answer,citations:sources.map(source=>({id:source.id,title:source.title,quote:source.title,provenance:'verified',url:source.url!}))};
}
