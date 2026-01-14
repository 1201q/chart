import NewTickerList from '@/components/coinList/NewTickerList';
import ListProfiler from './Profiler';

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
      <ListProfiler label="list-new" durationMs={10_000} autoStart={false}>
        <NewTickerList />
      </ListProfiler>
    </div>
  );
}
