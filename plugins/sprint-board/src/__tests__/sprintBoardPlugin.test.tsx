import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { PluginRegistry } from '@smartodo/plugin-sdk';
import { PluginRegistryProvider } from '@smartodo/plugin-sdk';
import { PluginSlot } from '@smartodo/plugin-sdk';
import { sprintBoardPlugin, sprintBoardManifest } from '../index';

function Wrapper({ registry, children }: { registry: PluginRegistry; children: React.ReactNode }) {
  return <PluginRegistryProvider registry={registry}>{children}</PluginRegistryProvider>;
}

describe('sprintBoardPlugin manifest', () => {
  it('has the correct id', () => {
    expect(sprintBoardManifest.id).toBe('smartodo.sprint-board');
  });

  it('declares project-tab and toolbar-action slots', () => {
    expect(sprintBoardManifest.ui_slots).toContain('project-tab');
    expect(sprintBoardManifest.ui_slots).toContain('toolbar-action');
  });

  it('declares the three task lifecycle hooks', () => {
    expect(sprintBoardManifest.hooks).toContain('task:created');
    expect(sprintBoardManifest.hooks).toContain('task:updated');
    expect(sprintBoardManifest.hooks).toContain('task:completed');
  });
});

describe('sprintBoardPlugin registration', () => {
  it('can be registered in a PluginRegistry without errors', () => {
    const registry = new PluginRegistry();
    expect(() => {
      registry.register(sprintBoardPlugin);
    }).not.toThrow();
  });

  it('appears in getSlotPlugins for project-tab', () => {
    const registry = new PluginRegistry();
    registry.register(sprintBoardPlugin);
    const slotPlugins = registry.getSlotPlugins('project-tab');
    expect(slotPlugins).toHaveLength(1);
    expect(slotPlugins[0]?.manifest.id).toBe('smartodo.sprint-board');
  });
});

describe('SprintBoardTab slot component', () => {
  it('renders the Sprint Board tab label', () => {
    const registry = new PluginRegistry();
    registry.register(sprintBoardPlugin);

    render(
      <Wrapper registry={registry}>
        <PluginSlot slot="project-tab" />
      </Wrapper>,
    );

    expect(screen.getByTestId('sprint-board-tab')).toBeInTheDocument();
    expect(screen.getByText('Sprint Board')).toBeInTheDocument();
  });
});

describe('SprintBoardToolbarButton slot component', () => {
  it('renders a Start Sprint button', () => {
    const registry = new PluginRegistry();
    registry.register(sprintBoardPlugin);

    render(
      <Wrapper registry={registry}>
        <PluginSlot slot="toolbar-action" />
      </Wrapper>,
    );

    expect(screen.getByTestId('sprint-board-start-sprint')).toBeInTheDocument();
  });

  it('calls onStartSprint prop when clicked', () => {
    const registry = new PluginRegistry();
    registry.register(sprintBoardPlugin);
    const onStartSprint = jest.fn();

    render(
      <Wrapper registry={registry}>
        <PluginSlot slot="toolbar-action" onStartSprint={onStartSprint} />
      </Wrapper>,
    );

    fireEvent.click(screen.getByTestId('sprint-board-start-sprint'));
    expect(onStartSprint).toHaveBeenCalledTimes(1);
  });
});

describe('sprintBoardPlugin hook dispatch', () => {
  const CONTEXT = {
    workspace: {
      id: 'ws-1',
      name: 'WS',
      slug: 'ws',
      owner_id: 'u1',
      settings: {},
      plan_tier: 'community' as const,
      created_at: new Date().toISOString(),
    },
    currentUser: {
      id: 'u1',
      full_name: 'Bob',
      avatar_url: null,
      preferences: {},
      created_at: new Date().toISOString(),
    },
  };

  it('dispatches task:created without throwing', async () => {
    const registry = new PluginRegistry();
    registry.register(sprintBoardPlugin);
    const task = { id: 't1' } as never;
    await expect(registry.dispatch('task:created', { task }, CONTEXT)).resolves.toBeUndefined();
  });

  it('dispatches task:completed without throwing', async () => {
    const registry = new PluginRegistry();
    registry.register(sprintBoardPlugin);
    const task = { id: 't1' } as never;
    await expect(registry.dispatch('task:completed', { task }, CONTEXT)).resolves.toBeUndefined();
  });
});
