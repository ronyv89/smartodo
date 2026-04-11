import type { HookEvent, HookPayload, PluginContext, PluginManifest, UISlotName } from './types';

const VALID_HOOK_EVENTS = new Set<HookEvent>([
  'task:created',
  'task:updated',
  'task:completed',
  'task:deleted',
]);

const VALID_UI_SLOTS = new Set<UISlotName>([
  'task-detail-sidebar',
  'task-card-badge',
  'project-tab',
  'workspace-settings-section',
  'toolbar-action',
]);

export type HookHandler<E extends HookEvent> = (
  payload: HookPayload[E],
  context: PluginContext,
) => void | Promise<void>;

export interface PluginDefinition {
  manifest: PluginManifest;
  hooks?: Partial<{ [E in HookEvent]: HookHandler<E> }>;
}

/**
 * Validates that an unknown value conforms to the PluginManifest shape.
 * Returns true if valid (type predicate) or throws with a descriptive message.
 */
export function validateManifest(value: unknown): value is PluginManifest {
  if (typeof value !== 'object' || value === null) {
    throw new Error('Manifest must be a non-null object');
  }
  const m = value as Record<string, unknown>;

  for (const field of ['id', 'name', 'version', 'description'] as const) {
    if (typeof m[field] !== 'string' || m[field].trim() === '') {
      throw new Error(`Manifest field "${field}" must be a non-empty string`);
    }
  }

  if (!Array.isArray(m.permissions)) {
    throw new Error('Manifest field "permissions" must be an array');
  }

  if (!Array.isArray(m.hooks)) {
    throw new Error('Manifest field "hooks" must be an array');
  }
  for (const hook of m.hooks as unknown[]) {
    if (!VALID_HOOK_EVENTS.has(hook as HookEvent)) {
      throw new Error(`Unknown hook event: "${String(hook)}"`);
    }
  }

  if (!Array.isArray(m.ui_slots)) {
    throw new Error('Manifest field "ui_slots" must be an array');
  }
  for (const slot of m.ui_slots as unknown[]) {
    if (!VALID_UI_SLOTS.has(slot as UISlotName)) {
      throw new Error(`Unknown UI slot: "${String(slot)}"`);
    }
  }

  return true;
}

/**
 * Central registry for smarTODO plugins.
 *
 * Plugins are registered with a manifest (validated on entry) plus optional
 * hook handlers.  The registry dispatches lifecycle events to all plugins
 * that declared the hook in their manifest and provided a handler.
 */
export class PluginRegistry {
  private readonly plugins = new Map<string, PluginDefinition>();

  /**
   * Register a plugin.  Throws if the manifest is invalid or a plugin with
   * the same id is already registered.
   */
  register(plugin: PluginDefinition): void {
    validateManifest(plugin.manifest);
    if (this.plugins.has(plugin.manifest.id)) {
      throw new Error(`Plugin "${plugin.manifest.id}" is already registered`);
    }
    this.plugins.set(plugin.manifest.id, plugin);
  }

  /** Remove a previously registered plugin. No-op if not found. */
  unregister(id: string): void {
    this.plugins.delete(id);
  }

  /** Retrieve a registered plugin by id, or undefined if not found. */
  getPlugin(id: string): PluginDefinition | undefined {
    return this.plugins.get(id);
  }

  /** Return all registered plugins. */
  getAll(): PluginDefinition[] {
    return Array.from(this.plugins.values());
  }

  /**
   * Return plugins that declared they occupy a given UI slot.
   * The caller is responsible for rendering the slot components.
   */
  getSlotPlugins(slot: UISlotName): PluginDefinition[] {
    return this.getAll().filter((p) => p.manifest.ui_slots.includes(slot));
  }

  /**
   * Dispatch a hook event to every registered plugin that:
   *  1. Declared the hook in its manifest, AND
   *  2. Provided a handler for it in its `hooks` map.
   *
   * Handlers run sequentially (await each in order) so that later plugins
   * see a consistent context state.  Errors in individual handlers are caught
   * and logged; they do not prevent other handlers from running.
   */
  async dispatch<E extends HookEvent>(
    event: E,
    payload: HookPayload[E],
    context: PluginContext,
  ): Promise<void> {
    for (const plugin of this.plugins.values()) {
      if (!plugin.manifest.hooks.includes(event)) continue;
      const handler = plugin.hooks?.[event];
      if (handler === undefined) continue;
      try {
        await handler(payload, context);
      } catch (err) {
        console.error(`[plugin-sdk] Error in "${plugin.manifest.id}" handler for "${event}":`, err);
      }
    }
  }
}

/** Singleton registry for application-level use. */
export const pluginRegistry = new PluginRegistry();
