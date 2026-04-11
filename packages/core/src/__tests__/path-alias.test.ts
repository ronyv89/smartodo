import { BRAND_COLORS, TASK_STATUS } from '@smartodo/core/constants';

describe('@smartodo/core path alias', () => {
  it('resolves brand colors constant', () => {
    expect(BRAND_COLORS.primary).toBe('#5e72e4');
  });

  it('resolves task status constant', () => {
    expect(TASK_STATUS).toContain('todo');
  });

  it('exports Task type (compile-time check)', () => {
    const status: (typeof TASK_STATUS)[number] = 'todo';
    expect(status).toBe('todo');
  });
});
