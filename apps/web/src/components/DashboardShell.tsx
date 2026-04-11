'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { WorkspaceSwitcher } from '@smartodo/ui';
import type { WorkspaceOption } from '@smartodo/ui';
import type { Workspace } from '@smartodo/supabase';
import TaskListPanel from './TaskListPanel';

interface DashboardShellProps {
  userId: string;
  workspaces: Workspace[];
  currentWorkspaceId: string;
}

export default function DashboardShell({
  userId,
  workspaces,
  currentWorkspaceId,
}: DashboardShellProps) {
  const router = useRouter();
  const [activeWorkspaceId, setActiveWorkspaceId] = useState(currentWorkspaceId);

  const workspaceOptions: WorkspaceOption[] = workspaces.map((w) => ({
    id: w.id,
    name: w.name,
    slug: w.slug,
  }));

  function handleWorkspaceChange(id: string) {
    setActiveWorkspaceId(id);
    router.refresh();
  }

  return (
    <div className="flex min-h-screen bg-gray-50" data-testid="dashboard-shell">
      {/* ── Sidebar ── */}
      <aside
        className="flex w-64 flex-col border-r border-gray-200 bg-white px-4 py-6"
        data-testid="sidebar"
      >
        <div className="mb-6">
          <span className="text-lg font-bold text-gray-800">smarTODO</span>
        </div>

        <WorkspaceSwitcher
          workspaces={workspaceOptions}
          currentWorkspaceId={activeWorkspaceId}
          onChange={handleWorkspaceChange}
          className="mb-6"
        />

        <nav className="flex-1 space-y-1">
          <a
            href="/dashboard"
            data-testid="nav-tasks"
            className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100"
          >
            📋 Tasks
          </a>
        </nav>

        {/* Logout */}
        <form action="/auth/logout" method="POST" className="mt-auto">
          <button
            type="submit"
            data-testid="logout-button"
            className="w-full rounded-lg px-3 py-2 text-left text-sm text-gray-500 hover:bg-gray-100 hover:text-gray-800"
          >
            Sign out
          </button>
        </form>
      </aside>

      {/* ── Main content ── */}
      <main className="flex-1 px-8 py-6" data-testid="dashboard-main">
        <TaskListPanel workspaceId={activeWorkspaceId} userId={userId} />
      </main>
    </div>
  );
}
