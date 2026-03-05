import LoadingSpinner from '@/components/LoadingSpinner';

export default function InitializeLoading() {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100dvh',
      }}
    >
      <LoadingSpinner size={48} />
    </div>
  );
}
