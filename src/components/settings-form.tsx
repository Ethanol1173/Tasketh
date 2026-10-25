'use client';
import { saveProfile } from '@/app/actions/workspace';
import type { Profile } from '@/lib/database.types';
import { ActionForm } from './ui';
import { ThemePicker, useTheme } from './theme-provider';
export function SettingsForm({ profile }: { profile: Profile }) {
  const { theme } = useTheme();
  const timezones = Array.from(
    new Set([profile.timezone, 'UTC', ...Intl.supportedValuesOf('timeZone')]),
  );
  return (
    <ActionForm action={saveProfile} submit="Save my preferences">
      <section className="settings-section">
        <h2>Your profile</h2>
        <p>A name that feels like you. A schedule that matches your timezone.</p>
        <div className="form-columns">
          <label>
            Username
            <input
              name="username"
              required
              minLength={3}
              maxLength={24}
              pattern="[a-zA-Z0-9_]+"
              defaultValue={profile.username}
              autoComplete="username"
            />
          </label>
          <label>
            Timezone
            <select name="timezone" defaultValue={profile.timezone}>
              {timezones.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
            <small>Assignment deadlines and study windows use this timezone.</small>
          </label>
        </div>
      </section>
      <section className="settings-section">
        <h2>Choose Your Vibe</h2>
        <p>Preview a new look. Save it to make it yours on every device.</p>
        <ThemePicker />
        <input type="hidden" name="selected_theme" value={theme} />
      </section>
    </ActionForm>
  );
}
