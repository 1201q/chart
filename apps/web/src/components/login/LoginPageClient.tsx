'use client';

import { useSearchParams } from 'next/navigation';
import styles from './styles/login.page.module.css';

import GoogleLogo from '../../../public/google.svg';
import NaverLogo from '../../../public/naver.svg';
import Link from 'next/link';

const API_URL = process.env.NEXT_PUBLIC_API_URL?.replace('/mock', '');

const LoginPageClient = () => {
  const searchParams = useSearchParams();
  const returnUrl = searchParams.get('returnUrl') || '/';

  // 서버/클라이언트 모두에서 동일한 base64 인코딩 사용
  const state =
    typeof window !== 'undefined'
      ? btoa(returnUrl)
      : Buffer.from(returnUrl).toString('base64');

  return (
    <div className={styles.container}>
      <h2 className={styles.title}>로그인</h2>

      <span className={styles.desc}>
        지금 로그인하고, 실시간 모의 거래를 경험해보세요.
      </span>

      <div className={styles.buttonWrapper}>
        <Link
          href={`${API_URL}/auth/google?state=${state}`}
          className={styles.loginButton}
        >
          <span className={styles.loginButtonIcon}>
            <GoogleLogo />
          </span>
          <span>Google 계정으로 시작</span>
        </Link>
        <Link
          href={`${API_URL}/auth/naver?state=${state}`}
          className={styles.loginButton}
        >
          <span className={styles.loginButtonIcon}>
            <NaverLogo />
          </span>
          <span>Naver 계정으로 시작</span>
        </Link>

        <div className={styles.divider}>
          <span className={styles.dividerLine}></span>
          <span className={styles.dividerText}>or continue with</span>
          <span className={styles.dividerLine}></span>
        </div>

        <button className={styles.guestButton}>게스트로 시작</button>
      </div>

      <footer className={styles.footer}>
        <p className={styles.footerText}>
          This site is protected by Google reCAPTCHA to ensure you&apos;re not a bot.{' '}
          <a href="#" className={styles.footerLink}>
            Learn more
          </a>
        </p>
      </footer>
    </div>
  );
};

export default LoginPageClient;
