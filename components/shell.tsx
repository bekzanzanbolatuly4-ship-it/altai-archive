'use client';
import Link from 'next/link';
import {usePathname} from 'next/navigation';
import {useEffect,useRef,useState} from 'react';
import {Archive,ArrowUpRight,BookOpen,Compass,House,Map,Menu,Moon,Newspaper,Search,Settings,Sun,X,History,Sparkles,Mail} from 'lucide-react';
import {useApp} from './providers';
import {messages,formatInstitutionName} from '@/locales/messages';

type NavItem=readonly [string,keyof typeof messages.ru,typeof House];
const primary:readonly NavItem[]=[
  ['/','home',House],
  ['/catalog','catalog',BookOpen],
  ['/assistant','assistant',Sparkles],
  ['/history','history',History],
  ['/branches','branches',Map],
  ['/exhibitions','exhibitions',Compass],
];
const institutional:readonly NavItem[]=[
  ['/about','about',Archive],
  ['/news','news',Newspaper],
  ['/about#feedback','feedback',Mail],
  ['/atlas','atlas',Map]
];

export function Shell({children}:{children:React.ReactNode}){
  const path=usePathname();
  const{msg,locale,setLocale,dark,setDark}=useApp();
  const[open,setOpen]=useState(false);
  const[staff,setStaff]=useState(false);
  const searchRef=useRef<HTMLInputElement>(null);

  useEffect(()=>{
    let alive=true;
    fetch('/api/auth/me').then(r=>r.ok?r.json():null).then(result=>{
      if(alive)setStaff(Boolean(result?.user?.role));
    }).catch(()=>{if(alive)setStaff(false);});
    return()=>{alive=false;};
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
          aria-label="ALTAI ARCHIVE — цифровая платформа Государственного архива Восточно-Казахстанской области"
        >
          <span className="brand-mark"><MountainMark/></span>
          <span className="brand-copy">
            <b>ALTAI<br/><i>ARCHIVE</i></b>
            <small>{institutionTitle}</small>
          </span>
        </Link>
        <nav className="side-nav-group" aria-label={locale==='ru'?'Основная навигация':locale==='kk'?'Негізгі навигация':'Primary navigation'}>
          <div className="nav-caption">{locale==='ru'?'ИССЛЕДОВАТЬ':locale==='kk'?'ЗЕРТТЕУ':'DISCOVER'}</div>
          {navLinks(primary)}
        </nav>
        <nav className="side-nav-group institutional-nav" aria-label={msg('moreSections')}>
          <div className="nav-caption">{msg('moreSections').toUpperCase()}</div>
          {navLinks(institutional)}
        </nav>
        <div className="sidebar-bottom">
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
          {staff&&<div className="admin-area">
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
          <Link href="/" className="mobile-brand">ALTAI ARCHIVE</Link>
          {path==='/'||hasLocalSearch?null:(
            <form className="top-search" action="/catalog">
              <Search size={17}/>
              <input ref={searchRef} name="q" placeholder={msg('search')} aria-label={msg('search')}/>
              <kbd>⌘ K</kbd>
            </form>
          )}
          <div className="top-actions">
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
            <span className="footer-platform">ALTAI ARCHIVE</span>
            <span className="footer-institution">{institutionTitle}</span>
          </div>
          <span>
            {msg('demo')} · {locale==='ru'?'Неофициальный демонстрационный макет':locale==='kk'?'Бейресми демонстрациялық макет':'Unofficial demonstration interface'}
          </span>
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
