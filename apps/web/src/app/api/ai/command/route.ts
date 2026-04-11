import { NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { rateLimit } from '@/lib/rate-limit';
import { flags } from '@/lib/feature-flags';

const limiter = rateLimit({ windowMs: 60_000, max: 20 });

export interface TaskSummary {
  id: string;
  title: string;
  status: string;
  priority: string;
  due_date: string | null;
}

export interface FilterSpec {
  status?: string;
  priority?: string;
  titleContains?: string;
  dueBefore?: string;
  dueAfter?: string;
}

export interface UpdateSpec {
  status?: string;
  priority?: string;
}

export type CommandResponse =
  | { kind: 'filter'; filters: FilterSpec; description: string }
  | { kind: 'batch_update'; filters: FilterSpec; update: UpdateSpec; description: string }
  | { kind: 'summary'; text: string }
  | { kind: 'unknown'; message: string };

export interface CommandRequest {
  input: string;
  tasks?: TaskSummary[];
}

const SYSTEM_PROMPT = `You are a workspace command parser for a task management app.

Parse the user's natural language input and return ONLY valid JSON in one of these shapes:

Filter tasks:
{"kind":"filter","filters":{"status":"todo|in_progress|done|cancelled","priority":"p1|p2|p3|p4","titleContains":"...","dueBefore":"YYYY-MM-DD","dueAfter":"YYYY-MM-DD"},"description":"Human-readable description"}

Batch update (mutations — always require confirmation):
{"kind":"batch_update","filters":{...},"update":{"status":"...","priority":"..."},"description":"Human-readable description of what will change"}

Summarize tasks (use when asked about accomplishments, progress, stats):
{"kind":"summary","text":"Your answer based on the task data provided"}

Unknown:
{"kind":"unknown","message":"Brief explanation of what you couldn't understand"}

Rules:
- Only include filter fields that are explicitly mentioned
- For "overdue" tasks: use dueBefore with today's ISO date
- For "this week" summaries: use the tasks list provided
- Mutations (assign, move, update) must use kind=batch_update
- No markdown, no explanation, just JSON`;

/**
 * POST /api/ai/command
 *
 * Translates a natural language workspace query into a structured command.
 * Returns a discriminated union that the client can execute (with confirmation
 * for mutations).
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

  const { input, tasks } = body as Partial<CommandRequest>;

  if (typeof input !== 'string' || input.trim() === '') {
    return NextResponse.json({ error: 'input is required' }, { status: 400 });
  }

  const parts: string[] = [`User command: ${input}`];
  if (Array.isArray(tasks) && tasks.length > 0) {
    const today = new Date().toISOString().slice(0, 10);
    parts.push(`Today's date: ${today}`);
    parts.push(
      `Workspace tasks (${String(tasks.length)} total):\n${tasks
        .map(
          (t) =>
            `- [${t.priority}][${t.status}] ${t.title}${t.due_date !== null ? ` (due ${t.due_date})` : ''}`,
        )
        .join('\n')}`,
    );
  } else {
    parts.push(`Today's date: ${new Date().toISOString().slice(0, 10)}`);
  }

  const userMessage = parts.join('\n');

  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  const response = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 512,
    system: [{ type: 'text', text: SYSTEM_PROMPT, cache_control: { type: 'ephemeral' } }],
    messages: [{ role: 'user', content: userMessage }],
  });

  const block = response.content[0];
  const raw =
    block?.type === 'text' ? block.text.trim() : '{"kind":"unknown","message":"No response"}';

  let parsed: CommandResponse;
  try {
    parsed = JSON.parse(raw) as CommandResponse;
  } catch {
    parsed = { kind: 'unknown', message: 'Could not parse response from AI.' };
  }

  return NextResponse.json(parsed);
}
