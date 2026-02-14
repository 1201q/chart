import styles from './styles/header.module.css';

import Logo from '../../../public/logo.svg';
import { TextAlignJustify } from 'lucide-react';
import Link from 'next/link';

const Header = () => {
  return (
    <div className={styles.container}>
      <div className={styles.leftWrapper}>
        <div className={styles.logo}>
          <Logo />
        </div>
        <nav className={styles.menus}>
          <Link href={'/'} className={styles.menu} data-active="true">
            <span>홈</span>
          </Link>
          <Link href={'/'} className={styles.menu}>
            <span>마켓</span>
          </Link>
          <Link href={'/'} className={styles.menu}>
            <span>내 지갑</span>
          </Link>
        </nav>
      </div>
      <div className={styles.rightWrapper}>
        <div className={styles.buttons}>
          <button className={styles.loginButton}>로그인</button>
          <button className={styles.menuButton}>
            <TextAlignJustify size={20} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default Header;
