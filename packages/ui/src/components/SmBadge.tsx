import type { HTMLAttributes } from 'react';
import type { TaskPriority, TaskStatus } from '@smartodo/core';

type BadgeColor = 'primary' | 'success' | 'warning' | 'danger' | 'info' | 'secondary';

interface SmBadgeProps extends HTMLAttributes<HTMLSpanElement> {
  color?: BadgeColor;
  pill?: boolean;
}

const PRIORITY_COLOR_MAP: Record<TaskPriority, BadgeColor> = {
  p1: 'danger',
  p2: 'warning',
  p3: 'primary',
  p4: 'secondary',
};

const STATUS_COLOR_MAP: Record<TaskStatus, BadgeColor> = {
  todo: 'secondary',
  in_progress: 'info',
  done: 'success',
  cancelled: 'secondary',
};

const COLOR_CLASSES: Record<BadgeColor, string> = {
  primary: 'bg-blue-100 text-blue-700',
  success: 'bg-green-100 text-green-700',
  warning: 'bg-orange-100 text-orange-700',
  danger: 'bg-red-100 text-red-700',
  info: 'bg-teal-100 text-teal-700',
  secondary: 'bg-gray-100 text-gray-600',
};

export function SmBadge({
  color = 'primary',
  pill = false,
  className = '',
  children,
  ...props
}: SmBadgeProps) {
  return (
    <span
      className={[
        'inline-flex items-center px-2.5 py-0.5 text-xs font-semibold',
        pill ? 'rounded-full' : 'rounded',
        COLOR_CLASSES[color],
        className,
      ].join(' ')}
      {...props}
    >
      {children}
    </span>
  );
}

// Convenience helpers
export function PriorityBadge({
  priority,
  ...props
}: Omit<SmBadgeProps, 'color'> & { priority: TaskPriority }) {
  return (
    <SmBadge color={PRIORITY_COLOR_MAP[priority]} pill {...props}>
      {priority.toUpperCase()}
    </SmBadge>
  );
}

export function StatusBadge({
  status,
  ...props
}: Omit<SmBadgeProps, 'color'> & { status: TaskStatus }) {
  return (
    <SmBadge color={STATUS_COLOR_MAP[status]} pill {...props}>
      {status.replace('_', ' ')}
    </SmBadge>
  );
}
