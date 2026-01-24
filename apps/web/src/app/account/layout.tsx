import MainHeader from '@/components/header/MainHeader';
import styles from './layout.module.css';
import AccountTabs from '@/components/account/AccountTabs';

const AccountLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <MainHeader />
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
