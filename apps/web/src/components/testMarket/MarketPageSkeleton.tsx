import styles from './MarketPageSkeleton.module.css';

const STAT_COUNT = 4;

const MarketPageSkeleton = () => {
  return (
    <div className={styles.page}>
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

      {/* 코인 정보 바 */}
      <div className={styles.coinInfoBar}>
        <div className={styles.coinLeft}>
          {/* 데스크탑: 아이콘 + 코인명 가로 배치 */}
          <div className={`${styles.block} ${styles.coinIcon}`} />
          <div className={`${styles.block} ${styles.coinName}`} />

          {/* 모바일 전용: 코인명 + 가격 세로 배치 */}
          <div className={`${styles.block} ${styles.mobilePriceMain}`} />
          <div className={`${styles.block} ${styles.mobilePriceSub}`} />
        </div>

        <div className={styles.barDivider} />

        <div className={styles.statsArea}>
          <div className={styles.priceBlock}>
            <div className={`${styles.block} ${styles.priceMain}`} />
            <div className={`${styles.block} ${styles.priceSub}`} />
          </div>
          {Array.from({ length: STAT_COUNT }).map((_, i) => (
            <div key={i} className={styles.statItem}>
              <div className={`${styles.block} ${styles.statLabel}`} />
              <div className={`${styles.block} ${styles.statValue}`} />
            </div>
          ))}
        </div>

        <div className={styles.favBtn} />
      </div>

      {/* 모바일 탭바 */}
      <div className={styles.mobileTabBar}>
        <div
          className={`${styles.block} ${styles.mobileTabItem}`}
          style={{ width: 26 }}
        />
        <div
          className={`${styles.block} ${styles.mobileTabItem}`}
          style={{ width: 24 }}
        />
        <div
          className={`${styles.block} ${styles.mobileTabItem}`}
          style={{ width: 24 }}
        />
        <div
          className={`${styles.block} ${styles.mobileTabItem}`}
          style={{ width: 44 }}
        />
      </div>

      {/* 메인 콘텐츠 */}
      <div className={styles.mainContent}>
        <div className={styles.contentGrid}>
          {/* 왼쪽 컬럼: 차트 + 하단 패널 */}
          <div className={styles.leftColumn}>
            <div className={`${styles.cardBlock} ${styles.chartCard}`} />
            <div className={styles.bottomRow}>
              <div className={`${styles.cardBlock}`} />
              <div className={`${styles.cardBlock}`} />
            </div>
          </div>

          {/* 호가창 */}
          <div className={`${styles.cardBlock} ${styles.orderbookCard}`} />

          {/* 주문 폼 */}
          <div className={`${styles.cardBlock} ${styles.orderFormCard}`} />
        </div>
      </div>

      {/* 모바일 하단 주문 버튼 */}
      <div className={styles.quickOrderBar}>
        <div className={styles.buyBtn} />
        <div className={styles.sellBtn} />
      </div>
    </div>
  );
};

export default MarketPageSkeleton;
