'use client';

import { createBrowserClient } from '@supabase/ssr';
import type { Database } from '@smartodo/supabase';

/**
 * Creates a typed Supabase client for use in Client Components.
 * Uses cookie-based session management via @supabase/ssr.
 */
export function createSupabaseBrowserClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL ?? '',
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '',
  );
}
