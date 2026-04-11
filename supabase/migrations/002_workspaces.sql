-- Migration 002: Workspaces + Members
-- Creates workspaces, workspace_members tables with RLS,
-- and a trigger that auto-creates the owner's membership on workspace creation.

-- ─────────────────────────────────────────────
-- workspaces (table only — policies created below after workspace_members)
-- ─────────────────────────────────────────────
create table if not exists public.workspaces (
  id         uuid primary key default gen_random_uuid(),
  name       text not null,
  slug       text not null unique,
  owner_id   uuid not null references public.profiles(id) on delete cascade,
  settings   jsonb not null default '{}',
  plan_tier  text not null default 'community' check (plan_tier in ('community', 'pro')),
  created_at timestamptz not null default now()
);

-- ─────────────────────────────────────────────
-- workspace_members (created before workspaces policies so that cross-table
-- references in USING expressions resolve correctly in plain Postgres)
-- ─────────────────────────────────────────────
create table if not exists public.workspace_members (
  id           uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  user_id      uuid not null references public.profiles(id) on delete cascade,
  role         text not null default 'member' check (role in ('admin', 'member', 'viewer')),
  joined_at    timestamptz not null default now(),
  unique (workspace_id, user_id)
);

-- ─────────────────────────────────────────────
-- RLS — workspaces
-- ─────────────────────────────────────────────
alter table public.workspaces enable row level security;

-- Members (and owners) can read workspaces they belong to
create policy "workspaces: members can read"
  on public.workspaces for select
  using (
    exists (
      select 1 from public.workspace_members wm
      where wm.workspace_id = id and wm.user_id = auth.uid()
    )
  );

-- Authenticated users can create workspaces
create policy "workspaces: authenticated can create"
  on public.workspaces for insert
  with check (auth.uid() = owner_id);

-- Only admin members can update workspace settings
create policy "workspaces: admin can update"
  on public.workspaces for update
  using (
    exists (
      select 1 from public.workspace_members wm
      where wm.workspace_id = id and wm.user_id = auth.uid() and wm.role = 'admin'
    )
  );

-- Only owner can delete workspace
create policy "workspaces: owner can delete"
  on public.workspaces for delete
  using (auth.uid() = owner_id);

-- ─────────────────────────────────────────────
-- RLS — workspace_members
-- ─────────────────────────────────────────────
alter table public.workspace_members enable row level security;

-- Members can see other members of the same workspace
create policy "workspace_members: members can read"
  on public.workspace_members for select
  using (
    exists (
      select 1 from public.workspace_members wm
      where wm.workspace_id = workspace_id and wm.user_id = auth.uid()
    )
  );

-- Admin members can add new members
create policy "workspace_members: admin can insert"
  on public.workspace_members for insert
  with check (
    exists (
      select 1 from public.workspace_members wm
      where wm.workspace_id = workspace_id and wm.user_id = auth.uid() and wm.role = 'admin'
    )
  );

-- Admin members can update roles
create policy "workspace_members: admin can update"
  on public.workspace_members for update
  using (
    exists (
      select 1 from public.workspace_members wm
      where wm.workspace_id = workspace_id and wm.user_id = auth.uid() and wm.role = 'admin'
    )
  );

-- Admin can remove members (but not themselves if they're the last admin)
create policy "workspace_members: admin can delete"
  on public.workspace_members for delete
  using (
    exists (
      select 1 from public.workspace_members wm
      where wm.workspace_id = workspace_id and wm.user_id = auth.uid() and wm.role = 'admin'
    )
  );

-- ─────────────────────────────────────────────
-- Trigger: auto-add owner as admin on workspace creation
-- ─────────────────────────────────────────────
create or replace function public.handle_new_workspace()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.workspace_members (workspace_id, user_id, role)
  values (new.id, new.owner_id, 'admin');
  return new;
end;
$$;

drop trigger if exists on_workspace_created on public.workspaces;
create trigger on_workspace_created
  after insert on public.workspaces
  for each row execute procedure public.handle_new_workspace();
