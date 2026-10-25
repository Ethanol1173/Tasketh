import Link from 'next/link';
import { AuthShell } from '@/components/public-shell';
import { AuthForm } from '@/components/auth-form';
import { supabaseConfig } from '@/lib/supabase/config';
export default function SignupPage() {
  return (
    <AuthShell>
      <h1>A fresh start, your way.</h1>
      <p>Create your space. Your selected theme comes with you.</p>
      <AuthForm mode="signup" configured={!!supabaseConfig()} />
      <p className="auth-bottom">
        Already here? <Link href="/login">Log in</Link> ·{' '}
        <Link href="/onboarding/theme">Change your vibe</Link>
      </p>
    </AuthShell>
  );
}
