import { execSync } from 'child_process';
import path from 'path';
import fs from 'fs';

const REPO_ROOT = path.resolve(__dirname, '../../../../');
const COMMITLINT_BIN = path.join(REPO_ROOT, 'node_modules/.bin/commitlint');

function runCommitlint(message: string): string {
  try {
    execSync(`echo "${message}" | ${COMMITLINT_BIN} --config commitlint.config.ts`, {
      cwd: REPO_ROOT,
      encoding: 'utf-8',
      stdio: ['pipe', 'pipe', 'pipe'],
    });
    return 'pass';
  } catch (err) {
    const e = err as { stdout?: string; stderr?: string };
    return (e.stdout ?? '') + (e.stderr ?? '');
  }
}

describe('commitlint configuration', () => {
  it('accepts a valid conventional commit message', () => {
    const result = runCommitlint('feat: add task creation feature');
    expect(result).toBe('pass');
  });

  it('rejects a non-conventional commit message', () => {
    const result = runCommitlint('added some stuff');
    expect(result).not.toBe('pass');
    expect(result).toMatch(/subject may not be empty|type may not be empty|error/i);
  });

  it('rejects an invalid type', () => {
    const result = runCommitlint('wip: work in progress');
    expect(result).not.toBe('pass');
  });

  it('accepts all allowed types', () => {
    const types = ['feat', 'fix', 'chore', 'refactor', 'test', 'docs', 'ci'];
    for (const type of types) {
      const result = runCommitlint(`${type}: valid message`);
      expect(result).toBe('pass');
    }
  });

  it('commitlint config file exists', () => {
    const configPath = path.join(REPO_ROOT, 'commitlint.config.ts');
    expect(fs.existsSync(configPath)).toBe(true);
  });
});
