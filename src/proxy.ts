import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
import { supabaseConfig } from './lib/supabase/config';
import type { Database } from './lib/database.types';

export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request });
  response.headers.set('Cache-Control', 'private, no-store');
  const config = supabaseConfig();
  if (!config) return response;
  const db = createServerClient<Database>(config.url, config.key, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll: (values) => {
        values.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        response.headers.set('Cache-Control', 'private, no-store');
        values.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
      },
    },
  });
  await db.auth.getUser();
  return response;
}
// Only authenticated workspaces need server-side session refresh on navigation.
// Public landing/login/signup assets avoid an unnecessary Auth round-trip.
export const config = {
  matcher: [
    '/dashboard/:path*',
    '/assignments/:path*',
    '/courses/:path*',
    '/schedule/:path*',
    '/settings/:path*',
    '/recommendation/:path*',
    '/onboarding',
  ],
};
