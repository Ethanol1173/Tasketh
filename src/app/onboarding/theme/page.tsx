import Link from 'next/link';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { PublicShell } from '@/components/public-shell';
import { ThemePicker } from '@/components/theme-provider';
export default function ThemePage() {
  return (
    <PublicShell>
      <section className="theme-page">
        <span className="eyebrow">FIRST, MAKE YOURSELF AT HOME</span>
        <h1>Choose Your Vibe</h1>
        <p>Make Tasketh feel like yours.</p>
        <ThemePicker />
        <div className="button-row">
          <Link href="/" className="text-link">
            <ArrowLeft size={16} /> Back
          </Link>
          <Link href="/signup" className="button">
            This feels like me <ArrowRight size={16} />
          </Link>
        </div>
        <p className="helper" style={{ marginTop: 20 }}>
          Preview freely. Your selection will be saved to your profile when you sign up.
        </p>
      </section>
    </PublicShell>
  );
}
