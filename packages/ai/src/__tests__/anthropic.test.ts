import { AnthropicProvider } from '../anthropic';

// Mock the openai SDK so tests never hit the network.
jest.mock('openai', () => {
  const mockCreate = jest.fn();
  return {
    __esModule: true,
    default: jest.fn().mockImplementation(() => ({
      chat: { completions: { create: mockCreate } },
    })),
    _mockCreate: mockCreate,
  };
});

// Helper to get the mock `create` function after module setup.
function getMockCreate(): jest.Mock {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const mod = require('openai') as { _mockCreate: jest.Mock };
  return mod._mockCreate;
}

/** Wrap a string in an OpenRouter/OpenAI chat completion response shape. */
function chatResponse(content: string) {
  return { choices: [{ message: { content } }] };
}

describe('AnthropicProvider', () => {
  let provider: AnthropicProvider;

  beforeEach(() => {
    provider = new AnthropicProvider('test-api-key');
    getMockCreate().mockReset();
  });

  describe('summarize', () => {
    it('returns the text from the first choice message', async () => {
      getMockCreate().mockResolvedValue(chatResponse('Fix the login bug.'));
      const result = await provider.summarize('Fix the login bug on the dashboard page');
      expect(result).toBe('Fix the login bug.');
    });

    it('falls back to the input text when content is missing', async () => {
      getMockCreate().mockResolvedValue({ choices: [] });
      const input = 'Some task';
      const result = await provider.summarize(input);
      expect(result).toBe(input);
    });

    it('calls chat.completions.create with a system and user message', async () => {
      getMockCreate().mockResolvedValue(chatResponse('Summary.'));
      await provider.summarize('task text');
      const call = getMockCreate().mock.calls[0]?.[0] as {
        messages: { role: string; content: string }[];
      };
      expect(call.messages[0]?.role).toBe('system');
      expect(call.messages[1]?.role).toBe('user');
      expect(call.messages[1]?.content).toBe('task text');
    });
  });

  describe('parseTaskInput', () => {
    it('merges parsed JSON into the result with input as fallback title', async () => {
      const json = JSON.stringify({ title: 'Buy milk', due_date: '2026-04-20', priority: 'p2' });
      getMockCreate().mockResolvedValue(chatResponse(json));
      const result = await provider.parseTaskInput('Buy milk by April 20 p2');
      expect(result.title).toBe('Buy milk');
      expect(result.due_date).toBe('2026-04-20');
      expect(result.priority).toBe('p2');
    });

    it('falls back to { title: input } on invalid JSON', async () => {
      getMockCreate().mockResolvedValue(chatResponse('not-json'));
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
      getMockCreate().mockResolvedValue(chatResponse('["l1","l3"]'));
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
      getMockCreate().mockResolvedValue(chatResponse('["l1","l2","l3","l4"]'));
      const result = await provider.suggestLabels('task', labels);
      expect(result.length).toBeLessThanOrEqual(3);
    });

    it('returns empty array on invalid JSON', async () => {
      getMockCreate().mockResolvedValue(chatResponse('invalid'));
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
