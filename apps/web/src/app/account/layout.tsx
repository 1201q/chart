import MainPageHeader from '@/components/mainPage/MainPageHeader';
import styles from './layout.module.css';
import AccountTabs from '@/components/account/AccountTabs';
import AccountMobileTabs from '@/components/account/AccountMobileTabs';
import { getMe } from '@/utils/api/auth.api';

const AccountLayout = async ({ children }: { children: React.ReactNode }) => {
  const user = await getMe();

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <MainPageHeader user={user} />
      </div>
      <div className={styles.mobileTabBar}>
        <AccountMobileTabs />
      </div>
      <div className={styles.main}>
        <div className={styles.mainWrapper}>
          <div className={styles.contentsWrapper}>
            <div className={styles.menuWrapper}>
              <AccountTabs />
            </div>
            <div className={styles.rightWrapper}>{children}</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AccountLayout;
