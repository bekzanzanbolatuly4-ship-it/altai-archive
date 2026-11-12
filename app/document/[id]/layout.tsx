import {isPublicDocument} from '@/lib/public-access';
import type {Metadata} from 'next';
import {documents} from '@/data/archive';
import {readStore} from '@/lib/archive-store';

export async function generateMetadata({
 params
}:{
 params:Promise<{id:string}>;
}):Promise<Metadata>{
 const {id}=await params;
 const demo=documents.find(d=>d.id===id);
 if(demo){
  return {
   title:`${demo.title} · Каталог`,
   description:demo.description,
   openGraph:{
     title:`${demo.title} · Государственный архив Восточно-Казахстанской области`,
    description:demo.description,
    type:'article',
    images:demo.image?[{url:demo.image}]:[]
   }
  };
 }

 try{
  const store=await readStore();
  const doc=store.documents.find(d=>d.id===id);
  if(doc&&isPublicDocument(doc)){
   return {
    title:`${doc.title} · Каталог`,
    description:doc.description||doc.title,
    openGraph:{
     title:`${doc.title} · Государственный архив Восточно-Казахстанской области`,
     description:doc.description||doc.title,
     type:'article',
     images:[{url:`/api/documents/${doc.id}/file`}]
    }
   };
  }
 }catch{
  // Fall back to noindex for missing or private documents
 }

 return {
  title:'Документ не найден',
  robots:{
   index:false,
   follow:false
  }
 };
}

export default function DocumentLayout({
 children
}:{
 children:React.ReactNode;
}){
 return children;
}
