'use client';

import { useState, useCallback } from 'react';
import { PriorityBadge } from '@smartodo/ui';
import type { Task } from '@smartodo/supabase';
import { updateTask, deleteTask } from '@smartodo/supabase';

const COLUMNS: { status: Task['status']; label: string; color: string }[] = [
  { status: 'todo', label: 'To Do', color: 'bg-gray-100' },
  { status: 'in_progress', label: 'In Progress', color: 'bg-blue-50' },
  { status: 'done', label: 'Done', color: 'bg-green-50' },
  { status: 'cancelled', label: 'Cancelled', color: 'bg-red-50' },
];

interface KanbanBoardProps {
  tasks: Task[];
  onTasksChange: (tasks: Task[]) => void;
}

export default function KanbanBoard({ tasks, onTasksChange }: KanbanBoardProps) {
  const [draggingId, setDraggingId] = useState<string | null>(null);

  const tasksByStatus = useCallback(
    (status: Task['status']) => tasks.filter((t) => t.status === status),
    [tasks],
  );

  async function handleDrop(e: React.DragEvent<HTMLDivElement>, status: Task['status']) {
    e.preventDefault();
    if (draggingId === null) return;
    const completedAt = status === 'done' ? new Date().toISOString() : null;
    const { data: updated } = await updateTask(draggingId, { status, completed_at: completedAt });
    if (updated !== null) {
      onTasksChange(tasks.map((t) => (t.id === draggingId ? updated : t)));
    }
    setDraggingId(null);
  }

  async function handleDelete(taskId: string) {
    await deleteTask(taskId);
    onTasksChange(tasks.filter((t) => t.id !== taskId));
  }

  return (
    <div
      data-testid="kanban-board"
      className="grid grid-cols-4 gap-4"
      style={{ minHeight: '60vh' }}
    >
      {COLUMNS.map(({ status, label, color }) => (
        <div
          key={status}
          data-testid={`kanban-column-${status}`}
          className={['rounded-xl p-3', color].join(' ')}
          onDragOver={(e) => {
            e.preventDefault();
          }}
          onDrop={(e) => void handleDrop(e, status)}
        >
          {/* Column header */}
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-600">{label}</h3>
            <span className="rounded-full bg-white px-2 py-0.5 text-xs font-semibold text-gray-500 shadow-sm">
              {tasksByStatus(status).length}
            </span>
          </div>

          {/* Task cards */}
          <div className="space-y-2">
            {tasksByStatus(status).map((task) => (
              <div
                key={task.id}
                draggable
                onDragStart={() => {
                  setDraggingId(task.id);
                }}
                onDragEnd={() => {
                  setDraggingId(null);
                }}
                data-testid={`kanban-task-${task.id}`}
                className={[
                  'card-smartodo cursor-grab rounded-lg bg-white p-3 shadow-sm transition-opacity active:cursor-grabbing',
                  draggingId === task.id ? 'opacity-40' : '',
                ].join(' ')}
              >
                <div className="mb-2 flex items-start justify-between gap-2">
                  <p className="flex-1 text-sm font-medium text-gray-800">{task.title}</p>
                  <button
                    onClick={() => void handleDelete(task.id)}
                    aria-label={`Delete "${task.title}"`}
                    data-testid={`kanban-delete-${task.id}`}
                    className="text-gray-300 hover:text-red-400"
                  >
                    ✕
                  </button>
                </div>
                <div className="flex items-center gap-2">
                  <PriorityBadge priority={task.priority} />
                  {task.due_date !== null && (
                    <span className="text-xs text-gray-400">{task.due_date}</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
