import { parseTaskInput } from '../utils/parseTaskInput';

// Fixed reference date: Wednesday 2024-01-10
const NOW = new Date('2024-01-10T12:00:00Z');

describe('parseTaskInput — title extraction', () => {
  it('returns the raw input as title when no special tokens present', () => {
    const result = parseTaskInput('Buy groceries', NOW);
    expect(result.title).toBe('Buy groceries');
    expect(result.priority).toBeNull();
    expect(result.due_date).toBeNull();
    expect(result.assignee_mention).toBeNull();
  });

  it('extracts title after removing all tokens', () => {
    const result = parseTaskInput('Call dentist tomorrow P1 @alice', NOW);
    expect(result.title).toBe('Call dentist');
  });
});

describe('parseTaskInput — priority', () => {
  it('extracts p1 (uppercase)', () => {
    expect(parseTaskInput('Fix bug P1', NOW).priority).toBe('p1');
  });

  it('extracts p2 (lowercase)', () => {
    expect(parseTaskInput('Fix bug p2', NOW).priority).toBe('p2');
  });

  it('extracts p3 in brackets', () => {
    expect(parseTaskInput('Fix bug [p3]', NOW).priority).toBe('p3');
  });

  it('extracts p4 in parens', () => {
    expect(parseTaskInput('Fix bug (p4)', NOW).priority).toBe('p4');
  });

  it('returns null when no priority present', () => {
    expect(parseTaskInput('Buy groceries', NOW).priority).toBeNull();
  });
});

describe('parseTaskInput — due date', () => {
  it('resolves "today"', () => {
    expect(parseTaskInput('Task today', NOW).due_date).toBe('2024-01-10');
  });

  it('resolves "tomorrow"', () => {
    expect(parseTaskInput('Task tomorrow', NOW).due_date).toBe('2024-01-11');
  });

  it('resolves "next week"', () => {
    expect(parseTaskInput('Task next week', NOW).due_date).toBe('2024-01-17');
  });

  it('resolves "in 3 days"', () => {
    expect(parseTaskInput('Task in 3 days', NOW).due_date).toBe('2024-01-13');
  });

  it('resolves next weekday (Monday from Wednesday)', () => {
    // 2024-01-10 is Wednesday; next Monday = 2024-01-15
    expect(parseTaskInput('Task on Monday', NOW).due_date).toBe('2024-01-15');
  });

  it('resolves next Friday from Wednesday', () => {
    // 2024-01-10 is Wednesday; next Friday = 2024-01-12
    expect(parseTaskInput('Task on Friday', NOW).due_date).toBe('2024-01-12');
  });

  it('returns null when no date present', () => {
    expect(parseTaskInput('Buy groceries', NOW).due_date).toBeNull();
  });
});

describe('parseTaskInput — assignee', () => {
  it('extracts @mention', () => {
    expect(parseTaskInput('Task @bob', NOW).assignee_mention).toBe('bob');
  });

  it('returns null when no @mention present', () => {
    expect(parseTaskInput('Buy groceries', NOW).assignee_mention).toBeNull();
  });
});

describe('parseTaskInput — combined', () => {
  it('parses all fields simultaneously', () => {
    const result = parseTaskInput('Call dentist tomorrow P1 @alice', NOW);
    expect(result.title).toBe('Call dentist');
    expect(result.priority).toBe('p1');
    expect(result.due_date).toBe('2024-01-11');
    expect(result.assignee_mention).toBe('alice');
  });

  it('handles input with only a priority (title preserved)', () => {
    const result = parseTaskInput('p2', NOW);
    expect(result.priority).toBe('p2');
    // title falls back to original input when it would be empty
    expect(result.title).toBe('p2');
  });
});
