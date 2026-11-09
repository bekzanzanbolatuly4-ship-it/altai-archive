import {requireUser} from '@/lib/archive-auth';import {readStore} from '@/lib/archive-store';
export async function GET(){const auth=await requireUser('audit');if(auth.response)return auth.response;return Response.json({audit:(await readStore()).audit},{headers:{'Cache-Control':'no-store'}})}
