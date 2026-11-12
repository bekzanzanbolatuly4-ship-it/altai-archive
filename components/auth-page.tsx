'use client';
import type {ComponentProps} from 'react';
import {AccountForm} from './account-form';
import {useApp} from './providers';

type Mode=NonNullable<ComponentProps<typeof AccountForm>['initialMode']>;
export function AuthPage({mode}:{mode:Mode}){
 const{locale}=useApp();const t=(ru:string,kk:string,en:string)=>locale==='ru'?ru:locale==='kk'?kk:en;
 const copy:Record<Mode,{title:[string,string,string];description:[string,string,string]}>= {
  login:{title:['Вход','Кіру','Sign in'],description:['Вход в аккаунт посетителя.','Келуші аккаунтына кіру.','Sign in to your visitor account.']},
  register:{title:['Регистрация посетителя','Келушіні тіркеу','Visitor registration'],description:['Публичные разделы сайта доступны без регистрации.','Сайттың ашық бөлімдерін тіркелмей пайдалануға болады.','Public sections are available without registration.']},
  reset:{title:['Восстановление пароля','Құпиясөзді қалпына келтіру','Password recovery'],description:['Ссылка отправляется на email аккаунта.','Сілтеме аккаунттың email мекенжайына жіберіледі.','A recovery link is sent to the account email.']},
  update:{title:['Новый пароль','Жаңа құпиясөз','New password'],description:['Откройте эту страницу по ссылке из письма.','Бұл бетті хаттағы сілтеме арқылы ашыңыз.','Open this page using the link in your email.']}
 };
 const selected=copy[mode];
 return <section className="feedback-section account-page"><div className="section-heading"><span className="eyebrow">{t('Государственный архив Восточно-Казахстанской области','Шығыс Қазақстан облысының мемлекеттік архиві','State Archive of East Kazakhstan Region')}</span><h1>{t(...selected.title)}</h1><p>{t(...selected.description)}</p></div><AccountForm initialMode={mode}/></section>;
}
