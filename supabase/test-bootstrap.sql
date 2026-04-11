-- Test-only bootstrap: creates a minimal auth schema stub so that our
-- migrations (which reference auth.users and auth.uid()) can run against
-- a plain Postgres 15 instance in CI / integration test environments.
-- This file is NOT applied in production (Supabase provides the real auth schema).

create schema if not exists auth;

-- Minimal auth.users table — only the columns our migrations reference.
create table if not exists auth.users (
  id                 uuid primary key default gen_random_uuid(),
  email              text unique,
  raw_user_meta_data jsonb not null default '{}',
  created_at         timestamptz not null default now()
);

-- Stub for auth.uid() — always returns NULL in tests (RLS is bypassed
-- when connecting as postgres superuser, so the value is never evaluated).
create or replace function auth.uid()
returns uuid
language sql stable
as $$
  select null::uuid;
$$;

-- Stub for auth.role() — used implicitly by some Supabase RLS helpers.
create or replace function auth.role()
returns text
language sql stable
as $$
  select 'anon'::text;
$$;
