import styles from './MainPageSkeleton.module.css';

const ROW_COUNT = 15;

const MainPageSkeleton = () => {
  return (
    <div className={styles.container}>
      {/* 헤더 */}
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <div className={`${styles.block} ${styles.logo}`} />
          <div className={styles.nav}>
            <div className={`${styles.block} ${styles.navItem}`} />
            <div className={`${styles.block} ${styles.navItem}`} />
            <div className={`${styles.block} ${styles.navItem}`} />
          </div>
        </div>
        <div className={`${styles.block} ${styles.headerBtn}`} />
      </div>

      {/* 탭 */}
      <div className={styles.tabs}>
        <div className={`${styles.block} ${styles.tabItem} ${styles.tabItemActive}`} />
        <div className={`${styles.block} ${styles.tabItem} ${styles.tabItemInactive}`} />
        <div className={`${styles.block} ${styles.tabItem} ${styles.tabItemInactive}`} />
      </div>

      {/* 리스트 헤더 */}
      <div className={styles.listHeader}>
        <div className={`${styles.block} ${styles.colName}`} />
        <div className={`${styles.block} ${styles.colCell}`} />
        <div className={`${styles.block} ${styles.colCell}`} />
        <div className={`${styles.block} ${styles.colCell}`} />
        <div className={`${styles.block} ${styles.colHighLow}`} />
      </div>

      {/* 코인 row 스켈레톤 */}
      <div className={styles.rows}>
        {Array.from({ length: ROW_COUNT }).map((_, i) => (
          <div key={i} className={styles.row}>
            <div className={styles.nameCell}>
              <div className={`${styles.block} ${styles.starSkeleton}`} />
              <div className={`${styles.block} ${styles.icon}`} />
              <div className={styles.nameWrap}>
                <div className={`${styles.block} ${styles.name}`} />
                <div className={`${styles.block} ${styles.code}`} />
              </div>
            </div>
            <div className={styles.priceCell}>
              <div className={`${styles.block} ${styles.price}`} />
            </div>
            <div className={styles.changeCell}>
              <div className={`${styles.block} ${styles.change}`} />
            </div>
            <div className={styles.volumeCell}>
              <div className={`${styles.block} ${styles.volume}`} />
            </div>
            <div className={styles.highLowCell}>
              <div className={`${styles.block} ${styles.highLow}`} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default MainPageSkeleton;
