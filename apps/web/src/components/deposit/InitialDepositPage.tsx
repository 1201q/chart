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
        <p className={styles.title}>시작할 시드 금액을 선택해 주세요</p>
        <div className={styles.optionList}>
          {AMOUNTS.map((amount) => {
            const isSelected = selected === amount;
            return (
              <div
                key={amount}
                className={`${styles.optionItem} ${isSelected ? styles.optionItemSelected : ''}`}
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
            '시작하기'
          )}
        </button>
      </div>
    </div>
  );
}
