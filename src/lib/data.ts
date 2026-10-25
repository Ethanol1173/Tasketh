import 'server-only';
import { cache } from 'react';
import { redirect } from 'next/navigation';
import { supabaseServer } from './supabase/server';
import { supabaseConfig } from './supabase/config';

export const viewer = cache(async () => {
  if (!supabaseConfig()) redirect('/login?setup=required');
  const db = await supabaseServer();
  const {
    data: { user },
    error,
  } = await db.auth.getUser();
  if (error || !user) redirect('/login');
  const { data: profile, error: profileError } = await db
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();
  if (profileError || !profile)
    throw new Error(
      'Your profile could not be loaded. Confirm the database migration has been applied, then retry.',
    );
  return { db, user, profile };
});
export async function workspaceData() {
  const { db, user, profile } = await viewer();
  // All three requests are read-only; one bounded retry handles occasional network/API hiccups.
  const load = () =>
    Promise.all([
      db.from('assignments').select('*').eq('user_id', user.id).order('due_date'),
      db.from('courses').select('*').eq('user_id', user.id).order('name'),
      db
        .from('weekly_availability')
        .select('*')
        .eq('user_id', user.id)
        .order('weekday')
        .order('start_time'),
    ]);
  let [assignments, courses, availability] = await load();
  if (assignments.error || courses.error || availability.error) {
    await new Promise((resolve) => setTimeout(resolve, 200));
    [assignments, courses, availability] = await load();
  }
  if (assignments.error || courses.error || availability.error) {
    // Log only database error codes, never tokens, user IDs or assignment contents.
    console.error('Tasketh workspace read failed', {
      assignments: assignments.error?.code ?? null,
      courses: courses.error?.code ?? null,
      availability: availability.error?.code ?? null,
    });
    throw new Error('Your workspace could not be loaded. Please retry.');
  }
  return {
    profile,
    assignments: assignments.data!,
    courses: courses.data!,
    availability: availability.data!,
  };
}
