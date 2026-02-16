'use client';

import MainPageHeader from './MainPageHeader';
import MainPageCoinList from './MainPageCoinList';
import styles from './MainPageLayout.module.css';

const MainPageLayout = () => {
  return (
    <div className={styles.container}>
      <MainPageHeader />
      <main className={styles.main}>
        <div className={styles.content}>
          <MainPageCoinList />
        </div>
      </main>
    </div>
  );
};

export default MainPageLayout;
