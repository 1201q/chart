import { Suspense } from 'react';
import LoadingSpinner from '@/components/LoadingSpinner';
import InitializeLayoutContent from './_content';

function InitializeLoadingFallback() {
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

export default function InitializeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Suspense fallback={<InitializeLoadingFallback />}>
      <InitializeLayoutContent>{children}</InitializeLayoutContent>
    </Suspense>
  );
}
