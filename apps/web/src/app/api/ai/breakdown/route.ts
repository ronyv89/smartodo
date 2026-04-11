import { NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';

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
 * Calls Claude to break a complex task into a structured subtask tree.
 * Returns JSON the client can preview and edit before bulk-creating subtasks.
 */
export async function POST(request: Request): Promise<NextResponse> {
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

  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  const response = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 512,
    system: [{ type: 'text', text: SYSTEM_PROMPT, cache_control: { type: 'ephemeral' } }],
    messages: [{ role: 'user', content: userMessage }],
  });

  const block = response.content[0];
  const raw = block?.type === 'text' ? block.text.trim() : '{"subtasks":[]}';

  let parsed: BreakdownResponse;
  try {
    parsed = JSON.parse(raw) as BreakdownResponse;
  } catch {
    parsed = { subtasks: [] };
  }

  return NextResponse.json(parsed);
}
