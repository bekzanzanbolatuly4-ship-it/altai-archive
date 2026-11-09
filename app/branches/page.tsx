import type {Metadata} from 'next';
import {Portal} from '@/components/portal';
export const metadata:Metadata={title:'Архив и филиалы',description:'Государственный архив Восточно-Казахстанской области и его подтверждённые филиалы.'};
export default function Page(){return <Portal kind="branches"/>}
