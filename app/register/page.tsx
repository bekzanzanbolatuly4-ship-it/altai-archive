import type {Metadata} from 'next';import {AuthPage} from '@/components/auth-page';
export const metadata:Metadata={title:'Регистрация'};
export default function Register(){return <AuthPage mode="register"/>}
