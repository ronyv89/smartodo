import type { Label } from '@smartodo/core';
import type { AIProvider, ParsedTask } from './provider';
import { AnthropicProvider } from './anthropic';
import { LocalAIProvider } from './local';

export interface ClaudeAIProviderOptions {
  apiKey?: string;
  model?: string;
  /** Maximum calls allowed within the window (default: 60). */
  maxCallsPerWindow?: number;
  /** Window duration in milliseconds (default: 60_000 — 1 minute). */
  windowMs?: number;
}

/**
 * ClaudeAIProvider wraps AnthropicProvider with:
 *
 *  1. **Rate limiting** — a sliding-window counter that enforces
 *     `maxCallsPerWindow` API calls per `windowMs`.  When the limit is
 *     reached, calls fall back to LocalAIProvider silently.
 *
 *  2. **Error handling** — any API error is caught and the same LocalAI
 *     fallback is used so the application never throws to the caller.
 *
 * This is the Pro-tier provider.  The Community tier uses LocalAIProvider
 * directly.
 */
export class ClaudeAIProvider implements AIProvider {
  private readonly claude: AnthropicProvider;
  private readonly local: LocalAIProvider;
  private readonly maxCalls: number;
  private readonly windowMs: number;
  private callTimestamps: number[] = [];

  constructor(options: ClaudeAIProviderOptions = {}) {
    this.claude = new AnthropicProvider(options.apiKey, options.model);
    this.local = new LocalAIProvider();
    this.maxCalls = options.maxCallsPerWindow ?? 60;
    this.windowMs = options.windowMs ?? 60_000;
  }

  /**
   * Returns true if we're under the rate limit and records the call.
   * Returns false (and does NOT record) when the limit is already reached.
   */
  private tryAcquire(): boolean {
    const now = Date.now();
    const windowStart = now - this.windowMs;
    // Evict timestamps outside the window
    this.callTimestamps = this.callTimestamps.filter((t) => t > windowStart);
    if (this.callTimestamps.length >= this.maxCalls) return false;
    this.callTimestamps.push(now);
    return true;
  }

  /** How many calls remain in the current window. */
  get remaining(): number {
    const now = Date.now();
    const windowStart = now - this.windowMs;
    const active = this.callTimestamps.filter((t) => t > windowStart).length;
    return Math.max(0, this.maxCalls - active);
  }

  private async withFallback<T>(fn: () => Promise<T>, fallback: () => Promise<T>): Promise<T> {
    if (!this.tryAcquire()) {
      return fallback();
    }
    try {
      return await fn();
    } catch {
      return fallback();
    }
  }

  async parseTaskInput(text: string): Promise<ParsedTask> {
    return this.withFallback(
      () => this.claude.parseTaskInput(text),
      () => this.local.parseTaskInput(text),
    );
  }

  async suggestLabels(taskTitle: string, existingLabels: Label[]): Promise<Label[]> {
    return this.withFallback(
      () => this.claude.suggestLabels(taskTitle, existingLabels),
      () => this.local.suggestLabels(taskTitle, existingLabels),
    );
  }

  async calculateFocusScore(taskId: string): Promise<number> {
    return this.withFallback(
      () => this.claude.calculateFocusScore(taskId),
      () => this.local.calculateFocusScore(taskId),
    );
  }

  async summarize(text: string): Promise<string> {
    return this.withFallback(
      () => this.claude.summarize(text),
      () => this.local.summarize(text),
    );
  }
}
