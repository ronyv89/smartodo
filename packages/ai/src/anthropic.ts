import Anthropic from '@anthropic-ai/sdk';
import type { Label } from '@smartodo/core';
import type { AIProvider, ParsedTask } from './provider';

/**
 * Anthropic Claude-backed implementation of AIProvider.
 *
 * All methods use the Messages API with prompt caching enabled on the system
 * prompt so repeated calls share the cached prefix and reduce latency/cost.
 */
export class AnthropicProvider implements AIProvider {
  private readonly client: Anthropic;
  private readonly model: string;

  constructor(apiKey?: string, model = 'claude-sonnet-4-6') {
    this.client = new Anthropic({ apiKey });
    this.model = model;
  }

  /**
   * Summarise task text into one concise sentence (≤ 25 words).
   * Used in the TaskDetailPanel to give a quick AI-generated summary.
   */
  async summarize(text: string): Promise<string> {
    const response = await this.client.messages.create({
      model: this.model,
      max_tokens: 128,
      system: [
        {
          type: 'text',
          text: 'You are a concise task summariser. Reply with ONE sentence of 25 words or fewer that captures the core action required by the task. Output ONLY the sentence — no preamble, no punctuation other than a period.',
          cache_control: { type: 'ephemeral' },
        },
      ],
      messages: [{ role: 'user', content: text }],
    });

    const block = response.content[0];
    return block?.type === 'text' ? block.text.trim() : text;
  }

  /**
   * Parse natural-language task input into structured fields.
   * Falls back to just the title when Claude can't identify structured fields.
   */
  async parseTaskInput(text: string): Promise<ParsedTask> {
    const response = await this.client.messages.create({
      model: this.model,
      max_tokens: 256,
      system: [
        {
          type: 'text',
          text: 'You are a task parser. Given free-form task text, extract structured fields and reply with ONLY valid JSON matching this shape (omit fields you cannot find):\n{"title":"...","due_date":"YYYY-MM-DD","priority":"p1|p2|p3|p4","assignee":"@handle","labels":["..."]}',
          cache_control: { type: 'ephemeral' },
        },
      ],
      messages: [{ role: 'user', content: text }],
    });

    const block = response.content[0];
    const raw = block?.type === 'text' ? block.text.trim() : '{}';
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
    const response = await this.client.messages.create({
      model: this.model,
      max_tokens: 64,
      system: [
        {
          type: 'text',
          text: `You are a label suggester. Given a task title, pick up to 3 label IDs from this list that are most relevant: [${labelList}]. Reply with ONLY a JSON array of label IDs, e.g. ["id1","id2"].`,
          cache_control: { type: 'ephemeral' },
        },
      ],
      messages: [{ role: 'user', content: taskTitle }],
    });

    const block = response.content[0];
    const raw = block?.type === 'text' ? block.text.trim() : '[]';
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
   * This is a stub that will be enriched in Phase 5.
   */
  async calculateFocusScore(_taskId: string): Promise<number> {
    // Placeholder — real implementation will fetch task context and use CE scoring.
    return Promise.resolve(50);
  }
}
