'use client';

import type { HTMLAttributes } from 'react';

export interface WorkspaceOption {
  id: string;
  name: string;
  slug: string;
}

interface WorkspaceSwitcherProps extends Omit<HTMLAttributes<HTMLDivElement>, 'onChange'> {
  workspaces: WorkspaceOption[];
  currentWorkspaceId: string | null;
  onChange: (workspaceId: string) => void;
}

export function WorkspaceSwitcher({
  workspaces,
  currentWorkspaceId,
  onChange,
  className = '',
  ...props
}: WorkspaceSwitcherProps) {
  const current = workspaces.find((w) => w.id === currentWorkspaceId);

  return (
    <div className={['relative', className].join(' ')} {...props} data-testid="workspace-switcher">
      <select
        value={currentWorkspaceId ?? ''}
        onChange={(e) => {
          onChange(e.target.value);
        }}
        aria-label="Switch workspace"
        data-testid="workspace-select"
        className="w-full cursor-pointer appearance-none rounded-lg border border-gray-200 bg-white py-2 pl-3 pr-8 text-sm font-semibold text-gray-800 shadow-sm transition focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
      >
        {workspaces.length === 0 && (
          <option value="" disabled>
            No workspaces
          </option>
        )}
        {workspaces.map((workspace) => (
          <option key={workspace.id} value={workspace.id}>
            {workspace.name}
          </option>
        ))}
      </select>
      {/* Dropdown chevron */}
      <span className="pointer-events-none absolute inset-y-0 right-2 flex items-center text-gray-400">
        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </span>
      {current !== undefined && (
        <p className="mt-1 truncate text-xs text-gray-400" data-testid="workspace-slug">
          /{current.slug}
        </p>
      )}
    </div>
  );
}
