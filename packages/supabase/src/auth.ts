import type { AuthError, Session, User } from '@supabase/supabase-js';
import { supabase } from './client';
import type { Database } from './database.types';

export type Profile = Database['public']['Tables']['profiles']['Row'];

export interface AuthResult<T = void> {
  data: T | null;
  error: AuthError | Error | null;
}

/** Returns the current session (null if not authenticated). */
export async function getSession(): Promise<AuthResult<Session>> {
  const { data, error } = await supabase.auth.getSession();
  return { data: data.session, error };
}

/** Returns the authenticated user (null if not logged in). */
export async function getUser(): Promise<AuthResult<User>> {
  const { data, error } = await supabase.auth.getUser();
  return { data: data.user, error };
}

/** Fetches the profile row for a given user id. */
export async function getProfile(userId: string): Promise<AuthResult<Profile>> {
  const { data, error } = await supabase.from('profiles').select('*').eq('id', userId).single();
  return { data, error };
}

/** Signs up with email + password. full_name is stored in user metadata and copied to profiles by trigger. */
export async function signUp(
  email: string,
  password: string,
  fullName: string,
): Promise<AuthResult<User>> {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { full_name: fullName } },
  });
  return { data: data.user, error };
}

/** Signs in with email + password. */
export async function signIn(email: string, password: string): Promise<AuthResult<Session>> {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  return { data: data.session, error };
}

/** Signs out the current user. */
export async function signOut(): Promise<AuthResult> {
  const { error } = await supabase.auth.signOut();
  return { data: null, error };
}

/** Updates the current user's profile (full_name and/or avatar_url). */
export async function updateProfile(
  userId: string,
  updates: Database['public']['Tables']['profiles']['Update'],
): Promise<AuthResult<Profile>> {
  const { data, error } = await supabase
    .from('profiles')
    .update(updates)
    .eq('id', userId)
    .select()
    .single();
  return { data, error };
}
