import Link from 'next/link';
export default function NotFound() {
  return (
    <main id="main" className="prose">
      <h1>This page wandered off.</h1>
      <p>The page or assignment doesn’t exist, or it isn’t in your workspace.</p>
      <Link className="button" href="/dashboard">
        Back to my space
      </Link>
    </main>
  );
}
