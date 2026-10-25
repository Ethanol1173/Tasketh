import { NextResponse } from 'next/server';
import type { EmailOtpType } from '@supabase/supabase-js';
import { supabaseServer } from '@/lib/supabase/server';
import { supabaseConfig } from '@/lib/supabase/config';

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get('code');
  const hash = url.searchParams.get('token_hash');
  const type = url.searchParams.get('type');
  const requestedNext = url.searchParams.get('next');
  const next = requestedNext === '/reset-password' ? '/reset-password' : '/onboarding';
  if (supabaseConfig()) {
    const db = await supabaseServer();
    const result = code
      ? await db.auth.exchangeCodeForSession(code)
      : hash && ['signup', 'email', 'recovery'].includes(type || '')
        ? await db.auth.verifyOtp({ token_hash: hash, type: type as EmailOtpType })
        : null;
    if (result && !result.error) {
      const response = NextResponse.redirect(new URL(next, url.origin));
      if (next === '/reset-password')
        response.cookies.set('tasketh-recovery', 'verified', {
          httpOnly: true,
          sameSite: 'strict',
          secure: process.env.NODE_ENV === 'production',
          path: '/',
          maxAge: 600,
        });
      return response;
    }
  }
  return NextResponse.redirect(new URL('/login?error=callback', url.origin));
}
