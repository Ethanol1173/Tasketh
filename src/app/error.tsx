'use client';
export default function ErrorPage({ reset }: { reset: () => void }) {
  return (
    <main id="main" className="prose">
      <h1>Let’s try that again.</h1>
      <p>
        Your workspace couldn’t be loaded. Check the connection and Supabase configuration, then
        retry. No success was recorded for the failed operation.
      </p>
      <button className="button" onClick={reset}>
        Try again
      </button>
    </main>
  );
}
