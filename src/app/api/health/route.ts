import { NextResponse } from 'next/server';
import { supabaseConfig } from '@/lib/supabase/config';
export function GET() {
  return NextResponse.json(
    {
      application: 'Tasketh',
      status: 'ok',
      supabase_configured: !!supabaseConfig(),
      gemini_configured: !!process.env.GEMINI_API_KEY,
    },
    { headers: { 'Cache-Control': 'no-store' } },
  );
}
