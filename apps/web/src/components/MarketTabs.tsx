'use client';

import { useState } from 'react';
import styles from './styles/market.tabs.module.css';

const MarketTabs = () => {
  const [activeTab, setActiveTab] = useState('chart');

  return (
    <div className={styles.tabs}>
      <button className={styles.tab}>차트</button>
      <button className={styles.tab}>세부정보</button>
    </div>
  );
};

export default MarketTabs;
