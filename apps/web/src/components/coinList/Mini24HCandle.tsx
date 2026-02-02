import React, { useMemo } from 'react';

interface Mini24HCandleProps {
  open: number;
  high: number;
  low: number;
  close: number;
  width?: number;
  height?: number;
}

const Mini24HCandle = ({
  open,
  high,
  low,
  close,
  width = 12,
  height = 32,
}: Mini24HCandleProps) => {
  const view = useMemo(() => {
    if (
      !Number.isFinite(open) ||
      !Number.isFinite(high) ||
      !Number.isFinite(low) ||
      !Number.isFinite(close)
    ) {
      return null;
    }

    const color =
      close >= open
        ? 'var(--red600)'
        : close < open
          ? 'var(--blue600)'
          : `var(--grey500)`;

    const pad = 2;
    const h = height - pad * 2;
    const range = Math.max(1e-9, high - low);

    const y = (price: number) => {
      return pad + (1 - (price - low) / range) * h;
    };

    const yHigh = y(high);
    const yLow = y(low);
    const yOpen = y(open);
    const yClose = y(close);

    const bodyTop = Math.min(yOpen, yClose);
    const bodyBottom = Math.max(yOpen, yClose);

    // bodyMinHeight가 2
    const bodyH = Math.max(2, bodyBottom - bodyTop);

    const cx = width / 2;
    const bodyW = Math.max(4, width * 0.45);
    const x = cx - bodyW / 2;

    return {
      color,
      cx,
      x,
      yHigh,
      yLow,
      bodyTop,
      bodyH,
      bodyW,
    };
  }, [open, high, low, close, width, height]);

  if (!view) return null;

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
      {/* wick */}
      <line
        x1={view.cx}
        x2={view.cx}
        y1={view.yHigh}
        y2={view.yLow}
        stroke={view.color}
        strokeWidth={1}
        strokeLinecap="square"
        opacity={0.9}
      />
      {/* body */}
      <rect
        x={view.x}
        y={view.bodyTop}
        width={view.bodyW}
        height={view.bodyH}
        fill={view.color}
        rx={1}
      />
    </svg>
  );
};

export default Mini24HCandle;
