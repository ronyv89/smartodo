// Unit tests for workspace helpers — Supabase client is mocked
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '../database.types';

interface MockQueryBuilder {
  select: jest.Mock;
  insert: jest.Mock;
  update: jest.Mock;
  delete: jest.Mock;
  eq: jest.Mock;
  order: jest.Mock;
  single: jest.Mock;
}

const mockBuilder: MockQueryBuilder = {
  select: jest.fn(),
  insert: jest.fn(),
  update: jest.fn(),
  delete: jest.fn(),
  eq: jest.fn(),
  order: jest.fn(),
  single: jest.fn(),
};

// Make all chained methods return the builder itself for fluent API
for (const key of Object.keys(mockBuilder) as (keyof MockQueryBuilder)[]) {
  mockBuilder[key].mockReturnValue(mockBuilder);
}

jest.mock('../client', () => ({
  supabase: {
    from: jest.fn(() => mockBuilder),
  } as unknown as SupabaseClient<Database>,
  createClient: jest.fn(),
}));

import { supabase } from '../client';
import {
  addWorkspaceMember,
  createWorkspace,
  deleteWorkspace,
  getWorkspace,
  listWorkspaceMembers,
  listWorkspaces,
  updateWorkspace,
} from '../workspaces';

const fakeWorkspace = {
  id: 'ws-1',
  name: 'My Workspace',
  slug: 'my-workspace',
  owner_id: 'u-1',
  settings: {},
  plan_tier: 'community' as const,
  created_at: '2024-01-01T00:00:00Z',
};

beforeEach(() => {
  jest.clearAllMocks();
  // Re-wire chains after clearAllMocks
  for (const key of Object.keys(mockBuilder) as (keyof MockQueryBuilder)[]) {
    mockBuilder[key].mockReturnValue(mockBuilder);
  }
});

describe('listWorkspaces', () => {
  it('returns workspace list', async () => {
    mockBuilder.order.mockResolvedValueOnce({ data: [fakeWorkspace], error: null });
    const result = await listWorkspaces();
    expect(result.data).toEqual([fakeWorkspace]);
    expect(supabase.from).toHaveBeenCalledWith('workspaces');
  });
});

describe('getWorkspace', () => {
  it('fetches a single workspace by id', async () => {
    mockBuilder.single.mockResolvedValueOnce({ data: fakeWorkspace, error: null });
    const result = await getWorkspace('ws-1');
    expect(result.data).toEqual(fakeWorkspace);
    expect(mockBuilder.eq).toHaveBeenCalledWith('id', 'ws-1');
  });
});

describe('createWorkspace', () => {
  it('inserts a workspace and returns it', async () => {
    mockBuilder.single.mockResolvedValueOnce({ data: fakeWorkspace, error: null });
    const result = await createWorkspace({
      name: 'My Workspace',
      slug: 'my-workspace',
      owner_id: 'u-1',
    });
    expect(result.data).toEqual(fakeWorkspace);
    expect(mockBuilder.insert).toHaveBeenCalledWith({
      name: 'My Workspace',
      slug: 'my-workspace',
      owner_id: 'u-1',
    });
  });
});

describe('updateWorkspace', () => {
  it('updates workspace fields', async () => {
    mockBuilder.single.mockResolvedValueOnce({
      data: { ...fakeWorkspace, name: 'Renamed' },
      error: null,
    });
    const result = await updateWorkspace('ws-1', { name: 'Renamed' });
    expect(result.data?.name).toBe('Renamed');
    expect(mockBuilder.update).toHaveBeenCalledWith({ name: 'Renamed' });
    expect(mockBuilder.eq).toHaveBeenCalledWith('id', 'ws-1');
  });
});

describe('deleteWorkspace', () => {
  it('deletes a workspace', async () => {
    mockBuilder.eq.mockResolvedValueOnce({ error: null });
    const result = await deleteWorkspace('ws-1');
    expect(result.data).toBeNull();
    expect(result.error).toBeNull();
    expect(mockBuilder.delete).toHaveBeenCalled();
  });
});

describe('listWorkspaceMembers', () => {
  it('returns members for a workspace', async () => {
    const fakeMembers = [
      { id: 'm-1', workspace_id: 'ws-1', user_id: 'u-1', role: 'admin', joined_at: '2024-01-01' },
    ];
    mockBuilder.order.mockResolvedValueOnce({ data: fakeMembers, error: null });
    const result = await listWorkspaceMembers('ws-1');
    expect(result.data).toEqual(fakeMembers);
    expect(mockBuilder.eq).toHaveBeenCalledWith('workspace_id', 'ws-1');
  });
});

describe('addWorkspaceMember', () => {
  it('inserts a new member', async () => {
    const fakeMember = {
      id: 'm-2',
      workspace_id: 'ws-1',
      user_id: 'u-2',
      role: 'member',
      joined_at: '2024-01-01',
    };
    mockBuilder.single.mockResolvedValueOnce({ data: fakeMember, error: null });
    const result = await addWorkspaceMember('ws-1', 'u-2', 'member');
    expect(result.data).toEqual(fakeMember);
    expect(mockBuilder.insert).toHaveBeenCalledWith({
      workspace_id: 'ws-1',
      user_id: 'u-2',
      role: 'member',
    });
  });
});
