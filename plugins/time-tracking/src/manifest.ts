import type { PluginManifest } from '@smartodo/plugin-sdk';

export const timeTrackingManifest: PluginManifest = {
  id: 'smartodo.time-tracking',
  name: 'Time Tracking',
  version: '0.1.0',
  description:
    'Log time spent on tasks with start/stop timers. ' +
    'Displays a live badge on task cards and a summary panel in task details.',
  permissions: ['tasks:read', 'tasks:write'],
  hooks: ['task:updated', 'task:completed'],
  ui_slots: ['task-card-badge', 'task-detail-sidebar'],
};
