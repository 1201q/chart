'use client';

import { useState, useTransition } from 'react';
import styles from './styles/deposit.module.css';
import { DepositHistoryItem, DepositStatus, depositKrw } from '@/utils/api/deposit.api';
import { useRouter } from 'next/navigation';

const KRW_FMT = new Intl.NumberFormat('ko-KR');
const DATE_FMT = new Intl.DateTimeFormat('ko-KR', {
  month: '2-digit',
  day: '2-digit',
  timeZone: 'Asia/Seoul',
});

const PRESET_AMOUNTS = [
  { label: '+1만', value: 10_000 },
  { label: '+10만', value: 100_000 },
  { label: '+100만', value: 1_000_000 },
  { label: '+1000만', value: 10_000_000 },
];

interface Props {
  status: DepositStatus;
  history: DepositHistoryItem[];
}

const DepositPage = ({ status, history }: Props) => {
  const router = useRouter();
  const [amount, setAmount] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [isPending, startTransition] = useTransition();

  const isExhausted = status.remaining === 0;
  const numericAmount = Number(amount.replace(/,/g, ''));

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/[^0-9]/g, '');
    if (!raw) {
      setAmount('');
      return;
    }
    setAmount(KRW_FMT.format(Number(raw)));
  };

  const handlePreset = (value: number) => {
    const current = Number(amount.replace(/,/g, '')) || 0;
    setAmount(KRW_FMT.format(current + value));
  };

  const handleSubmit = () => {
    setErrorMsg('');
    setSuccessMsg('');

    if (!numericAmount || numericAmount <= 0) {
      setErrorMsg('입금할 금액을 입력해주세요.');
      return;
    }
    if (numericAmount < 1_000) {
      setErrorMsg('최소 입금액은 1,000원입니다.');
      return;
    }

    startTransition(async () => {
      try {
        const result = await depositKrw(numericAmount);
        setAmount('');
        setSuccessMsg(
          `${KRW_FMT.format(result.amount)}원이 입금되었습니다. (이번달 잔여 ${result.remaining}회)`,
        );
        router.refresh();
      } catch {
        setErrorMsg('입금에 실패했습니다. 잠시 후 다시 시도해주세요.');
      }
    });
  };

  return (
    <div className={styles.wrapper}>
      {/* 이번달 입금 현황 */}
      <div className={styles.statusCard}>
        <div className={styles.statusHeader}>
          <span className={styles.statusTitle}>이번달 입금 현황</span>
          <span
            className={`${styles.statusBadge} ${isExhausted ? styles.statusBadgeExhausted : ''}`}
          >
            {isExhausted ? '한도 초과' : `잔여 ${status.remaining}회`}
          </span>
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
      <div>
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
      </div>
      {/* 입금 폼 */}
      <div className={styles.formCard}>
        <span className={styles.formTitle}>원화 입금</span>
        <div className={styles.inputRow}>
          <input
            className={styles.amountInput}
            type="text"
            inputMode="numeric"
            placeholder="입금할 금액 (원)"
            value={amount}
            onChange={handleAmountChange}
            disabled={isExhausted || isPending}
          />
        </div>
        <div className={styles.presetRow}>
          {PRESET_AMOUNTS.map((p) => (
            <button
              key={p.value}
              className={styles.presetBtn}
              onClick={() => handlePreset(p.value)}
              disabled={isExhausted || isPending}
            >
              {p.label}
            </button>
          ))}
        </div>
        {errorMsg && <span className={styles.errorMsg}>{errorMsg}</span>}
        {successMsg && <span className={styles.successMsg}>{successMsg}</span>}
        <button
          className={styles.submitBtn}
          onClick={handleSubmit}
          disabled={isExhausted || isPending || !numericAmount}
        >
          {isPending ? '처리 중...' : isExhausted ? '이번달 입금 한도 초과' : '입금하기'}
        </button>
      </div>
    </div>
  );
};

export default DepositPage;
