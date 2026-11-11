import {redact} from './context.ts';

const records=[
 {id:'demo-01',title:'Вид на город у подножия гор',description:'Учебная карточка для демонстрации каталога. Название, дата, место и описание не являются архивной записью.',terms:'город фотографии фотографию фотоснимок фото photograph photographs'},
 {id:'demo-02',title:'Карта горной местности (макет)',description:'Иллюстративный макет описания карты. Географические сведения и архивный шифр отсутствуют.',terms:'карта карты картографический топография map maps'},
 {id:'demo-03',title:'Образец машинописного документа',description:'Образец карточки для проверки просмотра, цитирования и навигации. Это не подлинный архивный документ.',terms:'документ документы машинопись document documents'},
 {id:'demo-04',title:'Историческая улица — фотокарточка',description:'Пробный материал для демонстрации карточки фотоколлекции. Сведения условны.',terms:'фотография фотографии фотографию фото улица photograph photographs photo'}
];

export function searchDemonstration(query:string,locale:string){
 const terms=[...new Set(query.toLocaleLowerCase().match(/[\p{L}\p{N}]{3,}/gu)||[])];
 const matches=records.map(record=>({record,score:terms.reduce((score,term)=>score+(`${record.title} ${record.description} ${record.terms}`.toLocaleLowerCase().includes(term)?1:0),0)}))
  .filter(item=>item.score>0).sort((a,b)=>b.score-a.score||a.record.id.localeCompare(b.record.id)).slice(0,3);
 if(!matches.length)return null;
 const answer=locale==='kk'
  ?'Жергілікті демонстрациялық каталогтан сәйкес сипаттамалар табылды. Бұл генеративті AI жауабы емес және жазбалар нақты архивтік құжаттар емес.'
  :locale==='ru'
  ?'В локальном демонстрационном каталоге найдены подходящие описания. Это не генеративный ответ AI, а записи не являются подлинными архивными документами.'
  :'Matching descriptions were found in the local demonstration catalogue. This is not a generative AI response, and these are not authentic archival records.';
 return {mode:'local-search' as const,locale,answer,citations:matches.map(({record},index)=>({id:`D${index+1}`,title:redact(record.title),quote:redact(record.description),url:`/document/${record.id}`,provenance:'demonstration'}))};
}
