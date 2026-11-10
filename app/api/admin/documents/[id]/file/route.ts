import {readFile} from 'node:fs/promises';
import path from 'node:path';
import {requireUser} from '@/lib/archive-auth';
import {readStore,uploadPath} from '@/lib/archive-store';

export const runtime='nodejs';

export async function GET(request:Request,{params}:{params:Promise<{id:string}>}){
 const auth=await requireUser('read');
 if(auth.response)return auth.response;

 const {id}=await params;
 const store=await readStore();
 const d=store.documents.find(x=>x.id===id);

 if(!d||!/^[\da-f-]+\.(pdf|jpg|png|webp|tiff)$/.test(d.fileName)){
  return Response.json({error:'Not found'},{status:404});
 }

 const fullPath=path.resolve(uploadPath,d.fileName);
 if(!fullPath.startsWith(path.resolve(uploadPath))){
  return Response.json({error:'Not found'},{status:404});
 }

 try{
  const bytes=await readFile(fullPath);
  const url=new URL(request.url);
  const isDownload=url.searchParams.get('download')==='1'||url.searchParams.get('download')==='true';

  const rawFilename=d.originalName||d.fileName;
  const safeAsciiName=rawFilename.replace(/[^a-zA-Z0-9._-]/g,'_')||d.fileName;
  const encodedName=encodeURIComponent(rawFilename);
  const disposition=isDownload
   ?`attachment; filename="${safeAsciiName}"; filename*=UTF-8''${encodedName}`
   :'inline';

  return new Response(bytes,{
   headers:{
    'Content-Type':d.mimeType,
    'Content-Length':String(bytes.length),
    'Content-Disposition':disposition,
    'X-Content-Type-Options':'nosniff',
    'Cache-Control':'private, no-store'
   }
  });
 }catch{
  return Response.json({error:'Not found'},{status:404});
 }
}
