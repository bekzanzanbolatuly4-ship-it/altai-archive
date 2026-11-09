import {readFile} from 'node:fs/promises';
import path from 'node:path';
import {readStore,uploadPath} from '@/lib/archive-store';
export const runtime='nodejs';
export async function GET(_request:Request,{params}:{params:Promise<{id:string}>}){const{id}=await params;const d=(await readStore()).documents.find(x=>x.id===id&&x.status==='published'&&x.accessStatus==='public');if(!d)return Response.json({error:'Not found'},{status:404});if(!/^[\da-f-]+\.(pdf|jpg|png|webp|tiff)$/.test(d.fileName))return Response.json({error:'Not found'},{status:404});try{const bytes=await readFile(path.join(uploadPath,d.fileName));return new Response(bytes,{headers:{'Content-Type':d.mimeType,'Content-Length':String(bytes.length),'Content-Disposition':'inline','X-Content-Type-Options':'nosniff','Cache-Control':'public, max-age=60'}})}catch{return Response.json({error:'Not found'},{status:404})}}
