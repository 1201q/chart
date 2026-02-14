'use client';

import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import LoadingSpinner from '@/components/LoadingSpinner';
import styles from './callback.module.css';

const AuthCallbackPage = () => {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        // Check for error from backend
        const error = searchParams.get('error');
        if (error) {
          console.error('Auth callback error:', error);
          router.push(`/login?error=${error}`);
          return;
        }

        // Cookies are already set by backend (AT & RT)
        // Just redirect to home or return URL
        const returnUrl = searchParams.get('returnUrl') || '/';

        // Short delay for better UX
        setTimeout(() => {
          router.push(returnUrl);
        }, 500);
      } catch (error) {
        console.error('Auth callback error:', error);
        router.push('/login?error=auth_failed');
      }
    };

    handleAuthCallback();
  }, [router, searchParams]);

  return (
    <div className={styles.container}>
      <LoadingSpinner size={40} stroke={6} />
    </div>
  );
};

export default AuthCallbackPage;
