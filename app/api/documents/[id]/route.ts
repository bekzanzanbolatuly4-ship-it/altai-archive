import {isPublicDocument} from '@/lib/public-access';
import {readStore} from '@/lib/archive-store';

export async function GET(_request:Request,{params}:{params:Promise<{id:string}>}){
 const {id}=await params;
 const store=await readStore();
 const d=store.documents.find(x=>x.id===id&&isPublicDocument(x));

 if(!d){
  return Response.json({error:'Not found'},{status:404});
 }

 const document={
  id:d.id,
  title:d.title,
  description:d.description,
  date:d.date,
  fond:d.fond,
  inventory:d.inventory,
  caseName:d.caseName,
  documentIdentifier:d.documentIdentifier,
  keywords:d.keywords,
  language:d.language,
  provenance:d.provenance,
  accessStatus:d.accessStatus,
  status:d.status,
  mimeType:d.mimeType,
  size:d.size,
  originalName:d.originalName,
  createdAt:d.createdAt,
  updatedAt:d.updatedAt
 };

 return Response.json(
  {document},
  {headers:{'Cache-Control':'no-store'}}
 );
}
