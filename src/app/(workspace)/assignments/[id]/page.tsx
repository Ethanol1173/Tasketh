import Link from 'next/link';
import { notFound } from 'next/navigation';
import { viewer } from '@/lib/data';
import { displayDeadline } from '@/lib/time';
import { labels, statuses } from '@/lib/schemas';
import { z } from 'zod';
import { ActionForm, DeleteForm } from '@/components/ui';
import { setAssignmentStatus, deleteAssignment } from '@/app/actions/workspace';
export default async function AssignmentPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const { id } = await params;
  if (!z.uuid().safeParse(id).success) notFound();
  const { db, user, profile } = await viewer();
  const { data: assignment, error } = await db
    .from('assignments')
    .select('*')
    .eq('id', id)
    .eq('user_id', user.id)
    .maybeSingle();
  if (error) throw new Error('Could not load this assignment. Please retry.');
  if (!assignment) notFound();
  const { data: course } = await db
    .from('courses')
    .select('name')
    .eq('id', assignment.course_id)
    .eq('user_id', user.id)
    .single();
  const feedback = await searchParams;
  const facts = [
    { label: 'Course', value: course?.name },
    {
      label: 'Deadline',
      value: displayDeadline(assignment.due_date, assignment.due_time, profile.timezone),
    },
    { label: 'Assignment type', value: labels[assignment.assignment_type] },
    { label: 'Estimated grade weight', value: `${assignment.grade_weight}%` },
    { label: 'Estimated effort', value: labels[assignment.effort_level] },
    {
      label: 'Optional duration',
      value: assignment.estimated_minutes
        ? `About ${assignment.estimated_minutes} minutes`
        : 'Not specified',
    },
  ];
  return (
    <div className="form-width">
      <header className="page-heading">
        <div>
          <Link href="/assignments" className="text-link">
            ← All assignments
          </Link>
          <h1>{assignment.title}</h1>
          <span className="badge green">{labels[assignment.status]}</span>
        </div>
        <Link href={`/assignments/${id}/edit`} className="button secondary">
          Edit assignment
        </Link>
      </header>
      {(feedback.saved || feedback.started) && (
        <p className="notice success" role="status">
          {feedback.started
            ? 'You’re in progress. Start small and keep going.'
            : 'Your assignment is saved.'}
        </p>
      )}
      <section className="card">
        <dl className="detail-grid">
          {facts.map((f) => (
            <div key={f.label}>
              <dt>{f.label}</dt>
              <dd>{f.value}</dd>
            </div>
          ))}
        </dl>
        <p className="helper">
          Deadlines use {profile.timezone}. Grade weights and durations are your estimates.
        </p>
        {assignment.description && (
          <div className="stack-sm" style={{ marginTop: 25 }}>
            <h3>Your notes</h3>
            <p className="description">{assignment.description}</p>
          </div>
        )}
        <ActionForm action={setAssignmentStatus} className="status-form" submit="Update status">
          <input type="hidden" name="id" value={id} />
          <label className="sr-only" htmlFor="assignment-status">
            Assignment status
          </label>
          <select
            key={assignment.status}
            id="assignment-status"
            name="status"
            defaultValue={assignment.status}
          >
            {statuses.map((s) => (
              <option key={s} value={s}>
                {labels[s]}
              </option>
            ))}
          </select>
        </ActionForm>
        {assignment.completed_at && (
          <p className="helper">
            Completed{' '}
            {new Intl.DateTimeFormat('en', {
              dateStyle: 'medium',
              timeZone: profile.timezone,
            }).format(new Date(assignment.completed_at))}
            . Reopen it by changing its status.
          </p>
        )}
        <div className="button-row" style={{ marginTop: 20 }}>
          <Link href="/recommendation" className="text-link">
            Find my next step →
          </Link>
          <DeleteForm action={deleteAssignment} id={id} label="assignment" />
        </div>
      </section>
    </div>
  );
}
