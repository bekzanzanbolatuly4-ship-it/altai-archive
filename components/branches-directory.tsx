'use client';
import {useState} from 'react';
import Link from 'next/link';
import {AlertTriangle,ArrowRight,ArrowUpRight,ExternalLink,MapPin,Map as MapIcon,Search} from 'lucide-react';
import {branches,getLocalizedBranchTitle,type ArchiveLocation} from '@/data/archive';
import {formatCity,formatInstitutionName} from '@/locales/messages';
import {useApp} from './providers';
import {branchConflicts,branchConflictDetails,branchEvidenceUrl} from '@/lib/provenance';

export function BranchesDirectory(){
 const{msg,locale}=useApp();
 const[query,setQuery]=useState('');
 const[selectedId,setSelectedId]=useState(branches.find(branch=>branch.coordinates)?.id||branches[0]?.id||'');
 const[view,setView]=useState<'list'|'map'>('list');
 const matching=branches.filter(branch=>`${branch.shortName} ${branch.name} ${branch.city} ${branch.address||''}`.toLocaleLowerCase().includes(query.trim().toLocaleLowerCase()));
 const selected=matching.find(branch=>branch.id===selectedId)||matching[0]||null;
 const selectBranch=(id:string)=>{
  setSelectedId(id);
  if(window.matchMedia('(max-width: 800px)').matches)setView('map');
 };
 const title=(branch:ArchiveLocation)=>getLocalizedBranchTitle(branch,locale);
 const mapUrl=(branch:ArchiveLocation)=>{
  if(!branch.coordinates)return null;
  const{latitude,longitude}=branch.coordinates;
  const dLat=0.003,dLon=0.004;
  const params=new URLSearchParams({bbox:`${longitude-dLon},${latitude-dLat},${longitude+dLon},${latitude+dLat}`,layer:'mapnik',marker:`${latitude},${longitude}`});
  return `https://www.openstreetmap.org/export/embed.html?${params.toString()}`;
 };

 return <div className="page-wrap branches-page">
  <header className="page-hero">
   <div className="breadcrumb"><Link href="/">{formatInstitutionName(locale)}</Link><span>/</span>{msg('branches')}</div>
   <span className="eyebrow">{formatInstitutionName(locale)}</span><h1>{msg('branchesTitle')}</h1><p>{msg('branchesSub')}</p>
  </header>
  <div className="branch-mobile-tabs" role="group" aria-label={msg('branchesTitle')}>
   <button type="button" aria-pressed={view==='list'} onClick={()=>setView('list')}>{msg('branchList')}</button>
   <button type="button" aria-pressed={view==='map'} onClick={()=>setView('map')}>{msg('branchMap')}</button>
  </div>
  <div className={`branch-explorer ${view==='map'?'show-map':''}`}>
   <section className="branch-list-panel" aria-label={msg('branchList')}>
    <label className="catalog-search branch-search"><Search size={18}/><input value={query} onChange={event=>setQuery(event.target.value)} placeholder={msg('branchSearch')} aria-label={msg('branchSearch')}/></label>
    <p className="branch-result-count">{matching.length} {msg('branchMatches')}</p>
    <div className="branch-list-items" aria-live="polite">
     {matching.map(branch=><button type="button" key={branch.id} className={`branch-list-item ${selected?.id===branch.id?'selected':''}`} aria-pressed={selected?.id===branch.id} onClick={()=>selectBranch(branch.id)}>
      <span className="branch-list-pin"><MapPin size={17}/></span><span><b>{title(branch)}</b><small>{formatCity(branch.city,locale)}</small></span><ArrowRight size={17}/>
     </button>)}
     {!matching.length&&<p className="branch-empty">{msg('branchNoResults')}</p>}
    </div>
   </section>
   <section className="branch-map-panel" aria-label={msg('branchMap')}>
    {selected&&mapUrl(selected)?<>
     <iframe className="branch-map-frame" title={`${title(selected)} · OpenStreetMap`} src={mapUrl(selected)!} loading="lazy" referrerPolicy="no-referrer" />
     <a className="branch-map-attribution" href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">© OpenStreetMap contributors</a>
     <p className="branch-map-status"><MapPin size={18}/>{msg('branchMapGeocoded')}</p>
     <p>{msg('branchCoordinateCaveat')}</p>
     <a className="branch-map-source" href={selected.coordinates!.sourceUrl} target="_blank" rel="noreferrer">{msg('branchCoordinateSource')} <ExternalLink size={13}/></a>
    </>:<>
     <div className="branch-map-art" aria-hidden="true"><span/><span/><MapIcon size={30}/></div>
     <p className="branch-map-status"><AlertTriangle size={18}/>{msg('branchMapUnavailable')}</p><p>{msg('branchMapHelp')}</p>
    </>}
    {selected&&<article className="branch-selected-card" aria-live="polite">
     <span className="eyebrow">{formatCity(selected.city,locale)}</span><h2>{title(selected)}</h2>
     <dl><div><dt>{msg('address')}</dt><dd>{selected.address?`${msg('branchSourceListing')}: ${selected.address}`:msg('unconfirmed')}</dd></div></dl>
     {selected.address&&(selected.addressStatus==='official-listing'||selected.id==='branch-source-12')&&<a className="outline-link branch-route" href={`https://2gis.kz/oskemen/search/${encodeURIComponent(selected.address)}`} target="_blank" rel="noreferrer"><MapPin size={16}/>{msg('branchRoute')}<ArrowUpRight size={14}/></a>}
     <div className="branch-evidence"><b>{msg(branchConflicts.has(selected.id)?'branchStatusConflict':'branchStatusNeedsReview')}</b><span>{msg('branchNameSource')}: {selected.sourceDocument}</span><span>{msg('branchAddressSource')}: {selected.addressSourceDocument||msg('unconfirmed')}</span><span>{msg('branchSourceDateNote')}</span>
      {branchConflictDetails[selected.id]&&<div className="branch-source-versions">
       <section><b>{msg('branchSourceOriginal')}</b><span>{selected.shortName}</span><span>{selected.address||msg('unconfirmed')}</span><span>{msg('phone')}: {selected.phone||msg('unconfirmed')}</span></section>
       <section><b>{msg('branchSourceExternal')}</b><span>{branchConflictDetails[selected.id].name}</span><span>{branchConflictDetails[selected.id].address||msg('branchNoExternalValue')}</span><span>{msg('phone')}: {branchConflictDetails[selected.id].phone||msg('branchNoExternalValue')}</span></section>
      </div>}
      <p>{msg('branchReviewNotice')}</p><p>{msg('branchCrossCheckCaveat')}</p><small>{msg('branchCheckedAt')}: 12.11.2026</small>
      <a href="https://www.gov.kz/org/vko-uca/documents/1?type=14" target="_blank" rel="noreferrer">gov.kz · {msg('branchGovSource')} <ExternalLink size={13}/></a>
      <a href={branchEvidenceUrl} target="_blank" rel="noreferrer">e-memory.kz · {msg('sourceLabel')} <ExternalLink size={13}/></a>
     </div>
    </article>}
   </section>
  </div>
  <aside className="branch-transfer-note"><b>{msg('boundaryChangeTitle')}</b><p>{msg('boundaryChangeText')}</p><a href="https://www.gov.kz/org/abay-cultura-arhiv/about/structure/10/1" target="_blank" rel="noreferrer">{msg('boundaryChangeLink')} <ArrowUpRight size={14}/></a></aside>
 </div>;
}
