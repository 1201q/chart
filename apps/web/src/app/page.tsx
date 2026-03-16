import { Suspense } from 'react';
import HomeContent from './HomeContent';
import MainPageSkeleton from '@/components/mainPage/MainPageSkeleton';
import SuspenseMark from '@/components/profiler/SuspenseMark';

export default function HomePage() {
  return (
    <Suspense fallback={<SuspenseMark name="home-content"><MainPageSkeleton /></SuspenseMark>}>
      <HomeContent />
    </Suspense>
  );
}
