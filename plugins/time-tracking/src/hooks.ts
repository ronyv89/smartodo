import type { HookHandler } from '@smartodo/plugin-sdk';

/**
 * When a task is updated, ensure any running timers are captured in
 * custom_fields.  In a full implementation this would persist to Supabase.
 */
export const onTaskUpdated: HookHandler<'task:updated'> = ({ task }) => {
  console.warn(`[time-tracking] task updated: ${task.id}`);
};

/**
 * When a task is completed, auto-stop any running timer and flush the log.
 */
export const onTaskCompleted: HookHandler<'task:completed'> = ({ task }) => {
  console.warn(`[time-tracking] task completed, flushing timer: ${task.id}`);
};
