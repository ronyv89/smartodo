// Plugin SDK types — full implementation in Phase 3
import type { Task, Workspace, Profile } from '@smartodo/core';

export type HookEvent =
  | 'task:created'
  | 'task:updated'
  | 'task:completed'
  | 'task:deleted';

export type UISlotName =
  | 'task-detail-sidebar'
  | 'task-card-badge'
  | 'project-tab'
  | 'workspace-settings-section'
  | 'toolbar-action';

export interface PluginManifest {
  id: string;
  name: string;
  version: string;
  description: string;
  permissions: string[];
  hooks: HookEvent[];
  ui_slots: UISlotName[];
}

export interface PluginContext {
  workspace: Workspace;
  currentUser: Profile;
}

export interface HookPayload {
  'task:created': { task: Task };
  'task:updated': { task: Task; previous: Task };
  'task:completed': { task: Task };
  'task:deleted': { taskId: string };
}

export interface CustomFieldDefinition {
  key: string;
  label: string;
  type: 'text' | 'number' | 'select' | 'date' | 'boolean';
  options?: string[];
  default?: unknown;
}
