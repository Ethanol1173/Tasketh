import Link from 'next/link';
import { redirect } from 'next/navigation';
import { workspaceData } from '@/lib/data';
import { ScheduleEditor } from '@/components/schedule-editor';
import { AssignmentForm } from '@/components/assignment-form';
import { RecommendationComposer } from '@/components/recommendation';
import { ActionForm } from '@/components/ui';
import { advanceOnboarding, finishOnboarding } from '@/app/actions/workspace';
export default async function OnboardingPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const { assignments, courses, availability, profile } = await workspaceData();
  if (profile.onboarding_completed) redirect('/dashboard');
  const params = await searchParams;
  const requested = Number(params.step || profile.onboarding_step);
  const step = Math.max(
    1,
    Math.min(Number.isInteger(requested) ? requested : 1, profile.onboarding_step),
  );
  return (
    <div className="form-width">
      <div className="onboarding-progress" aria-label="Getting started progress">
        {['Weekly availability', 'Add assignments', 'Find your focus'].map((title, i) => (
          <Link
            href={`/onboarding?step=${Math.min(i + 1, profile.onboarding_step)}`}
            key={title}
            className={step === i + 1 ? 'current' : ''}
            aria-current={step === i + 1 ? 'step' : undefined}
          >
            <span>0{i + 1}</span>
            {title}
          </Link>
        ))}
      </div>
      <header className="page-heading">
        <div>
          <span className="eyebrow">GOOD TO MEET YOU, {profile.username.toUpperCase()}</span>
          <h1>
            {step === 1
              ? 'Let’s make a little space.'
              : step === 2
                ? 'What’s on your plate?'
                : 'Your first next step.'}
          </h1>
          <p>
            {step === 1
              ? 'Start with the study windows that usually work for you.'
              : step === 2
                ? 'Add at least one active assignment. Rough estimates are absolutely fine.'
                : 'Get a recommendation, then head to your personal dashboard.'}
          </p>
        </div>
      </header>
      {step === 1 && (
        <ScheduleEditor availability={availability} timezone={profile.timezone} onboarding />
      )}
      {step === 2 && (
        <>
          {params.saved && (
            <p role="status" className="notice success">
              Assignment saved. Add another, or continue when you’re ready.
            </p>
          )}
          <div className="card">
            <AssignmentForm courses={courses} timezone={profile.timezone} onboarding />
          </div>
          <div className="card" style={{ marginTop: 20 }}>
            <p style={{ marginBottom: 15 }}>
              {assignments.filter((a) => a.status !== 'completed').length} active assignments saved.
            </p>
            <ActionForm action={advanceOnboarding} submit="Choose my study time" />
            <Link className="text-link" href="/onboarding?step=1" style={{ marginTop: 15 }}>
              ← Back to availability
            </Link>
          </div>
        </>
      )}
      {step === 3 && (
        <>
          <RecommendationComposer
            assignments={assignments}
            courses={courses}
            timezone={profile.timezone}
            onboarding
          />
          <div className="card" style={{ marginTop: 25 }}>
            <p style={{ marginBottom: 15 }}>
              Once you’ve received your recommendation, your workspace is ready for you.
            </p>
            <ActionForm action={finishOnboarding} submit="Continue to my dashboard" />
            <Link className="text-link" href="/onboarding?step=2" style={{ marginTop: 15 }}>
              ← Back to assignments
            </Link>
          </div>
        </>
      )}
    </div>
  );
}
