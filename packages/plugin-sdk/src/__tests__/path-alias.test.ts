import type { PluginManifest } from '@smartodo/plugin-sdk';

describe('@smartodo/plugin-sdk path alias', () => {
  it('resolves plugin types correctly', () => {
    const manifest: PluginManifest = {
      id: 'test-plugin',
      name: 'Test Plugin',
      version: '1.0.0',
      description: 'A test plugin',
      permissions: [],
      hooks: ['task:created'],
      ui_slots: [],
    };
    expect(manifest.id).toBe('test-plugin');
  });
});
