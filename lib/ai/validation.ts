import type {StoredDocument} from '../archive-store';
import type {Source} from './context.ts';
import {redact} from './context.ts';
import {isPublicDocument} from '../public-access.ts';
import {AIError} from './errors.ts';
export function validateResponse(raw:string,sources:Source[],current:StoredDocument[]){
 let value;try{value=JSON.parse(raw);}catch{throw new AIError('invalid_response');}
 if(!value||typeof value.answer!=='string'||!value.answer.trim()||value.answer.length>2500||!Array.isArray(value.citations)||value.citations.length>8||/(?:https?:|www\.|<|>|\]\(|\b[a-z0-9-]+\.(?:com|org|net|kz|io)\b)/i.test(value.answer)||redact(value.answer)!==value.answer)throw new AIError('invalid_response');
 const citations:{id:string;title:string;quote:string;provenance:string;url:string}[]=[];
 for(const c of value.citations){
  const source=sources.find(s=>s.id===c?.id);
  if(!source||typeof c.quote!=='string'||c.quote.length<3||![source.title,source.description].some(t=>t.includes(c.quote)))throw new AIError('invalid_response');
  if(source.kind==='reference'){
   if(!source.url||(!source.url.startsWith('/')&&!/^https:\/\/(?:adilet\.zan\.kz|www\.gov\.kz)\//.test(source.url)))throw new AIError('invalid_response');
   if(!citations.some(s=>s.id===c.id))citations.push({id:c.id,title:source.title,quote:c.quote,provenance:'verified',url:source.url});
   continue;
  }
  if(!source.documentId)throw new AIError('invalid_response');
  const document=current.find(d=>d.id===source.documentId&&isPublicDocument(d));
  if(document?.provenance!=='verified')throw new AIError('source_changed');
  // Fail closed: do not return prose based on a revoked or edited record.
  if(!document||redact(document.title).slice(0,180)!==source.title||redact(document.description||'').slice(0,500)!==source.description)throw new AIError('source_changed');
  if(!citations.some(s=>s.id===c.id))citations.push({id:c.id,title:source.title,quote:c.quote,provenance:source.provenance,url:`/document/${encodeURIComponent(document.id)}`});
 }
 if(sources.length && !citations.length)throw new AIError('invalid_response');
 // Any retrieved record might have influenced the answer, even without a citation.
 if(sources.some(s=>s.kind!=='reference'&&!current.some(d=>d.id===s.documentId&&isPublicDocument(d)&&d.provenance==='verified'&&redact(d.title).slice(0,180)===s.title&&redact(d.description||'').slice(0,500)===s.description)))throw new AIError('source_changed');
 return {answer:value.answer as string,citations};
}
