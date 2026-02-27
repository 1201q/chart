'use client';

import MainPageHeader from './MainPageHeader';
import MainPageCoinList from './MainPageCoinList';
import styles from './MainPageLayout.module.css';
import { AuthUser } from '@/utils/api/auth.api';
import { AuthenticatedContext } from '@/utils/context/auth.context';

interface MainPageLayoutProps {
  user: AuthUser | null;
}

const MainPageLayout = ({ user }: MainPageLayoutProps) => {
  return (
    <AuthenticatedContext.Provider value={!!user}>
      <div className={styles.container}>
        <MainPageHeader user={user} />
        <main className={styles.main}>
          <div className={styles.content}>
            <MainPageCoinList />
          </div>
        </main>
      </div>
    </AuthenticatedContext.Provider>
  );
};

export default MainPageLayout;
