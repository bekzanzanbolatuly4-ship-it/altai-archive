import type {Locale} from '@/locales/messages';
import branchDirectoryData from './branches.json';

export type AccessStatus = 'Описание доступно онлайн' | 'Демонстрационный материал';
export type ArchiveFond = {sourceId:string|null;title:string;provenance:'demonstration'|'verified';description?:string};
export type Inventory = {sourceId:string|null;fondId:string;title:string;provenance:'demonstration'|'verified'};
export type ArchiveCase = {sourceId:string|null;inventoryId:string;title:string;provenance:'demonstration'|'verified'};
export type ArchiveDocument = { id:string; title:string; category:string; date:string; year:number; description:string; fonds:string; inventory:string; caseName:string; creator:string; place:string; status:AccessStatus; source:string; image:string; tags:string[] };
export type Exhibition = { slug:string; title:string; category:string; intro:string; year:string; image:string };
export type NewsItem = { slug:string; title:string; category:string; date:string; excerpt:string };
export type HistoricalPlace = { id:string; name:string; region:string; period:string; description:string; x:number; y:number; provenance:'demonstration'|'verified' };
export type ArchiveLocation = {id:string;kind:'main'|'branch';name:string;shortName:string;affiliation:string;city:string;address:string|null;phone:string|null;email:string|null;hours:string|null;sourceLabel:string;sourceUrl:string|null;sourceDate:string;sourceDocument:string;addressSourceDocument?:string;needsReview:boolean;reviewNotes:string[];coordinatesStatus:'unavailable';affiliationStatus:'official-listing'|'last-listed-2019'|'source-listing';addressStatus:'official-listing'|'last-listed-2019'|'source-listing'};
export type UserRole='Main Administrator'|'Site Administrator'|'Editor'|'Archive Employee'|'Branch Administrator'|'Moderator'|'Analyst';
export type DemoUser={id:string;role:UserRole;label:string;authenticated:false};

export const documents:ArchiveDocument[]=[
 {id:'demo-01',title:'Вид на город у подножия гор',category:'Фотографии',date:'Середина XX века · условная датировка',year:1950,description:'Образец фотокарточки. Название, дата, место и описание не относятся к подтверждённой архивной записи.',fonds:'Образец фонда',inventory:'Образец описи',caseName:'Образец дела 01',creator:'Не установлен (пример)',place:'Восточный Казахстан (условно)',status:'Демонстрационный материал',source:'Пример интерфейса информационного портала',image:'/images/card-mountains.svg',tags:['город','фотография','демо']},
 {id:'demo-02',title:'Карта горной местности (макет)',category:'Карты',date:'XX век · условная дата',year:1930,description:'Иллюстративный образец описания карты. Географические сведения и архивный шифр отсутствуют.',fonds:'Образец фонда',inventory:'Образец описи',caseName:'Образец дела 02',creator:'Не установлен (пример)',place:'Координаты не подтверждены',status:'Демонстрационный материал',source:'Пример интерфейса информационного портала',image:'/images/card-map.svg',tags:['карта','топография','демо']},
 {id:'demo-03',title:'Образец машинописного документа',category:'Документы',date:'Без подтверждённой даты',year:1940,description:'Образец карточки для просмотра и цитирования. Изображение условное; это не архивный документ.',fonds:'Образец фонда',inventory:'Образец описи',caseName:'Образец дела 03',creator:'Не установлен (пример)',place:'Не указано',status:'Демонстрационный материал',source:'Пример интерфейса информационного портала',image:'/images/card-document.svg',tags:['документ','машинопись','демо']},
 {id:'demo-04',title:'Историческая улица — фотокарточка',category:'Фотографии',date:'Первая половина XX века · условная датировка',year:1925,description:'Образец карточки фотоколлекции с условными сведениями.',fonds:'Образец фонда',inventory:'Образец описи',caseName:'Образец дела 04',creator:'Не установлен (пример)',place:'Условное место',status:'Демонстрационный материал',source:'Пример интерфейса информационного портала',image:'/images/card-mountains.svg',tags:['фото','улица','демо']}
];

