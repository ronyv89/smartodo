// @smartodo/plugin-sprint-board — Sprint Board plugin for smarTODO
import type { PluginDefinition } from '@smartodo/plugin-sdk';
import { sprintBoardManifest } from './manifest';
import { SprintBoardTab } from './SprintBoardTab';
import { SprintBoardToolbarButton } from './SprintBoardToolbarButton';
import { onTaskCreated, onTaskUpdated, onTaskCompleted } from './hooks';

export { sprintBoardManifest } from './manifest';
export { SprintBoardTab } from './SprintBoardTab';
export { SprintBoardToolbarButton } from './SprintBoardToolbarButton';
export { onTaskCreated, onTaskUpdated, onTaskCompleted } from './hooks';

/**
 * Fully assembled PluginDefinition ready to pass to `pluginRegistry.register()`.
 *
 * ```ts
 * import { sprintBoardPlugin } from '@smartodo/plugin-sprint-board';
 * pluginRegistry.register(sprintBoardPlugin);
 * ```
 */
export const sprintBoardPlugin: PluginDefinition = {
  manifest: sprintBoardManifest,
  hooks: {
    'task:created': onTaskCreated,
    'task:updated': onTaskUpdated,
    'task:completed': onTaskCompleted,
  },
  slotComponents: {
    'project-tab': SprintBoardTab,
    'toolbar-action': SprintBoardToolbarButton,
  },
};
