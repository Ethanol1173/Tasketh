'use client';
import Link from 'next/link';

export default function ErrorPage({ reset }: { reset: () => void }) {
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
