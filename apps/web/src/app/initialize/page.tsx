import { redirect } from 'next/navigation';
import { getMe } from '@/utils/api/auth.api';
import InitialDepositPage from '@/components/deposit/InitialDepositPage';

export default async function InitializePage() {
  const user = await getMe();

  if (!user) redirect('/login');
  if (user.isInitialized) redirect('/');

  return <InitialDepositPage />;
}
