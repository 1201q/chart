'use client';

import { useState } from 'react';
import styles from './styles/asset.portfolio.module.css';
import { ChevronDown } from 'lucide-react';

import dynamic from 'next/dynamic';

const AssetDonut = dynamic(() => import('./AssetDonut').then((mod) => mod.AssetDonut), {
  ssr: false,
});

type ChartData = {
  key: string; // 'BTC'
  label: string; // '한국어 네임'
  value: number; // 원화 평가액
  color: string;
};

const AssetPortfolio = ({ data }: { data: ChartData[] }) => {
  const [expanded, setExpanded] = useState(false);
  return (
    <div className={styles.wrapper} data-expanded={expanded}>
      <button
        type="button"
        className={styles.headerWrapper}
        aria-expanded={expanded}
        onClick={() => setExpanded((p) => !p)}
      >
        <h3>가상자산 포트폴리오</h3>
        <span>
          <ChevronDown size={18} />
        </span>
      </button>

      <div className={styles.collapse}>
        <div className={styles.collapseInner}>
          <AssetDonut data={data} />
        </div>
      </div>
    </div>
  );
};

export default AssetPortfolio;
