import { BRAND_COLORS, TASK_STATUS } from '@smartodo/core/constants';
import type { Task } from '@smartodo/core/types';

describe('@smartodo/core path alias', () => {
  it('resolves constants correctly', () => {
    expect(BRAND_COLORS.primary).toBe('#5e72e4');
    expect(TASK_STATUS).toContain('todo');
  });

  it('exports Task type (compile-time check)', () => {
    const task: Partial<Task> = { title: 'Test task', status: 'todo' };
    expect(task.status).toBe('todo');
  });
});
