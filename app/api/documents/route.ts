import {isPublicDocument} from '@/lib/public-access';
import {readPublishedPublicDocuments} from '@/lib/archive-store';

export async function GET(){
 const documents=await readPublishedPublicDocuments();
 const publicDocuments=documents.filter(isPublicDocument).map(d=>({
  id:d.id,title:d.title,description:d.description,date:d.date,fond:d.fond,
  inventory:d.inventory,caseName:d.caseName,documentIdentifier:d.documentIdentifier,
  keywords:d.keywords,language:d.language,provenance:d.provenance,
  accessStatus:d.accessStatus,status:d.status,mimeType:d.mimeType,size:d.size,
  originalName:d.originalName,createdAt:d.createdAt,updatedAt:d.updatedAt
 }));
 return Response.json({documents:publicDocuments},{headers:{'Cache-Control':'no-store'}});
}
