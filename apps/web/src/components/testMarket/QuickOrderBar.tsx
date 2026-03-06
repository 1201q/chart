'use client';

import styles from './styles/QuickOrderBar.module.css';

interface QuickOrderBarProps {
  onBuy: () => void;
  onSell: () => void;
}

const QuickOrderBar = ({ onBuy, onSell }: QuickOrderBarProps) => {
  return (
    <div className={styles.quickOrderBar}>
      <button className={styles.buyBtn} onClick={onBuy}>
        매수
      </button>
      <button className={styles.sellBtn} onClick={onSell}>
        매도
      </button>
    </div>
  );
};

export default QuickOrderBar;
