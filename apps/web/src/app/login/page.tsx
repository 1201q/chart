import { Suspense } from 'react';
import LoginHeader from '@/components/login/LoginHeader';
import LoginPageClient from '@/components/login/LoginPageClient';

const LoginPage = () => {
  return (
    <div
      style={{
        height: '100dvh',
        display: 'flex',
        background: 'var(--grey0)',
        flexDirection: 'column',
      }}
    >
      <LoginHeader />
      <Suspense fallback={<div>Loading...</div>}>
        <LoginPageClient />
      </Suspense>
    </div>
  );
};

export default LoginPage;
