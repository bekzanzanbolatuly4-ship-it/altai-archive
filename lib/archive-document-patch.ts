import type {StoredDocument} from './archive-store';

const workflowStatuses:StoredDocument['status'][]=['draft','review','approved','published','archived'];
const editableTextFields=['title','description','date','fond','inventory','caseName','documentIdentifier','language','provenance'] as const;
const allowedFields=new Set<string>([...editableTextFields,'keywords','status','accessStatus']);
const workflowTransitions:Record<string,Record<string,'edit'|'publish'>>={
 draft:{review:'edit'},
 review:{approved:'publish',draft:'edit'},
 approved:{published:'publish'},
 published:{archived:'publish'}
};

export type DocumentPatchPermissions={edit:boolean;publish:boolean};

export type DocumentPatchResult={patch:Partial<StoredDocument>;error:string|null};

function sanitize(val:string,max:number):string{
 return val
  .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F]/g,'')
  .trim()
  .slice(0,max);
}

export function prepareDocumentPatch(
 document:StoredDocument,
 body:unknown,
 permissions:DocumentPatchPermissions
):DocumentPatchResult{
 if(!body||typeof body!=='object'||Array.isArray(body)){
  return {patch:{},error:'Invalid update'};
 }

 const values=body as Record<string,unknown>;
 if(Object.keys(values).some(key=>!allowedFields.has(key))){
  return {patch:{},error:'Invalid update'};
 }

 if(document.status==='published'&&!permissions.publish){
  return {patch:{},error:'Only editors can change published records'};
 }

 const patch:Partial<StoredDocument>={};
 if(Object.hasOwn(values,'status')){
  const status=values.status;
  if(typeof status!=='string'||!workflowStatuses.includes(status as StoredDocument['status'])){
   return {patch:{},error:'Invalid workflow status'};
  }
  if(status!==document.status){
   const requiredPermission=workflowTransitions[document.status]?.[status];
   if(!requiredPermission){
    return {patch:{},error:'Invalid workflow transition'};
   }
   if(!permissions[requiredPermission]){
    return {patch:{},error:requiredPermission==='publish'?'Only editors or administrators can approve, publish or archive':'Insufficient permission for workflow transition'};
   }
  }
  patch.status=status as StoredDocument['status'];
 }

 if(Object.hasOwn(values,'accessStatus')){
  const accessStatus=values.accessStatus;
  if(accessStatus!=='public'&&accessStatus!=='restricted'){
   return {patch:{},error:'Invalid access status'};
  }
  if(accessStatus==='public'&&!permissions.publish){
   return {patch:{},error:'Only editors or administrators can make a record public'};
  }
  patch.accessStatus=accessStatus;
 }

 for(const key of editableTextFields){
  if(!Object.hasOwn(values,key))continue;
  const value=values[key];
  if(typeof value!=='string')return {patch:{},error:'Invalid update'};
  patch[key]=sanitize(value,key==='description'?4000:key==='title'?250:500);
 }

 if(Object.hasOwn(values,'keywords')){
  if(!Array.isArray(values.keywords)||values.keywords.some(keyword=>typeof keyword!=='string')){
   return {patch:{},error:'Invalid update'};
  }
  patch.keywords=values.keywords
   .map(keyword=>sanitize(keyword as string,80))
   .filter(Boolean)
   .slice(0,30);
 }

 patch.updatedAt=new Date().toISOString();
 return {patch,error:null};
}
