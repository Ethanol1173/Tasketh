import type { Metadata } from 'next';
import { cookies } from 'next/headers';
import { GeistSans } from 'geist/font/sans';
import { ThemeProvider } from '@/components/theme-provider';
import { validTheme } from '@/lib/themes';
import './globals.css';
export const metadata: Metadata = {
  title: { default: 'Tasketh — Less planning. More doing.', template: '%s · Tasketh' },
  description:
    'Your smart study decision assistant. Turn a little free time into meaningful progress.',
  icons: { icon: '/icon.svg' },
};
export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const theme = validTheme((await cookies()).get('tasketh-theme')?.value);
  return (
    <html lang="en" data-theme={theme} className={GeistSans.variable}>
      <body>
        <a href="#main" className="skip-link">
          Skip to content
        </a>
        <ThemeProvider key={theme} initialTheme={theme}>
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
