import { supabase } from './client';
import type { Database, Json } from './database.types';

export type ActivityLog = Database['public']['Tables']['activity_logs']['Row'];

export interface ActivityResult<T = void> {
  data: T | null;
  error: Error | null;
}

/** Lists activity log entries for a task, newest first. */
export async function listActivityLogs(taskId: string): Promise<ActivityResult<ActivityLog[]>> {
  const { data, error } = await supabase
    .from('activity_logs')
    .select('*')
    .eq('task_id', taskId)
    .order('created_at', { ascending: false });
  return { data, error };
}

/** Records an activity log entry for a task change. */
export async function logActivity(
  taskId: string,
  actorId: string,
  action: string,
  diff: Record<string, unknown> = {},
): Promise<ActivityResult<ActivityLog>> {
  const { data, error } = await supabase
    .from('activity_logs')
    .insert({ task_id: taskId, actor_id: actorId, action, diff: diff as Record<string, Json> })
    .select()
    .single();
  return { data, error };
}
