import ListProfiler from './Profiler';
import SideCoinList from '@/components/coinList/SideCoinList';

export default async function Page({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        maxWidth: '500px',
        minHeight: '600px',
      }}
    >
      <ListProfiler label="list-prev" durationMs={10_000} autoStart={false}>
        <SideCoinList />
      </ListProfiler>
    </div>
  );
}
