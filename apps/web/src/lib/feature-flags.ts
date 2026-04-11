/**
 * Feature flags for smarTODO.
 *
 * Flags are read from environment variables at runtime so they can be
 * toggled without a code deploy.  All flags default to a safe fallback
 * when the env var is absent.
 *
 * Usage:
 *   import { flags } from '@/lib/feature-flags';
 *   if (flags.aiEnabled) { ... }
 */

export interface FeatureFlags {
  /**
   * Master switch for all AI features (label suggestions, task breakdown,
   * natural-language commands, standup digest).
   *
   * Disabled when ANTHROPIC_API_KEY is absent or AI_FEATURES_ENABLED=false.
   * Set AI_FEATURES_ENABLED=true in .env.local to enable locally without
   * needing a real key (useful for UI development with mocked responses).
   */
  aiEnabled: boolean;

  /**
   * Enable file attachments (Supabase Storage).
   * Disabled when NEXT_PUBLIC_ATTACHMENTS_ENABLED=false.
   */
  attachmentsEnabled: boolean;

  /**
   * Enable real-time task updates via Supabase Realtime.
   * Disabled when NEXT_PUBLIC_REALTIME_ENABLED=false.
   */
  realtimeEnabled: boolean;
}

function boolEnv(name: string, fallback: boolean): boolean {
  const val = process.env[name];
  if (val === undefined || val === '') return fallback;
  return val !== 'false' && val !== '0';
}

export const flags: FeatureFlags = {
  aiEnabled:
    boolEnv('AI_FEATURES_ENABLED', true) &&
    typeof process.env.ANTHROPIC_API_KEY === 'string' &&
    process.env.ANTHROPIC_API_KEY.length > 0,

  attachmentsEnabled: boolEnv('NEXT_PUBLIC_ATTACHMENTS_ENABLED', true),

  realtimeEnabled: boolEnv('NEXT_PUBLIC_REALTIME_ENABLED', true),
};
