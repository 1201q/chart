import MainPageHeader from '@/components/mainPage/MainPageHeader';
import { getMe } from '@/utils/api/auth.api';
import { redirect } from 'next/navigation';
import styles from './layout.module.css';

export default async function InitializeLayoutContent({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getMe();

  if (!user) redirect('/login');
  if (user.isInitialized) redirect('/');

  return (
    <div className={styles.page}>
      <MainPageHeader user={user} />
      <main className={styles.main}>{children}</main>
    </div>
  );
}
