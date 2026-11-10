import {rename,unlink} from 'node:fs/promises';
import {randomUUID} from 'node:crypto';
import path from 'node:path';
import {can,requireUser} from '@/lib/archive-auth';
import {prepareDocumentPatch} from '@/lib/archive-document-patch';
import {sameOriginFailure} from '@/lib/request-security';
import {appendAudit,updateStore,uploadPath} from '@/lib/archive-store';
import {demoReadOnlyFailure} from '@/lib/demo-read-only';

export const runtime='nodejs';

export async function PATCH(request:Request,{params}:{params:Promise<{id:string}>}){
 const readOnly=demoReadOnlyFailure();
 if(readOnly)return readOnly;
 const originFailure=sameOriginFailure(request);
 if(originFailure)return originFailure;
 const auth=await requireUser('edit');
 if(auth.response)return auth.response;

 try{
  const {id}=await params;
  let body:unknown;
  try{
   body=await request.json();
  }catch{
   return Response.json({error:'Invalid update'},{status:400});
  }
  let error='';
  let updated:unknown=null;

  await updateStore(s=>{
   const d=s.documents.find(x=>x.id===id);
   if(!d){
    error='Document not found';
    return;
   }

   const result=prepareDocumentPatch(d,body,{
    edit:can(auth.user!,'edit'),
    publish:can(auth.user!,'publish')
   });
   if(result.error){
    error=result.error;
    return;
   }
   Object.assign(d,result.patch);
   appendAudit(s,auth.user!.email,'document.update',id);
   updated=d;
  });

  if(error){
   const status=error==='Document not found'?404:error==='Invalid update'||error==='Invalid workflow status'||error==='Invalid access status'||error==='Invalid workflow transition'?400:403;
   return Response.json({error},{status});
  }

  return Response.json({document:updated},{headers:{'Cache-Control':'no-store'}});
 }catch{
  return Response.json({error:'Invalid update'},{status:400});
 }
}

export async function DELETE(_request:Request,{params}:{params:Promise<{id:string}>}){
 const readOnly=demoReadOnlyFailure();
 if(readOnly)return readOnly;
 const originFailure=sameOriginFailure(_request);
 if(originFailure)return originFailure;
 const auth=await requireUser('edit');
 if(auth.response)return auth.response;

 try{
  const {id}=await params;
  let error='';
  const stagedFile:{current:{original:string;quarantine:string}|null}={current:null};

  try{
   await updateStore(async s=>{
    const idx=s.documents.findIndex(x=>x.id===id);
    if(idx===-1){
     error='Document not found';
     return;
    }

    const doc=s.documents[idx];
    const userCanPublish=can(auth.user!,'publish');
    const isOwner=doc.createdBy===auth.user!.id;

    if(doc.status==='published'&&!userCanPublish){
     error='Only editors or administrators can delete published records';
     return;
    }

    if(!userCanPublish&&!isOwner){
     error='You can only delete your own draft records';
     return;
    }

    if(!/^[\da-f-]+\.(pdf|jpg|png|webp|tiff)$/.test(doc.fileName)){
     error='Document file path is invalid';
     return;
    }

    const original=path.resolve(uploadPath,doc.fileName);
    if(path.dirname(original)!==path.resolve(uploadPath)){
     error='Document file path is invalid';
     return;
    }
    const quarantine=path.join(path.resolve(uploadPath),`.${randomUUID()}.deleting`);
    try{
     await rename(original,quarantine);
     stagedFile.current={original,quarantine};
    }catch(fileError){
     if((fileError as NodeJS.ErrnoException).code!=='ENOENT')throw fileError;
    }

    s.documents.splice(idx,1);
    appendAudit(s,auth.user!.email,'document.delete',id);
   });
  }catch(error){
   if(stagedFile.current){
    try{
     await rename(stagedFile.current.quarantine,stagedFile.current.original);
    }catch{
     return Response.json({error:'Delete failed; the original file remains staged for recovery'},{status:500});
    }
   }
   throw error;
  }

  if(error){
   return Response.json({error},{status:error==='Document not found'?404:403});
  }

  if(stagedFile.current){
   try{
    await unlink(stagedFile.current.quarantine);
   }catch{
    return Response.json({error:'Document deleted, but file cleanup failed'},{status:500});
   }
  }
  return Response.json({ok:true},{headers:{'Cache-Control':'no-store'}});
 }catch{
  return Response.json({error:'Delete failed'},{status:400});
 }
}
