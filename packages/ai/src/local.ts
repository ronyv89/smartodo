import type { Label } from '@smartodo/core';
import { parseTaskInput as regexParseTaskInput } from '@smartodo/core';
import type { AIProvider, ParsedTask } from './provider';

/**
 * LocalAIProvider — a fully offline fallback that uses the CE regex parser
 * for task parsing and returns sensible no-op values for everything else.
 *
 * Used when:
 *  - The workspace is on the Community (CE) plan
 *  - The Anthropic API is unavailable or rate-limited
 */
export class LocalAIProvider implements AIProvider {
  parseTaskInput(text: string): Promise<ParsedTask> {
    const result = regexParseTaskInput(text);
    const parsed: ParsedTask = { title: result.title };
    if (result.due_date !== null) parsed.due_date = result.due_date;
    if (result.priority !== null) parsed.priority = result.priority;
    if (result.assignee_mention !== null) parsed.assignee = result.assignee_mention;
    return Promise.resolve(parsed);
  }

  suggestLabels(_taskTitle: string, _existingLabels: Label[]): Promise<Label[]> {
    return Promise.resolve([]);
  }

  calculateFocusScore(_taskId: string): Promise<number> {
    return Promise.resolve(50);
  }

  summarize(text: string): Promise<string> {
    // Best-effort: return the first sentence or the first 80 characters.
    const firstSentence = text.split(/[.!?]/)[0];
    return Promise.resolve((firstSentence ?? text).trim().slice(0, 80));
  }
}
