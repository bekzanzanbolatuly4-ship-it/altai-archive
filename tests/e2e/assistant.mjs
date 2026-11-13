import assert from 'node:assert/strict';
import {cp,mkdir,mkdtemp,writeFile,symlink,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {spawn} from 'node:child_process';
import {setTimeout as delay} from 'node:timers/promises';

// Optional tooling: PLAYWRIGHT_MODULE_PATH may point at an existing playwright installation.
const {chromium}=await import(process.env.PLAYWRIGHT_MODULE_PATH||'playwright');
const root=process.cwd();
const isolated=await mkdtemp(path.join(tmpdir(),'altai-ai-e2e-'));
let server,browser;
try{
 await cp(root,isolated,{recursive:true,filter:source=>{
  const part=path.relative(root,source).split(path.sep)[0];
  return !['.data','.next','node_modules','output'].includes(part)&&!part.startsWith('.');
 }});
 await symlink(path.join(root,'node_modules'),path.join(isolated,'node_modules'));
 await mkdir(path.join(isolated,'.data'));
 const publicDoc={id:'synthetic-public',title:'Archive photographs',description:'Photographs of mountains. Synthetic public record.',status:'published',accessStatus:'public',provenance:'verified',fileName:'synthetic.pdf',keywords:[]};
 await writeFile(path.join(isolated,'.data/archive-store.json'),JSON.stringify({users:[],sessions:[],audit:[],documents:[publicDoc,{...publicDoc,id:'private',title:'PRIVATE CONTENT',status:'draft',accessStatus:'restricted'}]}));
 server=spawn(process.execPath,[path.join(root,'node_modules/next/dist/bin/next'),'dev','--webpack','--hostname','127.0.0.1','--port','3107'],{
  cwd:isolated,stdio:'pipe',env:{PATH:process.env.PATH,HOME:process.env.HOME,NODE_OPTIONS:`--import=${path.join(isolated,'tests/fixtures/ai-provider.mjs')}`,GEMINI_API_KEY:'synthetic-e2e-key',DEMO_READ_ONLY:'true',ARCHIVE_OWNER_EMAIL:'synthetic-owner@example.test',ARCHIVE_OWNER_PASSWORD:'Synthetic-only-Password-2026!',SESSION_SECRET:'synthetic-only-secret-0123456789abcdef0123456789abcdef'}
 });
 let logs='';server.stdout.on('data',v=>{logs+=v;});server.stderr.on('data',v=>{logs+=v;});
 let ready=false;
 for(let i=0;i<60;i++){
  if(server.exitCode!==null)throw new Error(`Isolated server exited: ${logs}`);
  try{if((await fetch('http://127.0.0.1:3107/assistant')).ok){ready=true;break;}}catch{}
  await delay(1000);
 }
 assert.ok(ready,'Isolated server must start');
browser=await chromium.launch({headless:true,...(process.env.PLAYWRIGHT_EXECUTABLE_PATH?{executablePath:process.env.PLAYWRIGHT_EXECUTABLE_PATH}:{})});
 const page=await browser.newPage();
 if(process.env.ALT_ARCHIVE_SCREENSHOT_DIR)await mkdir(process.env.ALT_ARCHIVE_SCREENSHOT_DIR,{recursive:true});
 const assistantRequests=[];
 page.on('request',request=>{
  if(new URL(request.url()).pathname==='/api/assistant')assistantRequests.push(request);
 });
 await page.route('**/*',route=>new URL(route.request().url()).hostname==='127.0.0.1'?route.continue():route.abort());
 for(const width of [360,390,430,768,1024,1440]){
  await page.setViewportSize({width,height:900});
  await page.goto('http://127.0.0.1:3107/');
  assert.doesNotMatch(await page.locator('body').innerText(),/ALTAI\s*ARCHIVE/i,'Public site must use the official institution name, not the former product brand');
  if(process.env.ALT_ARCHIVE_SCREENSHOT_DIR&&(width===390||width===1440))await page.screenshot({path:path.join(process.env.ALT_ARCHIVE_SCREENSHOT_DIR,`home-${width}.png`),fullPage:true});
  assert.equal(await page.locator('.admin-link').count(),0,'Guest navigation must not expose administration');
  await page.locator('.home-shortcuts a[href="/assistant"]').click();
  await page.waitForURL('**/assistant');
  assert.equal(new URL(page.url()).pathname,'/assistant');
  await page.goto('http://127.0.0.1:3107/');
  if(width<=800){
   await page.getByRole('button',{name:/Меню навигации|Навигация мәзірі|Navigation menu/}).click();
   assert.equal(await page.getByRole('button',{name:/Меню навигации|Навигация мәзірі|Navigation menu/}).getAttribute('aria-expanded'),'true');
   await page.locator('.accessibility-button').click();
   assert.equal(await page.locator('html').getAttribute('data-accessibility'),'large');
   assert.ok(Number.parseFloat(await page.locator('body').evaluate(element=>getComputedStyle(element).fontSize))>=18);
   await page.locator('.accessibility-button').click();
   await page.keyboard.press('Escape');
   assert.equal(await page.getByRole('button',{name:/Меню навигации|Навигация мәзірі|Navigation menu/}).getAttribute('aria-expanded'),'false');
   await page.getByRole('button',{name:/Меню навигации|Навигация мәзірі|Navigation menu/}).click();
   await page.locator('.sidebar.sidebar-open a[href="/about"]').click();
  }else{
   await page.locator('.accessibility-button').click();
   assert.equal(await page.locator('html').getAttribute('data-accessibility'),'large');
   assert.ok(Number.parseFloat(await page.locator('body').evaluate(element=>getComputedStyle(element).fontSize))>=18);
   await page.locator('.accessibility-button').click();
   await page.locator('.sidebar a[href="/about"]').click();
  }
  await page.waitForURL('**/about');
  assert.equal(new URL(page.url()).pathname,'/about');
  assert.equal(await page.locator('.nav-link[aria-current="page"]').count(),1);
  assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
 }
 for(const [locale,label] of [['ru','ИИ-помощник'],['kk','ЖИ-көмекші'],['en','AI assistant']]){
  await page.setViewportSize({width:390,height:844});
  await page.goto('http://127.0.0.1:3107/');
  await page.evaluate(locale=>localStorage.setItem('altai-locale',locale),locale);
  await page.reload();
  const item=page.locator('footer a[href="/assistant"]');
  await page.waitForFunction(expected=>document.querySelector('footer a[href="/assistant"]')?.textContent?.trim()===expected,label);
  assert.equal((await item.innerText()).trim(),label);
  await item.focus();
  await page.keyboard.press('Enter');
  await page.waitForURL('**/assistant');
 }
 await page.setViewportSize({width:768,height:900});
 await page.goto('http://127.0.0.1:3107/branches');
 await page.evaluate(()=>localStorage.setItem('altai-locale','ru'));
 await page.reload();
 await page.getByRole('textbox',{name:'Поиск по городу или филиалу'}).fill('Риддер');
 await page.getByRole('button',{name:/Риддер/}).click();
 assert.ok((await page.locator('.branch-explorer').getAttribute('class')).includes('show-map'));
 assert.equal(await page.locator('a[href*="2gis.kz"]').count(),1,'Use the source-listed address to provide an external map search');
 await page.goto('http://127.0.0.1:3107/catalog');
 assert.equal(await page.locator('.catalog-search').count(),1);
 assert.equal(await page.locator('.top-search').count(),0);
 const catalogueSearch=page.locator('.catalog-search input');
 await catalogueSearch.fill('mountains');
 await page.getByRole('heading',{name:'Archive photographs'}).waitFor();
 await page.goto('http://127.0.0.1:3107/document/synthetic-public');
 await page.getByRole('heading',{name:'Archive photographs'}).waitFor();
 assert.doesNotMatch(await page.locator('body').innerText(),/DEMO|ДЕМО|Mockup preview|ДЕМО-ФОНД/i,'Example records must use editorial labels, not technical demo stamps');
 const documentArtwork=await page.evaluate(async()=>await (await fetch('/images/card-document.svg')).text());
 assert.match(documentArtwork,/ОБРАЗЕЦ ОПИСАНИЯ/,'Document illustration must identify itself as a sample');
 assert.doesNotMatch(documentArtwork,/DEMO|ДЕМО/i,'Document illustration must not carry a technical demo stamp');
 await page.goto('http://127.0.0.1:3107/exhibitions');
 await page.getByRole('heading',{name:'Выставки'}).waitFor();
 await page.goto('http://127.0.0.1:3107/exhibitions/land-and-memory');
 await page.getByRole('heading',{name:'Земля и память'}).waitFor();
 assert.doesNotMatch(await page.locator('body').innerText(),/\bDEMO\b|(?<![А-Яа-яЁё])ДЕМО(?![А-Яа-яЁё])|Mockup preview/i,'Exhibition concepts must retain their editorial labels without technical stamps');
 await page.goto('http://127.0.0.1:3107/exhibitions/archive-chronology');
 await page.getByRole('heading',{name:'История государственного архива ВКО'}).waitFor();
 await page.getByText('Государственный архив Восточно-Казахстанской области образован в 1940 году',{exact:false}).waitFor();
 await page.getByText('Материал передан архивом; даты и формулировки приведены по исходному документу.',{exact:true}).waitFor();
 await page.goto('http://127.0.0.1:3107/news');
 await page.getByRole('heading',{name:'Новости'}).waitFor();
 await page.goto('http://127.0.0.1:3107/catalog');
 await page.route('**/api/documents',route=>route.abort());
 await page.reload();
 await page.getByText('Не удалось загрузить опубликованные записи. Источник каталога временно недоступен.').waitFor();
 await page.goto('http://127.0.0.1:3107/news');
 await page.getByRole('textbox',{name:'Поиск публикаций'}).fill('no-matching-news');
 await page.getByRole('heading',{name:'Материалы не найдены'}).waitFor();
 await page.goto('http://127.0.0.1:3107/atlas');
 await page.getByRole('textbox',{name:'Поиск места'}).fill('no-matching-place');
 await page.locator('.place-list-empty').waitFor();
 for(const [locale,aboutTitle] of [['ru','Руководство и отделы'],['kk','Басшылық және бөлімдер'],['en','Management and departments']]){
  await page.goto('http://127.0.0.1:3107/about');
  await page.evaluate(locale=>localStorage.setItem('altai-locale',locale),locale);
  await page.reload();
  await page.getByRole('heading',{name:aboutTitle}).waitFor();
  await page.setViewportSize({width:1440,height:1000});
  const accessibilityName=locale==='ru'?'Для слабовидящих':locale==='kk'?'Көру қабілеті төмен адамдарға':'Accessibility mode';
  const accessibilityButton=page.getByRole('button',{name:accessibilityName});
  await accessibilityButton.click();
  assert.equal(await page.locator('html').getAttribute('data-accessibility'),'large','Accessibility control must enable large-text mode');
  assert.equal(await page.locator('body').evaluate(node=>getComputedStyle(node).fontSize),'18px');
  await accessibilityButton.click();
  assert.equal(await page.locator('html').getAttribute('data-accessibility'),'standard','Accessibility control must restore the default mode');
  const themeButton=page.locator('.theme-button:not(.accessibility-button)');
  await themeButton.click();
  assert.equal(await page.locator('html').getAttribute('data-theme'),'dark','Theme control must activate dark mode');
  await themeButton.click();
  assert.equal(await page.locator('html').getAttribute('data-theme'),'light','Theme control must restore light mode');
  await page.setViewportSize({width:390,height:844});
  const footer=page.locator('.footer-directory');
  assert.equal(await footer.locator('a[href="/about"]').count(),1);
  assert.equal(await footer.locator('a[href="/branches"]').count(),1);
  assert.equal(await footer.locator('a[href="/about#feedback"]').count(),1);
  assert.equal(await footer.locator('a[href="/catalog"]').count(),1);
  assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'Footer directory must fit a mobile viewport');
  const feedbackHeading={ru:'Отзывы и предложения',kk:'Пікірлер мен ұсыныстар',en:'Feedback and suggestions'}[locale];
  await page.getByRole('heading',{name:feedbackHeading}).scrollIntoViewIfNeeded();
  const feedbackForm=page.locator('.feedback-form');await feedbackForm.waitFor();
  assert.equal(await feedbackForm.locator('.feedback-contact-fields input').count(),2,'Anonymous feedback requires first and last name');
  assert.equal(await feedbackForm.locator('input[type="email"]').count(),1,'Reply email is optional');
  await feedbackForm.locator('select').selectOption('site_feedback');
  assert.equal(await feedbackForm.locator('.feedback-stars button').count(),5,'Website review provides a five-star rating');
  assert.equal(await page.locator('.admin-link').count(),0,'Public feedback page must not expose staff navigation');
  // UI-only mock: storage and rate-limit behavior are covered separately by route unit tests.
  await page.route('**/api/feedback',async route=>{
   const body=route.request().postDataJSON();assert.equal(body.firstName,'Test');assert.equal(body.lastName,'Visitor');assert.equal(body.type,'site_feedback');assert.equal(body.rating,5);assert.equal(body.feedbackConsent,true);assert.equal(body.website,'');
   await route.fulfill({status:201,contentType:'application/json',body:JSON.stringify({received:true})});
  });
  await feedbackForm.locator('.feedback-contact-fields input').nth(0).fill('Test');
  await feedbackForm.locator('.feedback-contact-fields input').nth(1).fill('Visitor');
  await feedbackForm.locator('.feedback-stars button').nth(4).click();
  await feedbackForm.locator('textarea').fill('The website is clear and useful.');
  await feedbackForm.locator('input[type="checkbox"]').check();
  await feedbackForm.locator('button[type="submit"]').click();
  await feedbackForm.getByRole('status').waitFor();
  await page.goto('http://127.0.0.1:3107/register');
  await page.getByRole('heading',{name:locale==='ru'?'Регистрация посетителя':locale==='kk'?'Келушіні тіркеу':'Visitor registration'}).waitFor();
  assert.equal(await page.locator('input[type="password"]').count(),2,'Registration asks for password and confirmation');
  assert.equal(await page.getByRole('button',{name:locale==='ru'?'Зарегистрироваться':locale==='kk'?'Тіркелу':'Register'}).isDisabled(),false,'Account form does not require a CAPTCHA widget');
  assert.equal(await page.getByText(/CAPTCHA/i).count(),0,'No CAPTCHA prompt is shown');
  await page.goto('http://127.0.0.1:3107/about');
  await page.setViewportSize({width:390,height:844});
  assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'Feedback form must fit a mobile viewport');
  await page.getByText('Жапаров Аскар Кенжебаевич',{exact:true}).waitFor();
  assert.ok(await page.locator('a[href="mailto:arhiv-ukg@yandex.kz"]').count()>=1,'Show the official archive email from the current public procurement record');
  assert.ok(await page.locator('a[href="https://egov.kz/services/K002/"]').count()>=1,'Use the official eGov online-service link');
  assert.equal(await page.locator('a[href*="2gis.kz/oskemen/search/"]').count(),1,'Only provide a 2GIS search for the verified main archive address');
  await page.goto('http://127.0.0.1:3107/official-documents');
  await page.getByRole('heading',{name:locale==='ru'?'Государственные услуги и документы':locale==='kk'?'Мемлекеттік қызметтер мен құжаттар':'Public services and documents'}).waitFor();
  for(const section of ['#paid-services','#government-service','#legal-framework','#compliance','#reading-room','#useful-links'])await page.locator(section).waitFor();
  const customerPdfLinks=await page.locator('a[href^="/documents/"]').evaluateAll(links=>links.map(link=>link.getAttribute('href')));
  assert.deepEqual(customerPdfLinks.sort(),['/documents/archive-services-price-list-kk.pdf','/documents/archive-services-price-list-ru.pdf','/documents/vko-akimat-resolution-142-2026.pdf'].sort());
  for(const href of customerPdfLinks){const response=await page.request.get(`http://127.0.0.1:3107${href}`);assert.equal(response.status(),200,`Customer PDF should be available: ${href}`);assert.match(response.headers()['content-type']||'',/application\/pdf/);}
  const officialHosts=await page.locator('.official-info-link').evaluateAll(links=>links.map(link=>new URL(link.href).hostname));
  assert.ok(officialHosts.length>=10);
  assert.ok(officialHosts.every(host=>host==='127.0.0.1'||host==='adilet.zan.kz'||host==='old.adilet.zan.kz'||host==='www.gov.kz'||host==='gov.kz'||host==='egov.kz'||host==='beta.egov.kz'));
  await page.setViewportSize({width:390,height:844});
  assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'Official information page must fit a mobile viewport');
  await page.screenshot({path:path.join(root,`output/playwright/official-documents-${locale}-mobile.png`),fullPage:true});
  await page.setViewportSize({width:1440,height:1000});
  await page.screenshot({path:path.join(root,`output/playwright/official-documents-${locale}-desktop.png`),fullPage:true});
 }
 const publicFeedbackRead=await page.request.get('http://127.0.0.1:3107/api/feedback');
 assert.equal(publicFeedbackRead.status(),405,'Feedback messages must not have a public read endpoint');
 for(const locale of ['ru','kk','en']){
  for(const mobile of [false,true]){
   await page.setViewportSize(mobile?{width:390,height:844}:{width:1440,height:1000});
   await page.goto('http://127.0.0.1:3107/assistant');
   await page.evaluate(({locale,mobile})=>{localStorage.setItem('altai-locale',locale);localStorage.setItem('altai-dark',String(mobile));},{locale,mobile});
   await page.reload();
   const input=page.locator('textarea');
   await input.fill('Find photographs');await input.press('Shift+Enter');
   assert.match(await input.inputValue(),/\n/);
   await input.press('Enter');
   await page.getByText(/Public metadata describes photographs\./).waitFor();
   const assistantRequest=assistantRequests.at(-1);
   assert.ok(assistantRequest,'Browser must issue the assistant request');
   assert.equal(assistantRequest.url(),`${page.url().split('/assistant')[0]}/api/assistant`,'Assistant fetch must use the current site origin');
   const assistantHeaders=await assistantRequest.allHeaders();
   assert.equal(assistantHeaders.origin,'http://127.0.0.1:3107','Browser Origin must match the page origin');
   assert.ok(assistantHeaders['sec-fetch-site']===undefined||assistantHeaders['sec-fetch-site']==='same-origin','Browser Fetch Metadata must not mark the API request cross-site');
   assert.equal(await page.locator('a[href="/document/synthetic-public"]').count(),1);
   assert.ok(!(await page.locator('body').innerText()).includes('PRIVATE CONTENT'));
   assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
   if(mobile){
    const greeting=locale==='ru'?'Привет!':locale==='kk'?'Сәлем!':'Hello!';
    const greetingResponse=page.waitForResponse(response=>new URL(response.url()).pathname==='/api/assistant');
    await input.fill(greeting);await input.press('Enter');
    const greetingBody=await (await greetingResponse).json();assert.equal(greetingBody.mode,'ai');assert.ok(greetingBody.citations.length>0);
    const referenceLabel=locale==='ru'?'Ответ AI':locale==='kk'?'AI жауабы':'AI response';
    await page.getByText(referenceLabel,{exact:true}).last().waitFor();
   }
   if(locale==='ru'&&mobile){
   const referenceResponse=page.waitForResponse(response=>new URL(response.url()).pathname==='/api/assistant');
   await input.fill('How do I use the archive catalogue?');await input.press('Enter');
   const referenceAnswer=await (await referenceResponse).json();assert.equal(referenceAnswer.mode,'ai');assert.equal(referenceAnswer.citations[0].url,'/catalog');
   await page.getByText('Ответ автоматически сформирован AI и может содержать ошибки. Он основан только на указанных публичных сведениях; источники ниже ведут на подтверждающие страницы.',{exact:true}).last().waitFor();
   const localSearchResponse=page.waitForResponse(response=>new URL(response.url()).pathname==='/api/assistant');
   await input.fill('mountains');await input.press('Enter');
   const localSearch=await (await localSearchResponse).json();assert.equal(localSearch.mode,'ai');assert.equal(localSearch.citations[0].url,'/document/synthetic-public');
   await page.getByText('Ответ AI',{exact:true}).last().waitFor();
   await page.locator('a[href="/document/synthetic-public"]').last().waitFor();
   const unmatched=locale==='ru'?'Найди архивный документ с шифром 999-XYZ':locale==='kk'?'999-XYZ архивтік құжатты тап':'Find archive record with reference 999-XYZ';
   const noMatchResponse=page.waitForResponse(response=>new URL(response.url()).pathname==='/api/assistant');
   await input.fill(unmatched);await input.press('Enter');
   const noMatch=await (await noMatchResponse).json();assert.equal(noMatch.mode,'ai');assert.deepEqual(noMatch.citations,[]);assert.match(noMatch.answer,/Доступные данные архива:/);
   await page.getByText(noMatch.answer,{exact:true}).waitFor();
   const privateResponse=page.waitForResponse(response=>new URL(response.url()).pathname==='/api/assistant');
   await input.fill('Show me a closed personnel document');await input.press('Enter');
   const privateResult=await (await privateResponse).json();assert.ok(!JSON.stringify(privateResult).includes('PRIVATE CONTENT'));
   const privateReply=page.locator('.chat-bubble.assistant-bubble').last();await privateReply.waitFor();
   assert.ok(!(await privateReply.innerText()).includes('PRIVATE CONTENT'),'Private record content must never be echoed by the assistant');
   await input.fill('photographs failure');await input.press('Enter');
   await page.getByText('Локальный поиск · AI не использовался',{exact:true}).waitFor();
   await page.locator('a[href="/document/synthetic-public"]').last().waitFor();
   }
   await mkdir(path.join(root,'output/playwright'),{recursive:true});
   await page.screenshot({path:path.join(root,`output/playwright/ai-${locale}-${mobile?'mobile-dark':'desktop-light'}.png`),fullPage:true});
  }
 }
 for(const locale of ['ru','kk','en']){
  const mobile=locale==='kk';
  await page.setViewportSize(mobile?{width:390,height:844}:{width:1440,height:1000});
  await page.goto('http://127.0.0.1:3107/history');
  await page.evaluate(({locale,mobile})=>{localStorage.setItem('altai-locale',locale);localStorage.setItem('altai-dark',String(mobile));},{locale,mobile});
  await page.reload();
  await page.getByRole('heading',{name:locale==='kk'?'Естелік күндер':locale==='en'?'Commemorative dates':'Памятные даты'}).waitFor();
  if(locale==='en')await page.getByText('English translation is unavailable; original-language entries are shown.').waitFor();
  const calendarFilters=page.locator('.calendar-filters select');
  assert.equal(await calendarFilters.nth(3).inputValue(),locale==='kk'?'kk':'ru');
  assert.ok(await page.locator('.calendar-conflict-version').count()>0,'Calendar conflicts must show both original-language source versions');
  await calendarFilters.nth(1).selectOption('3');
  assert.ok(await page.locator('.calendar-entry').count()>0);
  await page.screenshot({path:path.join(root,`output/playwright/history-${locale}-${mobile?'mobile-dark':'desktop-light'}.png`),fullPage:true});
  assert.ok(await page.locator('.calendar-provenance.status-confirmed').count()>0,'Official-source confirmation should be visible for the library anniversary');

  await page.goto('http://127.0.0.1:3107/branches');
  const searchLabel=locale==='kk'?'Қала немесе филиал бойынша іздеу':locale==='en'?'Search by city or branch':'Поиск по городу или филиалу';
  const liveMap=page.locator('.branch-map-frame');
  assert.equal(await liveMap.count(),1,'The customer-confirmed Oskemen address should show the interactive OpenStreetMap embed');
  assert.match(await liveMap.getAttribute('src'),/openstreetmap\.org\/export\/embed\.html.*marker=/,'The map should carry the geocoded marker');
  assert.equal(await page.locator('.branch-list-item').count(),13,'The branch directory must provide all thirteen source-listed locations');
  assert.equal(await page.locator('.branch-map-source[href*="openstreetmap.org/?mlat"]').count(),1,'Settlement centroid must disclose its OpenStreetMap source');
  await page.getByRole('textbox',{name:searchLabel}).fill('Потанина');
  await page.locator('.branch-list-item').first().click();
  assert.equal(await page.locator('.branch-map-source[href*="yandex.com/maps"]').count(),1,'The address-level marker must disclose its Yandex geocoding source');
  if(mobile)await page.locator('.branch-mobile-tabs button').first().click();
  await page.getByRole('textbox',{name:searchLabel}).fill('Риддер');
  const ridder=page.getByRole('button',{name:locale==='en'?/Ridder/:/Риддер/});
  await ridder.click();
  if(mobile)await page.locator('.branch-explorer').waitFor({state:'visible'});
  if(mobile)assert.ok((await page.locator('.branch-explorer').getAttribute('class')).includes('show-map'));
  const route=page.locator('a[href*="2gis.kz"]');
  assert.equal(await route.count(),1,'Clearly labelled source-listed addresses may open a map search');
  await page.locator('.branch-evidence a[href*="e-memory.kz"]').waitFor();
  if(mobile)await page.screenshot({path:path.join(root,`output/playwright/branches-${locale}-mobile-map.png`),fullPage:true});
  if(mobile)await page.locator('.branch-mobile-tabs button').first().click();
  await page.getByRole('textbox',{name:searchLabel}).fill('no-matching-archive-record');
  await page.getByText(locale==='kk'?'Бұл сұрау бойынша филиал табылмады. Атауды немесе елді мекенді өзгертіңіз.':locale==='en'?'No branches match this search. Try another name or settlement.':'Филиалы по этому запросу не найдены. Измените название или населённый пункт.').waitFor();
  await page.getByRole('textbox',{name:searchLabel}).fill('Риддер');
  await page.screenshot({path:path.join(root,`output/playwright/branches-${locale}-${mobile?'mobile-dark':'desktop-light'}.png`),fullPage:true});
 }
 await page.goto('http://127.0.0.1:3107/admin');
 await page.getByText('Демонстрация доступна только для чтения.',{exact:false}).waitFor();
 const readOnlyStatuses=await page.evaluate(async()=>{
  const headers={'content-type':'application/json'};
  const docs=await fetch('/api/admin/documents',{method:'POST',headers,body:'{}'});
  const users=await fetch('/api/admin/users',{method:'POST',headers,body:'{}'});
  const feedback=await fetch('/api/admin/feedback');
  const exportRequest=await fetch('/api/admin/export');
  return [docs.status,users.status,feedback.status,exportRequest.status];
 });
 assert.deepEqual(readOnlyStatuses,[503,503,401,503]);
 const loginStatus=await page.evaluate(async()=>{
  const response=await fetch('/api/auth/login',{method:'POST',headers:{'content-type':'application/json'},body:'{}'});
  return response.status;
 });
 assert.equal(loginStatus,401,'Invalid login should not require creating the initial owner in read-only mode');
 const isolatedStore=JSON.parse(await (await import('node:fs/promises')).readFile(path.join(isolated,'.data/archive-store.json'),'utf8'));
 assert.equal(isolatedStore.users.length,0,'Read-only login must not bootstrap an owner account');
 console.log('PASS: responsive navigation, public visitor routes, anonymous feedback UI (mocked success), RU/KK/EN, catalog accuracy, mock Gemini citations, safe fallback, no-match/private-content scenarios, keyboard access, branch provenance, customer PDFs, and read-only admin APIs');
}finally{
 await browser?.close();
 if(server&&server.exitCode===null){server.kill('SIGTERM');await new Promise(resolve=>server.once('exit',resolve));}
 await rm(isolated,{recursive:true,force:true});
}
