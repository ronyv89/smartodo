-- Migration: 004_task_attachments
-- Adds file attachment support: a metadata table + a Supabase Storage bucket.

-- ── task_attachments table ─────────────────────────────────────────────────
create table if not exists public.task_attachments (
  id            uuid primary key default gen_random_uuid(),
  task_id       uuid not null references public.tasks(id) on delete cascade,
  uploader_id   uuid not null references auth.users(id) on delete set null,
  file_name     text not null,
  file_size     bigint not null,
  mime_type     text not null default 'application/octet-stream',
  storage_path  text not null unique,
  created_at    timestamptz not null default now()
);

create index if not exists task_attachments_task_id_idx on public.task_attachments(task_id);

-- RLS: users can read attachments for tasks in their workspaces,
--      upload to tasks in their workspaces, delete their own uploads.
alter table public.task_attachments enable row level security;

drop policy if exists "workspace members can read attachments" on public.task_attachments;
create policy "workspace members can read attachments"
  on public.task_attachments for select
  using (
    exists (
      select 1 from public.tasks t
      join public.projects p on p.id = t.project_id
      join public.workspace_members wm on wm.workspace_id = p.workspace_id
      where t.id = task_attachments.task_id
        and wm.user_id = auth.uid()
    )
  );

drop policy if exists "workspace members can upload attachments" on public.task_attachments;
create policy "workspace members can upload attachments"
  on public.task_attachments for insert
  with check (
    uploader_id = auth.uid()
    and exists (
      select 1 from public.tasks t
      join public.projects p on p.id = t.project_id
      join public.workspace_members wm on wm.workspace_id = p.workspace_id
      where t.id = task_attachments.task_id
        and wm.user_id = auth.uid()
    )
  );

drop policy if exists "uploaders can delete their own attachments" on public.task_attachments;
create policy "uploaders can delete their own attachments"
  on public.task_attachments for delete
  using (uploader_id = auth.uid());

-- ── Storage bucket ─────────────────────────────────────────────────────────
-- Run this via the Supabase Dashboard → Storage → New bucket, or:
--   supabase storage create task-attachments --public false
--
-- Storage policies (set via Dashboard or supabase/storage.sql):
--   INSERT: authenticated users who are workspace members
--   SELECT: authenticated users who are workspace members
--   DELETE: uploader only
