'use client';

import { useState } from 'react';
import styles from './styles/order.form.input.module.css';
import { Plus, Minus } from 'lucide-react';
import {
  commitInputValue,
  sanitizeRawInput,
  stepPrice,
} from '@/utils/formatting/inputPrice';

type PriceInputProps = {
  value: number | null;
  onChange: (next: number | null) => void;
  mode: 'buy' | 'sell';
};

export function PriceInput({ value, onChange, mode }: PriceInputProps) {
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

  const handleStepUp = () => {
    const { value, display } = stepPrice(raw, 'up');
    setRaw(display);
    onChange(value);
  };

  const handleStepDown = () => {
    const { value, display } = stepPrice(raw, 'down');
    setRaw(display);
    onChange(value);
  };

  return (
    <div
      className={`${styles.inputContent} ${mode === 'buy' ? styles.buy : styles.sell}`}
    >
      <div className={styles.topWrapper}>
        <span>주문 가격</span>
      </div>
      <div className={styles.centerWrapper}>
        <div className={styles.inputWrapper}>
          <input
            inputMode="decimal"
            maxLength={11}
            value={raw}
            onChange={handleChange}
            onBlur={handleBlur}
            placeholder="주문 가격"
          />
          <p className={styles.rightFixedText}>원</p>
        </div>
        <div className={styles.stepperWrapper}>
          <button onClick={handleStepDown}>
            <Minus size={14} strokeWidth={3} />
          </button>
          <button onClick={handleStepUp}>
            <Plus size={14} strokeWidth={3} />
          </button>
        </div>
      </div>
    </div>
  );
}
