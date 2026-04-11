import type { HookHandler } from '@smartodo/plugin-sdk';

/**
 * Called when any task is created — the sprint board plugin can use this to
 * auto-assign new tasks to the active sprint in a real implementation.
 */
export const onTaskCreated: HookHandler<'task:created'> = ({ task }) => {
  // In a full implementation this would call a sprint API.
  // For now we just log so the hook system can be exercised in tests.
  console.warn(`[sprint-board] task created: ${task.id}`);
};

/**
 * Called when a task is updated — keeps sprint metadata in sync.
 */
export const onTaskUpdated: HookHandler<'task:updated'> = ({ task }) => {
  console.warn(`[sprint-board] task updated: ${task.id}`);
};

/**
 * Called when a task is completed — increments the sprint's velocity counter.
 */
export const onTaskCompleted: HookHandler<'task:completed'> = ({ task }) => {
  console.warn(`[sprint-board] task completed: ${task.id}`);
};
