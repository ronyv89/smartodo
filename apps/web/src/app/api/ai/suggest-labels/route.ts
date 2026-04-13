import { NextResponse } from 'next/server';
import { AnthropicProvider } from '@smartodo/ai';
import type { Label } from '@smartodo/core';
import { rateLimit } from '@/lib/rate-limit';
import { flags } from '@/lib/feature-flags';

const limiter = rateLimit({ windowMs: 60_000, max: 20 });

export interface SuggestLabelsRequest {
  taskTitle: string;
  labels: Label[];
}

export interface SuggestLabelsResponse {
  suggestions: Label[];
}

/**
 * POST /api/ai/suggest-labels
 *
 * Body: SuggestLabelsRequest
 * Response: SuggestLabelsResponse
 *
 * Calls the Anthropic API server-side so the API key is never exposed to the
 * browser.  Returns up to 3 suggested labels from the workspace label list.
 */
export async function POST(request: Request): Promise<NextResponse> {
  if (!flags.aiEnabled) {
    return NextResponse.json(
      { error: 'AI features are not enabled on this instance.' },
      { status: 503 },
    );
  }

  const limit = limiter(request);
  if (!limit.ok) {
    return NextResponse.json(
      { error: 'Too many requests. Please wait before retrying.' },
      { status: 429, headers: { 'Retry-After': String(Math.ceil(limit.retryAfterMs / 1000)) } },
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const { taskTitle, labels } = body as Partial<SuggestLabelsRequest>;
  if (typeof taskTitle !== 'string' || taskTitle.trim() === '') {
    return NextResponse.json({ error: 'taskTitle is required' }, { status: 400 });
  }

  const provider = new AnthropicProvider(process.env.OPENROUTER_API_KEY);
  const suggestions = await provider.suggestLabels(taskTitle, labels ?? []);
  const response: SuggestLabelsResponse = { suggestions };
  return NextResponse.json(response);
}
