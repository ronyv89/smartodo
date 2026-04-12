-- Migration 003: Projects + Tasks
-- Core task management tables with RLS

-- ─────────────────────────────────────────────
-- projects
-- ─────────────────────────────────────────────
create table if not exists public.projects (
  id           uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  name         text not null,
  description  text,
  color        text not null default '#5e72e4',
  view_default text not null default 'list' check (view_default in ('list', 'board')),
  sort_order   integer not null default 0,
  archived     boolean not null default false,
  created_at   timestamptz not null default now()
);

alter table public.projects enable row level security;

drop policy if exists "projects: workspace members can read" on public.projects;
create policy "projects: workspace members can read"
  on public.projects for select
  using (
    exists (
      select 1 from public.workspace_members wm
      where wm.workspace_id = workspace_id and wm.user_id = auth.uid()
    )
  );

drop policy if exists "projects: admin/member can create" on public.projects;
create policy "projects: admin/member can create"
  on public.projects for insert
  with check (
    exists (
      select 1 from public.workspace_members wm
      where wm.workspace_id = workspace_id
        and wm.user_id = auth.uid()
        and wm.role in ('admin', 'member')
    )
  );

drop policy if exists "projects: admin/member can update" on public.projects;
create policy "projects: admin/member can update"
  on public.projects for update
  using (
    exists (
      select 1 from public.workspace_members wm
      where wm.workspace_id = workspace_id
        and wm.user_id = auth.uid()
        and wm.role in ('admin', 'member')
    )
  );

drop policy if exists "projects: admin can delete" on public.projects;
create policy "projects: admin can delete"
  on public.projects for delete
  using (
    exists (
      select 1 from public.workspace_members wm
      where wm.workspace_id = workspace_id
        and wm.user_id = auth.uid()
        and wm.role = 'admin'
    )
  );

-- ─────────────────────────────────────────────
-- tasks
-- ─────────────────────────────────────────────
create table if not exists public.tasks (
  id            uuid primary key default gen_random_uuid(),
  project_id    uuid not null references public.projects(id) on delete cascade,
  parent_id     uuid references public.tasks(id) on delete set null,
  assignee_id   uuid references public.profiles(id) on delete set null,
  title         text not null,
  description   text,
  status        text not null default 'todo' check (status in ('todo', 'in_progress', 'done', 'cancelled')),
  priority      text not null default 'p3' check (priority in ('p1', 'p2', 'p3', 'p4')),
  due_date      date,
  sort_order    integer not null default 0,
  custom_fields jsonb not null default '{}',
  ai_metadata   jsonb not null default '{}',
  created_at    timestamptz not null default now(),
  completed_at  timestamptz
);

alter table public.tasks enable row level security;

drop policy if exists "tasks: workspace members can read" on public.tasks;
create policy "tasks: workspace members can read"
  on public.tasks for select
  using (
    exists (
      select 1
      from public.projects p
      join public.workspace_members wm on wm.workspace_id = p.workspace_id
      where p.id = project_id and wm.user_id = auth.uid()
    )
  );

drop policy if exists "tasks: admin/member can create" on public.tasks;
create policy "tasks: admin/member can create"
  on public.tasks for insert
  with check (
    exists (
      select 1
      from public.projects p
      join public.workspace_members wm on wm.workspace_id = p.workspace_id
      where p.id = project_id
        and wm.user_id = auth.uid()
        and wm.role in ('admin', 'member')
    )
  );

drop policy if exists "tasks: admin/member can update" on public.tasks;
create policy "tasks: admin/member can update"
  on public.tasks for update
  using (
    exists (
      select 1
      from public.projects p
      join public.workspace_members wm on wm.workspace_id = p.workspace_id
      where p.id = project_id
        and wm.user_id = auth.uid()
        and wm.role in ('admin', 'member')
    )
  );

drop policy if exists "tasks: admin/member can delete" on public.tasks;
create policy "tasks: admin/member can delete"
  on public.tasks for delete
  using (
    exists (
      select 1
      from public.projects p
      join public.workspace_members wm on wm.workspace_id = p.workspace_id
      where p.id = project_id
        and wm.user_id = auth.uid()
        and wm.role in ('admin', 'member')
    )
  );

