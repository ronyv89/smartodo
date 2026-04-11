'use client';

import type { SlotComponentProps } from '@smartodo/plugin-sdk';

/**
 * Project-tab slot component — renders a "Sprint Board" tab label.
 * The host (`PluginSlot slot="project-tab"`) renders this next to the
 * built-in project tabs.
 */
export function SprintBoardTab(_props: SlotComponentProps) {
  return (
    <span
      data-testid="sprint-board-tab"
      className="inline-flex items-center gap-1 text-sm font-medium text-indigo-600"
    >
      Sprint Board
    </span>
  );
}
