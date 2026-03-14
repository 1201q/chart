'use client';

import MainPageHeader from './MainPageHeader';
import MainPageCoinList from './MainPageCoinList';
import styles from './MainPageLayout.module.css';
import { AuthUser } from '@/utils/api/auth.api';
import { AuthenticatedContext } from '@/utils/context/auth.context';
import InitializePromptSheet from '@/components/deposit/InitializePromptSheet';

interface MainPageLayoutProps {
  user: AuthUser | null;
  isInitialized: boolean;
}

const MainPageLayout = ({ user, isInitialized }: MainPageLayoutProps) => {
  return (
    <AuthenticatedContext.Provider value={!!user}>
      {!isInitialized && <InitializePromptSheet />}
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
              해당 서비스의 모든 정보는 투자 참고용으로만 제공되며, 실제 투자 결과와 다를
              수 있습니다. 서비스가 제공하는 거래 기능은 실제 원화를 사용하지 않는
              시뮬레이션 거래입니다.
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
