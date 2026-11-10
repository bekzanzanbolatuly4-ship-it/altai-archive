import type {StoredDocument} from './archive-store';

export function isPublicDocument(document:StoredDocument):boolean {
 const flags=document as StoredDocument & {deleted?:boolean;hidden?:boolean;deletedAt?:unknown};
 return document.status==='published' && document.accessStatus==='public' && !flags.deleted && !flags.hidden && !flags.deletedAt;
}
