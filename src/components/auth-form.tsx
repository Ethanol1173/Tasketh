'use client';
import { useActionState, useState, useSyncExternalStore } from 'react';
import Link from 'next/link';
import { Eye, EyeOff } from 'lucide-react';
import { signUp, signIn, forgotPassword, resetPassword } from '@/app/actions/auth';
import { Feedback, Submit } from './ui';
import { useTheme } from './theme-provider';

export function PasswordField({
  name,
  label,
  fresh,
}: {
  name: string;
  label: string;
  fresh?: boolean;
}) {
  const [visible, setVisible] = useState(false);
  return (
    <label>
      {label}
      <span className="password-input">
        <input
          name={name}
          type={visible ? 'text' : 'password'}
          required
          minLength={fresh ? 12 : 1}
          maxLength={128}
          autoComplete={fresh ? 'new-password' : 'current-password'}
        />
        <button
          type="button"
          onClick={() => setVisible(!visible)}
          aria-label={visible ? `Hide ${label}` : `Show ${label}`}
        >
          {visible ? <EyeOff size={17} /> : <Eye size={17} />}
        </button>
      </span>
    </label>
  );
}
export function AuthForm({
  mode,
  configured,
}: {
  mode: 'signup' | 'login' | 'forgot' | 'reset';
  configured: boolean;
}) {
  const actions = { signup: signUp, login: signIn, forgot: forgotPassword, reset: resetPassword };
  const [state, action] = useActionState(actions[mode], {});
  const { theme } = useTheme();
  const timezone = useSyncExternalStore(
    () => () => {},
    () => Intl.DateTimeFormat().resolvedOptions().timeZone,
    () => 'UTC',
  );
  return (
    <form action={action} onReset={(event) => event.preventDefault()}>
      {!configured && (
        <p className="notice error" role="status">
          Account services need the Supabase publishable key before you can continue. Your details
          won’t be submitted until configuration is complete.
        </p>
      )}
      {mode !== 'reset' && (
        <label>
          Email Address *
          <input
            name="email"
            type="email"
            required
            autoComplete="email"
            maxLength={254}
            placeholder="you@university.edu"
          />
        </label>
      )}
      {mode === 'signup' && (
        <>
          <label>
            Username *
            <input
              aria-label="Username *"
              aria-describedby="username-help"
              name="username"
              required
              minLength={3}
              maxLength={24}
              pattern="[a-zA-Z0-9_]+"
              autoComplete="username"
              placeholder="ethan"
            />
            <small id="username-help">3–24 letters, numbers, or underscores. Make it yours.</small>
          </label>
          <input type="hidden" name="selected_theme" value={theme} />
          <input type="hidden" name="timezone" value={timezone} />
        </>
      )}
      {mode !== 'forgot' && (
        <PasswordField name="password" label="Password *" fresh={mode !== 'login'} />
      )}
      {(mode === 'signup' || mode === 'reset') && (
        <>
          <span className="helper">
            At least 12 characters, with uppercase, lowercase, and a number.
          </span>
          <PasswordField name="confirm_password" label="Confirm Password *" fresh />
        </>
      )}
      {mode === 'login' && (
        <Link href="/forgot-password" className="text-link">
          Forgot your password?
        </Link>
      )}
      <Feedback state={state} />
      <Submit disabled={!configured}>
        {
          {
            signup: 'Create my account',
            login: 'Welcome back',
            forgot: 'Send reset link',
            reset: 'Update password',
          }[mode]
        }
      </Submit>
      {mode === 'signup' && (
        <p className="helper">
          By continuing, you acknowledge our{' '}
          <Link href="/privacy" className="text-link">
            privacy & AI notice
          </Link>
          .
        </p>
      )}
    </form>
  );
}
