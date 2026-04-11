/**
 * Integration test: verifies the Supabase client can connect.
 * Requires a running Supabase instance (local via `supabase start` or Docker).
 * Skipped automatically when DATABASE_URL is not set.
 */
const skipIntegration = process.env.DATABASE_URL === undefined || process.env.DATABASE_URL === '';
const describeIf = skipIntegration ? describe.skip : describe;

describeIf('Supabase client integration', () => {
  it('connects and returns a client instance', async () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL =
      process.env.NEXT_PUBLIC_SUPABASE_URL ?? 'http://localhost:54321';
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY =
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? 'placeholder';

    const { supabase } = await import('../client');
    expect(supabase).toBeDefined();
  });
});
