import styles from './styles/account.orders.skeleton.module.css';

const ITEM_COUNT = 7;

const AccountOrdersSkeleton = () => {
  return (
    <div className={styles.shell}>
      <div className={styles.ordersSection}>
        <div className={styles.orders}>
          {/* listHeader */}
          <div className={styles.listHeader}>
            <div className={`${styles.block} ${styles.listTitle}`} />
            <div className={`${styles.block} ${styles.monthPicker}`} />
          </div>

          {/* 날짜 구분 + 아이템 */}
          {Array.from({ length: ITEM_COUNT }).map((_, i) => (
            <div key={i}>
              <div className={styles.orderItem}>
                <div className={styles.leftWrapper}>
                  <div className={styles.dateCol}>
                    {(i === 0 || i === 4) && (
                      <div className={`${styles.block} ${styles.timeBlock}`} />
                    )}
                  </div>
                  <div className={styles.leftInfos}>
                    <div className={`${styles.block} ${styles.koreanName}`} />
                    <div className={styles.bottomRow}>
                      <div className={`${styles.block} ${styles.tradeType}`} />
                      <div className={`${styles.block} ${styles.qty}`} />
                    </div>
                  </div>
                </div>
                <div className={styles.rightWrapper}>
                  <div className={`${styles.block} ${styles.amount}`} />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AccountOrdersSkeleton;
