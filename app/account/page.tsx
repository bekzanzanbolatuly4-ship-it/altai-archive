import type {Metadata} from 'next';
import {AuthPage} from '@/components/auth-page';
export const metadata:Metadata={title:'Аккаунт посетителя'};
export default function AccountPage(){return <AuthPage mode="login"/>}
