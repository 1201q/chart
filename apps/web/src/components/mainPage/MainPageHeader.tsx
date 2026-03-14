'use client';

import styles from './styles/mainpage.header.module.css';

import Logo from '../../../public/logo.svg';
import { TextAlignJustify, Moon, Sun } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, useRef } from 'react';
import MobileMenu from './MobileMenu';
import ProfileDropdown from './ProfileDropdown';
import { AuthUser } from '@/utils/api/auth.api';
import { useTheme } from '@/components/provider/ThemeProvider';

interface MainPageHeaderProps {
  user: AuthUser | null;
}

const MainPageHeader = ({ user }: MainPageHeaderProps) => {
  const pathname = usePathname();
  const { theme, toggleTheme } = useTheme();
  const [menuOpen, setMenuOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);

  const isActive = (path: string) => {
    if (pathname === '/login') return false;
    if (path === '/') return pathname === '/';
    return pathname.startsWith(path);
  };

  const isLoggedIn = user !== null;

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
            href={'/market/KRW-BTC'}
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
          {/* 비로그인: 테마 버튼 (데스크탑 전용) + 로그인 버튼 */}
          {!isLoggedIn && (
            <>
              <button
                className={styles.themeButton}
                onClick={toggleTheme}
                aria-label="테마 전환"
              >
                {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
              </button>
              <Link href="/login" className={styles.loginButton}>
                로그인
              </Link>
            </>
          )}

          {/* 로그인: 프로필 버튼 (데스크탑 전용) */}
          {isLoggedIn && (
            <div className={styles.profileWrapper} ref={profileRef}>
              <button
                className={styles.profileButton}
                onClick={() => setDropdownOpen((prev) => !prev)}
                aria-label="프로필 메뉴"
              >
                {user.profileImageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={user.profileImageUrl}
                    alt="프로필"
                    className={styles.profileImage}
                  />
                ) : (
                  <div className={styles.profileInitial}>
                    {(user.nickname ?? user.email)[0].toUpperCase()}
                  </div>
                )}
              </button>
              <ProfileDropdown
                user={user}
                isOpen={dropdownOpen}
                onClose={() => setDropdownOpen(false)}
                triggerRef={profileRef}
              />
            </div>
          )}

          {/* 모바일 햄버거 (모바일 전용) */}
          <button className={styles.menuButton} onClick={() => setMenuOpen(true)}>
            <TextAlignJustify size={20} />
          </button>
        </div>
      </div>
      <MobileMenu isOpen={menuOpen} onClose={() => setMenuOpen(false)} user={user} />
    </div>
  );
};

export default MainPageHeader;
