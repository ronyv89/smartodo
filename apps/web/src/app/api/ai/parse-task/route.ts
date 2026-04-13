import { NextResponse } from 'next/server';
import { AnthropicProvider } from '@smartodo/ai';
import { parseTaskInput } from '@smartodo/core';
import type { ParsedTask } from '@smartodo/ai';

export interface ParseTaskRequest {
  text: string;
}

export type ParseTaskResponse = ParsedTask;

/**
 * POST /api/ai/parse-task
 *
 * Parses natural-language task input.  First tries the fast regex CE parser;
 * if no structured fields (priority or due_date) are found, it falls back to
 * the Anthropic AI parser for richer extraction.
 *
 * Body: ParseTaskRequest  ({ text: string })
 * Response: ParseTaskResponse (ParsedTask)
 */
export async function POST(request: Request): Promise<NextResponse> {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const { text } = body as Partial<ParseTaskRequest>;
  if (typeof text !== 'string' || text.trim() === '') {
    return NextResponse.json({ error: 'text is required' }, { status: 400 });
  }

  // Fast path: regex CE parser
  const regexResult = parseTaskInput(text);

  // If the regex already found structured fields, return immediately
  if (regexResult.priority !== null || regexResult.due_date !== null) {
    const response: ParseTaskResponse = { title: regexResult.title };
    if (regexResult.due_date !== null) response.due_date = regexResult.due_date;
    if (regexResult.priority !== null) response.priority = regexResult.priority;
    if (regexResult.assignee_mention !== null) response.assignee = regexResult.assignee_mention;
    return NextResponse.json(response);
  }

  // Slow path: AI fallback
  const provider = new AnthropicProvider(process.env.OPENROUTER_API_KEY);
  const aiResult = await provider.parseTaskInput(text);
  return NextResponse.json(aiResult);
}
