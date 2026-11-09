import type {Metadata} from 'next';
import {Portal} from '@/components/portal';
export const metadata:Metadata={title:'Государственный архив Восточно-Казахстанской области',description:'Официальная информация о Государственном архиве Восточно-Казахстанской области и цифровой платформе ALTAI ARCHIVE.'};
export default function Page(){return <Portal kind="about"/>}
