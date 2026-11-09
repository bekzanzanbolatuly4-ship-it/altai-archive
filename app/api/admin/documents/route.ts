import {randomUUID} from 'node:crypto';
import {mkdir,writeFile} from 'node:fs/promises';
import path from 'node:path';
import {can,requireUser} from '@/lib/archive-auth';
import {readStore,recordAudit,updateStore,uploadPath,type StoredDocument} from '@/lib/archive-store';
export const runtime='nodejs';
const allowed:Record<string,{mime:string;ext:string;valid:(b:Buffer)=>boolean}>={
 'application/pdf':{mime:'application/pdf',ext:'pdf',valid:b=>b.subarray(0,5).toString()==='%PDF-'},
 'image/jpeg':{mime:'image/jpeg',ext:'jpg',valid:b=>b[0]===0xff&&b[1]===0xd8&&b[2]===0xff},
 'image/png':{mime:'image/png',ext:'png',valid:b=>b.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10]))},
 'image/webp':{mime:'image/webp',ext:'webp',valid:b=>b.subarray(0,4).toString()==='RIFF'&&b.subarray(8,12).toString()==='WEBP'},
 'image/tiff':{mime:'image/tiff',ext:'tiff',valid:b=>(b[0]===0x49&&b[1]===0x49&&b[2]===42&&b[3]===0)||(b[0]===0x4d&&b[1]===0x4d&&b[2]===0&&b[3]===42)}
};
const clean=(x:FormDataEntryValue|null,max=500)=>String(x||'').trim().slice(0,max);
export async function GET(){const auth=await requireUser('read');if(auth.response)return auth.response;const s=await readStore();return Response.json({documents:s.documents},{headers:{'Cache-Control':'no-store'}})}
export async function POST(request:Request){
 const auth=await requireUser('upload');if(auth.response)return auth.response;
 const limit=(Number(process.env.UPLOAD_LIMIT_MB)||25)*1024*1024;const length=Number(request.headers.get('content-length')||0);if(length>limit+128_000)return Response.json({error:`File limit is ${Math.floor(limit/1024/1024)} MB`},{status:413});
 try{const form=await request.formData();const file=form.get('file');if(!(file instanceof File)||file.size===0)return Response.json({error:'Choose a PDF or image file'},{status:400});if(file.size>limit)return Response.json({error:'File exceeds configured limit'},{status:413});const type=allowed[file.type];if(!type)return Response.json({error:'Supported types: PDF, JPG, PNG, WebP, TIFF'},{status:415});const bytes=Buffer.from(await file.arrayBuffer());if(!type.valid(bytes))return Response.json({error:'File signature does not match its declared type'},{status:415});
 const id=randomUUID();const fileName=`${id}.${type.ext}`;await mkdir(uploadPath,{recursive:true});await writeFile(path.join(/*turbopackIgnore: true*/ uploadPath,fileName),bytes,{flag:'wx',mode:0o600});const roleCanPublish=can(auth.user!,'publish');const status=roleCanPublish&&form.get('publish')==='true'?'published':'draft';
 const doc:StoredDocument={id,fileName,originalName:file.name.slice(0,180).replace(/[\\/\0]/g,'_'),mimeType:type.mime,size:file.size,title:clean(form.get('title'),250)||file.name.slice(0,250),description:clean(form.get('description'),4000),date:clean(form.get('date'),80),fond:clean(form.get('fond'),180),inventory:clean(form.get('inventory'),180),caseName:clean(form.get('caseName'),180),documentIdentifier:clean(form.get('documentIdentifier'),180),keywords:clean(form.get('keywords'),600).split(',').map(x=>x.trim()).filter(Boolean).slice(0,30),language:clean(form.get('language'),20),provenance:clean(form.get('provenance'),1000),accessStatus:form.get('accessStatus')==='public'?'public':'restricted',status,createdAt:new Date().toISOString(),updatedAt:new Date().toISOString(),createdBy:auth.user!.id};
 await updateStore(s=>{s.documents.unshift(doc)});await recordAudit(auth.user!.email,'document.create',id);return Response.json({document:doc},{status:201,headers:{'Cache-Control':'no-store'}})
 }catch(e){return Response.json({error:e instanceof Error?e.message:'Upload failed'},{status:400})}
}
