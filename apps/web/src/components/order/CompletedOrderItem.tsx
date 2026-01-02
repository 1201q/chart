import styles from './styles/order.form.order.item.module.css';

const CompletedOrderItem = () => {
  return (
    <div className={styles.completedTradeItem}>
      <div className={styles.leftWrapper}>
        <div className={styles.date}>11.11</div>
        <div className={`${styles.tradeType} ${styles.even}`}>매수</div>
      </div>
      <div className={styles.rightWrapper}>
        <span>2,750원</span>
      </div>
    </div>
  );
};

export default CompletedOrderItem;
