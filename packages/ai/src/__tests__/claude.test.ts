import { ClaudeAIProvider } from '../claude';
import { LocalAIProvider } from '../local';
import { AnthropicProvider } from '../anthropic';

// Mock the AnthropicProvider so no real API calls are made.
jest.mock('../anthropic');

const MockedAnthropic = AnthropicProvider as jest.MockedClass<typeof AnthropicProvider>;

describe('ClaudeAIProvider', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('summarize — normal path', () => {
    it('delegates to AnthropicProvider when under rate limit', async () => {
      MockedAnthropic.prototype.summarize.mockResolvedValue('Short summary.');

      const provider = new ClaudeAIProvider({ apiKey: 'test' });
      const result = await provider.summarize('A very long task description');

      expect(result).toBe('Short summary.');
      expect(MockedAnthropic.prototype.summarize).toHaveBeenCalledTimes(1);
    });
  });

  describe('fallback on API error', () => {
    it('falls back to LocalAIProvider when AnthropicProvider throws', async () => {
      MockedAnthropic.prototype.summarize.mockRejectedValue(new Error('Network error'));

      const provider = new ClaudeAIProvider({ apiKey: 'test' });
      // LocalAIProvider.summarize returns the first sentence up to 80 chars
      const result = await provider.summarize('Complete the report. Then file it.');
      expect(result).toBe('Complete the report');
    });

    it('falls back for suggestLabels on error', async () => {
      MockedAnthropic.prototype.suggestLabels.mockRejectedValue(new Error('500'));

      const provider = new ClaudeAIProvider({ apiKey: 'test' });
      const result = await provider.suggestLabels('my task', [
        { id: 'l1', workspace_id: 'ws', name: 'bug', color: 'red' },
      ]);
      expect(result).toEqual([]);
    });
  });

  describe('rate limiting', () => {
    it('allows calls up to maxCallsPerWindow', async () => {
      MockedAnthropic.prototype.summarize.mockResolvedValue('ok');

      const provider = new ClaudeAIProvider({
        apiKey: 'test',
        maxCallsPerWindow: 3,
        windowMs: 60_000,
      });

      await provider.summarize('a');
      await provider.summarize('b');
      await provider.summarize('c');

      expect(MockedAnthropic.prototype.summarize).toHaveBeenCalledTimes(3);
    });

    it('falls back to LocalAIProvider once limit is reached', async () => {
      MockedAnthropic.prototype.summarize.mockResolvedValue('Claude result');

      const provider = new ClaudeAIProvider({
        apiKey: 'test',
        maxCallsPerWindow: 2,
        windowMs: 60_000,
      });

      await provider.summarize('a');
      await provider.summarize('b');
      // Third call should be rate-limited → LocalAIProvider
      const result = await provider.summarize('Hello world. More text here.');

      // LocalAIProvider returns first sentence ≤ 80 chars
      expect(result).toBe('Hello world');
      // AnthropicProvider was only called twice
      expect(MockedAnthropic.prototype.summarize).toHaveBeenCalledTimes(2);
    });

    it('exposes remaining call count', async () => {
      MockedAnthropic.prototype.summarize.mockResolvedValue('ok');

      const provider = new ClaudeAIProvider({
        apiKey: 'test',
        maxCallsPerWindow: 5,
        windowMs: 60_000,
      });

      expect(provider.remaining).toBe(5);
      await provider.summarize('x');
      expect(provider.remaining).toBe(4);
      await provider.summarize('y');
      expect(provider.remaining).toBe(3);
    });
  });

  describe('parseTaskInput', () => {
    it('uses Anthropic on success', async () => {
      MockedAnthropic.prototype.parseTaskInput.mockResolvedValue({
        title: 'Buy milk',
        priority: 'p2',
      });
      const provider = new ClaudeAIProvider({ apiKey: 'test' });
      const result = await provider.parseTaskInput('Buy milk p2');
      expect(result.title).toBe('Buy milk');
      expect(result.priority).toBe('p2');
    });

    it('falls back to local regex parser on API error', async () => {
      MockedAnthropic.prototype.parseTaskInput.mockRejectedValue(new Error('API down'));
      const provider = new ClaudeAIProvider({ apiKey: 'test' });
      // Local parser extracts p1 priority
      const result = await provider.parseTaskInput('Fix bug p1');
      expect(result.priority).toBe('p1');
    });
  });
});

describe('LocalAIProvider', () => {
  const local = new LocalAIProvider();

  it('parseTaskInput uses regex CE parser', async () => {
    const result = await local.parseTaskInput('Review PR p2 due 2026-05-01');
    expect(result.priority).toBe('p2');
  });

  it('suggestLabels always returns empty', async () => {
    const result = await local.suggestLabels('task', [
      { id: 'l1', workspace_id: 'ws', name: 'bug', color: 'red' },
    ]);
    expect(result).toEqual([]);
  });

  it('calculateFocusScore returns 50', async () => {
    expect(await local.calculateFocusScore('id')).toBe(50);
  });

  it('summarize returns first sentence up to 80 chars', async () => {
    const result = await local.summarize('Fix the login bug. Update the docs. Deploy.');
    expect(result).toBe('Fix the login bug');
  });

  it('summarize truncates to 80 chars when no sentence boundary', async () => {
    const long = 'A'.repeat(120);
    const result = await local.summarize(long);
    expect(result.length).toBeLessThanOrEqual(80);
  });
});
