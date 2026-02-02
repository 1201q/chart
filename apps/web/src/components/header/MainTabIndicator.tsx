'use client';

import styles from './styles/main.tab.indicator.module.css';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const TABS: { id: string; label: string; href: string }[] = [
  { id: 'home', label: '홈', href: '/home' },
  { id: 'market', label: '거래소', href: '/test/new/KRW-BTC' },
  { id: 'account', label: '내 자산', href: '/account' },
];

const MainTabIndicator = ({
  isHiddenOnMobile = false,
}: {
  isHiddenOnMobile?: boolean;
}) => {
  const pathname = usePathname();

  return (
    <>
      <div
        className={`${styles.menuWrapper} ${isHiddenOnMobile ? styles.hiddenOnMobile : ''}`}
      >
        {TABS.map((tab) => {
          const isActive = pathname.startsWith(tab.href);

          return (
            <Link
              key={tab.id}
              className={`${styles.menu} ${isActive ? styles.select : ''}`}
              href={tab.href}
            >
              <span className={styles.label}>{tab.label}</span>

              {isActive && <div className={styles.pill} />}
            </Link>
          );
        })}
      </div>
    </>
  );
};

export default MainTabIndicator;
