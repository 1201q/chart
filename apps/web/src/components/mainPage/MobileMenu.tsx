'use client';

import styles from './styles/mobile.menu.module.css';
import { X, Moon, Sun, LogOut, Settings } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect } from 'react';
import { useTheme } from '@/components/provider/ThemeProvider';
import { AuthUser } from '@/utils/api/auth.api';
import { logout } from '@/utils/auth/logout';

interface MobileMenuProps {
  isOpen: boolean;
  onClose: () => void;
  user: AuthUser | null;
}

const MobileMenu = ({ isOpen, onClose, user }: MobileMenuProps) => {
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

  const handleLogout = async () => {
    onClose();
    await logout();
  };

  const displayName = user ? (user.nickname ?? user.email.split('@')[0]) : null;

  return (
    <div className={styles.overlay} data-open={isOpen}>
      {/* 상단바 — 테마 버튼 항상 노출 */}
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

      {/* 로그인 상태: 유저 프로필 섹션 */}
      {user && displayName && (
        <div className={styles.userSection}>
          <div className={styles.userInfo}>
            <div className={styles.avatar}>
              {user.profileImageUrl ? (
                // 크기를 몰라 일단 img 태그로 처리
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={user.profileImageUrl}
                  alt="프로필"
                  className={styles.avatarImage}
                />
              ) : (
                <div className={styles.avatarInitial}>{displayName[0].toUpperCase()}</div>
              )}
            </div>
            <div className={styles.userText}>
              <div className={styles.nickname}>{displayName}</div>
              <div className={styles.email}>{user.email}</div>
            </div>
          </div>

          {/* <div className={styles.sectionDivider} /> */}

          {/* 계정 설정 */}
          <Link href="/account/settings" className={styles.userAction} onClick={onClose}>
            <Settings size={18} />
            <span>계정 설정</span>
          </Link>

          {/* 로그아웃 */}
          <button
            className={`${styles.userAction} ${styles.logoutAction}`}
            onClick={handleLogout}
          >
            <LogOut size={18} />
            <span>로그아웃</span>
          </button>

          <div className={styles.sectionDivider} />
        </div>
      )}

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
