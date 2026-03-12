import type { Metadata } from 'next';
import localFont from 'next/font/local';
import './globals.css';
import ThemeProvider from '@/components/provider/ThemeProvider';
import { cookies } from 'next/headers';

export const metadata: Metadata = {
  title: '차트레이더스 | 가상자산 모의 투자 플랫폼',
  description: '가상자산 모의 투자 플랫폼, 차트레이더스 클럽에서 투자 실력을 키워보세요.',
};

// const pretendard = localFont({
//   src: '../../public/fonts/PretendardVariable.woff2',
//   display: 'swap',
//   weight: '45 920',
//   variable: '--font-pretendard',
//   preload: false,
// });

const pretendard = localFont({
  src: [
    {
      path: '../../public/fonts/Pretendard-Regular.subset.woff2',
      weight: '400',
      style: 'normal',
    },
    {
      path: '../../public/fonts/Pretendard-Medium.subset.woff2',
      weight: '500',
      style: 'normal',
    },
    {
      path: '../../public/fonts/Pretendard-SemiBold.subset.woff2',
      weight: '600',
      style: 'normal',
    },
    {
      path: '../../public/fonts/Pretendard-Bold.subset.woff2',
      weight: '700',
      style: 'normal',
    },
  ],
  display: 'swap',
  variable: '--font-pretendard',
  preload: false,
});

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const cookieStore = await cookies();
  const theme = (cookieStore.get('theme')?.value as 'light' | 'dark') || 'light';

  return (
    <html lang="ko" className={theme}>
      <body className={`${pretendard.variable}`}>
        <ThemeProvider initialTheme={theme}>{children}</ThemeProvider>
      </body>
      {/* <body>
        <ThemeProvider initialTheme={theme}>{children}</ThemeProvider>
      </body> */}
    </html>
  );
}
