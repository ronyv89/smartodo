import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import type { Database } from '@smartodo/supabase';

/**
 * Creates a typed Supabase client for use in Server Components, Server Actions,
 * and Route Handlers. Reads/writes cookies via Next.js headers.
 */
export async function createSupabaseServerClient() {
  const cookieStore = await cookies();
  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL ?? '',
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '',
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            for (const { name, value, options } of cookiesToSet) {
              cookieStore.set(name, value, options);
            }
          } catch {
            // setAll is called from a Server Component — cookies are read-only there.
            // Middleware handles token refresh, so this is safe to ignore.
          }
        },
      },
    },
  );
}
