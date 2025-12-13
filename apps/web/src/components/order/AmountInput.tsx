'use client';

import { useState } from 'react';
import styles from './styles/order.form.input.module.css';

import { commitInputValue, sanitizeRawInput } from '@/utils/formatting/inputPrice';

type AmountInputProps = {
  value: number | null;
  onChange: (next: number | null) => void;
  code: string;
  mode: 'buy' | 'sell';
};

export function AmountInput({ value, onChange, code, mode }: AmountInputProps) {
  const [raw, setRaw] = useState<string>(
    value !== null ? commitInputValue(String(value)).display : '',
  );

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const nextRaw = sanitizeRawInput(e.target.value);
    setRaw(nextRaw);
  };

  const handleBlur = () => {
    const { value: committedValue, display } = commitInputValue(raw);
    setRaw(display);

    onChange(committedValue);
  };

  return (
    <div
      className={`${styles.inputContent} ${mode === 'buy' ? styles.buy : styles.sell}`}
    >
      <div className={styles.topWrapper}>
        <span>수량</span>
      </div>
      <div className={styles.centerWrapper}>
        <div className={`${styles.inputWrapper} ${styles.amountInputWrapper}`}>
          <input
            inputMode="decimal"
            maxLength={11}
            value={raw}
            onChange={handleChange}
            onBlur={handleBlur}
            placeholder="수량"
          />
          <p className={styles.rightFixedText}>{code.replace('KRW-', '')}</p>
        </div>
      </div>
      <div className={styles.buttonWrapper}>
        <button>10%</button> <button>25%</button> <button>50%</button>
        <button>전체</button>
      </div>
    </div>
  );
}
