import { Suspense } from 'react';
import Header from '@/components/login/Header';
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
      <Header />
      <Suspense fallback={<div>Loading...</div>}>
        <LoginPageClient />
      </Suspense>
    </div>
  );
};

export default LoginPage;
