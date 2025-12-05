'use client';

import { useEffect } from 'react';
import SideCoinList from './SideCoinList';
import styles from './styles/coinlist.module.css';

const TickerListModal = ({ close }: { close: () => void }) => {
  const handleBgClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      close();
    }
  };

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'auto';
    };
  }, []);

  return (
    <div className={styles.modalBg} onClick={handleBgClick}>
      <div className={styles.modal}>
        <SideCoinList />
      </div>
    </div>
  );
};

export default TickerListModal;
