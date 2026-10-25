import { NextResponse } from 'next/server';
import { createHash } from 'node:crypto';
import { z } from 'zod';
import { supabaseConfig } from '@/lib/supabase/config';
import { supabaseServer } from '@/lib/supabase/server';
import { sessionSchema } from '@/lib/schemas';
import { recommend } from '@/lib/recommendations/gemini';
import { validateRecommendation } from '@/lib/recommendations/scoring';
import type { Json } from '@/lib/database.types';
import { readLimitedJson } from '@/lib/request';

export const maxDuration = 30;
const quotaSchema = z.object({
  state: z.enum(['allowed', 'cached', 'busy', 'limited']),
  result: z.unknown().optional(),
});
function reply(body: unknown, status = 200) {
  return NextResponse.json(body, { status, headers: { 'Cache-Control': 'private, no-store' } });
}
export async function POST(request: Request) {
  const origin = request.headers.get('origin');
  if (
    origin &&
    origin !== new URL(request.url).origin &&
    origin !== process.env.NEXT_PUBLIC_APP_URL
  )
    return reply({ error: 'Request origin is not allowed.' }, 403);
  if (!supabaseConfig()) return reply({ error: 'Supabase configuration is required.' }, 503);
  const db = await supabaseServer();
  const {
    data: { user },
  } = await db.auth.getUser();
  if (!user) return reply({ error: 'Sign in to get a recommendation.' }, 401);
  if (Number(request.headers.get('content-length') || 0) > 1024)
    return reply({ error: 'Request too large.' }, 413);
  let input;
  try {
    input = sessionSchema.safeParse(await readLimitedJson(request, 1024));
  } catch (error) {
    return reply(
      {
        error: error instanceof RangeError ? 'Request too large.' : 'Enter a valid study duration.',
      },
      error instanceof RangeError ? 413 : 400,
    );
  }
  if (!input.success) return reply({ error: 'Choose between 1 and 720 minutes.' }, 400);
  const [assignments, courses, profile] = await Promise.all([
    db
      .from('assignments')
      .select('*')
      .eq('user_id', user.id)
      .neq('status', 'completed')
      .order('due_date')
      .limit(1000),
    db.from('courses').select('*').eq('user_id', user.id),
    db.from('profiles').select('timezone').eq('id', user.id).single(),
  ]);
  if (assignments.error || courses.error || profile.error)
    return reply({ error: 'Could not load your assignments. Please retry.' }, 503);
  if (!assignments.data.length)
    return reply(
      { error: 'Add an active assignment first. If everything is finished, enjoy the break.' },
      422,
    );
  const minutes = input.data.available_minutes;
  const key = createHash('sha256')
    .update(
      JSON.stringify({
        minutes,
        timezone: profile.data.timezone,
        assignments: assignments.data,
        courses: courses.data,
      }),
    )
    .digest('hex');
  const quota = await db.rpc('reserve_recommendation', { p_key: key });
  const parsed = quotaSchema.safeParse(quota.data);
  if (quota.error || !parsed.success)
    return reply(
      { error: 'Recommendation service is not ready. Confirm the database migration is applied.' },
      503,
    );
  if (parsed.data.state === 'busy' || parsed.data.state === 'limited')
    return NextResponse.json(
      {
        error:
          parsed.data.state === 'busy'
            ? 'A recommendation is already being prepared. Try again shortly.'
            : 'Take a moment. You can request up to five new recommendations per minute.',
      },
      { status: 429, headers: { 'Retry-After': '30', 'Cache-Control': 'no-store' } },
    );
  if (parsed.data.state === 'cached') {
    const cached = parsed.data.result as Record<string, unknown>;
    if (cached && (cached.source === 'gemini' || cached.source === 'fallback')) {
      const { source, ...payload } = cached;
      const valid = validateRecommendation(payload, assignments.data, minutes);
      if (valid) return reply({ ...valid, source });
    }
    return reply({ error: 'Your assignments changed. Please try again shortly.' }, 409);
  }
  const result = await recommend(assignments.data, courses.data, minutes, profile.data.timezone);
  if (!result) return reply({ error: 'No eligible assignments were found.' }, 422);
  const saved = await db.rpc('complete_recommendation', {
    p_key: key,
    p_result: result as unknown as Json,
  });
  if (saved.error)
    return reply({ error: 'Could not save your recommendation. Please retry shortly.' }, 503);
  return reply(result);
}
