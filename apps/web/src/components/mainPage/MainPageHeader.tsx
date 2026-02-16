'use client';

import styles from './styles/mainpage.header.module.css';

import Logo from '../../../public/logo.svg';
import { TextAlignJustify, Moon, Sun } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTheme } from '@/components/provider/ThemeProvider';
import { useState } from 'react';
import MobileMenu from './MobileMenu';

const MainPageHeader = () => {
  const pathname = usePathname();
  const { theme, toggleTheme } = useTheme();
  const [menuOpen, setMenuOpen] = useState(false);

  const isActive = (path: string) => {
    // /login 페이지에서는 어떤 탭도 active 안 됨
    if (pathname === '/login') return false;

    // 정확히 같은 경로이거나, /market이나 /account의 하위 경로인 경우 active
    if (path === '/') {
      return pathname === '/';
    }
    return pathname.startsWith(path);
  };

  return (
    <div className={styles.container}>
      <div className={styles.leftWrapper}>
        <Link href={'/'} className={styles.logo}>
          <Logo />
        </Link>
        <nav className={styles.menus}>
          <Link href={'/'} className={styles.menu} data-active={isActive('/')}>
            <span>홈</span>
          </Link>
          <Link
            href={'/market'}
            className={styles.menu}
            data-active={isActive('/market')}
          >
            <span>마켓</span>
          </Link>
          <Link
            href={'/account'}
            className={styles.menu}
            data-active={isActive('/account')}
          >
            <span>내 지갑</span>
          </Link>
        </nav>
      </div>
      <div className={styles.rightWrapper}>
        <div className={styles.buttons}>
          <button
            className={styles.themeButton}
            onClick={toggleTheme}
            aria-label="테마 전환"
          >
            {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
          </button>
          <button className={styles.loginButton}>로그인</button>
          <button className={styles.menuButton} onClick={() => setMenuOpen(true)}>
            <TextAlignJustify size={20} />
          </button>
        </div>
      </div>
      <MobileMenu isOpen={menuOpen} onClose={() => setMenuOpen(false)} />
    </div>
  );
};

export default MainPageHeader;
