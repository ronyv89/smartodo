import { supabase } from './client';
import type { Database } from './database.types';

export type Workspace = Database['public']['Tables']['workspaces']['Row'];
export type WorkspaceMember = Database['public']['Tables']['workspace_members']['Row'];
export type WorkspaceInsert = Database['public']['Tables']['workspaces']['Insert'];

export interface WorkspaceResult<T = void> {
  data: T | null;
  error: Error | null;
}

/** Lists all workspaces the current user belongs to. */
export async function listWorkspaces(): Promise<WorkspaceResult<Workspace[]>> {
  const { data, error } = await supabase
    .from('workspaces')
    .select('*')
    .order('created_at', { ascending: true });
  return { data, error };
}

/** Fetches a single workspace by id (only if the user is a member). */
export async function getWorkspace(id: string): Promise<WorkspaceResult<Workspace>> {
  const { data, error } = await supabase.from('workspaces').select('*').eq('id', id).single();
  return { data, error };
}

/** Fetches a workspace by its slug. */
export async function getWorkspaceBySlug(slug: string): Promise<WorkspaceResult<Workspace>> {
  const { data, error } = await supabase.from('workspaces').select('*').eq('slug', slug).single();
  return { data, error };
}

/** Creates a new workspace. The trigger auto-adds the owner as admin. */
export async function createWorkspace(
  input: Pick<WorkspaceInsert, 'name' | 'slug' | 'owner_id'>,
): Promise<WorkspaceResult<Workspace>> {
  const { data, error } = await supabase.from('workspaces').insert(input).select().single();
  return { data, error };
}

/** Updates workspace name or settings. Requires admin role (enforced by RLS). */
export async function updateWorkspace(
  id: string,
  updates: Database['public']['Tables']['workspaces']['Update'],
): Promise<WorkspaceResult<Workspace>> {
  const { data, error } = await supabase
    .from('workspaces')
    .update(updates)
    .eq('id', id)
    .select()
    .single();
  return { data, error };
}

/** Deletes a workspace. Requires owner (enforced by RLS). */
export async function deleteWorkspace(id: string): Promise<WorkspaceResult> {
  const { error } = await supabase.from('workspaces').delete().eq('id', id);
  return { data: null, error };
}

/** Lists all members of a workspace. */
export async function listWorkspaceMembers(
  workspaceId: string,
): Promise<WorkspaceResult<WorkspaceMember[]>> {
  const { data, error } = await supabase
    .from('workspace_members')
    .select('*')
    .eq('workspace_id', workspaceId)
    .order('joined_at', { ascending: true });
  return { data, error };
}

/** Invites (adds) a user to a workspace. Requires admin role (enforced by RLS). */
export async function addWorkspaceMember(
  workspaceId: string,
  userId: string,
  role: WorkspaceMember['role'] = 'member',
): Promise<WorkspaceResult<WorkspaceMember>> {
  const { data, error } = await supabase
    .from('workspace_members')
    .insert({ workspace_id: workspaceId, user_id: userId, role })
    .select()
    .single();
  return { data, error };
}

/** Updates a member's role. Requires admin role (enforced by RLS). */
export async function updateMemberRole(
  memberId: string,
  role: WorkspaceMember['role'],
): Promise<WorkspaceResult<WorkspaceMember>> {
  const { data, error } = await supabase
    .from('workspace_members')
    .update({ role })
    .eq('id', memberId)
    .select()
    .single();
  return { data, error };
}

/** Removes a member from a workspace. Requires admin role (enforced by RLS). */
export async function removeWorkspaceMember(memberId: string): Promise<WorkspaceResult> {
  const { error } = await supabase.from('workspace_members').delete().eq('id', memberId);
  return { data: null, error };
}
