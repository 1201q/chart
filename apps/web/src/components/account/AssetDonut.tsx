'use client';

import { memo, useMemo, useState } from 'react';
import { Group } from '@visx/group';
import { Pie } from '@visx/shape';
import styles from './styles/donut.chart.module.css';

export type ChartData = {
  key: string; // 'BTC'
  label: string; // 한국어 네임
  value: number; // 원화 평가액
  color: string; //
};

function formatPct(p: number) {
  return `${(p * 100).toFixed(1)}%`;
}

function buildTopN(data: ChartData[], topN: number) {
  const sorted = [...data]
    .filter((d) => Number.isFinite(d.value) && d.value > 0)
    .sort((a, b) => b.value - a.value);

  const top = sorted.slice(0, topN);
  const rest = sorted.slice(topN);
  const restValue = rest.reduce((s, d) => s + d.value, 0);

  return restValue > 0
    ? [...top, { key: 'others', label: 'OTHERS', value: restValue, color: 'var(--grey300)' }]
    : top;
}

export const AssetDonut = memo(function AssetDonut({
  data,
  donutSize = 200, // 도넛 영역 크기
  thickness = 35, // 도넛 두께
  topN = 7,
}: {
  data: ChartData[];

  donutSize?: number;
  thickness?: number;
  topN?: number;
}) {
  const [activeKey, setActiveKey] = useState<string | null>(null);

  const slices = useMemo(() => buildTopN(data, topN), [data, topN]);
  const total = useMemo(() => slices.reduce((s, d) => s + d.value, 0), [slices]);

  const normalized = useMemo(() => {
    if (total <= 0) return [];
    return slices.map((d) => ({ ...d, p: d.value / total }));
  }, [slices, total]);

  const rOuter = donutSize / 2;
  const rInner = Math.max(0, rOuter - thickness);

  if (total <= 0) {
    return <section>없음</section>;
  }

  return (
    <div className={styles.donutChart}>
      {/* Donut */}
      <div
        className={styles.chartWrapper}
        style={{ width: donutSize, height: donutSize }}
      >
        <svg width={donutSize} height={donutSize} style={{ overflow: 'visible' }}>
          <Group top={rOuter} left={rOuter}>
            <Pie
              data={normalized}
              pieValue={(d) => d.value}
              outerRadius={rOuter}
              innerRadius={rInner}
              padAngle={0.01}
            >
              {(pie) => (
                <Group>
                  <Group>
                    {pie.arcs.map((arc) => {
                      const d = arc.data;
                      const isActive = activeKey ? activeKey === d.key : false;

                      return (
                        <path
                          key={d.key}
                          d={pie.path(arc) || undefined}
                          fill={d.color}
                          style={{
                            cursor: 'pointer',
                            transition: 'opacity 120ms ease, transform 120ms ease',
                            opacity: activeKey && !isActive ? 0.35 : 1,
                            transformOrigin: '0px 0px',
                            transform: isActive ? 'scale(1.01)' : 'scale(1)',
                          }}
                          onMouseEnter={() => setActiveKey(d.key)}
                          onMouseLeave={() => setActiveKey(null)}
                        />
                      );
                    })}
                  </Group>

                  {/* 가운데 라벨 */}
                  <Group>
                    <text
                      textAnchor="middle"
                      dominantBaseline="middle"
                      style={{
                        fontWeight: 600,
                        fontSize: 17,
                        fill: 'var(--grey800)',
                      }}
                    >
                      보유 비중
                    </text>
                    <text
                      y={19}
                      textAnchor="middle"
                      dominantBaseline="middle"
                      style={{ fontWeight: 600, fontSize: 13, fill: 'var(--grey500)' }}
                    >
                      (%)
                    </text>
                  </Group>
                </Group>
              )}
            </Pie>
          </Group>
        </svg>
      </div>

      {/* Legend */}
      <ul className={styles.legend}>
        {normalized.map((d) => {
          const isActive = activeKey === d.key;
          return (
            <li
              key={d.key}
              style={{
                opacity: activeKey && !isActive ? 0.5 : 1,
              }}
              onMouseEnter={() => setActiveKey(d.key)}
              onMouseLeave={() => setActiveKey(null)}
            >
              <span
                className={styles.colorBox}
                style={{
                  background: d.color,
                }}
              />
              <span className={styles.labelText}>{`${d.label}`}</span>
              <span className={styles.pctText}>{formatPct(d.p)}</span>
            </li>
          );
        })}
      </ul>
    </div>
  );
});
