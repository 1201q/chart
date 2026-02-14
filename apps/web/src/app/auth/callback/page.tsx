'use client';

import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import LoadingSpinner from '@/components/LoadingSpinner';
import { setAccessToken } from '@/utils/api/client';
import styles from './callback.module.css';

const AuthCallbackPage = () => {
  // const router = useRouter();
  // const searchParams = useSearchParams();

  // useEffect(() => {
  //   const handleAuthCallback = async () => {
  //     try {
  //       // URL에서 access token 추출
  //       const accessToken = searchParams.get('at');

  //       if (!accessToken) {
  //         console.error('No access token found in URL');
  //         router.push('/login?error=no_token');
  //         return;
  //       }

  //       // Access token을 localStorage에 저장
  //       setAccessToken(accessToken);

  //       // Refresh token은 이미 httpOnly cookie로 설정되어 있음 (백엔드에서 처리)

  //       // 짧은 딜레이 후 홈으로 리다이렉트
  //       setTimeout(() => {
  //         router.push('/');
  //       }, 500);
  //     } catch (error) {
  //       console.error('Auth callback error:', error);
  //       router.push('/login?error=auth_failed');
  //     }
  //   };

  //   handleAuthCallback();
  // }, [router, searchParams]);

  return (
    <div className={styles.container}>
      <LoadingSpinner size={40} stroke={6} />
    </div>
  );
};

export default AuthCallbackPage;
