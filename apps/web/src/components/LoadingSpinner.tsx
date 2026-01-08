/* eslint-disable @typescript-eslint/no-explicit-any */
import styles from './styles/loading.spinner.module.css';
import React from 'react';

interface Props {
  size?: number;
  stroke?: number;
  className?: string;
}

const LoadingSpinner = ({ className, stroke = 7, size = 30 }: Props) => {
  const style = {
    ['--sp-size' as any]: `${size}px`,
    ['--sp-stroke' as any]: `${stroke}px`,
  } as React.CSSProperties;

  return (
    <span style={style} className={className}>
      <svg className={styles.sp} viewBox="0 0 66 66" aria-hidden="true">
        {/* track */}
        <circle
          className={styles.track}
          fill="none"
          strokeWidth={stroke}
          cx="33"
          cy="33"
          r="30"
        />
        {/* head */}
        <circle
          className={styles.head}
          fill="none"
          strokeWidth={stroke}
          cx="33"
          cy="33"
          r="30"
        />
      </svg>
    </span>
  );
};

export default LoadingSpinner;
