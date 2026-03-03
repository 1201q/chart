import styles from './styles/account.asset.skeleton.module.css';

const ROW_COUNT = 4;

const AccountAssetSkeleton = () => {
  return (
    <div className={styles.wrapper}>
      {/* TopAccountInfo */}
      <div className={styles.topSection}>
        <div className={`${styles.block} ${styles.titleLabel}`} />
        <div className={`${styles.block} ${styles.totalAmount}`} />
        <div className={styles.infoGrid}>
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className={styles.infoRow}>
              <div className={`${styles.block} ${styles.infoLabel}`} />
              <div className={`${styles.block} ${styles.infoValue}`} />
            </div>
          ))}
        </div>
      </div>

      {/* AssetPortfolio (collapsed) */}
      <div className={`${styles.portfolioSection} ${styles.block}`}></div>

      {/* AssetTable */}
      <div className={styles.tableSection}>
        <div className={`${styles.block} ${styles.sectionTitle}`} />
        <div className={styles.tableHeader}>
          {Array.from({ length: 7 }).map((_, i) => (
            <div key={i} className={styles.thCell}>
              <div className={`${styles.block} ${styles.thBlock}`} />
            </div>
          ))}
        </div>
        {Array.from({ length: ROW_COUNT }).map((_, i) => (
          <div
            key={i}
            className={`${styles.tableRow} ${i % 2 === 1 ? styles.tableRowAlt : ''}`}
          >
            <div className={styles.nameCell}>
              <div className={`${styles.block} ${styles.coinIcon}`} />
              <div className={styles.nameTexts}>
                <div className={`${styles.block} ${styles.coinName}`} />
                <div className={`${styles.block} ${styles.coinCode}`} />
              </div>
            </div>
            {Array.from({ length: 6 }).map((_, j) => (
              <div key={j} className={styles.numCell}>
                <div className={`${styles.block} ${styles.numBlock}`} />
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
};

export default AccountAssetSkeleton;
