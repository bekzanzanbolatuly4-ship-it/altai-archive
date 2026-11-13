import type {Metadata} from 'next';
import {AccountProfile} from '@/components/account-profile';
export const metadata:Metadata={title:'Мой профиль'};
export default function AccountPage(){return <AccountProfile/>}
