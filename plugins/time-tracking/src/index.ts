// @smartodo/plugin-time-tracking — Time Tracking plugin for smarTODO
import type { PluginDefinition } from '@smartodo/plugin-sdk';
import { timeTrackingManifest } from './manifest';
import { TimeTrackingBadge } from './TimeTrackingBadge';
import { TimeTrackingSidebar } from './TimeTrackingSidebar';
import { onTaskUpdated, onTaskCompleted } from './hooks';

export { timeTrackingManifest } from './manifest';
export { TimeTrackingBadge } from './TimeTrackingBadge';
export { TimeTrackingSidebar } from './TimeTrackingSidebar';
export { onTaskUpdated, onTaskCompleted } from './hooks';

/**
 * Fully assembled PluginDefinition ready to pass to `pluginRegistry.register()`.
 *
 * ```ts
 * import { timeTrackingPlugin } from '@smartodo/plugin-time-tracking';
 * pluginRegistry.register(timeTrackingPlugin);
 * ```
 */
export const timeTrackingPlugin: PluginDefinition = {
  manifest: timeTrackingManifest,
  hooks: {
    'task:updated': onTaskUpdated,
    'task:completed': onTaskCompleted,
  },
  slotComponents: {
    'task-card-badge': TimeTrackingBadge,
    'task-detail-sidebar': TimeTrackingSidebar,
  },
};
