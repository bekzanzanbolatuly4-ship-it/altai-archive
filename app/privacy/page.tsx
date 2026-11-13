import type {Metadata} from 'next';
import {PrivacyPolicy} from '@/components/privacy-policy';

export const metadata:Metadata={title:'Политика конфиденциальности'};

export default function PrivacyPage(){return <section className="privacy-page-wrap"><PrivacyPolicy/></section>}
