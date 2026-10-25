import { AuthShell } from '@/components/public-shell';
import { AuthForm } from '@/components/auth-form';
import { supabaseConfig } from '@/lib/supabase/config';
export default function ResetPasswordPage() {
  return (
    <AuthShell>
      <h1>A new password. A fresh start.</h1>
      <p>Use a strong password you haven’t used before.</p>
      <AuthForm mode="reset" configured={!!supabaseConfig()} />
    </AuthShell>
  );
}
