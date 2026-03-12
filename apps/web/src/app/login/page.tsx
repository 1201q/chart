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

      <LoginPageClient />
    </div>
  );
};

export default LoginPage;
