import type { ParsedTask } from '@smartodo/ai';

describe('@smartodo/ai path alias', () => {
  it('resolves ParsedTask type correctly (compile-time check)', () => {
    const parsed: ParsedTask = { title: 'Buy groceries', priority: 'p2' };
    expect(parsed.title).toBe('Buy groceries');
  });

  it('package module resolves', async () => {
    const ai = await import('@smartodo/ai');
    expect(ai).toBeDefined();
  });
});
