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
export type ArchiveLocation = {id:string;kind:'main'|'branch';name:string;shortName:string;affiliation:string;city:string;address:string|null;phone:string|null;email:string|null;hours:string|null;sourceLabel:string;sourceUrl:string|null;sourceDate:string;sourceDocument:string;needsReview:boolean;reviewNotes:string[];coordinatesStatus:'unavailable';affiliationStatus:'official-listing'|'last-listed-2019'|'source-listing';addressStatus:'official-listing'|'last-listed-2019'|'source-listing'};
export type UserRole='Main Administrator'|'Site Administrator'|'Editor'|'Archive Employee'|'Branch Administrator'|'Moderator'|'Analyst';
export type DemoUser={id:string;role:UserRole;label:string;authenticated:false};

export const documents:ArchiveDocument[]=[
 {id:'demo-01',title:'Вид на город у подножия гор',category:'Фотографии',date:'Середина XX века · демонстрационная датировка',year:1950,description:'Учебная карточка для демонстрации каталога. Название, дата, место и описание не являются архивной записью.',fonds:'Демо-фонд',inventory:'Демо-опись',caseName:'Демо-дело 01',creator:'Не установлен (демо)',place:'Восточный Казахстан (условно)',status:'Демонстрационный материал',source:'Синтетическая запись ALTAI ARCHIVE · версия 1',image:'/images/card-mountains.svg',tags:['город','фотография','демо']},
 {id:'demo-02',title:'Карта горной местности (макет)',category:'Карты',date:'XX век · условная дата',year:1930,description:'Иллюстративный макет описания карты. Географические сведения и архивный шифр отсутствуют.',fonds:'Демо-фонд',inventory:'Демо-опись',caseName:'Демо-дело 02',creator:'Не установлен (демо)',place:'Координаты не подтверждены',status:'Демонстрационный материал',source:'Синтетическая запись ALTAI ARCHIVE · версия 1',image:'/images/card-map.svg',tags:['карта','топография','демо']},
 {id:'demo-03',title:'Образец машинописного документа',category:'Документы',date:'Без подтверждённой даты',year:1940,description:'Образец карточки для проверки просмотра, цитирования и навигации. Это не подлинный архивный документ.',fonds:'Демо-фонд',inventory:'Демо-опись',caseName:'Демо-дело 03',creator:'Демо-автор',place:'Не указано',status:'Демонстрационный материал',source:'Синтетическая запись ALTAI ARCHIVE · версия 1',image:'/images/card-document.svg',tags:['документ','машинопись','демо']},
 {id:'demo-04',title:'Историческая улица — фотокарточка',category:'Фотографии',date:'Первая половина XX века · демонстрационная датировка',year:1925,description:'Пробный материал для демонстрации карточки фотоколлекции. Сведения условны.',fonds:'Демо-фонд',inventory:'Демо-опись',caseName:'Демо-дело 04',creator:'Не установлен (демо)',place:'Условное место',status:'Демонстрационный материал',source:'Синтетическая запись ALTAI ARCHIVE · версия 1',image:'/images/card-mountains.svg',tags:['фото','улица','демо']}
];

export const exhibitions:Exhibition[]=[
 {slug:'land-and-memory',title:'Земля и память',category:'Пространство',intro:'Демонстрационная редакционная выставка о том, как меняется взгляд на родной край через карты, фотографии и описания мест.',year:'Демо-выставка',image:'/images/card-mountains.svg'},
 {slug:'paper-traces',title:'Следы на бумаге',category:'Документы',intro:'Макет выставочного маршрута: от архивного описания к внимательному чтению источника.',year:'Демо-выставка',image:'/images/card-document.svg'},
 {slug:'lines-of-place',title:'Линии места',category:'Карты',intro:'Иллюстративная история картографического материала с пометками о проверке происхождения.',year:'Демо-выставка',image:'/images/card-map.svg'}
];

