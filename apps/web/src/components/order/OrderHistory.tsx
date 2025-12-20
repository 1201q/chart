'use client';

import CompletedTradeItem from './CompletedTradeItem';
import styles from './styles/order.form.history.module.css';

const OrderHistory = () => {
  return (
    <div className={styles.history}>
      <div className={styles.historyTitle}>
        <h4>주문내역</h4>
      </div>
      <div className={styles.historyMenu}>
        <button>
          <span>대기</span>
        </button>
        <button>
          <span>완료</span>
        </button>
      </div>
      <div className={styles.contentWrapper}>
        {/* <div className={styles.emptyList}>
          <span>주문 내역이 없습니다.</span>
        </div> */}
        <div className={styles.listViewport}>
          <div className={styles.completedList}>
            <CompletedTradeItem />
            <CompletedTradeItem />
            <CompletedTradeItem />
            <CompletedTradeItem />
            <CompletedTradeItem /> <CompletedTradeItem />
            <CompletedTradeItem />
            <CompletedTradeItem />
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderHistory;
