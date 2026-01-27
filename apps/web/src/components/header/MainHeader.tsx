'use client';

import styles from './styles/main.header.module.css';

import MainTabIndicator from './MainTabIndicator';

const MainHeader = () => {
  return (
    <div className={styles.exchangeHeader}>
      <MainTabIndicator />
    </div>
  );
};

export default MainHeader;
