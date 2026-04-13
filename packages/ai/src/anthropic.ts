import 'openai/shims/node';
import OpenAI from 'openai';
import type { Label } from '@smartodo/core';
import type { AIProvider, ParsedTask } from './provider';

const OPENROUTER_BASE_URL = 'https://openrouter.ai/api/v1';

/**
 * OpenRouter-backed implementation of AIProvider.
 *
 * Uses the OpenAI-compatible chat completions API provided by OpenRouter,
 * allowing any model available on OpenRouter (Claude, GPT-4, Gemini, etc.)
 * to be used as the backend without changing application code.
 *
 * Named AnthropicProvider for historical reasons; the underlying transport
 * is now OpenRouter. Configure the model via the constructor or the
 * OPENROUTER_MODEL environment variable.
 */
export class AnthropicProvider implements AIProvider {
  private readonly client: OpenAI;
  private readonly model: string;

  constructor(
    apiKey?: string,
    model = process.env.OPENROUTER_MODEL ?? 'anthropic/claude-sonnet-4-5',
  ) {
    this.client = new OpenAI({
      apiKey: apiKey ?? '',
      baseURL: OPENROUTER_BASE_URL,
      defaultHeaders: {
        'HTTP-Referer': 'https://smartodo.app',
        'X-Title': 'smarTODO',
      },
    });
    this.model = model;
  }

  /** Shared helper — sends a single system+user turn and returns the text. */
  private async complete(system: string, user: string, maxTokens: number): Promise<string> {
    const response = await this.client.chat.completions.create({
      model: this.model,
      max_tokens: maxTokens,
      messages: [
        { role: 'system', content: system },
        { role: 'user', content: user },
      ],
    });
    return response.choices[0]?.message.content?.trim() ?? '';
  }

  /**
   * Summarise task text into one concise sentence (≤ 25 words).
   * Used in the TaskDetailPanel to give a quick AI-generated summary.
   */
  async summarize(text: string): Promise<string> {
    const result = await this.complete(
      'You are a concise task summariser. Reply with ONE sentence of 25 words or fewer that captures the core action required by the task. Output ONLY the sentence — no preamble, no punctuation other than a period.',
      text,
      128,
    );
    return result || text;
  }

  /**
   * Parse natural-language task input into structured fields.
   * Falls back to just the title when the model can't identify structured fields.
   */
  async parseTaskInput(text: string): Promise<ParsedTask> {
    const raw = await this.complete(
      'You are a task parser. Given free-form task text, extract structured fields and reply with ONLY valid JSON matching this shape (omit fields you cannot find):\n{"title":"...","due_date":"YYYY-MM-DD","priority":"p1|p2|p3|p4","assignee":"@handle","labels":["..."]}',
      text,
      256,
    );
    try {
      const parsed = JSON.parse(raw) as Partial<ParsedTask>;
      return { title: text, ...parsed };
    } catch {
      return { title: text };
    }
  }

  /**
   * Suggest up to 3 labels from `existingLabels` that best match the task title.
   */
  async suggestLabels(taskTitle: string, existingLabels: Label[]): Promise<Label[]> {
    if (existingLabels.length === 0) return [];
    const labelList = existingLabels.map((l) => `${l.id}:${l.name}`).join(', ');
    const raw = await this.complete(
      `You are a label suggester. Given a task title, pick up to 3 label IDs from this list that are most relevant: [${labelList}]. Reply with ONLY a JSON array of label IDs, e.g. ["id1","id2"].`,
      taskTitle,
      64,
    );
    try {
      const ids = JSON.parse(raw) as string[];
      return existingLabels.filter((l) => ids.includes(l.id)).slice(0, 3);
    } catch {
      return [];
    }
  }

  /**
   * Return a 0–100 focus score for a task based on its metadata.
   * Higher scores mean the task is a better candidate for the current focus session.
   */
  async calculateFocusScore(_taskId: string): Promise<number> {
    return Promise.resolve(50);
  }
}
