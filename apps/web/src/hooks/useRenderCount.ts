'use client';

import { useRef } from 'react';

export const useRenderCount = (label: string) => {
  const ref = useRef(0);
  // eslint-disable-next-line react-hooks/refs
  ref.current += 1;

  // eslint-disable-next-line react-hooks/refs
  console.log(`[render] ${label}:`, ref.current);
};
