'use client';

import { useEffect, useRef, useState } from 'react';
import type { Task, TaskComment, ActivityLog, Label, TaskAttachment } from '@smartodo/supabase';
import { PriorityBadge, StatusBadge } from '@smartodo/ui';
import {
  updateTask,
  listComments,
  addComment,
  deleteComment,
  listActivityLogs,
  logActivity,
  listLabels,
  listAttachments,
  uploadAttachment,
  deleteAttachment,
  getAttachmentUrl,
  createTask,
} from '@smartodo/supabase';
import type { SuggestLabelsResponse } from '@/app/api/ai/suggest-labels/route';
import type { BreakdownResponse, SubtaskSuggestion } from '@/app/api/ai/breakdown/route';

interface TaskDetailPanelProps {
  task: Task;
  userId: string;
  workspaceId: string;
  onClose: () => void;
  onTaskUpdate: (updated: Task) => void;
}

export default function TaskDetailPanel({
  task,
  userId,
  workspaceId,
  onClose,
  onTaskUpdate,
}: TaskDetailPanelProps) {
  const [comments, setComments] = useState<TaskComment[]>([]);
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([]);
  const [commentBody, setCommentBody] = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);
  const [editingTitle, setEditingTitle] = useState(false);
  const [titleDraft, setTitleDraft] = useState(task.title);
  const [workspaceLabels, setWorkspaceLabels] = useState<Label[]>([]);
  const [suggestedLabels, setSuggestedLabels] = useState<Label[]>([]);
  const [suggestingLabels, setSuggestingLabels] = useState(false);
  const [suggestedSubtasks, setSuggestedSubtasks] = useState<SubtaskSuggestion[]>([]);
  const [breakingDown, setBreakingDown] = useState(false);
  const [creatingSubtasks, setCreatingSubtasks] = useState(false);
  const [attachments, setAttachments] = useState<TaskAttachment[]>([]);
  const [uploadingFile, setUploadingFile] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    void (async () => {
      const [commentsResult, logsResult, labelsResult, attachmentsResult] = await Promise.all([
        listComments(task.id),
        listActivityLogs(task.id),
        listLabels(workspaceId),
        listAttachments(task.id),
      ]);
      setComments(commentsResult.data ?? []);
      setActivityLogs(logsResult.data ?? []);
      setWorkspaceLabels(labelsResult.data ?? []);
      setAttachments(attachmentsResult.data ?? []);
    })();
  }, [task.id, workspaceId]);

  async function handleSuggestLabels() {
    setSuggestingLabels(true);
    setSuggestedLabels([]);
    try {
      const res = await fetch('/api/ai/suggest-labels', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ taskTitle: task.title, labels: workspaceLabels }),
      });
      const json = (await res.json()) as SuggestLabelsResponse;
      setSuggestedLabels(json.suggestions);
    } finally {
      setSuggestingLabels(false);
    }
  }

  async function handleBreakdown() {
    setBreakingDown(true);
    setSuggestedSubtasks([]);
    try {
      const res = await fetch('/api/ai/breakdown', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ taskTitle: task.title }),
      });
      const json = (await res.json()) as BreakdownResponse;
      setSuggestedSubtasks(json.subtasks);
    } finally {
      setBreakingDown(false);
    }
  }

  async function handleAcceptSubtasks() {
    setCreatingSubtasks(true);
    await Promise.all(
      suggestedSubtasks.map((sub) =>
        createTask({
          project_id: task.project_id,
          parent_id: task.id,
          title: sub.title,
          priority: (sub.priority as Task['priority'] | undefined) ?? 'p3',
          assignee_id: null,
          due_date: null,
        }),
      ),
    );
    setSuggestedSubtasks([]);
    setCreatingSubtasks(false);
  }

  async function handleFileUpload(files: FileList | null) {
    if (files === null || files.length === 0) return;
    setUploadingFile(true);
    await Promise.all(
      Array.from(files).map(async (file) => {
        const { data } = await uploadAttachment(task.id, userId, file);
        if (data !== null) {
          setAttachments((prev) => [...prev, data]);
        }
      }),
    );
    setUploadingFile(false);
  }

  async function handleDeleteAttachment(attachment: TaskAttachment) {
    await deleteAttachment(attachment);
    setAttachments((prev) => prev.filter((a) => a.id !== attachment.id));
  }

  async function handleOpenAttachment(attachment: TaskAttachment) {
    const { data: url } = await getAttachmentUrl(attachment.storage_path);
    if (typeof url === 'string') {
      window.open(url, '_blank', 'noopener,noreferrer');
    }
  }

  async function handleTitleSave() {
    const newTitle = titleDraft.trim();
    if (newTitle === task.title) {
      setEditingTitle(false);
      return;
    }
    const [{ data: updated }] = await Promise.all([
      updateTask(task.id, { title: newTitle }),
      logActivity(task.id, userId, 'title_changed', { from: task.title, to: newTitle }),
    ]);
    if (updated !== null) {
      onTaskUpdate(updated);
    }
    setEditingTitle(false);
  }

  async function handleStatusChange(status: Task['status']) {
    const completedAt = status === 'done' ? new Date().toISOString() : null;
    const [{ data: updated }, { data: logEntry }] = await Promise.all([
      updateTask(task.id, { status, completed_at: completedAt }),
      logActivity(task.id, userId, 'status_changed', { from: task.status, to: status }),
    ]);
    if (updated !== null) {
      onTaskUpdate(updated);
    }
    if (logEntry !== null) {
      setActivityLogs((prev) => [logEntry, ...prev]);
    }
  }

  async function handlePriorityChange(priority: Task['priority']) {
    const [{ data: updated }, { data: logEntry }] = await Promise.all([
      updateTask(task.id, { priority }),
      logActivity(task.id, userId, 'priority_changed', { from: task.priority, to: priority }),
    ]);
    if (updated !== null) {
      onTaskUpdate(updated);
    }
    if (logEntry !== null) {
      setActivityLogs((prev) => [logEntry, ...prev]);
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

        {/* AI label suggestions */}
        <div className="mb-6">
          <div className="mb-2 flex items-center justify-between">
            <label className="text-xs font-semibold uppercase tracking-wide text-gray-500">
              AI Labels
            </label>
            <button
              onClick={() => void handleSuggestLabels()}
              disabled={suggestingLabels || workspaceLabels.length === 0}
              data-testid="suggest-labels-btn"
              className="rounded px-2 py-0.5 text-xs font-medium text-blue-600 hover:bg-blue-50 disabled:opacity-50"
            >
              {suggestingLabels ? 'Thinking…' : 'Suggest'}
            </button>
          </div>
          {suggestedLabels.length > 0 && (
            <div data-testid="suggested-labels" className="flex flex-wrap gap-2">
              {suggestedLabels.map((label) => (
                <span
                  key={label.id}
                  data-testid={`suggested-label-${label.id}`}
                  style={{ background: label.color }}
                  className="rounded-full px-2 py-0.5 text-xs font-medium text-white"
                >
                  {label.name}
                </span>
              ))}
            </div>
          )}
          {!suggestingLabels && suggestedLabels.length === 0 && workspaceLabels.length > 0 && (
            <p className="text-xs text-gray-400" data-testid="no-suggestions">
              Click Suggest to get AI label recommendations.
            </p>
          )}
        </div>

        {/* AI task breakdown */}
        <div className="mb-6">
          <div className="mb-2 flex items-center justify-between">
            <label className="text-xs font-semibold uppercase tracking-wide text-gray-500">
              AI Breakdown
            </label>
            <button
              onClick={() => void handleBreakdown()}
              disabled={breakingDown}
              data-testid="breakdown-btn"
              className="rounded px-2 py-0.5 text-xs font-medium text-indigo-600 hover:bg-indigo-50 disabled:opacity-50"
            >
              {breakingDown ? 'Thinking…' : 'Break down'}
            </button>
          </div>
          {suggestedSubtasks.length > 0 && (
            <div data-testid="breakdown-suggestions">
              <ul className="mb-3 space-y-1">
                {suggestedSubtasks.map((sub, i) => (
                  <li
                    key={String(i)}
                    data-testid={`breakdown-subtask-${String(i)}`}
                    className="flex items-start gap-2 rounded bg-indigo-50 px-3 py-2 text-xs text-indigo-800"
                  >
                    <span className="mt-0.5 h-1.5 w-1.5 shrink-0 rounded-full bg-indigo-400" />
                    {sub.title}
                    {sub.priority !== undefined && (
                      <span className="ml-auto font-mono text-indigo-500">{sub.priority}</span>
                    )}
                  </li>
                ))}
              </ul>
              <div className="flex gap-2">
                <button
                  onClick={() => void handleAcceptSubtasks()}
                  disabled={creatingSubtasks}
                  data-testid="breakdown-accept"
                  className="rounded bg-indigo-600 px-3 py-1 text-xs font-semibold text-white hover:bg-indigo-700 disabled:opacity-50"
                >
                  {creatingSubtasks ? 'Creating…' : 'Create subtasks'}
                </button>
                <button
                  onClick={() => {
                    setSuggestedSubtasks([]);
                  }}
                  data-testid="breakdown-dismiss"
                  className="rounded px-3 py-1 text-xs font-medium text-gray-500 hover:bg-gray-100"
                >
                  Dismiss
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Attachments */}
        <div className="mb-6">
          <div className="mb-2 flex items-center justify-between">
            <label className="text-xs font-semibold uppercase tracking-wide text-gray-500">
              Attachments ({attachments.length})
            </label>
            <button
              onClick={() => {
                fileInputRef.current?.click();
              }}
              disabled={uploadingFile}
              data-testid="attach-file-btn"
              className="rounded px-2 py-0.5 text-xs font-medium text-blue-600 hover:bg-blue-50 disabled:opacity-50"
            >
              {uploadingFile ? 'Uploading…' : 'Attach'}
            </button>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              className="hidden"
              data-testid="file-input"
              onChange={(e) => void handleFileUpload(e.target.files)}
            />
          </div>

          {/* Drag-and-drop zone */}
          <div
            data-testid="drop-zone"
            onDragOver={(e) => {
              e.preventDefault();
              setDragOver(true);
            }}
            onDragLeave={() => {
              setDragOver(false);
            }}
            onDrop={(e) => {
              e.preventDefault();
              setDragOver(false);
              void handleFileUpload(e.dataTransfer.files);
            }}
            className={[
              'mb-2 rounded-lg border-2 border-dashed px-4 py-3 text-center text-xs transition',
              dragOver
                ? 'border-blue-400 bg-blue-50 text-blue-600'
                : 'border-gray-200 text-gray-400',
            ].join(' ')}
          >
            {uploadingFile ? 'Uploading…' : 'Drop files here or click Attach'}
          </div>

          {/* Attachment list */}
          {attachments.length > 0 && (
            <ul data-testid="attachment-list" className="space-y-1">
              {attachments.map((attachment) => (
                <li
                  key={attachment.id}
                  data-testid={`attachment-${attachment.id}`}
                  className="flex items-center gap-2 rounded-lg bg-gray-50 px-3 py-2"
                >
                  <span className="text-base">📎</span>
                  <button
                    onClick={() => void handleOpenAttachment(attachment)}
                    className="flex-1 truncate text-left text-xs text-blue-600 hover:underline"
                    data-testid={`attachment-open-${attachment.id}`}
                  >
                    {attachment.file_name}
                  </button>
                  <span className="shrink-0 text-xs text-gray-400">
                    {formatBytes(attachment.file_size)}
                  </span>
                  <button
                    onClick={() => void handleDeleteAttachment(attachment)}
                    aria-label={`Delete ${attachment.file_name}`}
                    data-testid={`attachment-delete-${attachment.id}`}
                    className="text-gray-300 hover:text-red-400"
                  >
                    ✕
                  </button>
                </li>
              ))}
            </ul>
          )}
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

        {/* Activity log */}
        {activityLogs.length > 0 && (
          <div className="mt-6 border-t border-gray-100 pt-4">
            <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-gray-500">
              Activity
            </h3>
            <ul data-testid="activity-log" className="space-y-2">
              {activityLogs.map((log) => (
                <li
                  key={log.id}
                  data-testid={`activity-${log.id}`}
                  className="flex items-start gap-2 text-xs text-gray-500"
                >
                  <span className="mt-0.5 h-1.5 w-1.5 shrink-0 rounded-full bg-gray-300" />
                  <span>
                    <span className="font-medium text-gray-700">
                      {log.action.replace(/_/g, ' ')}
                    </span>
                    {' · '}
                    {new Date(log.created_at).toLocaleDateString()}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </aside>
  );
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${String(bytes)} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
