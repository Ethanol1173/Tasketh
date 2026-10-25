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
  const [assignments, courses, availability] = await Promise.all([
    db.from('assignments').select('*').eq('user_id', user.id).order('due_date'),
    db.from('courses').select('*').eq('user_id', user.id).order('name'),
    db
      .from('weekly_availability')
      .select('*')
      .eq('user_id', user.id)
      .order('weekday')
      .order('start_time'),
  ]);
  if (assignments.error || courses.error || availability.error)
    throw new Error('Your workspace could not be loaded. Check your connection and retry.');
  return {
    profile,
    assignments: assignments.data!,
    courses: courses.data!,
    availability: availability.data!,
  };
}
