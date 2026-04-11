// Core domain types — all entities defined here
export type TaskStatus = 'todo' | 'in_progress' | 'done' | 'cancelled';
export type TaskPriority = 'p1' | 'p2' | 'p3' | 'p4';
export type WorkspaceRole = 'admin' | 'member' | 'viewer';
export type PlanTier = 'community' | 'pro';
export type ViewDefault = 'list' | 'board';

export interface Profile {
  id: string;
  full_name: string;
  avatar_url: string | null;
  preferences: Record<string, unknown>;
  created_at: string;
}

export interface Workspace {
  id: string;
  name: string;
  slug: string;
  owner_id: string;
  settings: Record<string, unknown>;
  plan_tier: PlanTier;
  created_at: string;
}

export interface WorkspaceMember {
  id: string;
  workspace_id: string;
  user_id: string;
  role: WorkspaceRole;
  joined_at: string;
}

export interface Project {
  id: string;
  workspace_id: string;
  name: string;
  description: string | null;
  color: string;
  view_default: ViewDefault;
  sort_order: number;
  archived: boolean;
  created_at: string;
}

export interface Task {
  id: string;
  project_id: string;
  parent_id: string | null;
  assignee_id: string | null;
  title: string;
  description: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  due_date: string | null;
  sort_order: number;
  custom_fields: Record<string, unknown>;
  ai_metadata: Record<string, unknown>;
  created_at: string;
  completed_at: string | null;
}

export interface Label {
  id: string;
  workspace_id: string;
  name: string;
  color: string;
}

export interface TaskLabel {
  task_id: string;
  label_id: string;
}

export interface TaskComment {
  id: string;
  task_id: string;
  author_id: string;
  body: string;
  created_at: string;
}

export interface TaskAttachment {
  id: string;
  task_id: string;
  file_path: string;
  file_name: string;
  file_size: number | null;
  uploaded_at: string;
}

export interface ActivityLog {
  id: string;
  workspace_id: string;
  task_id: string | null;
  actor_id: string;
  action: string;
  metadata: Record<string, unknown>;
  created_at: string;
}
