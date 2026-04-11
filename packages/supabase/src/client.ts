import { createClient } from '@supabase/supabase-js';

/**
 * Validates that a required environment variable is set.
 * Throws at module load time on the server; silently returns '' on the client
 * (Next.js strips server-side env vars from the client bundle).
 */
function requireEnv(key: string): string {
  const value = process.env[key];
  if (value === undefined || value === '') {
    // Only throw on the server — client bundles won't have server-side vars
    if (typeof window === 'undefined') {
      throw new Error(`Missing required environment variable: ${key}`);
    }
    return '';
  }
  return value;
}

const supabaseUrl = requireEnv('NEXT_PUBLIC_SUPABASE_URL');
const supabaseAnonKey = requireEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY');

/**
 * Typed Supabase client for browser/SSR usage.
 * Use this in React Server Components, Client Components, and Server Actions.
 */
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export { createClient };
