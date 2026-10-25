import type { Metadata } from 'next';
import { cookies } from 'next/headers';
import { GeistSans } from 'geist/font/sans';
import { ThemeProvider } from '@/components/theme-provider';
import { validTheme } from '@/lib/themes';
import { supabaseConfig } from '@/lib/supabase/config';
import { supabaseServer } from '@/lib/supabase/server';
import './globals.css';
export const metadata: Metadata = {
  title: { default: 'Tasketh — Less planning. More doing.', template: '%s · Tasketh' },
  description:
    'Your smart study decision assistant. Turn a little free time into meaningful progress.',
  icons: { icon: '/icon.svg' },
};
export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  let theme = validTheme((await cookies()).get('tasketh-theme')?.value);
  if (supabaseConfig()) {
    const db = await supabaseServer();
    const {
      data: { user },
    } = await db.auth.getUser();
    if (user) {
      const { data } = await db
        .from('profiles')
        .select('selected_theme')
        .eq('id', user.id)
        .single();
      if (data) theme = validTheme(data.selected_theme);
    }
  }
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
