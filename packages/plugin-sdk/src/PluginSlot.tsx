'use client';

import type { UISlotName, SlotComponentProps } from './types';
import { usePluginRegistry } from './PluginRegistryContext';

/**
 * Renders all plugin-contributed components for a given UI slot.
 *
 * Usage:
 * ```tsx
 * <PluginSlot slot="task-detail-sidebar" taskId={task.id} />
 * ```
 *
 * Each plugin that declared the slot in its manifest AND exported a component
 * for it will be rendered in registration order.
 */
export function PluginSlot({ slot, ...props }: { slot: UISlotName } & SlotComponentProps) {
  const registry = usePluginRegistry();
  const plugins = registry.getSlotPlugins(slot);

  if (plugins.length === 0) return null;

  return (
    <>
      {plugins.map((plugin) => {
        const Component = plugin.slotComponents?.[slot];
        if (Component === undefined) return null;
        return <Component key={plugin.manifest.id} {...props} />;
      })}
    </>
  );
}
