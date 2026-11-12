import type {Metadata} from 'next';import {AuthPage} from '@/components/auth-page';
export const metadata:Metadata={title:'Восстановление пароля'};
export default function ForgotPassword(){return <AuthPage mode="reset"/>}
