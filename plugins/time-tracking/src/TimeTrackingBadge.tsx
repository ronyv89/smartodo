'use client';

import type { SlotComponentProps } from '@smartodo/plugin-sdk';

/** Formats elapsed seconds as "h:mm:ss". */
function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  const mm = String(m).padStart(2, '0');
  const ss = String(s).padStart(2, '0');
  return `${String(h)}:${mm}:${ss}`;
}

/**
 * Task-card-badge slot component — shows the total logged time for a task
 * in a compact badge beside the priority/status badges.
 *
 * Expects `{ totalSeconds?: number }` props forwarded by the host.
 */
export function TimeTrackingBadge({ totalSeconds }: SlotComponentProps) {
  const seconds = typeof totalSeconds === 'number' ? totalSeconds : 0;

  return (
    <span
      data-testid="time-tracking-badge"
      className="inline-flex items-center rounded border border-emerald-200 bg-emerald-50 px-1.5 py-0.5 font-mono text-xs font-medium text-emerald-700"
    >
      {formatDuration(seconds)}
    </span>
  );
}
