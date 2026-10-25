import { NextResponse } from 'next/server';
import { z } from 'zod';
import { supabaseServer } from '@/lib/supabase/server';
import { supabaseConfig } from '@/lib/supabase/config';

// Temporary, privacy-limited diagnostics for unexpected React error boundaries.
// Never receive cookies, passwords, task descriptions, full stacks or request headers.
const schema = z.object({
  route: z.enum(['recommendation', 'dashboard', 'onboarding', 'other']),
  errorName: z.string().max(60).regex(/^[a-zA-Z0-9_-]+$/),
  digest: z.string().max(90).regex(/^[a-zA-Z0-9_-]*$/),
  message: z.string().max(200),
}).strict();

export async function POST(request: Request) {
  const origin = request.headers.get('origin');
  if (origin !== new URL(request.url).origin) return new NextResponse(null, { status: 403 });
  if (Number(request.headers.get('content-length') || 0) > 700)
    return new NextResponse(null, { status: 413 });
  if (!supabaseConfig()) return new NextResponse(null, { status: 503 });
  const db = await supabaseServer();
  const { data: { user } } = await db.auth.getUser();
  if (!user) return new NextResponse(null, { status: 401 });
  let json: unknown;
  try { json = await request.json(); } catch { return new NextResponse(null, { status: 400 }); }
  const parsed = schema.safeParse(json);
  if (!parsed.success) return new NextResponse(null, { status: 400 });
  const { route, errorName, digest, message } = parsed.data;
  // Data is already scrubbed client-side. Sanitize again before ephemeral logging.
  const cleaned = message
    .replace(/https?:\/\/\S+/gi, '[url]')
    .replace(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi, '[email]')
    .replace(/(?:sb_[a-z]+_|eyJ)[a-zA-Z0-9._-]+/g, '[token]')
    .slice(0, 160);
  console.warn('Tasketh UI diagnostics', { route, errorName, digest, message: cleaned });
  return new NextResponse(null, { status: 204, headers: { 'Cache-Control': 'no-store' } });
}
