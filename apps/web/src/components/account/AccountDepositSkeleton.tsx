import styles from './styles/account.deposit.skeleton.module.css';

const ITEM_COUNT = 5;

const AccountDepositSkeleton = () => {
  return (
    <div className={styles.shell}>
      <div className={styles.historySection}>
        {/* 이번달 입금 현황 */}
        <div className={styles.statusSection}>
          <div className={styles.statusTop}>
            <div className={`${styles.block} ${styles.statusTitle}`} />
            <div className={`${styles.block} ${styles.depositBtn}`} />
          </div>
          <div className={styles.dotsRow}>
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className={`${styles.block} ${styles.dot}`} />
            ))}
          </div>
          <div className={`${styles.block} ${styles.statusDesc}`} />
        </div>

        {/* 입금 이력 헤더 */}
        <div className={styles.historyHeader}>
          <div className={`${styles.block} ${styles.historyTitle}`} />
        </div>

        {/* 입금 이력 아이템 */}
        <div className={styles.list}>
          {Array.from({ length: ITEM_COUNT }).map((_, i) => (
            <div key={i} className={styles.item}>
              <div className={styles.itemLeft}>
                <div className={styles.dateCol}>
                  {(i === 0 || i === 3) && (
                    <div className={`${styles.block} ${styles.dateBlock}`} />
                  )}
                </div>
                <div className={styles.itemInfo}>
                  <div className={`${styles.block} ${styles.itemLabel}`} />
                  <div className={`${styles.block} ${styles.itemSub}`} />
                </div>
              </div>
              <div className={`${styles.block} ${styles.itemAmount}`} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AccountDepositSkeleton;
