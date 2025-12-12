'use client';

import { useState } from 'react';
import styles from './styles/order.form.input.module.css';

import { commitInputValue, sanitizeRawInput } from '@/utils/formatting/inputPrice';

type AmountInputProps = {
  value: number | null;
  onChange: (next: number | null) => void;
  code: string;
};

export function AmountInput({ value, onChange, code }: AmountInputProps) {
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
    <div className={styles.inputContent}>
      <div className={styles.inputWrapper}>
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
  );
}