export const news:NewsItem[]=[
 {slug:'site-demo',title:'О цифровом макете ALTAI ARCHIVE',category:'Проект',date:'Демонстрационная публикация',excerpt:'Эта страница показывает формат новостной ленты. Текст не является официальным сообщением архива.'},
 {slug:'collections-demo',title:'Как читать архивное описание',category:'Просветительское',date:'Демонстрационная публикация',excerpt:'Краткий демонстрационный материал о связях между уровнями архивного описания.'},
 {slug:'heritage-demo',title:'Материалы региона в цифровой среде',category:'События',date:'Демонстрационная публикация',excerpt:'Макет анонса культурного события. Дата и организаторы не подтверждены.'}
];

export const places:HistoricalPlace[]=[
 {id:'place-1',name:'Условная точка — долина',region:'Восточный Казахстан · демонстрация',period:'XX век · условная привязка',description:'Условная демонстрационная точка для показа интерфейса. Это не архивная географическая привязка.',x:52,y:41,provenance:'demonstration'},
 {id:'place-2',name:'Условная точка — хребет',region:'Алтай · демонстрация',period:'Период не подтверждён',description:'Положение точки схематично и не указывает на конкретный исторический объект.',x:72,y:29,provenance:'demonstration'},
 {id:'place-3',name:'Условная точка — поселение',region:'Регион · демонстрация',period:'XX век · условная привязка',description:'Демо-объект, координаты не основаны на архивных данных.',x:39,y:62,provenance:'demonstration'}
];

export const demoCollections=[
 {title:'ВКО в XX веке',category:'Фотографии',image:'/images/card-mountains.svg',description:'Демонстрационная подборка исторических изображений региона.'},
 {title:'Исторические карты региона',category:'Карты',image:'/images/card-map.svg',description:'Иллюстративная подборка картографических материалов.'},
 {title:'Официальные документы',category:'Документы',image:'/images/card-document.svg',description:'Демонстрационные образцы описаний документов.'}
];

export const mainArchive:ArchiveLocation={id:'main',kind:'main',name:'Государственный архив Восточно-Казахстанской области',shortName:'Государственный архив Восточно-Казахстанской области',affiliation:'Государственный архив Восточно-Казахстанской области',city:'Усть-Каменогорск',address:null,phone:null,email:null,hours:null,sourceLabel:'Официальный портал управления цифровизации и архивов ВКО',sourceUrl:'https://www.gov.kz/org/vko-uca',sourceDate:'Проверено 09.11.2026',sourceDocument:'gov.kz',needsReview:false,reviewNotes:[],coordinatesStatus:'unavailable',affiliationStatus:'official-listing',addressStatus:'official-listing'};

export const branches:ArchiveLocation[]=branchDirectoryData as ArchiveLocation[];

export const archiveLocations:ArchiveLocation[]=[mainArchive,...branches];

export function getLocalizedPlace(place: HistoricalPlace, locale: Locale): HistoricalPlace {
  if (locale === 'kk') {
    if (place.id === 'place-1') {
      return {
        ...place,
        name: 'Шартты нүкте — алқап',
        region: 'Шығыс Қазақстан · демонстрация',
        period: 'XX ғасыр · шартты байланыстыру',
        description: 'Интерфейсті көрсетуге арналған шартты демо нүкте. Бұл архивтік географиялық байланыстыру емес.'
      };
    }
    if (place.id === 'place-2') {
      return {
        ...place,
        name: 'Шартты нүкте — жота',
        region: 'Алтай · демонстрация',
        period: 'Кезеңі расталмаған',
        description: 'Нүктенің орналасуы схемалық сипатта және нақты тарихи нысанды білдірмейді.'
      };
    }
    if (place.id === 'place-3') {
      return {
        ...place,
        name: 'Шартты нүкте — елді мекен',
        region: 'Өңір · демонстрация',
        period: 'XX ғасыр · шартты байланыстыру',
        description: 'Демо-нысан, координаттар архивтік деректерге негізделмеген.'
      };
    }
  }
  if (locale === 'en') {
    if (place.id === 'place-1') {
      return {
        ...place,
        name: 'Sample point — valley',
        region: 'East Kazakhstan · demo',
        period: '20th c. · illustrative',
        description: 'Illustrative demonstration marker. Not an archival geographic coordinate.'
      };
    }
    if (place.id === 'place-2') {
      return {
        ...place,
        name: 'Sample point — ridge',
        region: 'Altai · demo',
        period: 'Period unverified',
        description: 'Location is schematic and does not indicate a specific verified site.'
      };
    }
    if (place.id === 'place-3') {
      return {
        ...place,
        name: 'Sample point — settlement',
        region: 'Region · demo',
        period: '20th c. · illustrative',
        description: 'Demonstration location; coordinates are not based on archival survey records.'
      };
    }
  }
  return place;
}