export const exhibitions:Exhibition[]=[
 {slug:'archive-chronology',title:'История государственного архива ВКО',category:'История архива',intro:'Образовательная цифровая хронология по исторической справке, предоставленной архивом. Исходный текст сохранён на русском языке.',year:'1940–2022',image:'/images/archive-building.svg'},
 {slug:'land-and-memory',title:'Земля и память',category:'Пространство',intro:'Редакционная концепция о том, как меняется взгляд на родной край через карты, фотографии и описания мест. Изображения иллюстративные.',year:'Концепция выставки',image:'/images/card-mountains.svg'},
 {slug:'paper-traces',title:'Следы на бумаге',category:'Документы',intro:'Пример выставочного маршрута: от архивного описания к внимательному чтению источника.',year:'Концепция выставки',image:'/images/card-document.svg'},
 {slug:'lines-of-place',title:'Линии места',category:'Карты',intro:'Иллюстративный рассказ о картографических материалах с пометками о проверке происхождения.',year:'Концепция выставки',image:'/images/card-map.svg'}
];

export const news:NewsItem[]=[
 {slug:'site-demo',title:'Об информационном портале архива',category:'Проект',date:'Образец публикации',excerpt:'Редакционный пример описания информационного портала. Это не официальное сообщение архива.'},
 {slug:'collections-demo',title:'Как читать архивное описание',category:'Просветительское',date:'Образец публикации',excerpt:'Пример пояснительного материала о связях между уровнями архивного описания.'},
 {slug:'heritage-demo',title:'Материалы региона в цифровой среде',category:'События',date:'Образец публикации',excerpt:'Пример анонса культурного события. Дата и организаторы не подтверждены.'}
];

export const places:HistoricalPlace[]=[
 {id:'place-1',name:'Условная точка — долина',region:'Восточный Казахстан · схема',period:'XX век · условная привязка',description:'Иллюстративная отметка. Она не указывает подтверждённую архивную географическую привязку.',x:52,y:41,provenance:'demonstration'},
 {id:'place-2',name:'Условная точка — хребет',region:'Алтай · схема',period:'Период не подтверждён',description:'Положение точки схематично и не указывает на конкретный подтверждённый исторический объект.',x:72,y:29,provenance:'demonstration'},
 {id:'place-3',name:'Условная точка — поселение',region:'Регион · схема',period:'XX век · условная привязка',description:'Иллюстративная отметка без координат, основанных на архивных данных.',x:39,y:62,provenance:'demonstration'}
];

export const demoCollections=[
 {title:'ВКО в XX веке',category:'Фотографии',image:'/images/card-mountains.svg',description:'Иллюстративные изображения на тему истории региона.'},
 {title:'Исторические карты региона',category:'Карты',image:'/images/card-map.svg',description:'Иллюстрации на тему картографии региона.'},
 {title:'Официальные документы',category:'Документы',image:'/images/card-document.svg',description:'Образцы оформления описаний документов.'}
];

export const mainArchive:ArchiveLocation={id:'main',kind:'main',name:'Коммунальное государственное учреждение «Государственный архив Восточно-Казахстанской области» управления цифровизации и архивов Восточно-Казахстанской области',shortName:'Государственный архив Восточно-Казахстанской области',affiliation:'Коммунальное государственное учреждение «Государственный архив Восточно-Казахстанской области» управления цифровизации и архивов Восточно-Казахстанской области',city:'Усть-Каменогорск',address:'г. Усть-Каменогорск, ул. Головкова, 26/1',phone:null,email:'arhiv-ukg@yandex.kz',hours:null,sourceLabel:'Официальный портал государственных закупок РК · данные заказчика',sourceUrl:'https://procurement.gov.kz/ru/announce/index/17562202',sourceDate:'Запись от 02.09.2026 · проверено 12.11.2026',sourceDocument:'Объявление № 17562202-1',needsReview:false,reviewNotes:[],coordinatesStatus:'unavailable',affiliationStatus:'official-listing',addressStatus:'official-listing'};

export const branches:ArchiveLocation[]=branchDirectoryData as ArchiveLocation[];

export const archiveLocations:ArchiveLocation[]=[mainArchive,...branches];

