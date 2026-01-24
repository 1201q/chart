'use client';

import styles from './styles/top.account.info.module.css';

const TopAccountInfo = () => {
  return (
    <div className={styles.wrapper}>
      <h3>내 자산</h3>
      <h2>{Number(1000442).toLocaleString('ko-KR')}원</h2>
    </div>
  );
};

export default TopAccountInfo;
