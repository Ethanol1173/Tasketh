import Link from 'next/link';
import { redirect } from 'next/navigation';
import { ArrowUpRight, Plus, CircleCheck, Clock3, ListTodo, TriangleAlert } from 'lucide-react';
import { workspaceData } from '@/lib/data';
import { deadlineInstant } from '@/lib/time';
import { RecommendationComposer } from '@/components/recommendation';
import { AssignmentList } from '@/components/assignments';
export default async function DashboardPage() {
  const { profile, assignments, courses, availability } = await workspaceData();
  if (!profile.onboarding_completed) redirect('/onboarding');
  const now = new Date(),
    active = assignments.filter((a) => a.status !== 'completed');
  const overdue = active.filter(
    (a) => deadlineInstant(a.due_date, a.due_time, profile.timezone) < now,
  ).length;
  const soon = active.filter((a) => {
    const difference =
      deadlineInstant(a.due_date, a.due_time, profile.timezone).getTime() - now.getTime();
    return difference >= 0 && difference <= 7 * 86400000;
  }).length;
  const stats = [
    {
      label: 'Active assignments',
      count: active.length,
      note: 'One step at a time',
      icon: ListTodo,
    },
    { label: 'Due soon', count: soon, note: 'In the next 7 days', icon: Clock3 },
    { label: 'Overdue', count: overdue, note: 'Let’s get back on track', icon: TriangleAlert },
    {
      label: 'Completed',
      count: assignments.length - active.length,
      note: 'Progress worth noticing',
      icon: CircleCheck,
    },
  ];
  return (
    <>
      <header className="page-heading">
        <div>
          <span className="eyebrow">A LITTLE FOCUS. A LITTLE MOMENTUM.</span>
          <h1>Hey {profile.username}, ready to make progress?</h1>
          <p>You don’t need to do everything. Just find your next step.</p>
        </div>
        <Link href="/assignments/new" className="button small">
          <Plus size={16} /> Add assignment
        </Link>
      </header>
      <RecommendationComposer
        aiEnabled={process.env.TASKETH_RECOMMENDATION_MODE === 'gemini'}
        assignments={assignments}
        courses={courses}
        timezone={profile.timezone}
      />
      <div className="stat-grid">
        {stats.map(({ label, count, note, icon: Icon }) => (
          <article key={label} className="stat-card">
            <div>
              <span>{label}</span>
              <Icon size={15} />
            </div>
            <strong>{count}</strong>
            <span>{note}</span>
          </article>
        ))}
      </div>
      <div className="dashboard-grid">
        <section>
          <div className="section-title">
            <h2>On your radar</h2>
            <Link href="/assignments" className="text-link">
              View all <ArrowUpRight size={14} />
            </Link>
          </div>
          <AssignmentList
            assignments={active}
            courses={courses}
            timezone={profile.timezone}
            now={now.toISOString()}
            compact
          />
        </section>
        <section>
          <div className="section-title">
            <h2>Your weekly rhythm</h2>
            <Link href="/schedule" className="text-link">
              Edit <ArrowUpRight size={14} />
            </Link>
          </div>
          <div className="card weekly-mini">
            {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day, i) => (
              <div key={day}>
                <strong>{day}</strong>
                <span>
                  {availability
                    .filter((a) => a.weekday === i)
                    .map((a) => `${a.start_time.slice(0, 5)}–${a.end_time.slice(0, 5)}`)
                    .join(', ') || 'Room to breathe'}
                </span>
              </div>
            ))}
            <p className="helper">{profile.timezone}</p>
          </div>
          <Link href="/settings" className="text-link" style={{ marginTop: 20 }}>
            Make this space yours <ArrowUpRight size={14} />
          </Link>
        </section>
      </div>
    </>
  );
}