export function getLocalizedExhibition(item: Exhibition, locale: Locale): Exhibition {
  if (locale === 'kk') {
    if (item.slug === 'land-and-memory') {
      return {
        ...item,
        title: 'Жер және жад',
        category: 'Кеңістік',
        intro: 'Карталар, фотосуреттер мен сипаттамалар арқылы туған өлкеге көзқарастың қалай өзгеретіні туралы демонстрациялық көрме.',
        year: 'Демо-көрме'
      };
    }
    if (item.slug === 'paper-traces') {
      return {
        ...item,
        title: 'Қағаздағы іздер',
        category: 'Құжаттар',
        intro: 'Көрме маршрутының макеті: архивтік сипаттамадан бастап түпнұсқаны мұқият оқуға дейін.',
        year: 'Демо-көрме'
      };
    }
    if (item.slug === 'lines-of-place') {
      return {
        ...item,
        title: 'Мекен сызықтары',
        category: 'Карталар',
        intro: 'Шығу тегін тексеру белгілері бар картографиялық материалдардың иллюстрациялық тарихы.',
        year: 'Демо-көрме'
      };
    }
  }
  if (locale === 'en') {
    if (item.slug === 'land-and-memory') {
      return {
        ...item,
        title: 'Land and Memory',
        category: 'Space',
        intro: 'A demonstration exhibition on how perspective on the homeland evolves through maps, photographs, and records of places.',
        year: 'Demo exhibition'
      };
    }
    if (item.slug === 'paper-traces') {
      return {
        ...item,
        title: 'Traces on Paper',
        category: 'Documents',
        intro: 'An illustrative exhibition path: from archival description to attentive reading of sources.',
        year: 'Demo exhibition'
      };
    }
    if (item.slug === 'lines-of-place') {
      return {
        ...item,
        title: 'Lines of Place',
        category: 'Maps',
        intro: 'An illustrative narrative of cartographic records with provenance verification markers.',
        year: 'Demo exhibition'
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
        title: 'ALTAI ARCHIVE цифрлық макеті туралы',
        category: 'Жоба',
        date: 'Демонстрациялық жарияланым',
        excerpt: 'Бұл бет жаңалықтар лентасының форматын көрсетеді. Мәтін архивтің ресми хабарламасы болып табылмайды.'
      };
    }
    if (item.slug === 'collections-demo') {
      return {
        ...item,
        title: 'Архивтік сипаттаманы қалай оқу керек',
        category: 'Ағартушылық',
        date: 'Демонстрациялық жарияланым',
        excerpt: 'Архивтік сипаттама деңгейлері арасындағы байланыстар туралы қысқаша түсіндірме материал.'
      };
    }
    if (item.slug === 'heritage-demo') {
      return {
        ...item,
        title: 'Өңір материалдары цифрлық кеңістікте',
        category: 'Оқиғалар',
        date: 'Демонстрациялық жарияланым',
        excerpt: 'Мәдени іс-шара хабарландыруының макеті. Өткізілу күні мен ұйымдастырушылары расталмаған.'
      };
    }
  }
  if (locale === 'en') {
    if (item.slug === 'site-demo') {
      return {
        ...item,
        title: 'About the ALTAI ARCHIVE digital mockup',
        category: 'Project',
        date: 'Demonstration article',
        excerpt: 'This page illustrates the newsfeed format. The text is not an official archive announcement.'
      };
    }
    if (item.slug === 'collections-demo') {
      return {
        ...item,
        title: 'How to read an archival description',
        category: 'Educational',
        date: 'Demonstration article',
        excerpt: 'A brief explanatory guide to connections across levels of archival descriptions.'
      };
    }
    if (item.slug === 'heritage-demo') {
      return {
        ...item,
        title: 'Regional heritage in the digital environment',
        category: 'Events',
        date: 'Demonstration article',
        excerpt: 'Cultural event announcement mockup. Dates and organizers are unverified.'
      };
    }
  }
  return item;
}