export function getLocalizedPlace(place: HistoricalPlace, locale: Locale): HistoricalPlace {
  if (locale === 'kk') {
    if (place.id === 'place-1') {
      return {
        ...place,
        name: 'Шартты нүкте — алқап',
        region: 'Шығыс Қазақстан · схема',
        period: 'XX ғасыр · шартты байланыстыру',
        description: 'Иллюстрациялық белгі. Бұл расталған архивтік географиялық байланыстыру емес.'
      };
    }
    if (place.id === 'place-2') {
      return {
        ...place,
        name: 'Шартты нүкте — жота',
        region: 'Алтай · схема',
        period: 'Кезеңі расталмаған',
        description: 'Нүктенің орналасуы схемалық сипатта және нақты тарихи нысанды білдірмейді.'
      };
    }
    if (place.id === 'place-3') {
      return {
        ...place,
        name: 'Шартты нүкте — елді мекен',
        region: 'Өңір · схема',
        period: 'XX ғасыр · шартты байланыстыру',
        description: 'Иллюстрациялық белгі, координаттар архив деректеріне негізделмеген.'
      };
    }
  }
  if (locale === 'en') {
    if (place.id === 'place-1') {
      return {
        ...place,
        name: 'Sample point — valley',
        region: 'East Kazakhstan · schematic',
        period: '20th c. · illustrative',
        description: 'Illustrative marker; not a verified archival geographic location.'
      };
    }
    if (place.id === 'place-2') {
      return {
        ...place,
        name: 'Sample point — ridge',
        region: 'Altai · schematic',
        period: 'Period unverified',
        description: 'Location is schematic and does not indicate a specific verified site.'
      };
    }
    if (place.id === 'place-3') {
      return {
        ...place,
        name: 'Sample point — settlement',
        region: 'Region · schematic',
        period: '20th c. · illustrative',
        description: 'Illustrative marker; coordinates are not based on archival survey records.'
      };
    }
  }
  return place;
}

const branchTitles:Record<string,{kk:string;en:string}>={
 'branch-source-01':{kk:'Алтай ауданының филиалы',en:'Altai District Branch'},
 'branch-source-02':{kk:'Глубокое аудандық филиалы',en:'Glubokoye District Branch'},
 'branch-source-03':{kk:'Зайсан аудандық филиалы',en:'Zaysan District Branch'},
 'branch-source-04':{kk:'Қатонқарағай аудандық филиалы',en:'Katon-Karagay District Branch'},
 'branch-source-05':{kk:'Күршім аудандық филиалы',en:'Kurchum District Branch'},
 'branch-source-06':{kk:'Марқакөл ауданының филиалы',en:'Markakol District Branch'},
 'branch-source-07':{kk:'Риддер қалалық филиалы',en:'Ridder City Branch'},
 'branch-source-08':{kk:'Самар ауданының филиалы',en:'Samar District Branch'},
 'branch-source-09':{kk:'Тарбағатай аудандық филиалы',en:'Tarbagatai District Branch'},
 'branch-source-10':{kk:'Ұлан аудандық филиалы',en:'Ulan District Branch'},
 'branch-source-11':{kk:'Үлкен Нарын ауданының филиалы',en:'Ulken Naryn District Branch'},
 'branch-source-12':{kk:'Өскемен қалалық филиалы (жеке құрам)',en:'Oskemen City Personnel Branch'},
 'branch-source-13':{kk:'Шемонаиха аудандық филиалы',en:'Shemonaiha District Branch'}
};

export function getLocalizedBranchTitle(branch:ArchiveLocation,locale:Locale){
 return locale==='ru'?branch.shortName:branchTitles[branch.id]?.[locale]||branch.shortName;
}

