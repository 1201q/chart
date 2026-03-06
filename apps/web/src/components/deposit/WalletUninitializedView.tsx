'use client';

import Link from 'next/link';
import styles from './styles/wallet.uninitialized.view.module.css';

interface Props {
  compact?: boolean; // 모바일 시트 등 공간이 좁은 경우
}

const WalletUninitializedView = ({ compact = false }: Props) => {
  return (
    <div className={`${styles.wrapper} ${compact ? styles.compact : ''}`}>
      <div className={styles.icon}>
        <span className={styles.iconText}>₩</span>
      </div>
      <p className={styles.title}>지갑이 아직 생성되지 않았습니다</p>
      <p className={styles.desc}>모의 거래를 시작하려면 초기 자산을 설정해야 합니다.</p>
      <Link href="/initialize" className={styles.button}>
        지갑 생성하기
      </Link>
    </div>
  );
};

export default WalletUninitializedView;
