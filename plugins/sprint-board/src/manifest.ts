import type { PluginManifest } from '@smartodo/plugin-sdk';

export const sprintBoardManifest: PluginManifest = {
  id: 'smartodo.sprint-board',
  name: 'Sprint Board',
  version: '0.1.0',
  description:
    'Adds a sprint planning view — group tasks into time-boxed sprints ' +
    'and track velocity via a burndown chart.',
  permissions: ['tasks:read', 'tasks:write'],
  hooks: ['task:created', 'task:updated', 'task:completed'],
  ui_slots: ['project-tab', 'toolbar-action'],
};
