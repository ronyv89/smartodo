/**
 * Jest global teardown for integration tests.
 * Stops and removes the Postgres test container.
 */

import { spawnSync } from 'child_process';

const CONTAINER_NAME = 'smartodo-test-db';

export default function globalTeardown(): void {
  console.warn('[integration] Stopping Postgres test container…');
  spawnSync('docker', ['rm', '-f', CONTAINER_NAME], { encoding: 'utf8', stdio: 'inherit' });
}