export function getLocalizedExhibition(item: Exhibition, locale: Locale): Exhibition {
  if (locale === 'kk') {
    if (item.slug === 'archive-chronology') {
      return {
        ...item,
        title: 'ШҚО мемлекеттік архивінің тарихы',
        category: 'Архив тарихы',
        intro: 'Архив ұсынған тарихи анықтама бойынша жасалған ағартушылық цифрлық хронология. Бастапқы мәтін орыс тілінде сақталған.',
        year: '1940–2022'
      };
    }
    if (item.slug === 'land-and-memory') {
      return {
        ...item,
        title: 'Жер және жад',
        category: 'Кеңістік',
        intro: 'Карталар, фотосуреттер мен сипаттамалар арқылы туған өлке туралы көзқарасты зерттейтін редакциялық тұжырымдама. Бейнелер иллюстрациялық сипатта.',
        year: 'Көрме тұжырымдамасы'
      };
    }
    if (item.slug === 'paper-traces') {
      return {
        ...item,
        title: 'Қағаздағы іздер',
        category: 'Құжаттар',
        intro: 'Архивтік сипаттамадан дереккөзді мұқият оқуға дейінгі көрме маршрутының үлгісі.',
        year: 'Көрме тұжырымдамасы'
      };
    }
    if (item.slug === 'lines-of-place') {
      return {
        ...item,
        title: 'Мекен сызықтары',
        category: 'Карталар',
        intro: 'Шығу тегін тексеру белгілері бар картографиялық материалдардың иллюстрациялық тарихы.',
        year: 'Көрме тұжырымдамасы'
      };
    }
  }
  if (locale === 'en') {
    if (item.slug === 'archive-chronology') {
      return {
        ...item,
        title: 'History of the East Kazakhstan State Archive',
        category: 'Archive history',
        intro: 'An educational digital chronology based on a historical note supplied by the archive. The source text is preserved in Russian.',
        year: '1940–2022'
      };
    }
    if (item.slug === 'land-and-memory') {
      return {
        ...item,
        title: 'Land and Memory',
        category: 'Space',
        intro: 'An editorial concept exploring the homeland through maps, photographs, and descriptions of places. Images are illustrative.',
        year: 'Exhibition concept'
      };
    }
    if (item.slug === 'paper-traces') {
      return {
        ...item,
        title: 'Traces on Paper',
        category: 'Documents',
        intro: 'An example exhibition path, from archival description to attentive reading of sources.',
        year: 'Exhibition concept'
      };
    }
    if (item.slug === 'lines-of-place') {
      return {
        ...item,
        title: 'Lines of Place',
        category: 'Maps',
        intro: 'An illustrative narrative of cartographic records with provenance verification markers.',
        year: 'Exhibition concept'
      };
    }
  }
  return item;
}

export function getLocalizedNews(item: NewsItem, locale: Locale): NewsItem {
  if (locale === 'kk') {
    if (item.slug === 'site-demo') {
      return {
        ...item,
        title: 'Архивтің ақпараттық порталы туралы',
        category: 'Жоба',
        date: 'Жарияланым үлгісі',
        excerpt: 'Архивтің ақпараттық порталы туралы редакциялық үлгі. Бұл архивтің ресми хабарламасы емес.'
      };
    }
    if (item.slug === 'collections-demo') {
      return {
        ...item,
        title: 'Архивтік сипаттаманы қалай оқу керек',
        category: 'Ағартушылық',
        date: 'Жарияланым үлгісі',
        excerpt: 'Архивтік сипаттама деңгейлері арасындағы байланыстар туралы қысқаша түсіндірме материал үлгісі.'
      };
    }
    if (item.slug === 'heritage-demo') {
      return {
        ...item,
        title: 'Өңір материалдары цифрлық кеңістікте',
        category: 'Оқиғалар',
        date: 'Жарияланым үлгісі',
        excerpt: 'Мәдени іс-шара хабарландыруының үлгісі. Өткізілу күні мен ұйымдастырушылары расталмаған.'
      };
    }
  }
  if (locale === 'en') {
    if (item.slug === 'site-demo') {
      return {
        ...item,
        title: 'About the archive information portal',
        category: 'Project',
        date: 'Publication sample',
        excerpt: 'An editorial example about the archive information portal. This is not an official archive announcement.'
      };
    }
    if (item.slug === 'collections-demo') {
      return {
        ...item,
        title: 'How to read an archival description',
        category: 'Educational',
        date: 'Publication sample',
        excerpt: 'An example of a brief guide to connections across levels of archival descriptions.'
      };
    }
    if (item.slug === 'heritage-demo') {
      return {
        ...item,
        title: 'Regional heritage in the digital environment',
        category: 'Events',
        date: 'Publication sample',
        excerpt: 'An example cultural event announcement. Dates and organizers are unverified.'
      };
    }
  }
  return item;
}
