'use client';

import { createContext, useContext } from 'react';
import type { ReactNode } from 'react';
import type { PluginRegistry } from './registry';
import { pluginRegistry as defaultRegistry } from './registry';

const PluginRegistryContext = createContext<PluginRegistry>(defaultRegistry);

interface PluginRegistryProviderProps {
  registry?: PluginRegistry;
  children: ReactNode;
}

/**
 * Provides a PluginRegistry to the component tree.
 * Defaults to the singleton `pluginRegistry` if no registry is passed.
 */
export function PluginRegistryProvider({
  registry = defaultRegistry,
  children,
}: PluginRegistryProviderProps) {
  return (
    <PluginRegistryContext.Provider value={registry}>{children}</PluginRegistryContext.Provider>
  );
}

/** Returns the nearest PluginRegistry from context. */
export function usePluginRegistry(): PluginRegistry {
  return useContext(PluginRegistryContext);
}
