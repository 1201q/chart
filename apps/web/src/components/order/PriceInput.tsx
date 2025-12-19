/* eslint-disable react-hooks/set-state-in-effect */
'use client';

import { useEffect, useState } from 'react';
import styles from './styles/order.form.input.module.css';
import { Plus, Minus } from 'lucide-react';
import {
  commitInputValue,
  sanitizeRawInput,
  stepPrice,
} from '@/utils/formatting/inputPrice';
import { useOrderFormActions, useOrderFormSelector } from '../provider/OrderFormProvider';

export function PriceInput() {
  const price = useOrderFormSelector((s) => s.price);
  const store = useOrderFormActions();

  const [raw, setRaw] = useState<string>('');
  const [editing, setEditing] = useState<boolean>(false);

  useEffect(() => {
    if (editing) return;

    if (price === null) setRaw('');
    else setRaw(commitInputValue(String(price)).display);
  }, [price, editing]);

  const commit = () => {
    const { value, display } = commitInputValue(raw);
    setRaw(display);
    setEditing(false);
    store.setPrice(value, true);
  };

  const handleStepUp = () => {
    const { value, display } = stepPrice(raw, 'up');
    setRaw(display);
    setEditing(false);
    store.setPrice(value, true);
  };

  const handleStepDown = () => {
    const { value, display } = stepPrice(raw, 'down');
    setRaw(display);
    setEditing(false);
    store.setPrice(value, true);
  };

  return (
    <div className={`${styles.inputContent}`}>
      <div className={styles.topWrapper}>
        <span>주문 가격</span>
      </div>
      <div className={styles.centerWrapper}>
        <div className={styles.inputWrapper}>
          <input
            inputMode="decimal"
            maxLength={11}
            value={raw}
            onFocus={() => setEditing(true)}
            onChange={(e) => setRaw(sanitizeRawInput(e.target.value))}
            onBlur={commit}
            placeholder="주문 가격"
          />
          <p className={styles.rightFixedText}>원</p>
        </div>
        <div className={styles.stepperWrapper}>
          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={handleStepDown}
          >
            <Minus size={14} strokeWidth={3} />
          </button>
          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={handleStepUp}
          >
            <Plus size={14} strokeWidth={3} />
          </button>
        </div>
      </div>
    </div>
  );
}
