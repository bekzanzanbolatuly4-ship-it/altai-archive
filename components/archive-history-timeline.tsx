'use client';

import milestones from '@/data/archive-history.json';
import {useApp} from './providers';

export function ArchiveHistoryTimeline(){
 const{msg,locale}=useApp();
 return <section className="timeline archive-history-timeline" aria-labelledby="archive-history-heading">
  <h2 id="archive-history-heading">{msg('archiveHistoryTimeline')}</h2>
  <p className="archive-history-source-note">{msg('archiveHistoryTimelineNote')}</p>
  <div>{milestones.map((item,index)=><article key={`${item.year}-${index}`}>
   <i aria-hidden="true"/><h3>{item.year}</h3><p lang="ru">{item.text}</p>
   <small>{msg('provenanceArchivalDocument')}: {item.sourceDocument} · RU</small>
  </article>)}</div>
  <small className="archive-history-source-note">{locale==='ru'?'Материал передан архивом; даты и формулировки приведены по исходному документу.':locale==='kk'?'Материал архивтен берілді; күндер мен тұжырымдар бастапқы құжат бойынша берілген.':'Source material was supplied by the archive; dates and wording follow the Russian original.'}</small>
 </section>;
}
