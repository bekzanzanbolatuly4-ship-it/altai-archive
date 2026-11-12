export type EvidenceKind='archival-document'|'official-independent'|'missing';
export type VerificationStatus='confirmed'|'needs-review'|'conflicting';
export type ProvenanceEvidence={
 kind:EvidenceKind;
 label:string;
 url:string|null;
 publishedAt:string|null;
 checkedAt:string;
 supportsClaim:boolean;
 note:string;
};

export type ProvenanceRecord={
 status:VerificationStatus;
 evidence:ProvenanceEvidence[];
};

export const calendarEvidence={
 library130:{
  status:'confirmed',
  evidence:[
   {kind:'archival-document',label:'календарь 2026 год каз рус.docx',url:null,publishedAt:null,checkedAt:'2026-11-10',supportsClaim:true,note:'Исходная формулировка календаря сохранена без изменений.'},
   {kind:'official-independent',label:'Управление культуры, развития языков и архивного дела Восточно-Казахстанской области · gov.kz',url:'https://www.gov.kz/memleket/entities/vko-cultura-arhiv/press/news/details/1150609?lang=ru',publishedAt:null,checkedAt:'2026-11-10',supportsClaim:true,note:'Материал перечисляет 130-летие областной библиотеки имени А. С. Пушкина среди дат 2026 года. Точная дата публикации страницы не установлена.'}
  ]
 } satisfies ProvenanceRecord
} as const;

export const archiveFoundation:ProvenanceRecord={
 status:'confirmed',
 evidence:[
  {kind:'official-independent',label:'Шығыс Қазақстан облысының мәдениет басқармасы · gov.kz',url:'https://www.gov.kz/org/vko-cultura-arhiv/press/events/details/1292',publishedAt:null,checkedAt:'2026-11-10',supportsClaim:true,note:'Исторический материал 2020 года указывает, что областной государственный архив образован в 1940 году; на тот момент он сообщал о шести филиалах.'}
 ]
};

export const branchConflicts=new Set<string>();
export const branchConflictDetails:Record<string,{name:string;address:string|null;phone:null}>={};

export const branchEvidenceUrl='https://e-memory.kz/en/archive/vostochno-kazakhstanskaya-oblast/';
