/**
 * Jest global setup for integration tests.
 *
 * Starts a plain Postgres 15 container, applies the test-bootstrap SQL
 * (minimal auth schema stub) then all four migration files, and waits
 * until the DB is accepting connections before the test suite runs.
 *
 * Container name: smartodo-test-db
 * Port: 54322 (matches DATABASE_URL in .env.local)
 */

import { execSync, spawnSync } from 'child_process';
import path from 'path';
import { Client } from 'pg';

const CONTAINER_NAME = 'smartodo-test-db';
const PG_PORT = '54399'; // dedicated test port — avoids conflict with docker-compose supabase-db (54322)
const PG_PASSWORD = 'postgres';
const PG_DB = 'smartodo';
const DATABASE_URL = `postgresql://postgres:${PG_PASSWORD}@localhost:${PG_PORT}/${PG_DB}`;

const ROOT = path.resolve(__dirname);
const SUPABASE_DIR = path.join(ROOT, 'supabase');

function run(cmd: string): void {
  execSync(cmd, { stdio: 'inherit' });
}

function containerRunning(): boolean {
  const result = spawnSync('docker', ['inspect', '-f', '{{.State.Running}}', CONTAINER_NAME], {
    encoding: 'utf8',
  });
  return result.stdout.trim() === 'true';
}

async function waitForPostgres(url: string, retries = 30, intervalMs = 1000): Promise<void> {
  for (let i = 0; i < retries; i++) {
    const client = new Client({ connectionString: url });
    try {
      await client.connect();
      await client.end();
      return;
    } catch {
      await new Promise((resolve) => setTimeout(resolve, intervalMs));
    }
  }
  throw new Error(`Postgres did not become ready at ${url} after ${String(retries)} attempts`);
}

async function applySQL(url: string, file: string): Promise<void> {
  const fs = await import('fs');
  const sql = fs.readFileSync(file, 'utf8');
  const client = new Client({ connectionString: url });
  await client.connect();
  await client.query(sql);
  await client.end();
}

export default async function globalSetup(): Promise<void> {
  if (containerRunning()) {
    console.warn('[integration] Reusing existing smartodo-test-db container');
  } else {
    // Remove stopped container if it exists
    spawnSync('docker', ['rm', '-f', CONTAINER_NAME], { encoding: 'utf8' });

    console.warn('[integration] Starting Postgres container…');
    run(
      [
        'docker run -d',
        `--name ${CONTAINER_NAME}`,
        `-p ${PG_PORT}:5432`,
        `-e POSTGRES_PASSWORD=${PG_PASSWORD}`,
        `-e POSTGRES_DB=${PG_DB}`,
        'postgres:15-alpine',
      ].join(' '),
    );
  }

  console.warn('[integration] Waiting for Postgres to be ready…');
  await waitForPostgres(DATABASE_URL);

  console.warn('[integration] Applying test bootstrap (auth schema stub)…');
  await applySQL(DATABASE_URL, path.join(SUPABASE_DIR, 'test-bootstrap.sql'));

  const migrations = [
    '001_auth_profiles.sql',
    '002_workspaces.sql',
    '003_projects_tasks.sql',
    '004_task_attachments.sql',
  ];

  for (const migration of migrations) {
    const file = path.join(SUPABASE_DIR, 'migrations', migration);
    console.warn(`[integration] Applying migration: ${migration}`);
    await applySQL(DATABASE_URL, file);
  }

  console.warn('[integration] Database ready.');

  // Expose connection URL to test files via an env var
  process.env.DATABASE_URL = DATABASE_URL;
}
