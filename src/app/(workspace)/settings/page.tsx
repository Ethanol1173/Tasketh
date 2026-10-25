import { viewer } from '@/lib/data';
import { SettingsForm } from '@/components/settings-form';
export default async function SettingsPage() {
  const { profile } = await viewer();
  return (
    <div className="form-width">
      <header className="page-heading">
        <div>
          <span className="eyebrow">MAKE YOURSELF AT HOME</span>
          <h1>Your space, your way.</h1>
          <p>A little personalization goes a long way.</p>
        </div>
      </header>
      <SettingsForm profile={profile} />
    </div>
  );
}
