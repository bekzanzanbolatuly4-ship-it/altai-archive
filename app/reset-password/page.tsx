import type {Metadata} from 'next';import {AuthPage} from '@/components/auth-page';
export const metadata:Metadata={title:'Новый пароль'};
export default function ResetPassword(){return <AuthPage mode="update"/>}
