export const TASK_STATUS = ['todo', 'in_progress', 'done', 'cancelled'] as const;
export const TASK_PRIORITY = ['p1', 'p2', 'p3', 'p4'] as const;
export const WORKSPACE_ROLES = ['admin', 'member', 'viewer'] as const;
export const PLAN_TIERS = ['community', 'pro'] as const;
export const VIEW_DEFAULTS = ['list', 'board'] as const;

export const BRAND_COLORS = {
  primary: '#5e72e4',
  success: '#2dce89',
  warning: '#fb6340',
  info: '#11cdef',
  danger: '#f5365c',
} as const;

export const PRIORITY_COLORS: Record<string, string> = {
  p1: '#f5365c',
  p2: '#fb6340',
  p3: '#5e72e4',
  p4: '#adb5bd',
};
