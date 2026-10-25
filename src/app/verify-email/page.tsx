import Link from 'next/link';
import { MailCheck } from 'lucide-react';
import { AuthShell } from '@/components/public-shell';
export default function VerifyEmailPage() {
  return (
    <AuthShell>
      <MailCheck size={35} className="muted" />
      <h1 style={{ marginTop: 20 }}>Check your inbox.</h1>
      <p>
        Open the confirmation link from Tasketh to verify your email. Your username and theme are
        reserved with your account. After verifying, sign in to continue.
      </p>
      <Link href="/login" className="button">
        Continue to log in
      </Link>
      <p className="auth-bottom">No email? Check spam, or try signing up again after a minute.</p>
    </AuthShell>
  );
}
