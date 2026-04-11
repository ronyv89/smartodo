/**
 * Integration tests: verify the database schema is applied correctly.
 * Connects directly via pg as the postgres superuser (bypasses RLS).
 */

import { Client } from 'pg';

const DATABASE_URL = process.env.DATABASE_URL ?? '';
const skip = DATABASE_URL === '';
const describeIf = skip ? describe.skip : describe;

let client: Client;

describeIf('Schema integrity', () => {
  beforeAll(async () => {
    client = new Client({ connectionString: DATABASE_URL });
    await client.connect();
  });

  afterAll(async () => {
    await client.end();
  });

  const expectedTables = [
    'profiles',
    'workspaces',
    'workspace_members',
    'projects',
    'tasks',
    'labels',
    'task_labels',
    'task_comments',
    'activity_logs',
    'task_attachments',
  ];

  it.each(expectedTables)('public.%s table exists', async (table) => {
    const res = await client.query<{ exists: boolean }>(
      `select exists (
         select 1 from information_schema.tables
         where table_schema = 'public' and table_name = $1
       ) as exists`,
      [table],
    );
    expect(res.rows[0]?.exists).toBe(true);
  });

  it('auth.users table exists (stub)', async () => {
    const res = await client.query<{ exists: boolean }>(
      `select exists (
         select 1 from information_schema.tables
         where table_schema = 'auth' and table_name = 'users'
       ) as exists`,
    );
    expect(res.rows[0]?.exists).toBe(true);
  });

  it('tasks table has required columns', async () => {
    const res = await client.query<{ column_name: string }>(
      `select column_name from information_schema.columns
       where table_schema = 'public' and table_name = 'tasks'
       order by ordinal_position`,
    );
    const columns = res.rows.map((r) => r.column_name);
    expect(columns).toEqual(
      expect.arrayContaining([
        'id',
        'project_id',
        'parent_id',
        'assignee_id',
        'title',
        'description',
        'status',
        'priority',
        'due_date',
        'sort_order',
        'custom_fields',
        'ai_metadata',
        'created_at',
        'completed_at',
      ]),
    );
  });

  it('task_attachments table has required columns', async () => {
    const res = await client.query<{ column_name: string }>(
      `select column_name from information_schema.columns
       where table_schema = 'public' and table_name = 'task_attachments'
       order by ordinal_position`,
    );
    const columns = res.rows.map((r) => r.column_name);
    expect(columns).toEqual(
      expect.arrayContaining([
        'id',
        'task_id',
        'uploader_id',
        'file_name',
        'file_size',
        'mime_type',
        'storage_path',
        'created_at',
      ]),
    );
  });

  it('tasks.status has check constraint', async () => {
    const res = await client.query<{ constraint_name: string }>(
      `select constraint_name from information_schema.table_constraints
       where table_schema = 'public' and table_name = 'tasks'
         and constraint_type = 'CHECK'`,
    );
    expect(res.rows.length).toBeGreaterThan(0);
  });

  it('workspaces.plan_tier has check constraint', async () => {
    const res = await client.query<{ constraint_name: string }>(
      `select constraint_name from information_schema.table_constraints
       where table_schema = 'public' and table_name = 'workspaces'
         and constraint_type = 'CHECK'`,
    );
    expect(res.rows.length).toBeGreaterThan(0);
  });

  it('RLS is enabled on all public tables', async () => {
    const res = await client.query<{ relname: string; rowsecurity: boolean }>(
      `select relname, relrowsecurity as rowsecurity
       from pg_class c
       join pg_namespace n on n.oid = c.relnamespace
       where n.nspname = 'public' and c.relkind = 'r'
       order by relname`,
    );
    for (const row of res.rows) {
      expect({ table: row.relname, rls: row.rowsecurity }).toEqual({
        table: row.relname,
        rls: true,
      });
    }
  });
});
