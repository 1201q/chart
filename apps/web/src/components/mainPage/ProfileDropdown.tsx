'use client';

import styles from './styles/profile.dropdown.module.css';
import { Moon, Sun, Settings, LogOut } from 'lucide-react';
import { useTheme } from '@/components/provider/ThemeProvider';
import { AuthUser } from '@/utils/api/auth.api';
import { logout } from '@/utils/auth/logout';
import { useEffect, RefObject } from 'react';
import Link from 'next/link';

interface ProfileDropdownProps {
  user: AuthUser;
  isOpen: boolean;
  onClose: () => void;
  triggerRef: RefObject<HTMLDivElement | null>;
}

const ProfileDropdown = ({ user, isOpen, onClose, triggerRef }: ProfileDropdownProps) => {
  const { theme, toggleTheme } = useTheme();

  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (e: MouseEvent) => {
      if (triggerRef.current && !triggerRef.current.contains(e.target as Node)) {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen, onClose, triggerRef]);

  const handleLogout = async () => {
    onClose();
    await logout();
  };

  const displayName = user.nickname ?? user.email.split('@')[0];

  return (
    <div className={styles.dropdown} data-open={isOpen} role="menu">
      {/* 유저 정보 */}
      <div className={styles.userInfo}>
        <div className={styles.userText}>
          <div className={styles.nickname}>{displayName}</div>
          <div className={styles.email}>{user.email}</div>
        </div>
      </div>
      <div className={styles.menuItems}>
        {/* 테마 전환 */}
        <button className={styles.menuItem} onClick={toggleTheme}>
          {theme === 'dark' ? <Sun size={15} /> : <Moon size={15} />}
          <span>{theme === 'dark' ? '라이트 모드' : '다크 모드'}</span>
        </button>

        {/* 계정 설정 */}
        <Link href="/account/settings" className={styles.menuItem} onClick={onClose}>
          <Settings size={15} />
          <span>계정 설정</span>
        </Link>

        {/* 로그아웃 */}
        <button
          className={`${styles.menuItem} ${styles.logoutItem}`}
          onClick={handleLogout}
        >
          <LogOut size={15} />
          <span>로그아웃</span>
        </button>
      </div>
    </div>
  );
};

export default ProfileDropdown;
