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
      <LoginPageClient />
    </div>
  );
};

export default LoginPage;
