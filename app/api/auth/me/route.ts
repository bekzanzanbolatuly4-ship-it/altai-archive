import {currentUser} from '@/lib/archive-auth';
export async function GET(){return Response.json({user:await currentUser()},{headers:{'Cache-Control':'no-store'}})}
