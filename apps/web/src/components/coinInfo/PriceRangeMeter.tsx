'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import styles from './styles/price.range.meter.module.css';

const clamp = (n: number) => Math.min(100, Math.max(0, n));
const BALL = 10; // ball width

const PriceRangeMeter = ({ percent }: { percent: number }) => {
  const p = clamp(percent);

  const trackRef = useRef<HTMLDivElement>(null);
  const [trackWidth, setTrackWidth] = useState(0);

  useEffect(() => {
    const el = trackRef.current;
    if (!el) return;

    const ro = new ResizeObserver((e) => {
      const w = e[0].contentRect.width ?? 0;
      setTrackWidth(w);
    });

    ro.observe(el);

    return () => {
      ro.disconnect();
    };
  }, []);

  const x = useMemo(() => {
    if (!trackWidth) return 0;

    const availableWidth = trackWidth - BALL;
    return (availableWidth * p) / 100;
  }, [trackWidth, p]);

  return (
    <div ref={trackRef} className={styles.track}>
      <span
        className={styles.ball}
        style={{ transform: `translate3d(${x}px, 0,0)` }}
      ></span>
    </div>
  );
};

export default PriceRangeMeter;
