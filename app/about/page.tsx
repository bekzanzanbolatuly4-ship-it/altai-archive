import type {Metadata} from 'next';
import {Portal} from '@/components/portal';
export const metadata:Metadata={title:'Государственный архив Восточно-Казахстанской области',description:'Информация о Государственном архиве Восточно-Казахстанской области и его филиалах.'};
export default function Page(){return <Portal kind="about"/>}
