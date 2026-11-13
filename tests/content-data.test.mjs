import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {test} from 'node:test';
import {demoReadOnlyFailure} from '../lib/demo-read-only.ts';
import {getPublicSiteUrl} from '../lib/site-url.ts';
import {enforceSharedRateLimit} from '../lib/ai/shared-rate-limit.ts';
import {messages} from '../locales/messages.ts';
import {archiveFoundation,branchConflictDetails,branchConflicts,branchEvidenceUrl,calendarEvidence} from '../lib/provenance.ts';

test('demo read-only guard is opt-in and blocks writes without revealing details',async()=>{
 const before=process.env.DEMO_READ_ONLY,vercel=process.env.VERCEL;
 delete process.env.VERCEL;
 delete process.env.DEMO_READ_ONLY;
 assert.equal(demoReadOnlyFailure(),null);
 process.env.DEMO_READ_ONLY='true';
 const response=demoReadOnlyFailure();
 assert.equal(response.status,503);
 assert.equal(response.headers.get('cache-control'),'no-store');
 assert.deepEqual(await response.json(),{error:'Archive content is read-only in this demonstration'});
 process.env.VERCEL='1';delete process.env.DEMO_READ_ONLY;
 const deploymentGuard=demoReadOnlyFailure();assert.equal(deploymentGuard.status,503);assert.match((await deploymentGuard.json()).error,/Persistent administrative storage/);
 if(before===undefined)delete process.env.DEMO_READ_ONLY;else process.env.DEMO_READ_ONLY=before;
 if(vercel===undefined)delete process.env.VERCEL;else process.env.VERCEL=vercel;
});

test('public site URL accepts only a clean origin and requires matching HTTPS production origins',()=>{
 const nodeEnv=process.env.NODE_ENV,site=process.env.NEXT_PUBLIC_SITE_URL,origin=process.env.APP_ORIGIN;
 try{
  process.env.NODE_ENV='production';
  process.env.APP_ORIGIN='https://archive.example';
  process.env.NEXT_PUBLIC_SITE_URL='https://archive.example';
  assert.equal(getPublicSiteUrl().origin,'https://archive.example');
  process.env.APP_ORIGIN='https://other.example';
  assert.throws(()=>getPublicSiteUrl(),/must match/);
  process.env.APP_ORIGIN='https://archive.example';
  process.env.NEXT_PUBLIC_SITE_URL='http://archive.example';
  assert.throws(()=>getPublicSiteUrl(),/HTTPS/);
  process.env.NEXT_PUBLIC_SITE_URL='https://archive.example/path';
  assert.throws(()=>getPublicSiteUrl(),/only an origin/);
 }finally{
  if(nodeEnv===undefined)delete process.env.NODE_ENV;else process.env.NODE_ENV=nodeEnv;
  if(site===undefined)delete process.env.NEXT_PUBLIC_SITE_URL;else process.env.NEXT_PUBLIC_SITE_URL=site;
  if(origin===undefined)delete process.env.APP_ORIGIN;else process.env.APP_ORIGIN=origin;
 }
});

test('shared AI limiter checks per-IP and aggregate windows and fails closed in production',async()=>{
 let requestBody,requestUrl;
 const request=new Request('https://archive.example/api/assistant',{headers:{'x-forwarded-for':'203.0.113.12'}});
 const options={url:'https://redis.example',token:'test-only-token',vercel:true,production:true,now:()=>120_000,fetcher:async(url,init)=>{requestUrl=String(url);requestBody=JSON.parse(init.body);return Response.json({result:[2,18]});}};
 await enforceSharedRateLimit(request,options);
 assert.equal(requestBody[0],'EVAL');
 assert.equal(requestUrl,'https://redis.example/');
 assert.equal(requestBody[2],2);
 assert.match(requestBody[3],/^altai:assistant:ip:[a-f0-9]{64}:2$/);
 assert.equal(requestBody[4],'altai:assistant:global:2');
 await assert.rejects(enforceSharedRateLimit(request,{...options,fetcher:async()=>Response.json({result:[6,18]})}),/rate_limit/);
 await assert.rejects(enforceSharedRateLimit(request,{url:'',token:'',production:true,vercel:true}),/rate_limit_unavailable/);
});

