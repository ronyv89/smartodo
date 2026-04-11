/**
 * Tests for feature-flags.ts
 *
 * NOTE: Because feature-flags reads process.env at module load time, we use
 * jest.isolateModules() to get a fresh evaluation of the module for each test
 * so env changes take effect.
 */

describe('feature flags', () => {
  const original = { ...process.env };

  afterEach(() => {
    // Restore original env after each test
    for (const key of Object.keys(process.env)) {
      if (!(key in original)) {
        delete process.env[key]; // eslint-disable-line @typescript-eslint/no-dynamic-delete
      }
    }
    Object.assign(process.env, original);
  });

  it('aiEnabled is false when ANTHROPIC_API_KEY is absent', () => {
    delete process.env.ANTHROPIC_API_KEY;
    let flags: { aiEnabled: boolean } | undefined;
    jest.isolateModules(() => {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      flags = (require('../lib/feature-flags') as { flags: { aiEnabled: boolean } }).flags;
    });
    expect(flags?.aiEnabled).toBe(false);
  });

  it('aiEnabled is true when ANTHROPIC_API_KEY is set', () => {
    process.env.ANTHROPIC_API_KEY = 'sk-ant-test';
    delete process.env.AI_FEATURES_ENABLED;
    let flags: { aiEnabled: boolean } | undefined;
    jest.isolateModules(() => {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      flags = (require('../lib/feature-flags') as { flags: { aiEnabled: boolean } }).flags;
    });
    expect(flags?.aiEnabled).toBe(true);
  });

  it('aiEnabled is false when AI_FEATURES_ENABLED=false even with key', () => {
    process.env.ANTHROPIC_API_KEY = 'sk-ant-test';
    process.env.AI_FEATURES_ENABLED = 'false';
    let flags: { aiEnabled: boolean } | undefined;
    jest.isolateModules(() => {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      flags = (require('../lib/feature-flags') as { flags: { aiEnabled: boolean } }).flags;
    });
    expect(flags?.aiEnabled).toBe(false);
  });

  it('attachmentsEnabled defaults to true', () => {
    delete process.env.NEXT_PUBLIC_ATTACHMENTS_ENABLED;
    let flags: { attachmentsEnabled: boolean } | undefined;
    jest.isolateModules(() => {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      flags = (require('../lib/feature-flags') as { flags: { attachmentsEnabled: boolean } }).flags;
    });
    expect(flags?.attachmentsEnabled).toBe(true);
  });

  it('attachmentsEnabled is false when NEXT_PUBLIC_ATTACHMENTS_ENABLED=false', () => {
    process.env.NEXT_PUBLIC_ATTACHMENTS_ENABLED = 'false';
    let flags: { attachmentsEnabled: boolean } | undefined;
    jest.isolateModules(() => {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      flags = (require('../lib/feature-flags') as { flags: { attachmentsEnabled: boolean } }).flags;
    });
    expect(flags?.attachmentsEnabled).toBe(false);
  });
});
