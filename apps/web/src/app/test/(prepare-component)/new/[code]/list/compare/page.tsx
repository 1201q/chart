'use client';

import ListProfiler from '../Profiler';
import dynamic from 'next/dynamic';

const NewSideCoinList = dynamic(() => import('@/components/coinList/NewSideCoinList'), {
  ssr: false,
});

export default function Page() {
  return (
    <div style={{ display: 'flex', columnGap: '20px' }}>
      <div
        style={{
          width: '100%',
          height: '100%',
          maxWidth: '400px',
          minHeight: '600px',
          position: 'relative',
        }}
      >
        <ListProfiler
          label="list-new"
          durationMs={5000}
          autoStart={false}
          autoScroll={false}
        >
          <NewSideCoinList />
        </ListProfiler>
      </div>
    </div>
  );
}
