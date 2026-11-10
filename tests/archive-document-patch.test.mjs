import assert from 'node:assert/strict';
import {test} from 'node:test';
import {prepareDocumentPatch} from '../lib/archive-document-patch.ts';

function createDocument(){
 return {
  id:'document-1',fileName:'document-1.pdf',originalName:'record.pdf',mimeType:'application/pdf',size:10,
  title:'Original title',description:'Original description',date:'1940',fond:'1',inventory:'2',caseName:'3',
  documentIdentifier:'4',keywords:['original'],language:'ru',provenance:'Original source',accessStatus:'restricted',
  status:'draft',createdAt:'2026-01-01T00:00:00.000Z',updatedAt:'2026-01-01T00:00:00.000Z',createdBy:'staff-1'
 };
}

test('denied status change does not partially apply other fields',()=>{
 const document=createDocument();
 document.status='review';
 const before=structuredClone(document);
 const result=prepareDocumentPatch(document,{status:'approved',title:'Changed title'},{edit:true,publish:false});

 assert.equal(result.error,'Only editors or administrators can approve, publish or archive');
 assert.deepEqual(result.patch,{});
 assert.deepEqual(document,before);
});

test('denied public access change does not partially apply status or metadata',()=>{
 const document=createDocument();
 const before=structuredClone(document);
 const result=prepareDocumentPatch(document,{status:'review',accessStatus:'public',title:'Changed title'},{edit:true,publish:false});

 assert.equal(result.error,'Only editors or administrators can make a record public');
 assert.deepEqual(result.patch,{});
 assert.deepEqual(document,before);
});

test('unknown fields and malformed access values are rejected unchanged',()=>{
 for(const body of [{status:'review',admin:true},{status:'review',accessStatus:'publicity'}]){
  const document=createDocument();
  const before=structuredClone(document);
  const result=prepareDocumentPatch(document,body,{edit:true,publish:true});

  assert.ok(result.error);
  assert.deepEqual(result.patch,{});
  assert.deepEqual(document,before);
 }
});

test('workflow accepts only the configured transitions at their required permission level',()=>{
 const cases=[
  ['draft','review',{edit:true,publish:false},null],
  ['review','draft',{edit:true,publish:false},null],
  ['review','approved',{edit:true,publish:true},null],
  ['approved','published',{edit:true,publish:true},null],
  ['published','archived',{edit:true,publish:true},null],
  ['review','approved',{edit:true,publish:false},'Only editors or administrators can approve, publish or archive'],
  ['approved','published',{edit:true,publish:false},'Only editors or administrators can approve, publish or archive'],
  ['published','archived',{edit:true,publish:false},'Only editors can change published records'],
  ['draft','approved',{edit:true,publish:true},'Invalid workflow transition'],
  ['draft','published',{edit:true,publish:true},'Invalid workflow transition'],
  ['review','published',{edit:true,publish:true},'Invalid workflow transition'],
  ['approved','archived',{edit:true,publish:true},'Invalid workflow transition'],
  ['published','review',{edit:true,publish:true},'Invalid workflow transition'],
  ['archived','published',{edit:true,publish:true},'Invalid workflow transition']
 ];

 for(const [from,to,permissions,error] of cases){
  const document=createDocument();
  document.status=from;
  const before=structuredClone(document);
  const result=prepareDocumentPatch(document,{status:to,title:'Changed title'},permissions);

  assert.equal(result.error,error,`${from} → ${to}`);
  if(error){
   assert.deepEqual(result.patch,{},`${from} → ${to} returns no partial patch`);
   assert.deepEqual(document,before,`${from} → ${to} leaves document unchanged`);
  }else{
   assert.equal(result.patch.status,to,`${from} → ${to} is accepted`);
   assert.equal(result.patch.title,'Changed title');
  }
 }
});

test('ordinary metadata edits remain available on drafts',()=>{
 const document=createDocument();
 const result=prepareDocumentPatch(document,{
  title:'Updated title',description:'Updated description',date:'1941',fond:'5',inventory:'6',caseName:'7',
  documentIdentifier:'8',language:'kk',provenance:'Updated source',keywords:['updated']
 },{edit:true,publish:false});

 assert.equal(result.error,null);
 assert.equal(result.patch.title,'Updated title');
 assert.equal(result.patch.description,'Updated description');
 assert.equal(result.patch.provenance,'Updated source');
 assert.deepEqual(result.patch.keywords,['updated']);
});

test('published documents reject metadata edits without publish permission',()=>{
 const document=createDocument();
 document.status='published';
 const before=structuredClone(document);
 const result=prepareDocumentPatch(document,{title:'Unauthorized title'},{edit:true,publish:false});

 assert.equal(result.error,'Only editors can change published records');
 assert.deepEqual(result.patch,{});
 assert.deepEqual(document,before);
});
