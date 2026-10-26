'use client';
import { useState, useRef } from 'react';
import Link from 'next/link';
import { Sparkles, ArrowRight, Clock3, LoaderCircle } from 'lucide-react';
import type { Assignment, Course } from '@/lib/database.types';
import type { Recommendation } from '@/lib/recommendations/scoring';
import { setAssignmentStatus } from '@/app/actions/workspace';
import { ActionForm } from './ui';
import { displayDeadline } from '@/lib/time';
import { labels } from '@/lib/schemas';
export function RecommendationComposer({
  assignments,
  courses,
  timezone,
  onboarding = false,
}: {
  assignments: Assignment[];
  courses: Course[];
  timezone: string;
  onboarding?: boolean;
}) {
  const [minutes, setMinutes] = useState('30'),
    [custom, setCustom] = useState(false),
    [pending, setPending] = useState(false),
    [error, setError] = useState(''),
    [result, setResult] = useState<Recommendation | null>(null);
  const inFlight = useRef(false);
  async function request(event: React.FormEvent) {
    event.preventDefault();
    if (inFlight.current) return;
    const duration = Number(minutes);
    if (!Number.isInteger(duration) || duration < 1 || duration > 720) {
      setError('Choose a study window between 1 and 720 minutes.');
      return;
    }
    inFlight.current = true;
    setPending(true);
    setError('');
    setResult(null);
    try {
      const response = await fetch('/api/recommendations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ available_minutes: duration }),
        signal: AbortSignal.timeout(25000),
      });
      const data = await response.json();
      if (!response.ok)
        throw new Error(data.error || 'Could not prepare a recommendation. Please retry.');
      setResult(data);
    } catch (error) {
      setError(
        error instanceof Error && error.name !== 'TimeoutError'
          ? error.message
          : 'That took longer than expected. Please try again shortly.',
      );
    } finally {
      setPending(false);
      inFlight.current = false;
    }
  }
  const assignment = assignments.find((a) => a.id === result?.recommended_assignment_id),
    alternative = assignments.find((a) => a.id === result?.alternative_assignment_id);
  return (
    <>
      <section className="dashboard-focus">
        <div className="focus-heading">
          <Sparkles size={25} />
          <h2>{onboarding ? 'How much time do you have right now?' : 'What should I do now?'}</h2>
        </div>
        <p>
          Tell Tasketh how much time you can focus, and we&apos;ll help you decide what to work on.
        </p>
        <form onSubmit={request}>
          <div className="duration-options" role="group" aria-label="Available study time">
            {[15, 30, 45, 60, 90, 120].map((m) => (
              <button
                type="button"
                key={m}
                className={`duration-button ${!custom && minutes === String(m) ? 'selected' : ''}`}
                aria-pressed={!custom && minutes === String(m)}
                onClick={() => {
                  setCustom(false);
                  setMinutes(String(m));
                }}
              >
                {m} min
              </button>
            ))}
            <button
              type="button"
              className={`duration-button ${custom ? 'selected' : ''}`}
              aria-pressed={custom}
              onClick={() => setCustom(true)}
            >
              Custom
            </button>
            {custom && (
              <input
                className="duration-custom"
                type="number"
                aria-label="Custom duration in minutes"
                min="1"
                max="720"
                required
                value={minutes}
                onChange={(e) => setMinutes(e.target.value)}
              />
            )}
          </div>
          <button
            className="button"
            disabled={pending || !assignments.some((a) => a.status !== 'completed')}
          >
            {pending ? <LoaderCircle size={17} className="spin" /> : <Sparkles size={17} />}
            {pending ? 'Finding your next step…' : 'Find My Next Task'}
            {!pending && <ArrowRight size={16} />}
          </button>
        </form>
        {!assignments.some((a) => a.status !== 'completed') && (
          <p className="notice success">
            {assignments.length
              ? 'All caught up. Enjoy a well-earned break, or add your next assignment.'
              : 'Add an active assignment to find your next step.'}{' '}
            <Link href="/assignments/new" className="text-link">
              Add assignment
            </Link>
          </p>
        )}
        {error && (
          <p role="alert" className="notice error">
            {error}
          </p>
        )}
      </section>
      {pending && (
        <div
          className="skeleton"
          role="status"
          aria-label="Preparing your recommendation"
          style={{ marginTop: 20 }}
        />
      )}
      {result && assignment && (
        <section className="recommendation-result" aria-live="polite">
          <span className="accent-label">
            <Sparkles size={15} />
            {result.source === 'gemini' ? 'AI Recommendation' : 'Tasketh Smart Recommendation'}
          </span>
          <h2>Here&apos;s what you should work on.</h2>
          <h3>{assignment.title}</h3>
          <div className="assignment-meta">
            <span>{courses.find((c) => c.id === assignment.course_id)?.name}</span>
            <span>· {labels[assignment.assignment_type]}</span>
            <span>· {assignment.grade_weight}% estimated grade weight</span>
            <span>· Due {displayDeadline(assignment.due_date, assignment.due_time, timezone)}</span>
          </div>
          <p style={{ marginTop: 20 }}>{result.reason}</p>
          <div className="next-action">
            <span className="accent-label">
              <Clock3 size={14} /> YOUR NEXT {result.suggested_minutes} MINUTES
            </span>
            <p>{result.suggested_action}</p>
          </div>
          <div className="button-row">
            <ActionForm action={setAssignmentStatus} submit="Start This Task">
              <input type="hidden" name="id" value={assignment.id} />
              <input type="hidden" name="status" value="in_progress" />
              <input type="hidden" name="start" value="true" />
            </ActionForm>
            <Link className="button secondary" href={`/assignments/${assignment.id}`}>
              View Assignment
            </Link>
            <Link className="text-link" href="/assignments">
              View All Priorities <ArrowRight size={15} />
            </Link>
          </div>
          {alternative && (
            <div className="alternative">
              <span className="eyebrow">ANOTHER WAY TO MAKE PROGRESS</span>
              <p>
                <Link href={`/assignments/${alternative.id}`}>
                  <strong>
                    {alternative.title} <ArrowRight size={12} style={{ display: 'inline' }} />
                  </strong>
                </Link>
              </p>
              <p>{result.alternative_reason}</p>
            </div>
          )}
        </section>
      )}
    </>
  );
}
