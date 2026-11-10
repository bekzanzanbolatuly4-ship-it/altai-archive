import {isPublicDocument} from '@/lib/public-access';
import type {MetadataRoute} from 'next';
import {documents,exhibitions,news} from '@/data/archive';
import {readStore} from '@/lib/archive-store';
import {getPublicSiteUrl} from '@/lib/site-url';

export const dynamic='force-dynamic';

export default async function sitemap():Promise<MetadataRoute.Sitemap>{
 const base=getPublicSiteUrl().origin;
 const fixed=['','catalog','atlas','branches','exhibitions','history','news','about','assistant'];

 let storedPublicDocs:MetadataRoute.Sitemap=[];
 try{
  const store=await readStore();
  storedPublicDocs=store.documents
   .filter(d=>isPublicDocument(d))
   .map(d=>({
    url:`${base}/document/${d.id}`,
    lastModified:new Date(d.updatedAt||d.createdAt),
    changeFrequency:'monthly' as const,
    priority:0.6
   }));
 }catch{
  // Fall back to synthetic data if store is unavailable
 }

 const fixedEntries:MetadataRoute.Sitemap=fixed.map(path=>({
  url:path?`${base}/${path}`:base,
  lastModified:new Date(),
  changeFrequency:'monthly' as const,
  priority:path===''?1.0:0.7
 }));

 const demoDocEntries:MetadataRoute.Sitemap=documents.map(x=>({
  url:`${base}/document/${x.id}`,
  lastModified:new Date(),
  changeFrequency:'yearly' as const,
  priority:0.5
 }));

 const exhibitionEntries:MetadataRoute.Sitemap=exhibitions.map(x=>({
  url:`${base}/exhibitions/${x.slug}`,
  lastModified:new Date(),
  changeFrequency:'yearly' as const,
  priority:0.6
 }));

 const newsEntries:MetadataRoute.Sitemap=news.map(x=>({
  url:`${base}/news/${x.slug}`,
  lastModified:new Date(),
  changeFrequency:'monthly' as const,
  priority:0.6
 }));

 return [
  ...fixedEntries,
  ...storedPublicDocs,
  ...demoDocEntries,
  ...exhibitionEntries,
  ...newsEntries
 ];
}
