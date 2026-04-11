-- Migration 001: Auth + Profiles
-- Creates the profiles table, links it to auth.users via trigger,
-- and sets up Row Level Security policies.

-- ─────────────────────────────────────────────
-- profiles
-- ─────────────────────────────────────────────
create table if not exists public.profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  full_name   text not null default '',
  avatar_url  text,
  preferences jsonb not null default '{}',
  created_at  timestamptz not null default now()
);

alter table public.profiles enable row level security;

-- Users can read any profile (needed for assignee display)
create policy "profiles: anyone can read"
  on public.profiles for select
  using (true);

-- Users can only update their own profile
create policy "profiles: owner can update"
  on public.profiles for update
  using (auth.uid() = id);

-- ─────────────────────────────────────────────
-- Trigger: auto-create profile on signup
-- ─────────────────────────────────────────────
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, avatar_url)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', ''),
    new.raw_user_meta_data->>'avatar_url'
  );
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
