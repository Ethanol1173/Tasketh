import { PublicShell } from '@/components/public-shell';
export default function PrivacyPage() {
  return (
    <PublicShell>
      <article className="prose">
        <span className="eyebrow">YOUR SPACE, RESPECTED</span>
        <h1>Privacy & AI</h1>
        <p>
          Tasketh stores your profile, theme, courses, assignments, weekly availability, and
          onboarding progress in the existing Tasketh Supabase project. Supabase Auth manages your
          password. Private records are protected with per-user database policies.
        </p>
        <h2>What Gemini receives</h2>
        <p>
          When you ask for a recommendation, relevant assignment titles, course names, deadlines,
          estimated grade weights, effort, progress, and limited descriptions are sent to Google
          Gemini. Your email, password, authentication tokens, and profile details are excluded.
          Avoid putting sensitive personal information in assignment notes. Google’s API data terms
          apply to this processing.
        </p>
        <h2>When AI is unavailable</h2>
        <p>
          A deterministic priority algorithm still helps you choose a task. Recommendations are
          labeled “AI Recommendation” or “Priority-Based Recommendation” so you know which engine
          was used. Recommendations are study suggestions, not guarantees of grades or completion
          time.
        </p>
        <h2>Minimal storage</h2>
        <p>
          Tasketh does not store raw AI prompts or maintain a recommendation history. One recent
          result is temporarily cached in your private rate-limit record for duplicate prevention.
          You can edit or delete your assignments, courses, and availability in your workspace.
          Browser cookies maintain your login session and preview theme.
        </p>
        <h2>Your control</h2>
        <p>
          You can use assignment management and your weekly schedule without requesting AI. To
          remove your account and remaining records, contact the operator of your Tasketh
          deployment. The database cascades account deletion to your profile and personal records.
        </p>
      </article>
    </PublicShell>
  );
}
