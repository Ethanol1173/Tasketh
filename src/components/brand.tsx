import Link from 'next/link';
export function Brand({ compact = false }: { compact?: boolean }) {
  return (
    <Link href="/" className="brand" aria-label="Tasketh home">
      <svg width="34" height="34" viewBox="0 0 36 36" fill="none" aria-hidden="true">
        <rect x="1" y="1" width="34" height="34" rx="10" fill="currentColor" />
        <path d="M9 11h18v4H20v11h-4V15H9z" fill="var(--bg)" />
        <path
          d="m22 23 2.5 2.5L29 20"
          stroke="var(--bg)"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      {!compact && (
        <span>
          tasketh<span className="brand-dot">.</span>
        </span>
      )}
    </Link>
  );
}
