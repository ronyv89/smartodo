'use client';

import { useEffect, useState } from 'react';
import type { Task, TaskComment } from '@smartodo/supabase';
import { PriorityBadge, StatusBadge } from '@smartodo/ui';
import { updateTask, listComments, addComment, deleteComment } from '@smartodo/supabase';

interface TaskDetailPanelProps {
  task: Task;
  userId: string;
  onClose: () => void;
  onTaskUpdate: (updated: Task) => void;
}

export default function TaskDetailPanel({
  task,
  userId,
  onClose,
  onTaskUpdate,
}: TaskDetailPanelProps) {
  const [comments, setComments] = useState<TaskComment[]>([]);
  const [commentBody, setCommentBody] = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);
  const [editingTitle, setEditingTitle] = useState(false);
  const [titleDraft, setTitleDraft] = useState(task.title);

  useEffect(() => {
    void (async () => {
      const { data } = await listComments(task.id);
      setComments(data ?? []);
    })();
  }, [task.id]);

  async function handleTitleSave() {
    if (titleDraft.trim() === task.title) {
      setEditingTitle(false);
      return;
    }
    const { data: updated } = await updateTask(task.id, { title: titleDraft.trim() });
    if (updated !== null) {
      onTaskUpdate(updated);
    }
    setEditingTitle(false);
  }

  async function handleStatusChange(status: Task['status']) {
    const completedAt = status === 'done' ? new Date().toISOString() : null;
    const { data: updated } = await updateTask(task.id, { status, completed_at: completedAt });
    if (updated !== null) {
      onTaskUpdate(updated);
    }
  }

  async function handlePriorityChange(priority: Task['priority']) {
    const { data: updated } = await updateTask(task.id, { priority });
    if (updated !== null) {
      onTaskUpdate(updated);
    }
  }

  async function handleAddComment(e: React.SyntheticEvent<HTMLFormElement>) {
    e.preventDefault();
    if (commentBody.trim() === '') return;
    setSubmittingComment(true);
    const { data: newComment } = await addComment(task.id, userId, commentBody.trim());
    if (newComment !== null) {
      setComments((prev) => [...prev, newComment]);
    }
    setCommentBody('');
    setSubmittingComment(false);
  }

  async function handleDeleteComment(commentId: string) {
    await deleteComment(commentId);
    setComments((prev) => prev.filter((c) => c.id !== commentId));
  }

  return (
    <aside
      data-testid="task-detail-panel"
      className="fixed inset-y-0 right-0 z-40 flex w-96 flex-col border-l border-gray-200 bg-white shadow-xl"
    >
      {/* Header */}
      <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
        <h2 className="text-sm font-semibold text-gray-800">Task Details</h2>
        <button
          onClick={onClose}
          data-testid="task-detail-close"
          aria-label="Close task details"
          className="text-gray-400 hover:text-gray-700"
        >
          ✕
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-6 py-4">
        {/* Title */}
        <div className="mb-4">
          {editingTitle ? (
            <div className="flex gap-2">
              <input
                autoFocus
                value={titleDraft}
                onChange={(e) => {
                  setTitleDraft(e.target.value);
                }}
                onBlur={() => void handleTitleSave()}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') void handleTitleSave();
                  if (e.key === 'Escape') {
                    setTitleDraft(task.title);
                    setEditingTitle(false);
                  }
                }}
                data-testid="task-title-edit"
                className="flex-1 rounded-lg border border-blue-300 px-3 py-1.5 text-sm font-medium text-gray-800 outline-none focus:ring-2 focus:ring-blue-100"
              />
            </div>
          ) : (
            <button
              onClick={() => {
                setEditingTitle(true);
              }}
              data-testid="task-title-display"
              className="block w-full rounded-lg px-1 py-1 text-left text-base font-semibold text-gray-800 hover:bg-gray-50"
            >
              {task.title}
            </button>
          )}
        </div>

        {/* Status */}
        <div className="mb-4">
          <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-gray-500">
            Status
          </label>
          <select
            value={task.status}
            onChange={(e) => void handleStatusChange(e.target.value as Task['status'])}
            data-testid="task-status-select"
            className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
          >
            <option value="todo">To Do</option>
            <option value="in_progress">In Progress</option>
            <option value="done">Done</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>

        {/* Priority */}
        <div className="mb-4">
          <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-gray-500">
            Priority
          </label>
          <div className="flex gap-2">
            {(['p1', 'p2', 'p3', 'p4'] as Task['priority'][]).map((p) => (
              <button
                key={p}
                onClick={() => void handlePriorityChange(p)}
                data-testid={`priority-${p}`}
                className={[
                  'rounded-lg border px-3 py-1 text-xs font-semibold transition',
                  task.priority === p
                    ? 'border-blue-400 bg-blue-50 text-blue-700'
                    : 'border-gray-200 text-gray-500 hover:border-gray-300',
                ].join(' ')}
              >
                <PriorityBadge priority={p} />
              </button>
            ))}
          </div>
        </div>

        {/* Status badge summary */}
        <div className="mb-6 flex gap-2">
          <StatusBadge status={task.status} />
        </div>

        {/* Comments */}
        <div>
          <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-gray-500">
            Comments ({comments.length})
          </h3>

          <ul data-testid="comment-list" className="mb-4 space-y-3">
            {comments.length === 0 && (
              <li className="text-sm text-gray-400" data-testid="no-comments">
                No comments yet.
              </li>
            )}
            {comments.map((comment) => (
              <li
                key={comment.id}
                data-testid={`comment-${comment.id}`}
                className="rounded-lg bg-gray-50 px-4 py-3"
              >
                <p className="mb-1 text-sm text-gray-800">{comment.body}</p>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-400">
                    {new Date(comment.created_at).toLocaleDateString()}
                  </span>
                  {comment.author_id === userId && (
                    <button
                      onClick={() => void handleDeleteComment(comment.id)}
                      aria-label="Delete comment"
                      data-testid={`delete-comment-${comment.id}`}
                      className="text-xs text-gray-300 hover:text-red-400"
                    >
                      Delete
                    </button>
                  )}
                </div>
              </li>
            ))}
          </ul>

          {/* Add comment form */}
          <form
            onSubmit={(e) => void handleAddComment(e)}
            data-testid="add-comment-form"
            className="space-y-2"
          >
            <textarea
              value={commentBody}
              onChange={(e) => {
                setCommentBody(e.target.value);
              }}
              placeholder="Add a comment…"
              rows={3}
              data-testid="comment-input"
              className="w-full resize-none rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-100"
            />
            <button
              type="submit"
              disabled={submittingComment || commentBody.trim() === ''}
              data-testid="add-comment-submit"
              className="btn-smartodo-primary rounded-lg px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
            >
              Comment
            </button>
          </form>
        </div>
      </div>
    </aside>
  );
}
