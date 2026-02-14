'use client';

import styles from './styles/mobile.menu.module.css';
import Logo from '../../../public/logo.svg';
import { X, Moon, Sun } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect } from 'react';
import { useTheme } from '@/components/provider/ThemeProvider';

interface MobileMenuProps {
  isOpen: boolean;
  onClose: () => void;
}

const MobileMenu = ({ isOpen, onClose }: MobileMenuProps) => {
  const pathname = usePathname();
  const { theme, toggleTheme } = useTheme();

  // body scroll lock
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  // 화면 크기가 768px 이상으로 커지면 메뉴 닫기
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth > 768 && isOpen) {
        onClose();
      }
    };

    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, [isOpen, onClose]);

  const isActive = (path: string) => {
    if (pathname === '/login') return false;
    if (path === '/') return pathname === '/';
    return pathname.startsWith(path);
  };

  return (
    <div className={styles.overlay} data-open={isOpen}>
      {/* 상단바 */}
      <div className={styles.topBar}>
        <div></div>
        <div className={styles.topBarRight}>
          <button
            className={styles.themeButton}
            onClick={toggleTheme}
            aria-label="테마 전환"
          >
            {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
          </button>
          <button className={styles.closeButton} onClick={onClose} aria-label="메뉴 닫기">
            <X size={22} />
          </button>
        </div>
      </div>

      {/* 네비게이션 */}
      <nav className={styles.nav}>
        <Link
          href="/"
          className={styles.navLink}
          data-active={isActive('/')}
          onClick={onClose}
        >
          홈
        </Link>
        <Link
          href="/market"
          className={styles.navLink}
          data-active={isActive('/market')}
          onClick={onClose}
        >
          마켓
        </Link>
        <Link
          href="/account"
          className={styles.navLink}
          data-active={isActive('/account')}
          onClick={onClose}
        >
          내 지갑
        </Link>
      </nav>
    </div>
  );
};

export default MobileMenu;
