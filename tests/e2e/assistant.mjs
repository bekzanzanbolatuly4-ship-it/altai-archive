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
  return !['.git','.data','.next','node_modules','.agents','.codex','.aws','output'].includes(part)&&!part.startsWith('.env');
 }});
 await symlink(path.join(root,'node_modules'),path.join(isolated,'node_modules'));
 await mkdir(path.join(isolated,'.data'));
 const publicDoc={id:'synthetic-public',title:'Archive photographs',description:'Photographs of mountains.',status:'published',accessStatus:'public',provenance:'demonstration',fileName:'synthetic.pdf',keywords:[]};
 await writeFile(path.join(isolated,'.data/archive-store.json'),JSON.stringify({users:[],sessions:[],audit:[],documents:[publicDoc,{...publicDoc,id:'private',title:'PRIVATE CONTENT',status:'draft',accessStatus:'restricted'}]}));
 server=spawn(process.execPath,[path.join(root,'node_modules/next/dist/bin/next'),'dev','--webpack','--hostname','127.0.0.1','--port','3107'],{
  cwd:isolated,stdio:'pipe',env:{PATH:process.env.PATH,HOME:process.env.HOME,NODE_OPTIONS:`--import=${path.join(isolated,'tests/fixtures/ai-provider.mjs')}`,OPENROUTER_API_KEY:'synthetic-e2e-key',OPENROUTER_MODEL:'test/model:free',DEMO_READ_ONLY:'true',ARCHIVE_OWNER_EMAIL:'synthetic-owner@example.test',ARCHIVE_OWNER_PASSWORD:'Synthetic-only-Password-2026!',SESSION_SECRET:'synthetic-only-secret-0123456789abcdef0123456789abcdef'}
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
 await page.route('**/*',route=>new URL(route.request().url()).hostname==='127.0.0.1'?route.continue():route.abort());
 for(const width of [390,768,1440]){
  await page.setViewportSize({width,height:900});
  await page.goto('http://127.0.0.1:3107/');
  assert.equal(await page.locator('.admin-link').count(),0,'Guest navigation must not expose administration');
  await page.locator('.quick-tile[href="/assistant"]').click();
  await page.waitForURL('**/assistant');
  assert.equal(new URL(page.url()).pathname,'/assistant');
  await page.goto('http://127.0.0.1:3107/');
  if(width<=800){
   await page.getByRole('button',{name:/Меню навигации|Навигация мәзірі|Navigation menu/}).click();
   assert.equal(await page.getByRole('button',{name:/Меню навигации|Навигация мәзірі|Navigation menu/}).getAttribute('aria-expanded'),'true');
   await page.keyboard.press('Escape');
   assert.equal(await page.getByRole('button',{name:/Меню навигации|Навигация мәзірі|Navigation menu/}).getAttribute('aria-expanded'),'false');
   await page.getByRole('button',{name:/Меню навигации|Навигация мәзірі|Navigation menu/}).click();
   await page.locator('.sidebar.sidebar-open a[href="/assistant"]').click();
  }else{
   await page.locator('.sidebar a[href="/assistant"]').click();
  }
  await page.waitForURL('**/assistant');
  await page.getByRole('heading',{name:'ИИ-помощник'}).waitFor();
  assert.equal(new URL(page.url()).pathname,'/assistant');
  assert.equal(await page.locator('.nav-link[aria-current="page"]').count(),1);
  assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
 }
 for(const [locale,label] of [['ru','ИИ-помощник'],['kk','ЖИ-көмекші'],['en','AI assistant']]){
  await page.setViewportSize({width:390,height:844});
  await page.goto('http://127.0.0.1:3107/');
  await page.evaluate(locale=>localStorage.setItem('altai-locale',locale),locale);
  await page.reload();
  await page.getByRole('button',{name:/Меню навигации|Навигация мәзірі|Navigation menu/}).click();
  const item=page.locator('.sidebar.sidebar-open a[href="/assistant"]');
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
 assert.equal(await page.locator('a[href*="google.com/maps/search"]').count(),1);
 await page.goto('http://127.0.0.1:3107/catalog');
 assert.equal(await page.locator('.catalog-search').count(),1);
 assert.equal(await page.locator('.top-search').count(),0);
 await page.route('**/api/documents',route=>route.abort());
 await page.reload();
 await page.getByText('Не удалось загрузить опубликованные записи. Демонстрационные материалы остаются доступны.').waitFor();
 await page.goto('http://127.0.0.1:3107/news');
 await page.getByRole('textbox',{name:'Поиск публикаций'}).fill('no-matching-news');
 await page.getByRole('heading',{name:'Материалы не найдены'}).waitFor();
 await page.goto('http://127.0.0.1:3107/atlas');
 await page.getByRole('textbox',{name:'Поиск места'}).fill('no-matching-place');
 await page.locator('.place-list-empty').waitFor();
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
   await page.getByText('Public metadata describes photographs.',{exact:true}).waitFor();
   assert.equal(await page.locator('a[href="/document/synthetic-public"]').count(),1);
   assert.ok(!(await page.locator('body').innerText()).includes('PRIVATE CONTENT'));
   assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
   await input.fill('Find photographs failure');await input.press('Enter');
   const aiError=page.locator('.chat-bubble[role="alert"]');
   await aiError.waitFor();
   await aiError.getByRole('button').first().click();
   await aiError.waitFor();
   await aiError.getByRole('button').last().click();
   await page.getByText('DEMO ARCHIVIST',{exact:false}).waitFor();
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
  await page.getByRole('textbox',{name:searchLabel}).fill('Риддер');
  const ridder=page.getByRole('button',{name:/Риддер/});
  await ridder.click();
  if(mobile)await page.locator('.branch-explorer').waitFor({state:'visible'});
  if(mobile)assert.ok((await page.locator('.branch-explorer').getAttribute('class')).includes('show-map'));
  const route=page.locator('a[href*="google.com/maps/search"]');
  assert.equal(await route.count(),1);
  assert.match(await route.getAttribute('href'),/query=/);
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
  const exportRequest=await fetch('/api/admin/export');
  return [docs.status,users.status,exportRequest.status];
 });
 assert.deepEqual(readOnlyStatuses,[503,503,503]);
 const loginStatus=await page.evaluate(async()=>{
  const response=await fetch('/api/auth/login',{method:'POST',headers:{'content-type':'application/json'},body:'{}'});
  return response.status;
 });
 assert.equal(loginStatus,401,'Invalid login should not require creating the initial owner in read-only mode');
 const isolatedStore=JSON.parse(await (await import('node:fs/promises')).readFile(path.join(isolated,'.data/archive-store.json'),'utf8'));
 assert.equal(isolatedStore.users.length,0,'Read-only login must not bootstrap an owner account');
 console.log('PASS: 390/768/1440 navigation to AI, direct chat, mock citations/errors/retry/demo, keyboard, RU/KK/EN, branch search/empty state/mobile list-to-map/routes, calendar provenance filters, read-only admin API and desktop/mobile themes');
}finally{
 await browser?.close();
 if(server&&server.exitCode===null){server.kill('SIGTERM');await new Promise(resolve=>server.once('exit',resolve));}
 await rm(isolated,{recursive:true,force:true});
}
