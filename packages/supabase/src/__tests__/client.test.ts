import fs from 'fs';
import path from 'path';

const REPO_ROOT = path.resolve(__dirname, '../../../../');

describe('Supabase client environment validation', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it('createClient is exported', async () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'http://localhost:54321';
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key';

    const { createClient } = await import('../client');
    expect(typeof createClient).toBe('function');
  });

  it('supabase client instance is exported when env vars are set', async () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'http://localhost:54321';
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key';

    const { supabase } = await import('../client');
    expect(supabase).toBeDefined();
    expect(typeof supabase.from).toBe('function');
  });

  it('.env.local.example documents all required variables', () => {
    const envExample = fs.readFileSync(path.join(REPO_ROOT, '.env.local.example'), 'utf-8');
    expect(envExample).toContain('NEXT_PUBLIC_SUPABASE_URL');
    expect(envExample).toContain('NEXT_PUBLIC_SUPABASE_ANON_KEY');
    expect(envExample).toContain('SUPABASE_SERVICE_ROLE_KEY');
    expect(envExample).toContain('ANTHROPIC_API_KEY');
  });
});
