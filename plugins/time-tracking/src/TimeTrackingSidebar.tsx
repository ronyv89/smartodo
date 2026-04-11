'use client';

import { useState } from 'react';
import type { SlotComponentProps } from '@smartodo/plugin-sdk';

/**
 * Task-detail-sidebar slot component — a start/stop timer panel rendered
 * inside the TaskDetailPanel when the time-tracking plugin is active.
 *
 * Props forwarded by the host:
 *   - `taskId: string` — the current task's id
 *   - `onLog?: (taskId: string, seconds: number) => void` — callback when the
 *     user stops a timer session (used in tests and by the host).
 */
export function TimeTrackingSidebar({ taskId, onLog }: SlotComponentProps) {
  const [running, setRunning] = useState(false);
  const [startedAt, setStartedAt] = useState<number | null>(null);
  const [logged, setLogged] = useState(0);

  function handleToggle() {
    if (running) {
      const elapsed = startedAt !== null ? Math.floor((Date.now() - startedAt) / 1000) : 0;
      const newLogged = logged + elapsed;
      setLogged(newLogged);
      setStartedAt(null);
      setRunning(false);
      if (typeof onLog === 'function') {
        (onLog as (id: string, secs: number) => void)(
          typeof taskId === 'string' ? taskId : '',
          newLogged,
        );
      }
    } else {
      setStartedAt(Date.now());
      setRunning(true);
    }
  }

  const buttonLabel = running ? 'Stop' : 'Start';

  return (
    <div data-testid="time-tracking-sidebar" className="mt-4 border-t border-gray-100 pt-3">
      <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">
        Time Tracking
      </p>
      <div className="flex items-center gap-3">
        <button
          onClick={handleToggle}
          data-testid="time-tracking-toggle"
          className={[
            'rounded px-3 py-1 text-xs font-semibold',
            running
              ? 'border border-red-300 bg-red-50 text-red-700 hover:bg-red-100'
              : 'border border-emerald-300 bg-emerald-50 text-emerald-700 hover:bg-emerald-100',
          ].join(' ')}
        >
          {buttonLabel}
        </button>
        <span data-testid="time-tracking-logged" className="font-mono text-xs text-gray-600">
          Logged: {logged}s
        </span>
      </div>
    </div>
  );
}
