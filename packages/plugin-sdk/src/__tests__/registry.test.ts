import { PluginRegistry, validateManifest } from '../registry';
import type { PluginDefinition } from '../registry';
import type { PluginManifest, PluginContext } from '../types';

const VALID_MANIFEST: PluginManifest = {
  id: 'test-plugin',
  name: 'Test Plugin',
  version: '1.0.0',
  description: 'A plugin for testing',
  permissions: [],
  hooks: ['task:created', 'task:updated'],
  ui_slots: ['task-detail-sidebar'],
};

const VALID_CONTEXT: PluginContext = {
  workspace: {
    id: 'ws-1',
    name: 'Test WS',
    slug: 'test-ws',
    owner_id: 'user-1',
    settings: {},
    plan_tier: 'community',
    created_at: new Date().toISOString(),
  },
  currentUser: {
    id: 'user-1',
    full_name: 'Alice',
    avatar_url: null,
    preferences: {},
    created_at: new Date().toISOString(),
  },
};

describe('validateManifest', () => {
  it('accepts a valid manifest', () => {
    expect(validateManifest(VALID_MANIFEST)).toBe(true);
  });

  it('throws if value is not an object', () => {
    expect(() => validateManifest(null)).toThrow('non-null object');
    expect(() => validateManifest('string')).toThrow('non-null object');
  });

  it('throws if a required string field is missing', () => {
    const bad = { ...VALID_MANIFEST, id: '' };
    expect(() => validateManifest(bad)).toThrow('"id"');
  });

  it('throws if hooks contains an unknown event', () => {
    const bad = { ...VALID_MANIFEST, hooks: ['task:unknown'] };
    expect(() => validateManifest(bad)).toThrow('Unknown hook event');
  });

  it('throws if ui_slots contains an unknown slot', () => {
    const bad = { ...VALID_MANIFEST, ui_slots: ['not-a-slot'] };
    expect(() => validateManifest(bad)).toThrow('Unknown UI slot');
  });

  it('throws if permissions is not an array', () => {
    const bad = { ...VALID_MANIFEST, permissions: 'read' };
    expect(() => validateManifest(bad)).toThrow('"permissions"');
  });
});

describe('PluginRegistry', () => {
  let registry: PluginRegistry;

  beforeEach(() => {
    registry = new PluginRegistry();
  });

  describe('register', () => {
    it('registers a valid plugin', () => {
      const plugin: PluginDefinition = { manifest: VALID_MANIFEST };
      registry.register(plugin);
      expect(registry.getPlugin(VALID_MANIFEST.id)).toBe(plugin);
    });

    it('throws on duplicate id', () => {
      registry.register({ manifest: VALID_MANIFEST });
      expect(() => {
        registry.register({ manifest: VALID_MANIFEST });
      }).toThrow('already registered');
    });

    it('validates the manifest on register', () => {
      const bad = { manifest: { ...VALID_MANIFEST, version: '' } };
      expect(() => {
        registry.register(bad);
      }).toThrow('"version"');
    });
  });

  describe('unregister', () => {
    it('removes a registered plugin', () => {
      registry.register({ manifest: VALID_MANIFEST });
      registry.unregister(VALID_MANIFEST.id);
      expect(registry.getPlugin(VALID_MANIFEST.id)).toBeUndefined();
    });

    it('is a no-op for unknown ids', () => {
      expect(() => {
        registry.unregister('nonexistent');
      }).not.toThrow();
    });
  });

  describe('getAll', () => {
    it('returns all registered plugins', () => {
      const p1: PluginDefinition = { manifest: VALID_MANIFEST };
      const p2: PluginDefinition = {
        manifest: { ...VALID_MANIFEST, id: 'plugin-2' },
      };
      registry.register(p1);
      registry.register(p2);
      expect(registry.getAll()).toHaveLength(2);
    });

    it('returns an empty array when nothing is registered', () => {
      expect(registry.getAll()).toEqual([]);
    });
  });

  describe('getSlotPlugins', () => {
    it('returns plugins that declared a given slot', () => {
      registry.register({ manifest: VALID_MANIFEST }); // has 'task-detail-sidebar'
      registry.register({
        manifest: {
          ...VALID_MANIFEST,
          id: 'plugin-2',
          ui_slots: ['toolbar-action'],
        },
      });
      const result = registry.getSlotPlugins('task-detail-sidebar');
      expect(result).toHaveLength(1);
      expect(result[0]?.manifest.id).toBe('test-plugin');
    });

    it('returns empty array when no plugin occupies the slot', () => {
      registry.register({ manifest: VALID_MANIFEST });
      expect(registry.getSlotPlugins('project-tab')).toEqual([]);
    });
  });

  describe('dispatch', () => {
    it('calls the handler for the matching event', async () => {
      const handler = jest.fn();
      const plugin: PluginDefinition = {
        manifest: VALID_MANIFEST,
        hooks: { 'task:created': handler },
      };
      registry.register(plugin);

      const task = { id: 't1', title: 'T' } as never;
      await registry.dispatch('task:created', { task }, VALID_CONTEXT);
      expect(handler).toHaveBeenCalledWith({ task }, VALID_CONTEXT);
    });

    it('does not call handlers for events not in the manifest', async () => {
      const handler = jest.fn();
      // manifest declares only 'task:created', 'task:updated'
      const plugin: PluginDefinition = {
        manifest: VALID_MANIFEST,
        hooks: { 'task:deleted': handler },
      };
      registry.register(plugin);

      await registry.dispatch('task:deleted', { taskId: 't1' }, VALID_CONTEXT);
      expect(handler).not.toHaveBeenCalled();
    });

    it('skips plugins with no handler for the event', async () => {
      // Manifest declares the event but hooks map omits it
      const plugin: PluginDefinition = { manifest: VALID_MANIFEST };
      registry.register(plugin);
      // Should not throw
      await expect(
        registry.dispatch('task:created', { task: { id: 't1' } as never }, VALID_CONTEXT),
      ).resolves.toBeUndefined();
    });

    it('catches handler errors and continues dispatching', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(jest.fn());
      const failHandler = jest.fn().mockRejectedValue(new Error('boom'));
      const goodHandler = jest.fn();

      registry.register({
        manifest: VALID_MANIFEST,
        hooks: { 'task:created': failHandler },
      });
      registry.register({
        manifest: { ...VALID_MANIFEST, id: 'plugin-2' },
        hooks: { 'task:created': goodHandler },
      });

      const task = { id: 't1' } as never;
      await registry.dispatch('task:created', { task }, VALID_CONTEXT);

      expect(goodHandler).toHaveBeenCalled();
      expect(consoleSpy).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });

    it('dispatches to multiple plugins that share the event', async () => {
      const h1 = jest.fn();
      const h2 = jest.fn();

      registry.register({ manifest: VALID_MANIFEST, hooks: { 'task:updated': h1 } });
      registry.register({
        manifest: { ...VALID_MANIFEST, id: 'plugin-2' },
        hooks: { 'task:updated': h2 },
      });

      const task = { id: 't1' } as never;
      await registry.dispatch('task:updated', { task, previous: task }, VALID_CONTEXT);

      expect(h1).toHaveBeenCalled();
      expect(h2).toHaveBeenCalled();
    });
  });
});
