import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '차트레이더스 | 로그인',
  description: '지금 로그인하고, 가상자산 모의 투자 거래를 경험해보세요.',
};

export default function LoginLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
