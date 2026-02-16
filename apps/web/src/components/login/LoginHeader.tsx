'use client';

import styles from './styles/login.header.module.css';
import Logo from '../../../public/logo.svg';
import Link from 'next/link';

const LoginHeader = () => {
  return (
    <div className={styles.container}>
      <Link href={'/'} className={styles.logo}>
        <Logo />
      </Link>
    </div>
  );
};

export default LoginHeader;
