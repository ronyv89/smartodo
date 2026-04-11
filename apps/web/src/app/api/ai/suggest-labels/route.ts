import { NextResponse } from 'next/server';
import { AnthropicProvider } from '@smartodo/ai';
import type { Label } from '@smartodo/core';

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

  const provider = new AnthropicProvider(process.env.ANTHROPIC_API_KEY);
  const suggestions = await provider.suggestLabels(taskTitle, labels ?? []);
  const response: SuggestLabelsResponse = { suggestions };
  return NextResponse.json(response);
}
