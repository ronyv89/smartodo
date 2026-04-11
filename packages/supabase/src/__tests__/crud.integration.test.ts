/**
 * Integration tests: CRUD operations against the real database schema.
 * Connects as postgres superuser (bypasses RLS) to exercise table
 * constraints, triggers, and cascades.
 */

import { Client } from 'pg';

const DATABASE_URL = process.env.DATABASE_URL ?? '';
const skip = DATABASE_URL === '';
const describeIf = skip ? describe.skip : describe;

let client: Client;

// Reusable IDs set up in beforeAll
let userId: string;
let workspaceId: string;
let projectId: string;
let taskId: string;

describeIf('CRUD operations', () => {
  beforeAll(async () => {
    client = new Client({ connectionString: DATABASE_URL });
    await client.connect();

    // Clean up any leftover data from a previous run (idempotent)
    await client.query(`delete from auth.users where email = 'integration@test.local'`);
  });

  afterAll(async () => {
    // Cascade deletes clean up everything downstream
    if (userId) {
      await client.query(`delete from auth.users where id = $1`, [userId]);
    }
    await client.end();
  });

  // ── Users + Profiles ──────────────────────────────────────────────────────

  it('inserts a user into auth.users', async () => {
    const res = await client.query<{ id: string }>(
      `insert into auth.users (email, raw_user_meta_data)
       values ('integration@test.local', '{"full_name":"Integration Tester"}')
       returning id`,
    );
    userId = res.rows[0]?.id ?? '';
    expect(userId).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/);
  });

  it('trigger auto-creates a profile for new auth user', async () => {
    const res = await client.query<{ id: string; full_name: string }>(
      `select id, full_name from public.profiles where id = $1`,
      [userId],
    );
    expect(res.rows[0]?.id).toBe(userId);
    expect(res.rows[0]?.full_name).toBe('Integration Tester');
  });

  // ── Workspaces ────────────────────────────────────────────────────────────

  it('creates a workspace', async () => {
    const res = await client.query<{ id: string }>(
      `insert into public.workspaces (name, slug, owner_id, plan_tier)
       values ('Test Workspace', 'test-workspace-integration', $1, 'community')
       returning id`,
      [userId],
    );
    workspaceId = res.rows[0]?.id ?? '';
    expect(workspaceId).toBeTruthy();
  });

  it('trigger auto-adds owner as admin member', async () => {
    const res = await client.query<{ role: string }>(
      `select role from public.workspace_members
       where workspace_id = $1 and user_id = $2`,
      [workspaceId, userId],
    );
    expect(res.rows[0]?.role).toBe('admin');
  });

  it('rejects invalid plan_tier', async () => {
    await expect(
      client.query(
        `insert into public.workspaces (name, slug, owner_id, plan_tier)
         values ('Bad', 'bad-slug', $1, 'enterprise') returning id`,
        [userId],
      ),
    ).rejects.toThrow();
  });

  // ── Projects ──────────────────────────────────────────────────────────────

  it('creates a project in the workspace', async () => {
    const res = await client.query<{ id: string }>(
      `insert into public.projects (workspace_id, name, color)
       values ($1, 'Integration Project', '#5e72e4')
       returning id`,
      [workspaceId],
    );
    projectId = res.rows[0]?.id ?? '';
    expect(projectId).toBeTruthy();
  });

  it('rejects invalid view_default', async () => {
    await expect(
      client.query(
        `insert into public.projects (workspace_id, name, view_default)
         values ($1, 'Bad Project', 'gantt') returning id`,
        [workspaceId],
      ),
    ).rejects.toThrow();
  });

  // ── Tasks ─────────────────────────────────────────────────────────────────

  it('creates a task in the project', async () => {
    const res = await client.query<{ id: string }>(
      `insert into public.tasks (project_id, title, status, priority)
       values ($1, 'Write integration tests', 'todo', 'p2')
       returning id`,
      [projectId],
    );
    taskId = res.rows[0]?.id ?? '';
    expect(taskId).toBeTruthy();
  });

  it('rejects invalid task status', async () => {
    await expect(
      client.query(
        `insert into public.tasks (project_id, title, status, priority)
         values ($1, 'Bad Task', 'pending', 'p2') returning id`,
        [projectId],
      ),
    ).rejects.toThrow();
  });

  it('rejects invalid task priority', async () => {
    await expect(
      client.query(
        `insert into public.tasks (project_id, title, status, priority)
         values ($1, 'Bad Task', 'todo', 'urgent') returning id`,
        [projectId],
      ),
    ).rejects.toThrow();
  });

  it('creates a subtask with parent_id', async () => {
    const res = await client.query<{ id: string; parent_id: string }>(
      `insert into public.tasks (project_id, parent_id, title, status, priority)
       values ($1, $2, 'Subtask', 'todo', 'p3')
       returning id, parent_id`,
      [projectId, taskId],
    );
    expect(res.rows[0]?.parent_id).toBe(taskId);
  });

  // ── Labels ────────────────────────────────────────────────────────────────

  it('creates a label and attaches it to a task', async () => {
    const labelRes = await client.query<{ id: string }>(
      `insert into public.labels (workspace_id, name, color)
       values ($1, 'bug', '#ef4444')
       returning id`,
      [workspaceId],
    );
    const labelId = labelRes.rows[0]?.id ?? '';

    await client.query(`insert into public.task_labels (task_id, label_id) values ($1, $2)`, [
      taskId,
      labelId,
    ]);

    const res = await client.query<{ label_id: string }>(
      `select label_id from public.task_labels where task_id = $1`,
      [taskId],
    );
    expect(res.rows[0]?.label_id).toBe(labelId);
  });

  it('enforces unique (workspace_id, name) on labels', async () => {
    await expect(
      client.query(
        `insert into public.labels (workspace_id, name, color) values ($1, 'bug', '#000')`,
        [workspaceId],
      ),
    ).rejects.toThrow();
  });

  // ── Comments ──────────────────────────────────────────────────────────────

  it('creates a task comment', async () => {
    const res = await client.query<{ id: string; body: string }>(
      `insert into public.task_comments (task_id, author_id, body)
       values ($1, $2, 'This is an integration test comment.')
       returning id, body`,
      [taskId, userId],
    );
    expect(res.rows[0]?.body).toBe('This is an integration test comment.');
  });

  // ── Activity logs ─────────────────────────────────────────────────────────

  it('creates an activity log entry', async () => {
    const res = await client.query<{ id: string; action: string }>(
      `insert into public.activity_logs (task_id, actor_id, action, diff)
       values ($1, $2, 'status_changed', '{"from":"todo","to":"in_progress"}')
       returning id, action`,
      [taskId, userId],
    );
    expect(res.rows[0]?.action).toBe('status_changed');
  });

  // ── Task attachments ──────────────────────────────────────────────────────

  it('creates a task attachment metadata row', async () => {
    const res = await client.query<{ id: string; file_name: string }>(
      `insert into public.task_attachments
         (task_id, uploader_id, file_name, file_size, mime_type, storage_path)
       values ($1, $2, 'test.pdf', 12345, 'application/pdf', $3)
       returning id, file_name`,
      [taskId, userId, `${taskId}/test.pdf`],
    );
    expect(res.rows[0]?.file_name).toBe('test.pdf');
  });

  it('enforces unique storage_path on task_attachments', async () => {
    await expect(
      client.query(
        `insert into public.task_attachments
           (task_id, uploader_id, file_name, file_size, mime_type, storage_path)
         values ($1, $2, 'dup.pdf', 99, 'application/pdf', $3)`,
        [taskId, userId, `${taskId}/test.pdf`],
      ),
    ).rejects.toThrow();
  });

  // ── Cascade deletes ───────────────────────────────────────────────────────

  it('deleting a task cascades to comments, activity logs, and attachments', async () => {
    await client.query(`delete from public.tasks where id = $1`, [taskId]);

    const comments = await client.query(`select id from public.task_comments where task_id = $1`, [
      taskId,
    ]);
    const logs = await client.query(`select id from public.activity_logs where task_id = $1`, [
      taskId,
    ]);
    const attachments = await client.query(
      `select id from public.task_attachments where task_id = $1`,
      [taskId],
    );

    expect(comments.rows).toHaveLength(0);
    expect(logs.rows).toHaveLength(0);
    expect(attachments.rows).toHaveLength(0);
  });
});
