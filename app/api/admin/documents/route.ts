import {randomUUID} from 'node:crypto';
import {mkdir,unlink,writeFile} from 'node:fs/promises';
import path from 'node:path';
import {resolveUploadType} from '@/lib/archive-upload';
import {can,requireUser} from '@/lib/archive-auth';
import {sameOriginFailure} from '@/lib/request-security';
import {appendAudit,readStore,updateStore,uploadPath,type StoredDocument} from '@/lib/archive-store';
import {demoReadOnlyFailure} from '@/lib/demo-read-only';

export const runtime='nodejs';

function clean(x:FormDataEntryValue|null,max=500):string{
 return String(x||'')
  .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F]/g,'')
  .trim()
  .slice(0,max);
}

export async function GET(){
 const auth=await requireUser('read');
 if(auth.response)return auth.response;
 const s=await readStore();
 return Response.json({documents:s.documents},{headers:{'Cache-Control':'no-store'}});
}

export async function POST(request:Request){
 const readOnly=demoReadOnlyFailure();
 if(readOnly)return readOnly;
 const originFailure=sameOriginFailure(request);
 if(originFailure)return originFailure;
 const auth=await requireUser('upload');
 if(auth.response)return auth.response;

 const configuredLimit=Number(process.env.UPLOAD_LIMIT_MB);
 const limitMb=Number.isFinite(configuredLimit)&&configuredLimit>0?configuredLimit:25;
 const limit=limitMb*1024*1024;
 const rawLength=request.headers.get('content-length');
 const length=rawLength===null?0:Number(rawLength);
 if(!Number.isFinite(length)||length<0)return Response.json({error:'Invalid request size'},{status:400});
 if(length>limit+128_000){
  return Response.json(
   {error:`File limit is ${Math.floor(limit/1024/1024)} MB`},
   {status:413}
  );
 }

 let createdFilePath:string|null=null;
 try{
  if(!request.body){
   return Response.json({error:'Missing upload body'},{status:400});
  }
  const reader=request.body.getReader();
  const chunks:Uint8Array[]=[];
  let total=0;
  while(true){
   const {done,value}=await reader.read();
   if(done)break;
   total+=value.byteLength;
   if(total>limit+128_000){
    await reader.cancel();
    return Response.json(
     {error:`File limit is ${Math.floor(limit/1024/1024)} MB`},
     {status:413}
    );
   }
   chunks.push(value);
  }
  const bodyBytes=new Uint8Array(total);
  let offset=0;
  for(const chunk of chunks){bodyBytes.set(chunk,offset);offset+=chunk.byteLength;}
  const form=await new Response(bodyBytes,{headers:{'Content-Type':request.headers.get('content-type')||''}}).formData();
  const file=form.get('file');
  if(!(file instanceof File)||file.size===0){
   return Response.json({error:'Choose a PDF or image file'},{status:400});
  }
  if(file.size>limit){
   return Response.json({error:'File exceeds configured limit'},{status:413});
  }

  const typeSpec=resolveUploadType(file.type,file.name);
  if(!typeSpec){
   return Response.json(
    {error:'Supported types: PDF, JPG, PNG, WebP, TIFF'},
    {status:415}
   );
  }

  const bytes=Buffer.from(await file.arrayBuffer());
  if(!typeSpec.valid(bytes)){
   return Response.json(
    {error:'File signature does not match its declared type'},
    {status:415}
   );
  }

  const id=randomUUID();
  const fileName=`${id}.${typeSpec.ext}`;
  await mkdir(uploadPath,{recursive:true});
  createdFilePath=path.join(/*turbopackIgnore: true*/ uploadPath,fileName);
  await writeFile(createdFilePath,bytes,{flag:'wx',mode:0o600});

  const roleCanPublish=can(auth.user!,'publish');
  const requestedAccess=form.get('accessStatus')==='public'?'public':'restricted';
  const accessStatus=roleCanPublish?requestedAccess:'restricted';

  const doc:StoredDocument={
   id,
   fileName,
   originalName:file.name.slice(0,180).replace(/[\\/\0]/g,'_'),
   mimeType:typeSpec.mime,
   size:file.size,
   title:clean(form.get('title'),250)||file.name.slice(0,250),
   description:clean(form.get('description'),4000),
   date:clean(form.get('date'),80),
   fond:clean(form.get('fond'),180),
   inventory:clean(form.get('inventory'),180),
   caseName:clean(form.get('caseName'),180),
   documentIdentifier:clean(form.get('documentIdentifier'),180),
   keywords:clean(form.get('keywords'),600).split(',').map(x=>x.trim()).filter(Boolean).slice(0,30),
   language:clean(form.get('language'),40),
   provenance:clean(form.get('provenance'),1000),
   accessStatus,
   status:'draft',
   createdAt:new Date().toISOString(),
   updatedAt:new Date().toISOString(),
   createdBy:auth.user!.id
  };

  await updateStore(s=>{
   s.documents.unshift(doc);
   appendAudit(s,auth.user!.email,'document.create',id);
  });

  return Response.json(
   {document:doc},
   {status:201,headers:{'Cache-Control':'no-store'}}
  );
 }catch(e){
  if(createdFilePath){
   await unlink(createdFilePath).catch(()=>{});
  }
  return Response.json(
   {error:e instanceof Error?e.message:'Upload failed'},
   {status:400}
  );
 }
}
