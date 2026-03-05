'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Check } from 'lucide-react';
import styles from './styles/initial.deposit.page.module.css';
import { initializeBalance } from '@/utils/api/deposit.api';
import LoadingSpinner from '@/components/LoadingSpinner';

const AMOUNTS = [10_000_000, 30_000_000, 50_000_000, 100_000_000];

function formatAmount(amount: number): string {
  if (amount === 100_000_000) return '1억원';
  const man = amount / 10_000;
  return `${man.toLocaleString()}만원`;
}

export default function InitialDepositPage() {
  const [selected, setSelected] = useState(10_000_000);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async () => {
    setIsLoading(true);
    try {
      await initializeBalance(selected);
      router.replace('/');
    } catch {
      setIsLoading(false);
    }
  };

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <p className={styles.title}>초기 시드 금액을 선택해 주세요</p>
        <div className={styles.optionList}>
          {AMOUNTS.map((amount) => {
            const isSelected = selected === amount;
            return (
              <div
                key={amount}
                className={`${styles.optionItem} `}
                onClick={() => setSelected(amount)}
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
          <p className={styles.noticeTitle}>초기 지갑 생성 안내</p>
          <ul className={styles.noticeList}>
            <li>선택한 금액은 모의 거래에만 사용되는 가상 원화입니다.</li>
            <li>
              초기 자산은 최초 1회만 설정 가능하며, 이후 입금 기능을 통해 추가할 수
              있습니다.
            </li>
            <li>원화 추가 입금은 매월 최대 3회까지 가능합니다.</li>
            <li>실제 금전 거래와는 무관하며, 투자 손익에 대한 책임은 지지 않습니다.</li>
          </ul>
        </div>
        <button
          className={styles.submitButton}
          onClick={handleSubmit}
          disabled={isLoading}
        >
          {isLoading ? (
            <>
              <LoadingSpinner size={18} stroke={5} color="#ffffff" />
              <span>처리 중...</span>
            </>
          ) : (
            '지갑 생성'
          )}
        </button>
      </div>
    </div>
  );
}
