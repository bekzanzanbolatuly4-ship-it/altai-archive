import {can,requireUser} from '@/lib/archive-auth';
import {createBackup,exportArchiveData,recordAudit} from '@/lib/archive-store';
import {demoReadOnlyFailure} from '@/lib/demo-read-only';

export const runtime='nodejs';

export async function GET(){
 const readOnly=demoReadOnlyFailure();
 if(readOnly)return readOnly;
 const auth=await requireUser('read');
 if(auth.response)return auth.response;

 if(!can(auth.user!,'audit')&&!can(auth.user!,'accounts')){
  return Response.json({error:'Insufficient permission to export archival data'},{status:403});
 }

 try{
  await createBackup();
  const data=await exportArchiveData();
  await recordAudit(auth.user!.email,'archive.export','catalog_and_metadata');

  const filename=`altai-archive-export-${new Date().toISOString().slice(0,10)}.json`;
  return new Response(JSON.stringify(data,null,2),{
   headers:{
    'Content-Type':'application/json; charset=utf-8',
    'Content-Disposition':`attachment; filename="${filename}"`,
    'Cache-Control':'no-store'
   }
  });
  }catch{
  return Response.json(
   {error:'Export failed'},
   {status:500}
  );
 }
}
