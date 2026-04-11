import type { AIProvider, ParsedTask } from '@smartodo/ai';

describe('@smartodo/ai path alias', () => {
  it('resolves AI provider interface correctly', () => {
    const parsed: ParsedTask = { title: 'Buy groceries', priority: 'p2' };
    expect(parsed.title).toBe('Buy groceries');

    // Compile-time check: AIProvider is assignable
    const _check: AIProvider | undefined = undefined;
    expect(_check).toBeUndefined();
  });
});
