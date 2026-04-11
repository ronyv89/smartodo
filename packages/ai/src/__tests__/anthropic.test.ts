import { AnthropicProvider } from '../anthropic';

// Mock the Anthropic SDK so tests never hit the network.
jest.mock('@anthropic-ai/sdk', () => {
  const mockCreate = jest.fn();
  return {
    __esModule: true,
    default: jest.fn().mockImplementation(() => ({
      messages: { create: mockCreate },
    })),
    _mockCreate: mockCreate,
  };
});

// Helper to get the mock `create` function after module setup.
function getMockCreate(): jest.Mock {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const mod = require('@anthropic-ai/sdk') as { _mockCreate: jest.Mock };
  return mod._mockCreate;
}

function textBlock(text: string) {
  return { content: [{ type: 'text', text }] };
}

describe('AnthropicProvider', () => {
  let provider: AnthropicProvider;

  beforeEach(() => {
    provider = new AnthropicProvider('test-api-key');
    getMockCreate().mockReset();
  });

  describe('summarize', () => {
    it('returns the text from the first content block', async () => {
      getMockCreate().mockResolvedValue(textBlock('Fix the login bug.'));
      const result = await provider.summarize('Fix the login bug on the dashboard page');
      expect(result).toBe('Fix the login bug.');
    });

    it('falls back to the input text when content is missing', async () => {
      getMockCreate().mockResolvedValue({ content: [] });
      const input = 'Some task';
      const result = await provider.summarize(input);
      expect(result).toBe(input);
    });

    it('calls the API with cache_control on the system prompt', async () => {
      getMockCreate().mockResolvedValue(textBlock('Summary.'));
      await provider.summarize('task text');
      const call = getMockCreate().mock.calls[0]?.[0] as Record<string, unknown>;
      const system = call.system as { cache_control?: unknown }[];
      expect(system[0]?.cache_control).toEqual({ type: 'ephemeral' });
    });
  });

  describe('parseTaskInput', () => {
    it('merges parsed JSON into the result with input as fallback title', async () => {
      const json = JSON.stringify({ title: 'Buy milk', due_date: '2026-04-20', priority: 'p2' });
      getMockCreate().mockResolvedValue(textBlock(json));
      const result = await provider.parseTaskInput('Buy milk by April 20 p2');
      expect(result.title).toBe('Buy milk');
      expect(result.due_date).toBe('2026-04-20');
      expect(result.priority).toBe('p2');
    });

    it('falls back to { title: input } on invalid JSON', async () => {
      getMockCreate().mockResolvedValue(textBlock('not-json'));
      const result = await provider.parseTaskInput('raw input');
      expect(result).toEqual({ title: 'raw input' });
    });
  });

  describe('suggestLabels', () => {
    const labels = [
      { id: 'l1', workspace_id: 'ws', name: 'bug', color: 'red' },
      { id: 'l2', workspace_id: 'ws', name: 'feature', color: 'blue' },
      { id: 'l3', workspace_id: 'ws', name: 'docs', color: 'gray' },
    ];

    it('returns matching Label objects for suggested ids', async () => {
      getMockCreate().mockResolvedValue(textBlock('["l1","l3"]'));
      const result = await provider.suggestLabels('fix docs error', labels);
      expect(result).toHaveLength(2);
      expect(result.map((l) => l.id)).toEqual(['l1', 'l3']);
    });

    it('returns empty array when existingLabels is empty', async () => {
      const result = await provider.suggestLabels('task', []);
      expect(result).toEqual([]);
      expect(getMockCreate()).not.toHaveBeenCalled();
    });

    it('limits to 3 labels even when API returns more', async () => {
      getMockCreate().mockResolvedValue(textBlock('["l1","l2","l3","l4"]'));
      const result = await provider.suggestLabels('task', labels);
      expect(result.length).toBeLessThanOrEqual(3);
    });

    it('returns empty array on invalid JSON', async () => {
      getMockCreate().mockResolvedValue(textBlock('invalid'));
      const result = await provider.suggestLabels('task', labels);
      expect(result).toEqual([]);
    });
  });

  describe('calculateFocusScore', () => {
    it('returns a number between 0 and 100', async () => {
      const score = await provider.calculateFocusScore('task-id');
      expect(score).toBeGreaterThanOrEqual(0);
      expect(score).toBeLessThanOrEqual(100);
    });
  });
});
