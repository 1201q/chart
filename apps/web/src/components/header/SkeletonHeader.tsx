import styles from './styles/exchange.header.module.css';

const SkeletonHeader = () => {
  return (
    <div className={styles.exchangeHeader}>
      <div className={`sk ${styles.skeleton} ${styles.coinNameButton}`}></div>
      <div className={`${styles.textWrapper} ${styles.hidden}`}>
        <h2 className={`sk ${styles.skeleton} ${styles.coinPriceText}`}></h2>
        <div className={styles.changeWrapper}>
          <span className={`sk ${styles.skeleton} ${styles.changeRumericText}`}></span>
        </div>
      </div>
    </div>
  );
};

export default SkeletonHeader;
