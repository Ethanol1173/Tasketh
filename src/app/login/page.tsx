import Link from 'next/link';
import { redirect } from 'next/navigation';
import { AuthShell } from '@/components/public-shell';
import { AuthForm } from '@/components/auth-form';
import { supabaseConfig } from '@/lib/supabase/config';
import { supabaseServer } from '@/lib/supabase/server';
export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  if (supabaseConfig()) {
    const db = await supabaseServer();
    const {
      data: { user },
    } = await db.auth.getUser();
    if (user) {
      const { data } = await db
        .from('profiles')
        .select('onboarding_completed')
        .eq('id', user.id)
        .single();
      redirect(data?.onboarding_completed ? '/dashboard' : '/onboarding');
    }
  }
  const params = await searchParams;
  return (
    <AuthShell>
      <h1>Good to have you back.</h1>
      <p>Pick up where you left off.</p>
      {params.error && (
        <p role="alert" className="notice error">
          That verification link is invalid or has expired. Sign in or request a new reset link.
        </p>
      )}
      {params.password && (
        <p role="status" className="notice success">
          Password updated. Sign in with your new password.
        </p>
      )}
      <AuthForm mode="login" configured={!!supabaseConfig()} />
      <p className="auth-bottom">
        New around here? <Link href="/onboarding/theme">Get started</Link>
      </p>
    </AuthShell>
  );
}
