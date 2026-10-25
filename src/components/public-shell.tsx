import Link from 'next/link';
import { Brand } from './brand';
export function PublicShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="public-shell">
      <header className="public-header">
        <Brand />
        <Link href="/login" className="text-link">
          Already have an account? Log in
        </Link>
      </header>
      <main id="main">{children}</main>
    </div>
  );
}
export function AuthShell({ children }: { children: React.ReactNode }) {
  return (
    <PublicShell>
      <div className="auth-wrap">
        <div className="auth-aside">
          <span className="pill">A LITTLE LESS OVERWHELM</span>
          <h1>
            Your time.
            <br />
            <span>Your next move.</span>
          </h1>
          <p>Make space for what matters. We’ll help you figure out where to start.</p>
          <span className="eyebrow">LESS PLANNING. MORE DOING.</span>
        </div>
        <section className="auth-card">{children}</section>
      </div>
    </PublicShell>
  );
}
