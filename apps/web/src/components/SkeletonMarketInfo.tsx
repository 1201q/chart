import styles from './styles/market.info.module.css';

const SkeletonMarketInfo = () => {
  return (
    <div className={styles.marketInfo}>
      <div className={styles.leftWrapper}>
        <div className={`${styles.leftIconWrapper} ${styles.skeleton} sk `}>
          {/* <Image src={imgSrc} alt={`${code} icon`} width={35} height={35} unoptimized /> */}
        </div>
        <div className={styles.leftInfoWrapper}>
          <div className={`sk ${styles.leftTopWrapper} ${styles.skeleton}`}></div>
          <div className={`sk ${styles.leftBottomWrapper} ${styles.skeleton}`}></div>
        </div>
      </div>
      <div className={styles.rightWrapper}>
        <div className={styles.rightItem}>
          <div className={`${styles.rightItemTitleText}`}>
            <div className={`sk ${styles.skeleton}`}></div>
          </div>
          <p className={`sk ${styles.skeleton} ${styles.rightItemValueText}`}></p>
        </div>
        <div className={styles.rightItem}>
          <div className={`${styles.rightItemTitleText}`}>
            <div className={`sk ${styles.skeleton}`}></div>
          </div>
          <p className={`sk ${styles.skeleton} ${styles.rightItemValueText}`}></p>
        </div>
        <div className={styles.rightItem}>
          <div className={`${styles.rightItemTitleText}`}>
            <div className={`sk ${styles.skeleton}`}></div>
            <div className={`sk ${styles.skeleton} ${styles.year}`}></div>
          </div>
          <p className={`sk ${styles.skeleton} ${styles.rightItemValueText}`}></p>
        </div>
        <div className={styles.rightItem}>
          <div className={`${styles.rightItemTitleText}`}>
            <div className={`sk ${styles.skeleton}`}></div>
            <div className={`sk ${styles.skeleton} ${styles.year}`}></div>
          </div>
          <p className={`sk ${styles.skeleton} ${styles.rightItemValueText}`}></p>
        </div>
      </div>
    </div>
  );
};

export default SkeletonMarketInfo;
