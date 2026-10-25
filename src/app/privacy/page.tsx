import { PublicShell } from '@/components/public-shell';

export default function PrivacyPage() {
  const aiEnabled = process.env.TASKETH_RECOMMENDATION_MODE === 'gemini';
  return (
    <PublicShell>
      <article className="prose">
        <span className="eyebrow">YOUR SPACE, RESPECTED</span>
        <h1>Privacy & recommendations</h1>
        <p>
          Tasketh stores your profile, theme, courses, assignments, weekly availability, and
          onboarding progress in the existing Tasketh Supabase project. Supabase Auth manages your
          password. Private records are protected with per-user database policies.
        </p>
        <h2>How Tasketh recommends your next task</h2>
        {aiEnabled ? (
          <p>
            In AI mode, relevant assignment titles, course names, deadlines, grade weights, effort,
            progress, and limited descriptions may be sent to Google Gemini. Your email, password,
            authentication tokens, and profile details are excluded. Google’s API data terms apply.
            If the provider fails, Tasketh automatically uses its rule-based priority system.
          </p>
        ) : (
          <p>
            In the current rule-based mode, Tasketh prioritizes tasks using deadline urgency (50%),
            estimated grade weight (35%), and fit for your available study time (15%). Tasketh does
            not send assignment details to Google Gemini in this mode. These transparent rules
            provide study suggestions, not AI-generated decisions or guarantees of academic outcomes.
          </p>
        )}
        <h2>Minimal storage</h2>
        <p>
          Tasketh does not store raw AI prompts or maintain a recommendation history. One recent
          recommendation is temporarily cached in your private rate-limit record to prevent
          duplicate requests. You can edit or delete your assignments, courses, and availability
          in your workspace. Browser cookies maintain your login session and preview theme.
        </p>
        <h2>Your control</h2>
        <p>
          You can use assignment management and your weekly schedule without requesting a
          recommendation. To remove your account and remaining records, contact the operator
          of your Tasketh deployment. The database cascades account deletion to your profile
          and personal records.
        </p>
      </article>
    </PublicShell>
  );
}
