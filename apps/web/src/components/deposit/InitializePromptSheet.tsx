'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import styles from './styles/initialize.prompt.sheet.module.css';

const InitializePromptSheet = () => {
  const [isOpen, setIsOpen] = useState(true);
  const router = useRouter();

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      document.documentElement.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
      document.documentElement.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
      document.documentElement.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className={styles.overlay}>
      <div className={styles.sheet}>
        <div className={styles.inner}>
          <div className={styles.texts}>
            <p className={styles.title}>모의 거래 초기 설정</p>
            <p className={styles.desc}>
              모의 거래를 시작하려면 먼저 지갑을 생성해야 합니다.{'\n'}
              잠깐이면 됩니다.
            </p>
          </div>
          <div className={styles.buttons}>
            <button
              className={styles.primaryButton}
              onClick={() => router.push('/initialize')}
            >
              시작하기
            </button>
            <button className={styles.closeButton} onClick={() => setIsOpen(false)}>
              닫기
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InitializePromptSheet;