-- ─────────────────────────────────────────────
-- labels
-- ─────────────────────────────────────────────
create table if not exists public.labels (
  id           uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  name         text not null,
  color        text not null default '#6b7280',
  unique (workspace_id, name)
);

alter table public.labels enable row level security;

drop policy if exists "labels: workspace members can read" on public.labels;
create policy "labels: workspace members can read"
  on public.labels for select
  using (
    exists (
      select 1 from public.workspace_members wm
      where wm.workspace_id = workspace_id and wm.user_id = auth.uid()
    )
  );

drop policy if exists "labels: admin/member can manage" on public.labels;
create policy "labels: admin/member can manage"
  on public.labels for all
  using (
    exists (
      select 1 from public.workspace_members wm
      where wm.workspace_id = workspace_id
        and wm.user_id = auth.uid()
        and wm.role in ('admin', 'member')
    )
  );

-- ─────────────────────────────────────────────
-- task_labels (join table)
-- ─────────────────────────────────────────────
create table if not exists public.task_labels (
  task_id  uuid not null references public.tasks(id) on delete cascade,
  label_id uuid not null references public.labels(id) on delete cascade,
  primary key (task_id, label_id)
);

alter table public.task_labels enable row level security;

drop policy if exists "task_labels: workspace members can read" on public.task_labels;
create policy "task_labels: workspace members can read"
  on public.task_labels for select
  using (
    exists (
      select 1
      from public.tasks t
      join public.projects p on p.id = t.project_id
      join public.workspace_members wm on wm.workspace_id = p.workspace_id
      where t.id = task_id and wm.user_id = auth.uid()
    )
  );

drop policy if exists "task_labels: admin/member can manage" on public.task_labels;
create policy "task_labels: admin/member can manage"
  on public.task_labels for all
  using (
    exists (
      select 1
      from public.tasks t
      join public.projects p on p.id = t.project_id
      join public.workspace_members wm on wm.workspace_id = p.workspace_id
      where t.id = task_id
        and wm.user_id = auth.uid()
        and wm.role in ('admin', 'member')
    )
  );

-- ─────────────────────────────────────────────
-- task_comments
-- ─────────────────────────────────────────────
create table if not exists public.task_comments (
  id         uuid primary key default gen_random_uuid(),
  task_id    uuid not null references public.tasks(id) on delete cascade,
  author_id  uuid not null references public.profiles(id) on delete cascade,
  body       text not null,
  created_at timestamptz not null default now()
);

alter table public.task_comments enable row level security;

drop policy if exists "task_comments: workspace members can read" on public.task_comments;
create policy "task_comments: workspace members can read"
  on public.task_comments for select
  using (
    exists (
      select 1
      from public.tasks t
      join public.projects p on p.id = t.project_id
      join public.workspace_members wm on wm.workspace_id = p.workspace_id
      where t.id = task_id and wm.user_id = auth.uid()
    )
  );

drop policy if exists "task_comments: members can create own" on public.task_comments;
create policy "task_comments: members can create own"
  on public.task_comments for insert
  with check (auth.uid() = author_id);

drop policy if exists "task_comments: author can delete own" on public.task_comments;
create policy "task_comments: author can delete own"
  on public.task_comments for delete
  using (auth.uid() = author_id);

-- ─────────────────────────────────────────────
-- activity_logs
-- ─────────────────────────────────────────────
create table if not exists public.activity_logs (
  id         uuid primary key default gen_random_uuid(),
  task_id    uuid not null references public.tasks(id) on delete cascade,
  actor_id   uuid not null references public.profiles(id) on delete cascade,
  action     text not null,
  diff       jsonb not null default '{}',
  created_at timestamptz not null default now()
);

alter table public.activity_logs enable row level security;

drop policy if exists "activity_logs: workspace members can read" on public.activity_logs;
create policy "activity_logs: workspace members can read"
  on public.activity_logs for select
  using (
    exists (
      select 1
      from public.tasks t
      join public.projects p on p.id = t.project_id
      join public.workspace_members wm on wm.workspace_id = p.workspace_id
      where t.id = task_id and wm.user_id = auth.uid()
    )
  );

drop policy if exists "activity_logs: system inserts only" on public.activity_logs;
create policy "activity_logs: system inserts only"
  on public.activity_logs for insert
  with check (auth.uid() = actor_id);
