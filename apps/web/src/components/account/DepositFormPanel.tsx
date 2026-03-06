'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Check } from 'lucide-react';
import styles from './styles/deposit.form.panel.module.css';
import { DepositStatus, depositKrw } from '@/utils/api/deposit.api';

const KRW_FMT = new Intl.NumberFormat('ko-KR');

const AMOUNTS = [10_000_000, 30_000_000, 50_000_000, 100_000_000];

function formatAmount(amount: number): string {
  if (amount >= 100_000_000) return `${amount / 100_000_000}억원`;
  const man = amount / 10_000;
  return `${man.toLocaleString()}만원`;
}

interface Props {
  status: DepositStatus;
}

const DepositFormPanel = ({ status }: Props) => {
  const router = useRouter();
  const [selected, setSelected] = useState(AMOUNTS[0]);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [isPending, setIsPending] = useState(false);

  const isExhausted = status.remaining === 0;

  const handleSubmit = async () => {
    setErrorMsg('');
    setSuccessMsg('');
    setIsPending(true);
    try {
      const result = await depositKrw(selected);
      setSuccessMsg(
        `${KRW_FMT.format(result.amount)}원 입금 완료 · 잔여 ${result.remaining}회`,
      );
      router.refresh();
    } catch {
      setErrorMsg('입금에 실패했습니다. 잠시 후 다시 시도해주세요.');
    } finally {
      setIsPending(false);
    }
  };

  return (
    <div className={styles.panel}>
      <div className={styles.panelHeader}>
        <h3>원화 입금</h3>
        <span
          className={`${styles.statusBadge} ${isExhausted ? styles.statusBadgeExhausted : ''}`}
        >
          {isExhausted ? '한도 초과' : `잔여 ${status.remaining}회`}
        </span>
      </div>

      <div className={styles.content}>
        <p className={styles.title}>입금 금액을 선택해 주세요</p>

        <div className={styles.optionList}>
          {AMOUNTS.map((amount) => {
            const isSelected = selected === amount;
            return (
              <div
                key={amount}
                className={styles.optionItem}
                onClick={() => !isExhausted && !isPending && setSelected(amount)}
              >
                <span className={styles.optionAmount}>{formatAmount(amount)}</span>
                <span
                  className={`${styles.indicator} ${isSelected ? styles.indicatorSelected : ''}`}
                >
                  <Check size={14} strokeWidth={3} />
                </span>
              </div>
            );
          })}
        </div>

        <div className={styles.notice}>
          <p className={styles.noticeTitle}>원화 입금 안내</p>
          <ul className={styles.noticeList}>
            <li>입금되는 금액은 모의 거래에만 사용되는 가상 원화입니다.</li>
            <li>원화 입금은 매월 최대 3회까지 가능합니다.</li>
            <li>
              이번달 잔여 횟수는 <strong>{isExhausted ? '0' : status.remaining}회</strong>
              입니다.
            </li>
            <li>실제 금전 거래와는 무관하며, 투자 손익에 대한 책임은 지지 않습니다.</li>
          </ul>
        </div>

        {errorMsg && <span className={styles.errorMsg}>{errorMsg}</span>}
        {successMsg && <span className={styles.successMsg}>{successMsg}</span>}

        <button
          className={styles.submitButton}
          onClick={handleSubmit}
          disabled={isExhausted || isPending}
        >
          {isPending ? '처리 중...' : isExhausted ? '이번달 입금 한도 초과' : '입금하기'}
        </button>
      </div>
    </div>
  );
};

export default DepositFormPanel;
