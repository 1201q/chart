/* eslint-disable react-hooks/set-state-in-effect */
'use client';

import { useEffect, useState } from 'react';
import styles from './styles/order.form.input.module.css';

import { useOrderFormActions, useOrderFormSelector } from '../provider/OrderFormProvider';
import { commitQtyValue, sanitizeQtyRawInput } from '@/utils/formatting/inputQty';

type AmountInputProps = {
  code: string;
};

export function QtyInput({ code }: AmountInputProps) {
  const qty = useOrderFormSelector((s) => s.qty);
  const store = useOrderFormActions();

  const [raw, setRaw] = useState<string>('');
  const [editing, setEditing] = useState<boolean>(false);

  useEffect(() => {
    if (editing) return;

    if (qty === null) setRaw('');
    else setRaw(commitQtyValue(String(qty)).display);
  }, [qty, editing]);

  const commit = () => {
    const { value, display } = commitQtyValue(raw);
    setRaw(display);
    setEditing(false);
    store.setQty(value, true);
  };

  return (
    <div className={styles.inputContent}>
      <div className={styles.topWrapper}>
        <span>수량</span>
      </div>
      <div className={styles.centerWrapper}>
        <div className={`${styles.inputWrapper} ${styles.amountInputWrapper}`}>
          <input
            inputMode="decimal"
            maxLength={18}
            value={raw}
            onFocus={() => setEditing(true)}
            onChange={(e) => setRaw(sanitizeQtyRawInput(e.target.value))}
            onBlur={commit}
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
