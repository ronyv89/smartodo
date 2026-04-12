// Unit tests for auth helpers — Supabase client is mocked
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '../database.types';

// Mock the supabase client module before importing auth helpers
jest.mock('../client', () => {
  const mockAuth = {
    getSession: jest.fn(),
    getUser: jest.fn(),
    signUp: jest.fn(),
    signInWithPassword: jest.fn(),
    signOut: jest.fn(),
  };

  const mockFrom = jest.fn();

  return {
    supabase: {
      auth: mockAuth,
      from: mockFrom,
    } as unknown as SupabaseClient<Database>,
    createClient: jest.fn(),
  };
});

import { supabase } from '../client';
import { getSession, getUser, signIn, signOut, signUp } from '../auth';

const mockAuth = supabase.auth as jest.Mocked<typeof supabase.auth>;

beforeEach(() => {
  jest.clearAllMocks();
});

describe('getSession', () => {
  it('returns the session when authenticated', async () => {
    const fakeSession = { access_token: 'tok', user: { id: 'u1' } };
    mockAuth.getSession.mockResolvedValueOnce({
      data: { session: fakeSession },
      error: null,
    } as never);

    const result = await getSession();
    expect(result.data).toEqual(fakeSession);
    expect(result.error).toBeNull();
  });

  it('returns null when not authenticated', async () => {
    mockAuth.getSession.mockResolvedValueOnce({
      data: { session: null },
      error: null,
    } as never);

    const result = await getSession();
    expect(result.data).toBeNull();
    expect(result.error).toBeNull();
  });
});

describe('getUser', () => {
  it('returns the user when authenticated', async () => {
    const fakeUser = { id: 'u1', email: 'test@example.com' };
    mockAuth.getUser.mockResolvedValueOnce({
      data: { user: fakeUser },
      error: null,
    } as never);

    const result = await getUser();
    expect(result.data).toEqual(fakeUser);
  });
});

describe('signUp', () => {
  it('calls signUp with email, password, and full_name metadata', async () => {
    const fakeUser = { id: 'u2', email: 'new@example.com' };
    mockAuth.signUp.mockResolvedValueOnce({
      data: { user: fakeUser, session: null },
      error: null,
    } as never);

    const result = await signUp('new@example.com', 'ValidPass1!', 'New User');
    expect(result.data).toEqual(fakeUser);
    expect(mockAuth.signUp).toHaveBeenCalledWith({
      email: 'new@example.com',
      password: 'ValidPass1!',
      options: { data: { full_name: 'New User' } },
    });
  });

  it('returns an error and does NOT call Supabase when password is too short', async () => {
    const result = await signUp('new@example.com', 'Ab1!', 'New User');
    expect(result.data).toBeNull();
    expect(result.error).not.toBeNull();
    expect(result.error?.message).toMatch(/password requirements not met/i);
    expect(mockAuth.signUp).not.toHaveBeenCalled();
  });

  it('returns an error when password has no uppercase letter', async () => {
    const result = await signUp('new@example.com', 'nouppercase1!', 'New User');
    expect(result.data).toBeNull();
    expect(result.error?.message).toMatch(/uppercase/i);
    expect(mockAuth.signUp).not.toHaveBeenCalled();
  });

  it('returns an error when password has no number', async () => {
    const result = await signUp('new@example.com', 'NoNumber!abc', 'New User');
    expect(result.data).toBeNull();
    expect(result.error?.message).toMatch(/number/i);
    expect(mockAuth.signUp).not.toHaveBeenCalled();
  });

  it('returns an error when password has no special character', async () => {
    const result = await signUp('new@example.com', 'NoSpecial123', 'New User');
    expect(result.data).toBeNull();
    expect(result.error?.message).toMatch(/special/i);
    expect(mockAuth.signUp).not.toHaveBeenCalled();
  });
});

describe('signIn', () => {
  it('calls signInWithPassword and returns the session', async () => {
    const fakeSession = { access_token: 'tok2', user: { id: 'u1' } };
    mockAuth.signInWithPassword.mockResolvedValueOnce({
      data: { session: fakeSession, user: null },
      error: null,
    } as never);

    const result = await signIn('test@example.com', 'password');
    expect(result.data).toEqual(fakeSession);
    expect(mockAuth.signInWithPassword).toHaveBeenCalledWith({
      email: 'test@example.com',
      password: 'password',
    });
  });
});

describe('signOut', () => {
  it('calls signOut and returns no error', async () => {
    mockAuth.signOut.mockResolvedValueOnce({ error: null } as never);

    const result = await signOut();
    expect(result.data).toBeNull();
    expect(result.error).toBeNull();
    expect(mockAuth.signOut).toHaveBeenCalledTimes(1);
  });
});
