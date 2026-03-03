import { Suspense } from 'react';
import HomeContent from './HomeContent';
import MainPageSkeleton from '@/components/mainPage/MainPageSkeleton';

export default function HomePage() {
  return (
    <Suspense fallback={<MainPageSkeleton />}>
      <HomeContent />
    </Suspense>
  );
}
