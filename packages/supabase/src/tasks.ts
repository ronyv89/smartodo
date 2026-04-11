import { supabase } from './client';
import type { Database } from './database.types';

export type Task = Database['public']['Tables']['tasks']['Row'];
export type TaskInsert = Database['public']['Tables']['tasks']['Insert'];
export type Label = Database['public']['Tables']['labels']['Row'];
export type TaskComment = Database['public']['Tables']['task_comments']['Row'];

export interface TaskResult<T = void> {
  data: T | null;
  error: Error | null;
}

// ──────────────────────────────────────────────────────────────
// Tasks
// ──────────────────────────────────────────────────────────────

export async function listTasks(projectId: string): Promise<TaskResult<Task[]>> {
  const { data, error } = await supabase
    .from('tasks')
    .select('*')
    .eq('project_id', projectId)
    .is('parent_id', null) // top-level tasks only
    .order('sort_order', { ascending: true });
  return { data, error };
}

export async function getTask(id: string): Promise<TaskResult<Task>> {
  const { data, error } = await supabase.from('tasks').select('*').eq('id', id).single();
  return { data, error };
}

export async function createTask(
  input: Pick<TaskInsert, 'project_id' | 'title' | 'priority' | 'assignee_id' | 'due_date'>,
): Promise<TaskResult<Task>> {
  const { data, error } = await supabase.from('tasks').insert(input).select().single();
  return { data, error };
}

export async function updateTask(
  id: string,
  updates: Database['public']['Tables']['tasks']['Update'],
): Promise<TaskResult<Task>> {
  const { data, error } = await supabase
    .from('tasks')
    .update(updates)
    .eq('id', id)
    .select()
    .single();
  return { data, error };
}

export async function deleteTask(id: string): Promise<TaskResult> {
  const { error } = await supabase.from('tasks').delete().eq('id', id);
  return { data: null, error };
}

/** Reorders a task by updating sort_order. Caller is responsible for re-indexing siblings. */
export async function reorderTask(id: string, sortOrder: number): Promise<TaskResult<Task>> {
  return updateTask(id, { sort_order: sortOrder });
}

// ──────────────────────────────────────────────────────────────
// Labels
// ──────────────────────────────────────────────────────────────

export async function listLabels(workspaceId: string): Promise<TaskResult<Label[]>> {
  const { data, error } = await supabase
    .from('labels')
    .select('*')
    .eq('workspace_id', workspaceId)
    .order('name', { ascending: true });
  return { data, error };
}

export async function addLabelToTask(taskId: string, labelId: string): Promise<TaskResult> {
  const { error } = await supabase
    .from('task_labels')
    .insert({ task_id: taskId, label_id: labelId });
  return { data: null, error };
}

export async function removeLabelFromTask(taskId: string, labelId: string): Promise<TaskResult> {
  const { error } = await supabase
    .from('task_labels')
    .delete()
    .eq('task_id', taskId)
    .eq('label_id', labelId);
  return { data: null, error };
}

// ──────────────────────────────────────────────────────────────
// Comments
// ──────────────────────────────────────────────────────────────

export async function listComments(taskId: string): Promise<TaskResult<TaskComment[]>> {
  const { data, error } = await supabase
    .from('task_comments')
    .select('*')
    .eq('task_id', taskId)
    .order('created_at', { ascending: true });
  return { data, error };
}

export async function addComment(
  taskId: string,
  authorId: string,
  body: string,
): Promise<TaskResult<TaskComment>> {
  const { data, error } = await supabase
    .from('task_comments')
    .insert({ task_id: taskId, author_id: authorId, body })
    .select()
    .single();
  return { data, error };
}

export async function deleteComment(id: string): Promise<TaskResult> {
  const { error } = await supabase.from('task_comments').delete().eq('id', id);
  return { data: null, error };
}
