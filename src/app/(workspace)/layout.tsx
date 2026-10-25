import Link from 'next/link';
import { Sparkles } from 'lucide-react';
import { Navigation } from '@/components/navigation';
import { viewer } from '@/lib/data';
export default async function WorkspaceLayout({ children }: { children: React.ReactNode }) {
  const { profile } = await viewer();
  return (
    <div className="workspace">
      <Navigation username={profile.username} onboarding={!profile.onboarding_completed} />
      <main id="main" className="workspace-main">
        <header className="workspace-topline">
          <span>YOUR SPACE. YOUR PACE.</span>
          <Link href="/recommendation" className="text-link">
            <Sparkles size={13} /> Find my focus
          </Link>
        </header>
        {children}
      </main>
    </div>
  );
}
