import { supabase } from './client';
import type { Database } from './database.types';

export type Project = Database['public']['Tables']['projects']['Row'];
export type ProjectInsert = Database['public']['Tables']['projects']['Insert'];

export interface ProjectResult<T = void> {
  data: T | null;
  error: Error | null;
}

export async function listProjects(workspaceId: string): Promise<ProjectResult<Project[]>> {
  const { data, error } = await supabase
    .from('projects')
    .select('*')
    .eq('workspace_id', workspaceId)
    .eq('archived', false)
    .order('sort_order', { ascending: true });
  return { data, error };
}

export async function getProject(id: string): Promise<ProjectResult<Project>> {
  const { data, error } = await supabase.from('projects').select('*').eq('id', id).single();
  return { data, error };
}

export async function createProject(
  input: Pick<ProjectInsert, 'workspace_id' | 'name' | 'description' | 'color'>,
): Promise<ProjectResult<Project>> {
  const { data, error } = await supabase.from('projects').insert(input).select().single();
  return { data, error };
}

export async function updateProject(
  id: string,
  updates: Database['public']['Tables']['projects']['Update'],
): Promise<ProjectResult<Project>> {
  const { data, error } = await supabase
    .from('projects')
    .update(updates)
    .eq('id', id)
    .select()
    .single();
  return { data, error };
}

export async function archiveProject(id: string): Promise<ProjectResult<Project>> {
  return updateProject(id, { archived: true });
}

export async function deleteProject(id: string): Promise<ProjectResult> {
  const { error } = await supabase.from('projects').delete().eq('id', id);
  return { data: null, error };
}
