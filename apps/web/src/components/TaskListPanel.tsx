'use client';

import { useEffect, useState, useCallback } from 'react';
import { PriorityBadge, StatusBadge } from '@smartodo/ui';
import type { Task, Project } from '@smartodo/supabase';
import {
  listProjects,
  listTasks,
  createTask,
  updateTask,
  deleteTask,
  subscribeToProjectTasks,
  unsubscribeChannel,
} from '@smartodo/supabase';
import type { RealtimeChannel } from '@smartodo/supabase';
import { parseTaskInput } from '@smartodo/core';
import KanbanBoard from './KanbanBoard';
import TaskDetailPanel from './TaskDetailPanel';
import CommandPalette from './CommandPalette';
import StandupWidget from './StandupWidget';
import type { FilterSpec, UpdateSpec } from '@/app/api/ai/command/route';

interface TaskListPanelProps {
  workspaceId: string;
  userId: string;
}

interface TaskFormState {
  title: string;
  priority: Task['priority'];
}

type ViewMode = 'list' | 'board';

export default function TaskListPanel({ workspaceId, userId }: TaskListPanelProps) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [activeProjectId, setActiveProjectId] = useState<string | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [taskForm, setTaskForm] = useState<TaskFormState>({ title: '', priority: 'p3' });
  const [submitting, setSubmitting] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);
  const [activeFilter, setActiveFilter] = useState<{
    filters: FilterSpec;
    description: string;
  } | null>(null);

  const fetchTasks = useCallback(async (projectId: string) => {
    const { data } = await listTasks(projectId);
    setTasks(data ?? []);
  }, []);

  // Cmd+K / Ctrl+K → open command palette
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setCommandPaletteOpen((prev) => !prev);
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  function handleApplyFilter(filters: FilterSpec, description: string) {
    setActiveFilter({ filters, description });
  }

  async function handleBatchUpdate(filterSpec: FilterSpec, update: UpdateSpec) {
    const toUpdate = tasks.filter((t) => {
      if (typeof filterSpec.status === 'string' && t.status !== filterSpec.status) return false;
      if (typeof filterSpec.priority === 'string' && t.priority !== filterSpec.priority)
        return false;
      if (
        typeof filterSpec.titleContains === 'string' &&
        !t.title.toLowerCase().includes(filterSpec.titleContains.toLowerCase())
      )
        return false;
      if (
        typeof filterSpec.dueBefore === 'string' &&
        (t.due_date === null || t.due_date > filterSpec.dueBefore)
      )
        return false;
      if (
        typeof filterSpec.dueAfter === 'string' &&
        (t.due_date === null || t.due_date < filterSpec.dueAfter)
      )
        return false;
      return true;
    });
    await Promise.all(
      toUpdate.map((t) =>
        updateTask(t.id, {
          ...(typeof update.status === 'string' ? { status: update.status as Task['status'] } : {}),
          ...(typeof update.priority === 'string'
            ? { priority: update.priority as Task['priority'] }
            : {}),
        }),
      ),
    );
    if (activeProjectId !== null) {
      await fetchTasks(activeProjectId);
    }
  }

  const filteredTasks =
    activeFilter !== null
      ? tasks.filter((t) => {
          const f = activeFilter.filters;
          if (typeof f.status === 'string' && t.status !== f.status) return false;
          if (typeof f.priority === 'string' && t.priority !== f.priority) return false;
          if (
            typeof f.titleContains === 'string' &&
            !t.title.toLowerCase().includes(f.titleContains.toLowerCase())
          )
            return false;
          if (typeof f.dueBefore === 'string' && (t.due_date === null || t.due_date > f.dueBefore))
            return false;
          if (typeof f.dueAfter === 'string' && (t.due_date === null || t.due_date < f.dueAfter))
            return false;
          return true;
        })
      : tasks;

  useEffect(() => {
    let channel: RealtimeChannel | null = null;

    void (async () => {
      setLoading(true);
      const { data } = await listProjects(workspaceId);
      const projectList = data ?? [];
      setProjects(projectList);
      const firstProject = projectList[0];
      if (firstProject !== undefined) {
        setActiveProjectId(firstProject.id);
        await fetchTasks(firstProject.id);
        // Subscribe to realtime updates for this project
        channel = subscribeToProjectTasks(firstProject.id, (payload) => {
          const newTask = payload.new;
          const oldTask = payload.old;
          if (payload.event === 'INSERT' && newTask !== null) {
            setTasks((prev) => {
              const exists = prev.some((t) => t.id === newTask.id);
              return exists ? prev : [...prev, newTask];
            });
          } else if (payload.event === 'UPDATE' && newTask !== null) {
            setTasks((prev) => prev.map((t) => (t.id === newTask.id ? newTask : t)));
          } else if (payload.event === 'DELETE' && oldTask !== null) {
            setTasks((prev) => prev.filter((t) => t.id !== oldTask.id));
          }
        });
      }
      setLoading(false);
    })();

    return () => {
      if (channel !== null) {
        void unsubscribeChannel(channel);
      }
    };
  }, [workspaceId, fetchTasks]);

  async function handleAddTask(e: React.SyntheticEvent<HTMLFormElement>) {
    e.preventDefault();
    if (activeProjectId === null || taskForm.title.trim() === '') return;

    setSubmitting(true);
    // Parse natural-language input (CE regex parser)
    const parsed = parseTaskInput(taskForm.title);
    const { data: newTask } = await createTask({
      project_id: activeProjectId,
      title: parsed.title,
      priority: parsed.priority ?? taskForm.priority,
      assignee_id: null,
      due_date: parsed.due_date,
    });
    if (newTask !== null) {
      setTasks((prev) => [...prev, newTask]);
    }
    setTaskForm({ title: '', priority: 'p3' });
    setSubmitting(false);
  }

  async function handleStatusChange(taskId: string, status: Task['status']) {
    const completedAt = status === 'done' ? new Date().toISOString() : null;
    const { data: updated } = await updateTask(taskId, { status, completed_at: completedAt });
    if (updated !== null) {
      setTasks((prev) => prev.map((t) => (t.id === taskId ? updated : t)));
    }
  }

  async function handleDelete(taskId: string) {
    await deleteTask(taskId);
    setTasks((prev) => prev.filter((t) => t.id !== taskId));
    if (selectedTask?.id === taskId) setSelectedTask(null);
  }

  function handleTaskUpdate(updated: Task) {
    setTasks((prev) => prev.map((t) => (t.id === updated.id ? updated : t)));
    setSelectedTask(updated);
  }

  if (loading) {
    return (
      <div data-testid="task-list-loading" className="flex items-center justify-center py-20">
        <span className="text-gray-400">Loading…</span>
      </div>
    );
  }

  if (projects.length === 0) {
    return (
      <div data-testid="no-projects" className="py-20 text-center text-gray-400">
        <p className="mb-4 text-lg">No projects yet</p>
        <p className="text-sm">Create a project to start managing tasks.</p>
      </div>
    );
  }

  return (
    <div data-testid="task-list-panel">
      {/* Command palette (Cmd+K) */}
      {commandPaletteOpen && (
        <CommandPalette
          tasks={tasks}
          onApplyFilter={handleApplyFilter}
          onBatchUpdate={(filters, update) => void handleBatchUpdate(filters, update)}
          onClose={() => {
            setCommandPaletteOpen(false);
          }}
        />
      )}

      {/* Active filter banner */}
      {activeFilter !== null && (
        <div
          data-testid="active-filter-banner"
          className="mb-4 flex items-center justify-between rounded-lg bg-blue-50 px-4 py-2 text-sm text-blue-700"
        >
          <span>Filtered: {activeFilter.description}</span>
          <button
            onClick={() => {
              setActiveFilter(null);
            }}
            data-testid="clear-filter"
            className="ml-4 text-xs font-medium text-blue-500 hover:text-blue-700"
          >
            Clear
          </button>
        </div>
      )}

      {/* Header: project tabs + view toggle */}
      <div className="mb-6 flex items-end justify-between border-b border-gray-200">
        <div className="flex gap-2">
          {projects.map((project) => (
            <button
              key={project.id}
              onClick={() => {
                setActiveProjectId(project.id);
                void fetchTasks(project.id);
              }}
              data-testid={`project-tab-${project.id}`}
              className={[
                'border-b-2 px-4 py-2 text-sm font-medium transition-colors',
                activeProjectId === project.id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-800',
              ].join(' ')}
            >
              {project.name}
            </button>
          ))}
        </div>
        {/* View toggle + command palette trigger */}
        <div className="mb-1 flex items-center gap-2">
          <button
            onClick={() => {
              setCommandPaletteOpen(true);
            }}
            data-testid="open-command-palette"
            className="flex items-center gap-1 rounded-lg border border-gray-200 px-3 py-1 text-xs font-medium text-gray-500 hover:border-gray-300 hover:text-gray-800"
            title="Open command palette (⌘K)"
          >
            <span>⌘K</span>
          </button>
          <div className="flex gap-1 rounded-lg border border-gray-200 p-1">
            <button
              onClick={() => {
                setViewMode('list');
              }}
              data-testid="view-list"
              className={[
                'rounded px-3 py-1 text-xs font-medium',
                viewMode === 'list'
                  ? 'bg-blue-500 text-white'
                  : 'text-gray-500 hover:text-gray-800',
              ].join(' ')}
            >
              List
            </button>
            <button
              onClick={() => {
                setViewMode('board');
              }}
              data-testid="view-board"
              className={[
                'rounded px-3 py-1 text-xs font-medium',
                viewMode === 'board'
                  ? 'bg-blue-500 text-white'
                  : 'text-gray-500 hover:text-gray-800',
              ].join(' ')}
            >
              Board
            </button>
          </div>
        </div>
      </div>

      {/* Add task form */}
      <form
        onSubmit={(e) => void handleAddTask(e)}
        data-testid="add-task-form"
        className="card-smartodo mb-6 flex gap-3 rounded-lg bg-white p-4"
      >
        <input
          type="text"
          placeholder="Add a task…"
          value={taskForm.title}
          onChange={(e) => {
            setTaskForm((prev) => ({ ...prev, title: e.target.value }));
          }}
          data-testid="task-title-input"
          className="flex-1 rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-100"
        />
        <select
          value={taskForm.priority}
          onChange={(e) => {
            setTaskForm((prev) => ({
              ...prev,
              priority: e.target.value as Task['priority'],
            }));
          }}
          data-testid="task-priority-select"
          className="rounded-lg border border-gray-200 px-2 py-2 text-sm outline-none"
        >
          <option value="p1">P1</option>
          <option value="p2">P2</option>
          <option value="p3">P3</option>
          <option value="p4">P4</option>
        </select>
        <button
          type="submit"
          disabled={submitting}
          data-testid="add-task-submit"
          className="btn-smartodo-primary rounded-lg px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
        >
          Add
        </button>
      </form>

      {/* Kanban board */}
      {viewMode === 'board' && <KanbanBoard tasks={filteredTasks} onTasksChange={setTasks} />}

      {/* Task list */}
      {viewMode === 'list' && (
        <ul data-testid="task-list" className="space-y-2">
          {filteredTasks.length === 0 && (
            <li className="py-8 text-center text-sm text-gray-400" data-testid="empty-task-list">
              {activeFilter !== null
                ? 'No tasks match the current filter.'
                : 'No tasks yet — add one above!'}
            </li>
          )}
          {filteredTasks.map((task) => (
            <li
              key={task.id}
              data-testid={`task-item-${task.id}`}
              className="card-smartodo flex items-center gap-3 rounded-lg bg-white px-4 py-3"
            >
              {/* Status toggle */}
              <input
                type="checkbox"
                checked={task.status === 'done'}
                onChange={(e) => {
                  void handleStatusChange(task.id, e.target.checked ? 'done' : 'todo');
                }}
                aria-label={`Mark "${task.title}" as ${task.status === 'done' ? 'todo' : 'done'}`}
                className="h-4 w-4 cursor-pointer rounded border-gray-300 accent-blue-500"
              />

              {/* Title — click to open detail panel */}
              <button
                onClick={() => {
                  setSelectedTask(task);
                }}
                data-testid={`task-title-${task.id}`}
                className={[
                  'flex-1 text-left text-sm',
                  task.status === 'done' ? 'text-gray-400 line-through' : 'text-gray-800',
                ].join(' ')}
              >
                {task.title}
              </button>

              {/* Badges */}
              <PriorityBadge priority={task.priority} />
              <StatusBadge status={task.status} />

              {/* Delete */}
              <button
                onClick={() => void handleDelete(task.id)}
                aria-label={`Delete "${task.title}"`}
                data-testid={`delete-task-${task.id}`}
                className="ml-2 text-gray-300 hover:text-red-400"
              >
                ✕
              </button>
            </li>
          ))}
        </ul>
      )}

      {/* Task detail panel (slide-in from right) */}
      {selectedTask !== null && (
        <TaskDetailPanel
          task={selectedTask}
          userId={userId}
          workspaceId={workspaceId}
          onClose={() => {
            setSelectedTask(null);
          }}
          onTaskUpdate={handleTaskUpdate}
        />
      )}

      {/* Standup / insights widget */}
      <div className="mt-8">
        <StandupWidget
          tasks={tasks}
          project={projects.find((p) => p.id === activeProjectId) ?? null}
        />
      </div>
    </div>
  );
}
