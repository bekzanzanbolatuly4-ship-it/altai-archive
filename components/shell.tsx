'use client';
import Link from 'next/link';
import {usePathname} from 'next/navigation';
import {useRouter} from 'next/navigation';
import {useEffect,useRef,useState} from 'react';
import {ArrowUpRight,BookOpen,Eye,House,Map,Menu,Moon,Newspaper,Search,Settings,Sun,X,History,Sparkles} from 'lucide-react';
import {useApp} from './providers';
import {messages,formatInstitutionName,formatOfficeHours} from '@/locales/messages';
import {mainArchive} from '@/data/archive';

type NavItem=readonly [string,keyof typeof messages.ru,typeof House];
const primary:readonly NavItem[]=[
  ['/','home',House],
  ['/about','about',House],
  ['/catalog','catalog',BookOpen],
  ['/history','history',History],
  ['/branches','branches',Map],
  ['/news','news',Newspaper],
  ['/assistant','assistant',Sparkles],
];

export function Shell({children}:{children:React.ReactNode}){
  const path=usePathname();
  const router=useRouter();
  const{msg,locale,setLocale,dark,setDark,accessible,setAccessible}=useApp();
  const[open,setOpen]=useState(false);
  const[staff,setStaff]=useState(false);
  const[visitor,setVisitor]=useState(false);
  const searchRef=useRef<HTMLInputElement>(null);

  useEffect(()=>{
    let alive=true;
    const refreshStaff=()=>fetch('/api/auth/me').then(r=>r.ok?r.json():null).then(result=>{if(alive)setStaff(Boolean(result?.user?.role))}).catch(()=>{if(alive)setStaff(false)});
    const refreshVisitor=()=>fetch('/api/visitor/me',{cache:'no-store'}).then(r=>r.ok?r.json():null).then(result=>{if(alive)setVisitor(Boolean(result?.user))}).catch(()=>{if(alive)setVisitor(false)});
    void refreshStaff();void refreshVisitor();
    let unsubscribe:undefined|(()=>void);
    import('@/lib/supabase/browser').then(({createSupabaseBrowserClient})=>{
      const auth=createSupabaseBrowserClient();
      if(!alive||!auth)return;
      const{data:{subscription}}=auth.auth.onAuthStateChange(()=>{void refreshVisitor()});
      unsubscribe=()=>subscription.unsubscribe();
    }).catch(()=>{});
    return()=>{alive=false;unsubscribe?.();};
  },[]);

  useEffect(()=>{
    const onKey=(e:KeyboardEvent)=>{
      if((e.metaKey||e.ctrlKey)&&e.key.toLowerCase()==='k'){
        e.preventDefault();
        if(path==='/')document.querySelector<HTMLInputElement>('.hero-search input')?.focus();
        else searchRef.current?.focus();
      }
    };
    const onEscape=(e:KeyboardEvent)=>{
      if(e.key==='Escape')setOpen(false);
    };
    window.addEventListener('keydown',onKey);
    window.addEventListener('keydown',onEscape);
    return()=>{
      window.removeEventListener('keydown',onKey);
      window.removeEventListener('keydown',onEscape);
    };
  },[path]);

  const navLinks=(links:readonly NavItem[])=>links.map(([href,key,Icon])=>{
    const route=href.split('#')[0];
    const active=path===route||route!=='/'&&path.startsWith(`${route}/`);
    return <Link
      key={href}
      href={href}
      onClick={()=>setOpen(false)}
      className={`nav-link ${active?'active':''}`}
      aria-current={active?'page':undefined}
    >
      <Icon size={18} strokeWidth={1.6}/>
      <span>{msg(key)}</span>
    </Link>;
  });

  const institutionTitle=formatInstitutionName(locale);
  const hasLocalSearch=['/catalog','/branches','/history','/news','/atlas','/exhibitions','/assistant'].some(route=>path===route||path.startsWith(`${route}/`));

  return (
    <div className="app-shell">
      <a href="#main-content" className="skip-link">
        {locale==='ru'?'Перейти к основному содержимому':locale==='kk'?'Негізгі мазмұнға өту':'Skip to main content'}
      </a>
      <aside id="site-navigation" className={`sidebar ${open?'sidebar-open':''}`}>
        <Link
          className="brand"
          href="/"
          onClick={()=>setOpen(false)}
          aria-label={institutionTitle}
        >
          <span className="brand-mark"><MountainMark/></span>
          <span className="brand-copy">
            <b className="brand-institution">{institutionTitle}</b>
          </span>
        </Link>
        <nav className="side-nav-group" aria-label={locale==='ru'?'Основная навигация':locale==='kk'?'Негізгі навигация':'Primary navigation'}>
          <div className="nav-caption">{locale==='ru'?'ИССЛЕДОВАТЬ':locale==='kk'?'ЗЕРТТЕУ':'DISCOVER'}</div>
          {navLinks(primary)}
        </nav>
        <div className="sidebar-bottom">
          <button className={`theme-button accessibility-button ${accessible?'accessibility-active':''}`} type="button" aria-pressed={accessible} onClick={()=>setAccessible(!accessible)}>
            <Eye size={17}/><span>{locale==='ru'?'Для слабовидящих':locale==='kk'?'Көру қабілеті төмен адамдарға':'Accessibility mode'}</span>
          </button>
          <button
            className="theme-button"
            onClick={()=>setDark(!dark)}
            aria-label={`${msg('theme')}: ${dark?msg('dark'):msg('light')}`}
          >
            <span className="theme-icon">{dark?<Moon size={17}/>:<Sun size={17}/>}</span>
            <span>{dark?msg('dark'):msg('light')}</span>
            <span className={`switch ${dark?'on':''}`} aria-hidden="true"><i/></span>
          </button>
          <div className="sidebar-note">
            {locale==='ru'?'Цифровая платформа архива':locale==='kk'?'Архивтің цифрлық платформасы':'Digital platform of the archive'}
          </div>
          {staff&&!visitor&&<div className="admin-area">
            <span className="admin-caption">
              {locale==='ru'?'ДЛЯ СОТРУДНИКОВ':locale==='kk'?'ҚЫЗМЕТКЕРЛЕРГЕ':'STAFF ACCESS'}
            </span>
            <Link className="admin-link" href="/admin" onClick={()=>setOpen(false)}>
              <Settings size={16}/>
              <span>{msg('admin')}</span>
              <ArrowUpRight size={13}/>
            </Link>
            <small>
              {locale==='ru'?'Вход для сотрудников':locale==='kk'?'Қызметкерлерге кіру':'Staff sign-in'}
            </small>
          </div>}
        </div>
      </aside>
      {open&&<button className="scrim" onClick={()=>setOpen(false)} aria-label={msg('close')}/>}
      <div className="main-column">
        <header className="topbar">
          <button
            className="mobile-menu icon-button"
            onClick={()=>setOpen(!open)}
            aria-label={locale==='ru'?'Меню навигации':locale==='kk'?'Навигация мәзірі':'Navigation menu'}
            aria-expanded={open}
            aria-controls="site-navigation"
          >
            {open?<X size={21}/>:<Menu size={21}/>}
          </button>
          <Link href="/" className="mobile-brand" aria-label={institutionTitle} title={institutionTitle}>{locale==='ru'?'Госархив ВКО':locale==='kk'?'ШҚО мемлекеттік архиві':'State Archive'}</Link>
          {path==='/'||hasLocalSearch?null:(
            <form className="top-search" action="/catalog">
              <Search size={17}/>
              <input ref={searchRef} name="q" placeholder={msg('search')} aria-label={msg('search')}/>
              <kbd>⌘ K</kbd>
            </form>
          )}
          <div className="top-actions">
            <div className="visitor-actions">
              {visitor?<><Link href="/account" className="visitor-account">{locale==='ru'?'Мой профиль':locale==='kk'?'Менің профилім':'My profile'}</Link><button type="button" className="visitor-logout" onClick={async()=>{const{createSupabaseBrowserClient}=await import('@/lib/supabase/browser');const auth=createSupabaseBrowserClient();if(auth)await auth.auth.signOut();await fetch('/api/auth/logout',{method:'POST'}).catch(()=>{});setVisitor(false);setStaff(false);router.push('/');router.refresh()}}>{locale==='ru'?'Выйти':locale==='kk'?'Шығу':'Sign out'}</button></>:<><Link href="/login" className="visitor-account">{locale==='ru'?'Войти':locale==='kk'?'Кіру':'Sign in'}</Link><Link href="/register" className="visitor-account">{locale==='ru'?'Регистрация':locale==='kk'?'Тіркелу':'Register'}</Link></>}
            </div>
            <div className="language-switch" role="group" aria-label={msg('language')}>
              <button
                type="button"
                className={`lang-btn ${locale==='kk'?'active':''}`}
                onClick={()=>setLocale('kk')}
                aria-pressed={locale==='kk'}
                aria-label="Қазақ тілі"
              >
                KZ
              </button>
              <button
                type="button"
                className={`lang-btn ${locale==='ru'?'active':''}`}
                onClick={()=>setLocale('ru')}
                aria-pressed={locale==='ru'}
                aria-label="Русский язык"
              >
                RU
              </button>
              <button
                type="button"
                className={`lang-btn ${locale==='en'?'active':''}`}
                onClick={()=>setLocale('en')}
                aria-pressed={locale==='en'}
                aria-label="English language"
              >
                EN
              </button>
            </div>
          </div>
        </header>
        <main id="main-content">{children}</main>
        <footer className="footer">
          <div className="footer-lockup">
            <span className="footer-institution">{institutionTitle}</span>
          </div>
          <nav className="footer-directory" aria-label={msg('moreSections')}>
            <section className="footer-section">
              <h2>{msg('footerArchive')}</h2>
              <Link href="/about">{msg('about')}</Link>
              <Link href="/official-documents">{msg('officialDocuments')}</Link>
              <Link href="/catalog">{msg('catalog')}</Link>
              <Link href="/history">{msg('history')}</Link>
            </section>
            <section className="footer-section">
              <h2>{msg('footerBranches')}</h2>
              <Link href="/branches">{msg('branches')}</Link>
            </section>
            <section className="footer-section">
              <h2>{msg('footerContacts')}</h2>
              <span>{mainArchive.address}, {mainArchive.postalCode}</span>
              {mainArchive.phone&&<a href={`tel:${mainArchive.phone.replace(/\D/g,'')}`}>{mainArchive.phone}</a>}
              <span>{formatOfficeHours(locale)}</span>
              <a href={`mailto:${mainArchive.email}`}>{mainArchive.email}</a>
              {mainArchive.websiteUrl&&<a href={mainArchive.websiteUrl} target="_blank" rel="noreferrer">{msg('archiveOfficialSite')} <ArrowUpRight size={13}/></a>}
              <Link href="/about#feedback">{msg('feedback')}</Link>
            </section>
            <section className="footer-section">
              <h2>{msg('footerResources')}</h2>
              <Link href="/exhibitions">{msg('exhibitions')}</Link>
              <Link href="/news">{msg('news')}</Link>
              <Link href="/atlas">{msg('atlas')}</Link>
              <Link href="/assistant">{msg('assistant')}</Link>
              <a href="https://egov.kz/services/K002/" target="_blank" rel="noreferrer">{locale==='ru'?'Заказать архивную справку на eGov.kz':locale==='kk'?'eGov.kz арқылы архивтік анықтамаға тапсырыс беру':'Request an archive certificate on eGov.kz'} <ArrowUpRight size={13}/></a>
              <a href="https://egov.kz/cms/ru/articles/department_of_archives" target="_blank" rel="noreferrer">eGov.kz — {locale==='ru'?'архивное дело':locale==='kk'?'архив ісі':'archives directory'} <ArrowUpRight size={13}/></a>
            </section>
          </nav>
        </footer>
      </div>
    </div>
  );
}

function MountainMark(){
  return (
    <svg viewBox="0 0 40 32" aria-hidden="true">
      <path d="M2 28 15 7l6 9 5-7 12 19H2Z" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round"/>
      <path d="m11 14 4-7 4 6m4 8 3-5 4 5" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round"/>
    </svg>
  );
}
