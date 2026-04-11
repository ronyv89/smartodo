import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { PluginRegistry } from '@smartodo/plugin-sdk';
import { PluginRegistryProvider, PluginSlot } from '@smartodo/plugin-sdk';
import { timeTrackingPlugin, timeTrackingManifest } from '../index';

function Wrapper({ registry, children }: { registry: PluginRegistry; children: React.ReactNode }) {
  return <PluginRegistryProvider registry={registry}>{children}</PluginRegistryProvider>;
}

describe('timeTrackingManifest', () => {
  it('has the correct id', () => {
    expect(timeTrackingManifest.id).toBe('smartodo.time-tracking');
  });

  it('declares task-card-badge and task-detail-sidebar slots', () => {
    expect(timeTrackingManifest.ui_slots).toContain('task-card-badge');
    expect(timeTrackingManifest.ui_slots).toContain('task-detail-sidebar');
  });

  it('declares task:updated and task:completed hooks', () => {
    expect(timeTrackingManifest.hooks).toContain('task:updated');
    expect(timeTrackingManifest.hooks).toContain('task:completed');
  });
});

describe('timeTrackingPlugin registration', () => {
  it('registers without errors', () => {
    const registry = new PluginRegistry();
    expect(() => {
      registry.register(timeTrackingPlugin);
    }).not.toThrow();
  });

  it('appears in getSlotPlugins for task-card-badge', () => {
    const registry = new PluginRegistry();
    registry.register(timeTrackingPlugin);
    const plugins = registry.getSlotPlugins('task-card-badge');
    expect(plugins).toHaveLength(1);
    expect(plugins[0]?.manifest.id).toBe('smartodo.time-tracking');
  });
});

describe('TimeTrackingBadge slot component', () => {
  it('renders formatted time badge with zero seconds by default', () => {
    const registry = new PluginRegistry();
    registry.register(timeTrackingPlugin);

    render(
      <Wrapper registry={registry}>
        <PluginSlot slot="task-card-badge" />
      </Wrapper>,
    );

    const badge = screen.getByTestId('time-tracking-badge');
    expect(badge).toBeInTheDocument();
    expect(badge).toHaveTextContent('0:00:00');
  });

  it('formats totalSeconds prop correctly', () => {
    const registry = new PluginRegistry();
    registry.register(timeTrackingPlugin);

    render(
      <Wrapper registry={registry}>
        <PluginSlot slot="task-card-badge" totalSeconds={3661} />
      </Wrapper>,
    );

    expect(screen.getByTestId('time-tracking-badge')).toHaveTextContent('1:01:01');
  });
});

describe('TimeTrackingSidebar slot component', () => {
  it('renders start button and zero logged time', () => {
    const registry = new PluginRegistry();
    registry.register(timeTrackingPlugin);

    render(
      <Wrapper registry={registry}>
        <PluginSlot slot="task-detail-sidebar" taskId="task-1" />
      </Wrapper>,
    );

    expect(screen.getByTestId('time-tracking-sidebar')).toBeInTheDocument();
    expect(screen.getByTestId('time-tracking-toggle')).toHaveTextContent('Start');
    expect(screen.getByTestId('time-tracking-logged')).toHaveTextContent('Logged: 0s');
  });

  it('toggles to Stop when started', () => {
    const registry = new PluginRegistry();
    registry.register(timeTrackingPlugin);

    render(
      <Wrapper registry={registry}>
        <PluginSlot slot="task-detail-sidebar" taskId="task-1" />
      </Wrapper>,
    );

    fireEvent.click(screen.getByTestId('time-tracking-toggle'));
    expect(screen.getByTestId('time-tracking-toggle')).toHaveTextContent('Stop');
  });

  it('calls onLog with taskId and elapsed seconds when stopped', () => {
    const registry = new PluginRegistry();
    registry.register(timeTrackingPlugin);
    const onLog = jest.fn();

    render(
      <Wrapper registry={registry}>
        <PluginSlot slot="task-detail-sidebar" taskId="task-42" onLog={onLog} />
      </Wrapper>,
    );

    fireEvent.click(screen.getByTestId('time-tracking-toggle')); // start
    fireEvent.click(screen.getByTestId('time-tracking-toggle')); // stop

    expect(onLog).toHaveBeenCalledWith('task-42', expect.any(Number));
  });
});

describe('timeTrackingPlugin hook dispatch', () => {
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
      full_name: 'Alice',
      avatar_url: null,
      preferences: {},
      created_at: new Date().toISOString(),
    },
  };

  it('dispatches task:completed without throwing', async () => {
    const registry = new PluginRegistry();
    registry.register(timeTrackingPlugin);
    const task = { id: 't1' } as never;
    await expect(registry.dispatch('task:completed', { task }, CONTEXT)).resolves.toBeUndefined();
  });
});
