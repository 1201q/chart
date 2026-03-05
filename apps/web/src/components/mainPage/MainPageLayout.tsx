'use client';

import MainPageHeader from './MainPageHeader';
import MainPageCoinList from './MainPageCoinList';
import styles from './MainPageLayout.module.css';
import { AuthUser } from '@/utils/api/auth.api';
import { AuthenticatedContext } from '@/utils/context/auth.context';

interface MainPageLayoutProps {
  user: AuthUser | null;
}

const MainPageLayout = ({ user }: MainPageLayoutProps) => {
  return (
    <AuthenticatedContext.Provider value={!!user}>
      <div className={styles.container}>
        <MainPageHeader user={user} />
        <main className={styles.main}>
          <div className={styles.content}>
            <MainPageCoinList />
          </div>
        </main>
        <footer className={styles.footer}>
          <div className={styles.footerInner}>
            <p className={styles.footerDisclaimer}>
              해당 서비스에서 제공하는 투자 정보는 고객의 투자 판단을 위한 단순 참고용일
              뿐, 투자 제안 및 권유, 종목 추천을 위해 작성된 것이 아닙니다.
            </p>
            <div className={styles.footerMeta}>
              <div className={styles.footerAttribution}>
                <span className={styles.footerAttributionLabel}>Data powered by</span>
                <span className={styles.footerAttributionItem}>Upbit API</span>
                <span className={styles.footerAttributionDot}>·</span>
                <span className={styles.footerAttributionItem}>CoinMarketCap API</span>
              </div>
              <span className={styles.footerMetaDot}>·</span>
              <p className={styles.footerCopyright}>
                © {new Date().getFullYear()} Chartraders.club All rights reserved.
              </p>
            </div>
          </div>
        </footer>
      </div>
    </AuthenticatedContext.Provider>
  );
};

export default MainPageLayout;
