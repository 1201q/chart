import { apiClient, clearAccessToken } from '@/utils/api/client';

/**
 * 로그아웃 처리
 * - 백엔드 /auth/logout 호출하여 AT/RT 쿠키 삭제
 * - localStorage의 deprecated AT도 삭제
 * - 로그인 페이지로 리다이렉트
 */
export const logout = async () => {
  try {
    // Call backend logout endpoint (clears cookies)
    await apiClient('/auth/logout', { method: 'POST' });
  } catch (error) {
    console.error('Logout error:', error);
  } finally {
    // Clear deprecated localStorage token
    clearAccessToken();

    // Redirect to login
    window.location.href = '/login';
  }
};
