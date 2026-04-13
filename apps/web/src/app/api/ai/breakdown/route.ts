import { NextResponse } from 'next/server';
import OpenAI from 'openai';
import { rateLimit } from '@/lib/rate-limit';
import { flags } from '@/lib/feature-flags';

const limiter = rateLimit({ windowMs: 60_000, max: 20 });

export interface BreakdownRequest {
  taskTitle: string;
  taskDescription?: string;
  existingSubtasks?: string[];
}

export interface SubtaskSuggestion {
  title: string;
  priority?: string;
}

export interface BreakdownResponse {
  subtasks: SubtaskSuggestion[];
}

const SYSTEM_PROMPT = `You are a task decomposition assistant. Given a high-level task, generate a list of actionable subtasks.

Reply with ONLY valid JSON in this exact shape:
{"subtasks":[{"title":"...","priority":"p1|p2|p3|p4"},{"title":"..."}]}

Rules:
- Generate 3-7 subtasks unless the task is already very granular
- Each title should be a clear, actionable sentence
- priority is optional — only include when obvious from context
- No markdown, no explanation, just JSON`;

/**
 * POST /api/ai/breakdown
 *
 * Calls an OpenRouter-hosted model to break a complex task into a structured
 * subtask tree. Returns JSON the client can preview and edit before
 * bulk-creating subtasks.
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

  const { taskTitle, taskDescription, existingSubtasks } = body as Partial<BreakdownRequest>;

  if (typeof taskTitle !== 'string' || taskTitle.trim() === '') {
    return NextResponse.json({ error: 'taskTitle is required' }, { status: 400 });
  }

  const parts: string[] = [`Task: ${taskTitle}`];
  if (typeof taskDescription === 'string' && taskDescription.length > 0) {
    parts.push(`Description: ${taskDescription}`);
  }
  if (existingSubtasks !== undefined && existingSubtasks.length > 0) {
    parts.push(`Existing subtasks (exclude from suggestions): ${existingSubtasks.join(', ')}`);
  }
  const userMessage = parts.join('\n');

  const client = new OpenAI({
    apiKey: process.env.OPENROUTER_API_KEY,
    baseURL: 'https://openrouter.ai/api/v1',
    defaultHeaders: {
      'HTTP-Referer': 'https://smartodo.app',
      'X-Title': 'smarTODO',
    },
  });

  const response = await client.chat.completions.create({
    model: process.env.OPENROUTER_MODEL ?? 'anthropic/claude-sonnet-4-5',
    max_tokens: 512,
    messages: [
      { role: 'system', content: SYSTEM_PROMPT },
      { role: 'user', content: userMessage },
    ],
  });

  const raw = response.choices[0]?.message.content?.trim() ?? '{"subtasks":[]}';

  let parsed: BreakdownResponse;
  try {
    parsed = JSON.parse(raw) as BreakdownResponse;
  } catch {
    parsed = { subtasks: [] };
  }

  return NextResponse.json(parsed);
}
