'use client';

import type { SlotComponentProps } from '@smartodo/plugin-sdk';

/**
 * Toolbar-action slot component — renders a "Start Sprint" button in the
 * host's toolbar area when the sprint board plugin is active.
 */
export function SprintBoardToolbarButton({ onStartSprint }: SlotComponentProps) {
  return (
    <button
      data-testid="sprint-board-start-sprint"
      onClick={() => {
        if (typeof onStartSprint === 'function') {
          (onStartSprint as () => void)();
        }
      }}
      className="rounded-lg border border-indigo-300 bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-700 hover:bg-indigo-100"
    >
      Start Sprint
    </button>
  );
}