test('branch import preserves source and review markers, never invents coordinates or hours',async()=>{
 const records=JSON.parse(await readFile(new URL('../data/branches.json',import.meta.url),'utf8'));
 assert.equal(records.length,13);
 for(const record of records){
  assert.equal(record.sourceDocument,'Постановление обл акимата 142.pdf');
  assert.equal(record.addressSourceDocument,'Адреса и контакты филиалов.xls');
  assert.equal(record.sourceDate,'2 июня 2026 года · перечень и переименование филиалов');
  assert.equal(record.needsReview,true);
  if(record.id==='branch-source-12'){
   assert.equal(record.coordinatesStatus,'provider-geocoded');
   assert.deepEqual(record.coordinates,{latitude:49.958867,longitude:82.598267,sourceUrl:'https://yandex.com/maps/10306/ust-kamenogorsk/search/Potanina%2012%2F2/',sourceLabel:'Yandex Maps address match; map position only, not independent confirmation of branch operation',checkedAt:'2026-11-13'});
  }else assert.equal(record.coordinatesStatus,'unavailable');
  assert.equal(record.hours,null);
  if(record.id==='branch-source-12'){
   assert.equal(record.phone,'8 (7232) 76-65-60, 8 (7232) 76-81-64');
   assert.equal(record.contactSourceDocument,'Контакты предоставлены заказчиком 12.11.2026');
  }else assert.equal(record.phone,null,'Unprovided branch phone numbers must not ship in the public branch dataset');
  assert.equal(record.email,null,'Unverified staff email addresses must not ship in the public branch dataset');
  assert.ok(Array.isArray(record.reviewNotes));
 }
 assert.deepEqual(records.map(x=>x.shortName),[
  'Филиал района Алтай','Глубоковский районный филиал','Зайсанский районный филиал','Катон-Карагайский районный филиал','Курчумский районный филиал','Филиал района Маркаколь','Риддерский городской филиал','Филиал района Самар','Тарбагатайский районный филиал','Уланский районный филиал','Филиал района Улькен Нарын','Усть-Каменогорский городской филиал по личному составу','Шемонаихинский районный филиал'
 ]);
 assert.equal(records.filter(x=>x.addressStatus==='official-listing').length,0);
 const institution=await readFile(new URL('../components/institution.tsx',import.meta.url),'utf8');
 assert.match(institution,/selected\.address&&selected\.addressStatus==='official-listing'/,'Map links must only use verified branch addresses');
 const directory=await readFile(new URL('../components/branches-directory.tsx',import.meta.url),'utf8');
 assert.match(directory,/openstreetmap\.org\/export\/embed\.html/,'A real map iframe must be used for the geocoded branch');
 assert.match(directory,/selected\.id==='branch-source-12'/,'A 2GIS address search is allowed only for the customer-confirmed Oskemen branch');
});

test('2026 calendar retains both source language records and flags known discrepancies',async()=>{
 const records=JSON.parse(await readFile(new URL('../data/calendar-2026.json',import.meta.url),'utf8'));
 assert.equal(records.filter(x=>x.language==='ru').length,42);
 assert.equal(records.filter(x=>x.language==='kk').length,42);
 assert.ok(records.every(x=>x.year===2026&&x.sourceDocument==='календарь 2026 год каз рус.docx'));
 for(const phrase of ['телефонной станции 1946','школы, открытой в 1886','исследования Рудного Алтая']){
  assert.ok(records.some(x=>x.needsReview&&x.reviewNotes.some(note=>note.includes(phrase))));
 }
});

test('customer calendars for 2022–2025 are preserved in both source languages',async()=>{
 const records=JSON.parse(await readFile(new URL('../data/calendar-2022-2025.json',import.meta.url),'utf8'));
 assert.equal(records.length,308);
 for(const year of [2022,2023,2024,2025]){
  const entries=records.filter(x=>x.year===year);
  assert.equal(entries.filter(x=>x.language==='ru').length,entries.filter(x=>x.language==='kk').length);
  assert.ok(entries.every(x=>x.sourceDocument===`календарь ${year} год каз рус.docx`));
 }
 assert.ok(records.every(x=>x.text.trim()&&x.sourceDate.trim()&&x.pairId));
 assert.ok(records.some(x=>x.needsReview),'Source discrepancies should be flagged, not normalized away');
 const combined=[...records,JSON.parse(await readFile(new URL('../data/calendar-2026.json',import.meta.url),'utf8'))];
 assert.equal(combined.flat().filter(x=>x.language==='ru').length,196);
 assert.equal(combined.flat().filter(x=>x.language==='kk').length,196);
});

