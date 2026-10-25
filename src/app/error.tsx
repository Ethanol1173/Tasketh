'use client';
import { useEffect } from 'react';
import Link from 'next/link';

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    const path = window.location.pathname;
    const route = path.startsWith('/recommendation')
      ? 'recommendation'
      : path.startsWith('/dashboard')
        ? 'dashboard'
        : path.startsWith('/onboarding')
          ? 'onboarding'
          : 'other';
    const cleaned = (error.message || 'No message')
      .replace(/https?:\/\/\S+/gi, '[url]')
      .replace(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi, '[email]')
      .replace(/(?:sb_[a-z]+_|eyJ)[a-zA-Z0-9._-]+/g, '[token]')
      .slice(0, 200);
    // Send only minimal diagnostic metadata, not the stack, cookies or assignment contents.
    void fetch('/api/client-diagnostics', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        route,
        errorName: (error.name || 'Error').replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 60),
        digest: (error.digest || '').replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 90),
        message: cleaned,
      }),
      keepalive: true,
    }).catch(() => {});
  }, [error]);

  return (
    <main id="main" className="prose">
      <h1>Let’s try that again.</h1>
      <p>
        Something interrupted this page while it was loading. Your saved study data remains in
        Tasketh. Try the page again, or return to your dashboard.
      </p>
      <div className="button-row">
        <button className="button" onClick={reset}>
          Try again
        </button>
        <Link href="/dashboard" className="button secondary">
          Back to dashboard
        </Link>
      </div>
    </main>
  );
}
