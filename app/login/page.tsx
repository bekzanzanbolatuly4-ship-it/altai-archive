import type {Metadata} from 'next';import {AuthPage} from '@/components/auth-page';
export const metadata:Metadata={title:'Вход'};
export default function Login(){return <AuthPage mode="login"/>}
