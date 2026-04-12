-- Migration 000: Extensions + shared schema setup
-- Must run before all other migrations.
-- Creates the extensions schema and installs extensions that Studio/pg-meta
-- expect to find (e.g. pg_stat_statements for the query-performance panel).

create schema if not exists extensions;

-- Allow the postgres role (and supabase_admin) to use the extensions schema
grant usage on schema extensions to postgres, supabase_admin, anon, authenticated, service_role;
alter default privileges in schema extensions grant all on tables to postgres, supabase_admin;

-- pg_stat_statements: required by Studio → Performance → Slowest queries panel.
-- shared_preload_libraries = 'pg_stat_statements' is set in the Supabase Postgres
-- image, so we only need to CREATE the extension here.
create extension if not exists pg_stat_statements schema extensions;
