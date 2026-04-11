import { execSync } from 'child_process';
import path from 'path';
import fs from 'fs';

const REPO_ROOT = path.resolve(__dirname, '../../../../');
const ESLINT_BIN = path.join(REPO_ROOT, 'node_modules/.bin/eslint');

describe('ESLint configuration', () => {
  it('ESLint config file exists with required rules', () => {
    const configPath = path.join(REPO_ROOT, 'eslint.config.mjs');
    expect(fs.existsSync(configPath)).toBe(true);
    const content = fs.readFileSync(configPath, 'utf-8');
    expect(content).toContain('@typescript-eslint/no-explicit-any');
    expect(content).toContain('no-console');
    expect(content).toContain('prettier');
    expect(content).toContain('strictTypeChecked');
  });

  it('ESLint reports errors on no-console violation (subprocess)', () => {
    // Write a fixture inside the project so ESLint's base path includes it
    const fixtureDir = path.join(REPO_ROOT, 'packages/core/src/__tests__/fixtures');
    if (!fs.existsSync(fixtureDir)) fs.mkdirSync(fixtureDir, { recursive: true });
    const fixturePath = path.join(fixtureDir, 'console-violation.ts');
    fs.writeFileSync(fixturePath, `// eslint-test fixture\nconst _x = 1;\nconsole.log('bad');\n`);

    let output = '';
    try {
      execSync(`${ESLINT_BIN} --max-warnings 0 ${fixturePath}`, {
        encoding: 'utf-8',
        stdio: ['pipe', 'pipe', 'pipe'],
        cwd: REPO_ROOT,
      });
    } catch (err) {
      const e = err as { stdout?: string; stderr?: string };
      output = (e.stdout ?? '') + (e.stderr ?? '');
    } finally {
      if (fs.existsSync(fixturePath)) fs.unlinkSync(fixturePath);
    }

    // ESLint should report the no-console error from our project config
    expect(output).toMatch(/no-console|error/i);
  });

  it('Prettier config is valid JSON with correct settings', () => {
    const prettierrc = path.join(REPO_ROOT, '.prettierrc');
    const content = fs.readFileSync(prettierrc, 'utf-8');
    const config = JSON.parse(content) as Record<string, unknown>;
    expect(config.singleQuote).toBe(true);
    expect(config.semi).toBe(true);
    expect(config.printWidth).toBe(100);
  });
});
