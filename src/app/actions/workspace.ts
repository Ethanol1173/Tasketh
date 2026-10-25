'use server';
import { z } from 'zod';
import { cookies } from 'next/headers';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { viewer } from '@/lib/data';
import {
  assignmentSchema,
  errorMessage,
  scheduleSchema,
  statuses,
  themeSchema,
  timezoneSchema,
  usernameSchema,
} from '@/lib/schemas';
import { splitAndValidateBlocks } from '@/lib/time';
import type { FormState } from './auth';
import type { Json } from '@/lib/database.types';

function refresh() {
  revalidatePath('/', 'layout');
}
export async function saveAssignment(_: FormState, form: FormData): Promise<FormState> {
  const input = assignmentSchema.safeParse(Object.fromEntries(form));
  if (!input.success) return { error: errorMessage(input.error) };
  const { db, user } = await viewer();
  const course = await db
    .from('courses')
    .select('id')
    .eq('id', input.data.course_id)
    .eq('user_id', user.id)
    .single();
  if (course.error) return { error: 'Choose a course from your own workspace.' };
  const id = form.get('id');
  if (id && !z.uuid().safeParse(id).success) return { error: 'Invalid assignment.' };
  const query = id
    ? db
        .from('assignments')
        .update(input.data)
        .eq('id', String(id))
        .eq('user_id', user.id)
        .select('id')
        .single()
    : db
        .from('assignments')
        .insert({ ...input.data, user_id: user.id })
        .select('id')
        .single();
  const { data, error } = await query;
  if (error || !data)
    return { error: 'Your assignment was not saved. Check your connection and try again.' };
  refresh();
  redirect(
    form.get('onboarding') === 'true'
      ? '/onboarding?step=2&saved=1'
      : `/assignments/${data.id}?saved=1`,
  );
}
export async function setAssignmentStatus(_: FormState, form: FormData): Promise<FormState> {
  const input = z
    .object({ id: z.uuid(), status: z.enum(statuses) })
    .safeParse(Object.fromEntries(form));
  if (!input.success) return { error: 'Invalid assignment status.' };
  const { db, user } = await viewer();
  const { error, data } = await db
    .from('assignments')
    .update({ status: input.data.status })
    .eq('id', input.data.id)
    .eq('user_id', user.id)
    .select('id')
    .single();
  if (error || !data) return { error: 'The status could not be updated. Please retry.' };
  refresh();
  if (form.get('start') === 'true') redirect(`/assignments/${input.data.id}?started=1`);
  return { success: 'Assignment updated.' };
}
export async function deleteAssignment(_: FormState, form: FormData): Promise<FormState> {
  const id = z.uuid().safeParse(form.get('id'));
  if (!id.success || form.get('confirmed') !== 'true')
    return { error: 'Confirm the assignment deletion first.' };
  const { db, user } = await viewer();
  const { data, error } = await db
    .from('assignments')
    .delete()
    .eq('id', id.data)
    .eq('user_id', user.id)
    .select('id')
    .single();
  if (error || !data) return { error: 'The assignment could not be deleted.' };
  refresh();
  redirect('/assignments?deleted=1');
}
export async function saveCourse(_: FormState, form: FormData): Promise<FormState> {
  const name = z.string().trim().min(1).max(100).safeParse(form.get('name'));
  if (!name.success) return { error: 'Use a course name between 1 and 100 characters.' };
  const { db, user } = await viewer();
  const id = form.get('id');
  if (id && !z.uuid().safeParse(id).success) return { error: 'Invalid course.' };
  const { error } = id
    ? await db
        .from('courses')
        .update({ name: name.data })
        .eq('user_id', user.id)
        .eq('id', String(id))
        .select('id')
        .single()
    : await db.from('courses').insert({ name: name.data, user_id: user.id });
  if (error)
    return {
      error:
        error.code === '23505'
          ? 'You already have a course with that name.'
          : 'Your course could not be saved.',
    };
  refresh();
  return { success: 'Course saved. You can now select it for an assignment.' };
}
export async function deleteCourse(_: FormState, form: FormData): Promise<FormState> {
  const id = z.uuid().safeParse(form.get('id'));
  if (!id.success || form.get('confirmed') !== 'true')
    return { error: 'Confirm the course deletion first.' };
  const { db, user } = await viewer();
  const { error } = await db
    .from('courses')
    .delete()
    .eq('id', id.data)
    .eq('user_id', user.id)
    .select('id')
    .single();
  if (error)
    return {
      error:
        error.code === '23503'
          ? 'Move or delete this course’s assignments first.'
          : 'Your course could not be deleted.',
    };
  refresh();
  return { success: 'Course deleted.' };
}
export async function saveSchedule(_: FormState, form: FormData): Promise<FormState> {
  let raw;
  try {
    raw = JSON.parse(String(form.get('blocks')));
  } catch {
    return { error: 'Invalid study schedule.' };
  }
  const parsed = scheduleSchema.safeParse(raw);
  if (!parsed.success)
    return { error: 'Check your days and time ranges. You can add up to 70 blocks.' };
  let blocks;
  try {
    blocks = splitAndValidateBlocks(parsed.data);
  } catch (error) {
    return { error: (error as Error).message };
  }
  const { db } = await viewer();
  const advancing = form.get('onboarding') === 'true';
  const { error } = await db.rpc('replace_weekly_availability', {
    p_blocks: blocks as unknown as Json,
    p_advance: advancing,
  });
  if (error)
    return { error: 'Your schedule was not saved. Check for overlapping blocks and try again.' };
  refresh();
  if (advancing) redirect('/onboarding?step=2');
  return { success: 'Your weekly availability is saved.' };
}
export async function advanceOnboarding(_: FormState): Promise<FormState> {
  void _;
  const { db, user } = await viewer();
  const { count, error } = await db
    .from('assignments')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', user.id)
    .neq('status', 'completed');
  if (error || !count) return { error: 'Add at least one active assignment before continuing.' };
  const result = await db.from('profiles').update({ onboarding_step: 3 }).eq('id', user.id);
  if (result.error) return { error: 'Could not save your progress. Try again.' };
  refresh();
  redirect('/onboarding?step=3');
}
export async function finishOnboarding(_: FormState): Promise<FormState> {
  void _;
  const { db } = await viewer();
  const { error } = await db.rpc('finish_onboarding', {});
  if (error)
    return {
      error: 'Add an active assignment and get your first recommendation before continuing.',
    };
  refresh();
  redirect('/dashboard');
}
export async function saveProfile(_: FormState, form: FormData): Promise<FormState> {
  const parsed = z
    .object({ username: usernameSchema, timezone: timezoneSchema, selected_theme: themeSchema })
    .safeParse(Object.fromEntries(form));
  if (!parsed.success) return { error: errorMessage(parsed.error) };
  const { db, user } = await viewer();
  const { error } = await db
    .from('profiles')
    .update(parsed.data)
    .eq('id', user.id)
    .select('id')
    .single();
  if (error)
    return {
      error:
        error.code === '23505'
          ? 'That username is already taken.'
          : 'Your preferences were not saved. Please retry.',
    };
  (await cookies()).set('tasketh-theme', parsed.data.selected_theme, {
    path: '/',
    sameSite: 'lax',
    maxAge: 31536000,
    secure: process.env.NODE_ENV === 'production',
  });
  refresh();
  return { success: 'Your profile and theme are saved across devices.' };
}
