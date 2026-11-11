import type {StoredDocument} from '../archive-store';
import {isPublicDocument} from '../public-access.ts';
import {AIError} from './errors.ts';
export type Language='ru'|'kk'|'en';
export type Source={id:string;documentId?:string;title:string;description:string;provenance:string;kind?:'archive'|'reference';url?:string};

const sensitive=/(?:[\w.+-]+@[\w.-]+\.[a-z]{2,}|\b\d{12}\b|\+?\d[\d ()-]{8,}\d|\b(?:sk-|Bearer\s)[\w-]{8,}|(?:password|пароль|token|api[_ -]?key)\s*[:=]\s*\S+)/gi;
export function redact(text:string){return text.replace(sensitive,'[redacted]');}
export function parseInput(raw:unknown){
 if(!raw || typeof raw!=='object')throw new AIError('invalid_request',400);
 const input=raw as Record<string,unknown>;
 if(typeof input.message!=='string' || !input.message.trim() || input.message.length>2000 || !['ru','kk','en'].includes(String(input.locale)))throw new AIError('invalid_request',400);
 const message=redact(input.message.trim());
 const locale:Language=/[әғқңөұүһі]/i.test(message)?'kk':/[а-яё]/i.test(message)?'ru':/\b(the|find|what|how|hello|archive|document|please)\b/i.test(message)?'en':input.locale as Language;
 return {message,locale};
}
export function searchPublic(documents:StoredDocument[],query:string):Source[]{
 const terms=[...new Set(query.toLowerCase().match(/[\p{L}\p{N}]{3,}/gu)||[])];
 // Only records whose provenance has been reviewed may enter an external AI context.
 return documents.filter(d=>isPublicDocument(d)&&d.provenance==='verified').map(d=>({d,score:terms.reduce((n,t)=>n+( `${d.title} ${d.description}`.toLowerCase().includes(t)?1:0),0)}))
 .filter(x=>x.score>0).sort((a,b)=>b.score-a.score||a.d.id.localeCompare(b.d.id)).slice(0,5)
 .map(({d},i)=>({id:`S${i+1}`,kind:'archive' as const,documentId:d.id,title:redact(d.title).slice(0,180),description:redact(d.description||'').slice(0,500),provenance:'verified'}));
}
export function buildContext(sources:Source[]){
 return JSON.stringify(sources.map(({id,title,description,provenance})=>({id,title,description,provenance,content:'metadata only'})));
}
