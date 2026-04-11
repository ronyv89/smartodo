'use client';

import { useEffect, useState, useCallback } from 'react';
import { PriorityBadge, StatusBadge } from '@smartodo/ui';
import type { Task, Project } from '@smartodo/supabase';
import { listProjects, listTasks, createTask, updateTask, deleteTask } from '@smartodo/supabase';
import KanbanBoard from './KanbanBoard';

interface TaskListPanelProps {
  workspaceId: string;
  userId: string;
}

interface TaskFormState {
  title: string;
  priority: Task['priority'];
}

type ViewMode = 'list' | 'board';

export default function TaskListPanel({ workspaceId, userId: _userId }: TaskListPanelProps) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [activeProjectId, setActiveProjectId] = useState<string | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [taskForm, setTaskForm] = useState<TaskFormState>({ title: '', priority: 'p3' });
  const [submitting, setSubmitting] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>('list');

  const fetchTasks = useCallback(async (projectId: string) => {
    const { data } = await listTasks(projectId);
    setTasks(data ?? []);
  }, []);

  useEffect(() => {
    void (async () => {
      setLoading(true);
      const { data } = await listProjects(workspaceId);
      const projectList = data ?? [];
      setProjects(projectList);
      if (projectList.length > 0 && projectList[0] !== undefined) {
        setActiveProjectId(projectList[0].id);
        await fetchTasks(projectList[0].id);
      }
      setLoading(false);
    })();
  }, [workspaceId, fetchTasks]);

  async function handleAddTask(e: React.SyntheticEvent<HTMLFormElement>) {
    e.preventDefault();
    if (activeProjectId === null || taskForm.title.trim() === '') return;

    setSubmitting(true);
    const { data: newTask } = await createTask({
      project_id: activeProjectId,
      title: taskForm.title.trim(),
      priority: taskForm.priority,
      assignee_id: null,
      due_date: null,
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
        {/* View toggle */}
        <div className="mb-1 flex gap-1 rounded-lg border border-gray-200 p-1">
          <button
            onClick={() => {
              setViewMode('list');
            }}
            data-testid="view-list"
            className={[
              'rounded px-3 py-1 text-xs font-medium',
              viewMode === 'list' ? 'bg-blue-500 text-white' : 'text-gray-500 hover:text-gray-800',
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
              viewMode === 'board' ? 'bg-blue-500 text-white' : 'text-gray-500 hover:text-gray-800',
            ].join(' ')}
          >
            Board
          </button>
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
      {viewMode === 'board' && <KanbanBoard tasks={tasks} onTasksChange={setTasks} />}

      {/* Task list */}
      {viewMode === 'list' && (
        <ul data-testid="task-list" className="space-y-2">
          {tasks.length === 0 && (
            <li className="py-8 text-center text-sm text-gray-400" data-testid="empty-task-list">
              No tasks yet — add one above!
            </li>
          )}
          {tasks.map((task) => (
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

              {/* Title */}
              <span
                className={[
                  'flex-1 text-sm',
                  task.status === 'done' ? 'text-gray-400 line-through' : 'text-gray-800',
                ].join(' ')}
              >
                {task.title}
              </span>

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
    </div>
  );
}
