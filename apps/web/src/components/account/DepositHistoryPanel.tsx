import styles from './styles/deposit.module.css';
import { DepositHistoryItem, DepositStatus } from '@/utils/api/deposit.api';

const KRW_FMT = new Intl.NumberFormat('ko-KR');
const DATE_FMT = new Intl.DateTimeFormat('ko-KR', {
  month: '2-digit',
  day: '2-digit',
  timeZone: 'Asia/Seoul',
});

interface Props {
  history: DepositHistoryItem[];
  status: DepositStatus;
  onOpenForm: () => void;
}

const DepositHistoryPanel = ({ history, status, onOpenForm }: Props) => {
  const isExhausted = status.remaining === 0;

  return (
    <>
      {/* 이번달 입금 현황 */}
      <div className={styles.statusSection}>
        <div className={styles.statusTop}>
          <span className={styles.statusTitle}>이번달 입금 현황</span>
          <button
            className={`${styles.depositBtn} ${isExhausted ? styles.depositBtnDisabled : ''}`}
            onClick={onOpenForm}
            disabled={isExhausted}
          >
            {isExhausted ? '한도 초과' : '입금하기'}
          </button>
        </div>
        <div className={styles.dotsRow}>
          {Array.from({ length: status.limit }).map((_, i) => (
            <div
              key={i}
              className={`${styles.dot} ${i < status.used ? styles.dotUsed : ''}`}
            />
          ))}
        </div>
        <span className={styles.statusDesc}>
          {status.depositMonth.replace('_', '년 ').replace(/(\d+)$/, '$1월')} 기준 ·{' '}
          {status.used}/{status.limit}회 사용
        </span>
      </div>

      {/* 입금 이력 */}
      <div className={styles.historyHeader}>
        <h3>입금 이력</h3>
      </div>
      <div className={styles.historyList}>
        {history.length === 0 ? (
          <span className={styles.historyEmpty}>입금 이력이 없습니다.</span>
        ) : (
          history.map((item) => (
            <div key={item.id} className={styles.historyItem}>
              <div className={styles.historyLeft}>
                <span className={styles.historyDate}>
                  {DATE_FMT.format(new Date(item.createdAt))
                    .replace(/\. /g, '.')
                    .replace(/\.$/, '')}
                </span>
                <div className={styles.historyInfo}>
                  <span className={styles.historyLabel}>원화입금</span>
                  <span className={styles.historySubLabel}>입금완료</span>
                </div>
              </div>
              <span className={styles.historyAmount}>
                +{KRW_FMT.format(item.amount)}원
              </span>
            </div>
          ))
        )}
      </div>
    </>
  );
};

export default DepositHistoryPanel;
