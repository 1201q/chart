'use client';

import ListProfiler from './Profiler';
import dynamic from 'next/dynamic';

const NewSideCoinList = dynamic(() => import('@/components/coinList/NewSideCoinList'), {
  ssr: false,
});

export default function Page() {
  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        maxWidth: '500px',
        minHeight: '600px',
      }}
    >
      <ListProfiler label="list-new" durationMs={10_000} autoStart={false}>
        <NewSideCoinList />
      </ListProfiler>
    </div>
  );
}
