import Link from 'next/link';
import { AuthShell } from '@/components/public-shell';
import { AuthForm } from '@/components/auth-form';
import { supabaseConfig } from '@/lib/supabase/config';
export default function ForgotPasswordPage() {
  return (
    <AuthShell>
      <h1>Let’s get you back in.</h1>
      <p>We’ll email you a link to reset your password.</p>
      <AuthForm mode="forgot" configured={!!supabaseConfig()} />
      <p className="auth-bottom">
        <Link href="/login">Back to log in</Link>
      </p>
    </AuthShell>
  );
}
