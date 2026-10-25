'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  CalendarDays,
  LayoutDashboard,
  ListTodo,
  Palette,
  BookOpen,
  LogOut,
  Sparkles,
  ArrowUpRight,
} from 'lucide-react';
import { Brand } from './brand';
import { signOut } from '@/app/actions/auth';
const links = [
  { href: '/dashboard', label: 'Overview', icon: LayoutDashboard },
  { href: '/assignments', label: 'Assignments', icon: ListTodo },
  { href: '/courses', label: 'Courses', icon: BookOpen },
  { href: '/schedule', label: 'Weekly schedule', icon: CalendarDays },
  { href: '/settings', label: 'Appearance & profile', icon: Palette },
];
export function Navigation({ username, onboarding }: { username: string; onboarding: boolean }) {
  const pathname = usePathname();
  return (
    <aside className="sidebar">
      <div className="sidebar-top">
        <Brand />
        <span className="eyebrow">YOUR STUDY SPACE</span>
        <nav aria-label="Workspace">
          {links.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className={pathname.startsWith(href) ? 'nav-link active' : 'nav-link'}
            >
              <Icon size={18} />
              <span>{label}</span>
            </Link>
          ))}
        </nav>
        {onboarding && (
          <Link className="nav-link active" href="/onboarding">
            <ArrowUpRight size={18} />
            Finish getting started
          </Link>
        )}
      </div>
      <div className="sidebar-bottom">
        <Link href="/recommendation" className="sidebar-note">
          <Sparkles size={20} />
          <strong>A little focus goes a long way.</strong>
          <span>Let’s find your next step.</span>
        </Link>
        <div className="account-row">
          <span className="avatar">{username.slice(0, 2).toUpperCase()}</span>
          <div>
            <strong>{username}</strong>
            <span>Your personal workspace</span>
          </div>
          <form action={signOut}>
            <button className="icon-button" aria-label="Sign out">
              <LogOut size={18} />
            </button>
          </form>
        </div>
      </div>
    </aside>
  );
}
