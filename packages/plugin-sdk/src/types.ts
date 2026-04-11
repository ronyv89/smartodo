// Plugin SDK types — full implementation in Phase 3
import type { ReactNode } from 'react';
import type { Task, Workspace, Profile } from '@smartodo/core';

export type HookEvent = 'task:created' | 'task:updated' | 'task:completed' | 'task:deleted';

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

/**
 * A React component contributed by a plugin for a named UI slot.
 * Receives forwarded slot props from the host.
 */
export type SlotComponentProps = Record<string, unknown>;
export type SlotComponent = (props: SlotComponentProps) => ReactNode;

export interface CustomFieldDefinition {
  key: string;
  label: string;
  type: 'text' | 'number' | 'select' | 'date' | 'boolean';
  options?: string[];
  default?: unknown;
}
