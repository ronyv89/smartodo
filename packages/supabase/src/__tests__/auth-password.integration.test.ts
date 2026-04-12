/**
 * Integration tests — verifies that the signUp helper in @smartodo/supabase
 * correctly integrates with the password validation from @smartodo/core.
 *
 * Supabase network calls are mocked so no live service is required.
 * These tests focus on the boundary between the two packages.
 */
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '../database.types';

jest.mock('../client', () => {
  const mockAuth = {
    getSession: jest.fn(),
    getUser: jest.fn(),
    signUp: jest.fn(),
    signInWithPassword: jest.fn(),
    signOut: jest.fn(),
  };

  return {
    supabase: {
      auth: mockAuth,
      from: jest.fn(),
    } as unknown as SupabaseClient<Database>,
    createClient: jest.fn(),
  };
});

import { supabase } from '../client';
import { signUp } from '../auth';
import { PASSWORD_REQUIREMENTS } from '@smartodo/core';

const mockAuth = supabase.auth as jest.Mocked<typeof supabase.auth>;

beforeEach(() => {
  jest.clearAllMocks();
});

describe('signUp — password validation integration', () => {
  const VALID_PASSWORD = 'Secure@Pass1';

  it('rejects passwords that fail every requirement', async () => {
    const result = await signUp('a@b.com', '', 'Test User');
    expect(result.data).toBeNull();
    expect(result.error).not.toBeNull();
    expect(mockAuth.signUp).not.toHaveBeenCalled();
  });

  it.each(
    // For each requirement, generate a password that is otherwise valid but missing that one.
    PASSWORD_REQUIREMENTS.map((req) => {
      const passwordsMissingReq: Record<string, string> = {
        length: 'Ab1!', // too short
        uppercase: 'nouppercase1!', // no uppercase
        lowercase: 'NOLOWERCASE1!', // no lowercase
        number: 'NoNumber!abcd', // no digit
        special: 'NoSpecialChar1', // no special char
      };
      return [req.id, req.label, passwordsMissingReq[req.id] ?? ''];
    }),
  )('rejects password missing the "%s" requirement', async (_id, label, weakPassword) => {
    const result = await signUp('a@b.com', weakPassword, 'Test User');
    expect(result.data).toBeNull();
    expect(result.error).not.toBeNull();
    expect(result.error?.message).toContain(label);
    expect(mockAuth.signUp).not.toHaveBeenCalled();
  });

  it('forwards valid credentials to Supabase and returns the user', async () => {
    const fakeUser = { id: 'u1', email: 'a@b.com' };
    mockAuth.signUp.mockResolvedValueOnce({
      data: { user: fakeUser, session: null },
      error: null,
    } as never);

    const result = await signUp('a@b.com', VALID_PASSWORD, 'Test User');

    expect(mockAuth.signUp).toHaveBeenCalledTimes(1);
    expect(mockAuth.signUp).toHaveBeenCalledWith({
      email: 'a@b.com',
      password: VALID_PASSWORD,
      options: { data: { full_name: 'Test User' } },
    });
    expect(result.data).toEqual(fakeUser);
    expect(result.error).toBeNull();
  });

  it('propagates Supabase errors for valid passwords through to the caller', async () => {
    mockAuth.signUp.mockResolvedValueOnce({
      data: { user: null, session: null },
      error: { message: 'User already registered', status: 422 },
    } as never);

    const result = await signUp('existing@b.com', VALID_PASSWORD, 'Test User');

    expect(result.data).toBeNull();
    expect(result.error?.message).toBe('User already registered');
  });

  it('does not call Supabase for invalid passwords even when other fields are valid', async () => {
    const invalidPasswords = [
      'short', // too short, missing uppercase/number/special
      'alllowercase1!', // missing uppercase
      'ALLUPPERCASE1!', // missing lowercase
      'NoNumbers!abc', // missing number
      'NoSpecials123', // missing special char
    ];

    for (const pw of invalidPasswords) {
      jest.clearAllMocks();
      await signUp('valid@example.com', pw, 'Valid Name');
      expect(mockAuth.signUp).not.toHaveBeenCalled();
    }
  });
});
