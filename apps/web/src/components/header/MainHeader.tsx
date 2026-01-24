'use client';

import styles from './styles/main.header.module.css';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const MainHeader = () => {
  const pathname = usePathname();

  return (
    <div className={styles.exchangeHeader}>
      <div className={styles.menuWrapper}>
        <Link
          className={`${styles.menu} ${pathname.startsWith('/home') ? styles.select : ''}`}
          href={'/'}
        >
          홈
        </Link>
        <Link
          className={`${styles.menu} ${pathname.startsWith('/test') ? styles.select : ''}`}
          href={'/'}
        >
          거래소
        </Link>
        <Link
          className={`${styles.menu} ${pathname.startsWith('/account') ? styles.select : ''}`}
          href={'/account'}
        >
          내 자산
        </Link>
      </div>
    </div>
  );
};

export default MainHeader;
