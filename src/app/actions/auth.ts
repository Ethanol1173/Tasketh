'use server';
import { z } from 'zod';
import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import { revalidatePath } from 'next/cache';
import { supabaseServer } from '@/lib/supabase/server';
import { supabaseConfig } from '@/lib/supabase/config';
import { errorMessage, passwordSchema, signupSchema } from '@/lib/schemas';

export type FormState = { error?: string; success?: string };
function appUrl() {
  return (process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000').replace(/\/$/, '');
}
export async function signUp(_: FormState, form: FormData): Promise<FormState> {
  const input = signupSchema.safeParse(Object.fromEntries(form));
  if (!input.success) return { error: errorMessage(input.error) };
  if (!supabaseConfig())
    return {
      error:
        'Registration is waiting for the Supabase publishable key. See the setup instructions.',
    };
  const { email, username, password, selected_theme, timezone } = input.data;
  const db = await supabaseServer();
  const availability = await db.rpc('tasketh_username_available', { p_username: username });
  if (availability.error)
    return {
      error:
        'Account services are not ready. Confirm the database migration is applied, then try again.',
    };
  if (!availability.data) return { error: 'That username is already taken. Choose another one.' };
  const { data, error } = await db.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${appUrl()}/auth/callback?next=/onboarding`,
      data: { username, selected_theme, timezone },
    },
  });
  if (error)
    return {
      error: /database|username|unique/i.test(error.message)
        ? 'That username may already be taken. Try another, or contact support if the problem continues.'
        : 'Could not create your account. Check your details and try again shortly.',
    };
  (await cookies()).set('tasketh-theme', selected_theme, {
    path: '/',
    sameSite: 'lax',
    maxAge: 31536000,
    secure: process.env.NODE_ENV === 'production',
  });
  if (!data.session) redirect('/verify-email');
  revalidatePath('/', 'layout');
  redirect('/onboarding');
}
export async function signIn(_: FormState, form: FormData): Promise<FormState> {
  const parsed = z
    .object({ email: z.email(), password: z.string().min(1).max(128) })
    .safeParse(Object.fromEntries(form));
  if (!parsed.success) return { error: 'Enter your email and password.' };
  if (!supabaseConfig()) return { error: 'Sign in is waiting for the Supabase publishable key.' };
  const db = await supabaseServer();
  const { data, error } = await db.auth.signInWithPassword(parsed.data);
  if (error || !data.user)
    return { error: 'Sign in failed. Check your email, password, and email verification.' };
  const { data: profile } = await db
    .from('profiles')
    .select('onboarding_completed,selected_theme')
    .eq('id', data.user.id)
    .single();
  if (profile)
    (await cookies()).set('tasketh-theme', profile.selected_theme, {
      path: '/',
      sameSite: 'lax',
      maxAge: 31536000,
      secure: process.env.NODE_ENV === 'production',
    });
  revalidatePath('/', 'layout');
  redirect(profile?.onboarding_completed ? '/dashboard' : '/onboarding');
}
export async function signOut() {
  const db = await supabaseServer();
  const { error } = await db.auth.signOut();
  if (error) throw new Error('Sign out failed. Please retry.');
  revalidatePath('/', 'layout');
  redirect('/login');
}
export async function forgotPassword(_: FormState, form: FormData): Promise<FormState> {
  const email = z.email().safeParse(form.get('email'));
  if (!email.success) return { error: 'Enter a valid email address.' };
  if (!supabaseConfig())
    return { error: 'Password recovery is waiting for Supabase configuration.' };
  const db = await supabaseServer();
  const { error } = await db.auth.resetPasswordForEmail(email.data, {
    redirectTo: `${appUrl()}/auth/callback?next=/reset-password`,
  });
  if (error) return { error: 'Could not send a reset email. Please try again shortly.' };
  return {
    success:
      'If an account exists for that address, a password reset link is on its way. Check your inbox.',
  };
}
export async function resetPassword(_: FormState, form: FormData): Promise<FormState> {
  const parsed = z
    .object({ password: passwordSchema, confirm_password: z.string() })
    .refine((v) => v.password === v.confirm_password, 'Your passwords don’t match.')
    .safeParse(Object.fromEntries(form));
  if (!parsed.success) return { error: errorMessage(parsed.error) };
  if (!supabaseConfig()) return { error: 'Supabase configuration is required.' };
  const jar = await cookies();
  if (jar.get('tasketh-recovery')?.value !== 'verified')
    return { error: 'Open a fresh password reset link from your email first.' };
  const db = await supabaseServer();
  const {
    data: { user },
  } = await db.auth.getUser();
  if (!user) return { error: 'This reset link has expired. Request another one.' };
  const { error } = await db.auth.updateUser({ password: parsed.data.password });
  if (error) return { error: 'Could not update your password. Use a new password and try again.' };
  jar.delete('tasketh-recovery');
  await db.auth.signOut();
  redirect('/login?password=updated');
}
