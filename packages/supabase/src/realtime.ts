import { supabase } from './client';
import type { RealtimeChannel } from '@supabase/supabase-js';
import type { Task } from './tasks';

export type RealtimeTaskEvent = 'INSERT' | 'UPDATE' | 'DELETE';

export interface TaskRealtimePayload {
  event: RealtimeTaskEvent;
  new: Task | null;
  old: Partial<Task> | null;
}

/**
 * Subscribes to Realtime changes on the tasks table for a given project.
 * Returns the channel so the caller can unsubscribe when the component unmounts.
 */
export function subscribeToProjectTasks(
  projectId: string,
  onEvent: (payload: TaskRealtimePayload) => void,
): RealtimeChannel {
  const channel = supabase
    .channel(`tasks:project_id=eq.${projectId}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'tasks',
        filter: `project_id=eq.${projectId}`,
      },
      (payload) => {
        onEvent({
          event: payload.eventType as RealtimeTaskEvent,
          new: Object.keys(payload.new).length > 0 ? (payload.new as Task) : null,
          old: Object.keys(payload.old).length > 0 ? (payload.old as Partial<Task>) : null,
        });
      },
    )
    .subscribe();

  return channel;
}

/** Removes (unsubscribes) a Realtime channel. */
export async function unsubscribeChannel(channel: RealtimeChannel): Promise<void> {
  await supabase.removeChannel(channel);
}
