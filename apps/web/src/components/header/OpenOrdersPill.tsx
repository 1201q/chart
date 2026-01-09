'use client';
import LoadingSpinner from '../LoadingSpinner';
import styles from './styles/orders.pill.module.css';

const OpenOrdersPill = () => {
  return (
    <button type="button" className={styles.pill}>
      <div className={styles.textWrapper}>
        <span>주문 1건</span>
        <p>진행중</p>
      </div>
      <LoadingSpinner
        className={styles.loader}
        size={15}
        stroke={6}
        color="var(--grey200)"
      />
    </button>
  );
};

export default OpenOrdersPill;