test('archive history timeline quotes customer material in the original language',async()=>{
 const records=JSON.parse(await readFile(new URL('../data/archive-history.json',import.meta.url),'utf8'));
 assert.equal(records.length,10);
 assert.deepEqual(records.map(x=>x.year),[1940,1963,1967,1997,2009,2012,2013,2019,2020,2022]);
 assert.ok(records.every(x=>x.language==='ru'&&x.sourceDocument==='История архива.docx'&&x.provenance==='customer-supplied-primary-source'));
 assert.ok(records[0].text.startsWith('Государственный архив Восточно-Казахстанской области образован в 1940 году'));
 const archive=await readFile(new URL('../data/archive.ts',import.meta.url),'utf8');
 assert.match(archive,/slug:'archive-chronology'.*?year:'1940–2022'/s);
 for(const locale of ['ru','kk','en']){
  assert.ok(messages[locale].exhibitionsLead&&messages[locale].exhibitionSourceBased,`Source-based exhibition labels must exist in ${locale}`);
 }
});

test('provenance distinguishes archive source, official corroboration and branch conflicts',async()=>{
 const records=JSON.parse(await readFile(new URL('../data/calendar-2026.json',import.meta.url),'utf8'));
 assert.equal(archiveFoundation.status,'confirmed');
 assert.equal(archiveFoundation.evidence[0].url,'https://www.gov.kz/org/vko-cultura-arhiv/press/events/details/1292');
 assert.equal(calendarEvidence.library130.status,'confirmed');
 assert.equal(calendarEvidence.library130.evidence[1].publishedAt,null);
 assert.equal(calendarEvidence.library130.evidence[1].checkedAt,'2026-11-10');
 assert.ok(records.some(record=>record.language==='ru'&&record.month===3&&record.text.includes('областной библиотеки')));
 assert.ok(records.some(record=>record.language==='kk'&&record.month===3&&record.text.includes('кітапханасының')));
 assert.equal(branchConflicts.size,Object.keys(branchConflictDetails).length);
 assert.ok(Object.values(branchConflictDetails).every(record=>record.phone===null),'Unverified branch phone contacts must not appear in the public provenance register');
 assert.equal(branchEvidenceUrl,'https://e-memory.kz/en/archive/vostochno-kazakhstanskaya-oblast/');
});

test('new branch and calendar interface labels exist in RU, KK and EN',()=>{
 const keys=['assistant','feedback','feedbackTitle','moreSections','branchList','branchMap','branchSearch','branchRoute','branchMapGeocoded','branchCoordinateCaveat','branchCoordinateSource','branchReviewNotice','branchStatusNeedsReview','branchStatusConflict','branchSourceOriginal','branchSourceExternal','branchCrossCheckCaveat','provenanceConfirmed','provenanceNoSource','aiWebSearchUnavailable','aiExampleOne','aiHelpCatalog','aiHelpDocument','catalogueSourceError','searchEmptyHint','exhibitionDemo','historyRegionEyebrow','historySampleMaterials','calendarEyebrow','calendarTitle','calendarIntro','calendarYear','calendarMonth','calendarTopic','calendarSourceLanguage','calendarEnglishUnavailable','calendarReviewNeeded','calendarNoEntries','historyCalendarIntro','calendarAskAI','calendarSourceVersion'];
 for(const locale of ['ru','kk','en'])for(const key of keys)assert.equal(typeof messages[locale][key],'string',`${locale}.${key}`);
});

test('official documents navigation is localized and archive-supplied PDFs are present',async()=>{
 const keys=['officialDocuments'];
 for(const locale of ['ru','kk','en'])for(const key of keys)assert.equal(typeof messages[locale][key],'string',`${locale}.${key}`);
 const page=await readFile(new URL('../app/official-documents/page.tsx',import.meta.url),'utf8');
 for(const url of ['https://adilet.zan.kz/rus/docs/G23V000289A','https://adilet.zan.kz/kaz/docs/G23V000289A','https://www.gov.kz/services/3014?lang=ru','https://www.gov.kz/situations/13/67'])assert.ok(page.includes(url),`Official source link missing: ${url}`);
 for(const file of ['archive-services-price-list-ru.pdf','archive-services-price-list-kk.pdf','vko-akimat-resolution-142-2026.pdf']){
  assert.ok(page.includes(`/documents/${file}`),`Local source link missing: ${file}`);
  const pdf=await readFile(new URL(`../public/documents/${file}`,import.meta.url));
  assert.equal(pdf.subarray(0,4).toString(),'%PDF',`Invalid PDF asset: ${file}`);
 }
 assert.match(page,/нормативный акт, а не архивное дело/i,'The resolution must not be presented as an archival record');
});
