import React from 'react';
import { render, screen } from '@testing-library/react';
import { PluginRegistry } from '../registry';
import type { PluginDefinition } from '../registry';
import type { PluginManifest } from '../types';
import { PluginRegistryProvider } from '../PluginRegistryContext';
import { PluginSlot } from '../PluginSlot';

const BASE_MANIFEST: PluginManifest = {
  id: 'slot-test-plugin',
  name: 'Slot Test Plugin',
  version: '1.0.0',
  description: 'Tests slot rendering',
  permissions: [],
  hooks: [],
  ui_slots: ['task-detail-sidebar'],
};

function Wrapper({ registry, children }: { registry: PluginRegistry; children: React.ReactNode }) {
  return <PluginRegistryProvider registry={registry}>{children}</PluginRegistryProvider>;
}

describe('PluginSlot', () => {
  it('renders nothing when no plugins occupy the slot', () => {
    const registry = new PluginRegistry();
    const { container } = render(
      <Wrapper registry={registry}>
        <PluginSlot slot="task-detail-sidebar" />
      </Wrapper>,
    );
    expect(container.firstChild).toBeNull();
  });

  it('renders a plugin component into the slot', () => {
    const registry = new PluginRegistry();
    const plugin: PluginDefinition = {
      manifest: BASE_MANIFEST,
      slotComponents: {
        'task-detail-sidebar': () => <div data-testid="slot-content">Hello from plugin</div>,
      },
    };
    registry.register(plugin);

    render(
      <Wrapper registry={registry}>
        <PluginSlot slot="task-detail-sidebar" />
      </Wrapper>,
    );

    expect(screen.getByTestId('slot-content')).toBeInTheDocument();
    expect(screen.getByText('Hello from plugin')).toBeInTheDocument();
  });

  it('passes extra props to the slot component', () => {
    const registry = new PluginRegistry();
    const plugin: PluginDefinition = {
      manifest: BASE_MANIFEST,
      slotComponents: {
        'task-detail-sidebar': ({ taskId }) => (
          <div data-testid="slot-with-props">{String(taskId)}</div>
        ),
      },
    };
    registry.register(plugin);

    render(
      <Wrapper registry={registry}>
        <PluginSlot slot="task-detail-sidebar" taskId="task-42" />
      </Wrapper>,
    );

    expect(screen.getByTestId('slot-with-props')).toHaveTextContent('task-42');
  });

  it('renders multiple plugins in the same slot', () => {
    const registry = new PluginRegistry();
    const p1: PluginDefinition = {
      manifest: BASE_MANIFEST,
      slotComponents: {
        'task-detail-sidebar': () => <div data-testid="plugin-1">P1</div>,
      },
    };
    const p2: PluginDefinition = {
      manifest: { ...BASE_MANIFEST, id: 'plugin-2' },
      slotComponents: {
        'task-detail-sidebar': () => <div data-testid="plugin-2">P2</div>,
      },
    };
    registry.register(p1);
    registry.register(p2);

    render(
      <Wrapper registry={registry}>
        <PluginSlot slot="task-detail-sidebar" />
      </Wrapper>,
    );

    expect(screen.getByTestId('plugin-1')).toBeInTheDocument();
    expect(screen.getByTestId('plugin-2')).toBeInTheDocument();
  });

  it('skips plugins that declared the slot but provided no component', () => {
    const registry = new PluginRegistry();
    const plugin: PluginDefinition = {
      manifest: BASE_MANIFEST,
      // no slotComponents
    };
    registry.register(plugin);

    const { container } = render(
      <Wrapper registry={registry}>
        <PluginSlot slot="task-detail-sidebar" />
      </Wrapper>,
    );

    // Fragment with all-null children collapses to nothing visible
    expect(screen.queryByTestId('slot-content')).not.toBeInTheDocument();
    // Container still renders (fragment), no crash
    expect(container).toBeTruthy();
  });

  it('does not render plugins into a different slot', () => {
    const registry = new PluginRegistry();
    const plugin: PluginDefinition = {
      manifest: { ...BASE_MANIFEST, ui_slots: ['toolbar-action'] },
      slotComponents: {
        'toolbar-action': () => <div data-testid="toolbar-content">Toolbar</div>,
      },
    };
    registry.register(plugin);

    const { container } = render(
      <Wrapper registry={registry}>
        <PluginSlot slot="task-detail-sidebar" />
      </Wrapper>,
    );

    expect(container.firstChild).toBeNull();
    expect(screen.queryByTestId('toolbar-content')).not.toBeInTheDocument();
  });
});
