import { NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { rateLimit } from '@/lib/rate-limit';
import { flags } from '@/lib/feature-flags';

const limiter = rateLimit({ windowMs: 60_000, max: 10 });

export interface StandupTaskSummary {
  title: string;
  status: string;
  priority: string;
  due_date: string | null;
  completed_at: string | null;
}

export interface StandupRequest {
  tasks: StandupTaskSummary[];
  projectName: string;
  period: 'daily' | 'weekly';
}

export interface StandupResponse {
  digest: string;
  healthScore: number;
  highlights: string[];
  blockers: string[];
}

const SYSTEM_PROMPT = `You are a project health analyst for a task management tool.
Given a list of tasks and a time period, generate a standup digest.

Reply with ONLY valid JSON in this exact shape:
{
  "digest": "2-3 sentence narrative summary of team progress",
  "healthScore": <integer 0-100>,
  "highlights": ["accomplishment 1", "accomplishment 2"],
  "blockers": ["blocker 1"]
}

Health score guidelines:
- Start at 70 (baseline healthy)
- +10 if completion rate > 50%
- -20 if any P1 tasks are overdue
- -10 if more than 30% tasks are overdue
- -5 per P1 task in_progress with no recent activity
- Max 100, min 0

Rules:
- highlights: completed tasks or notable progress (empty array if none)
- blockers: P1/P2 tasks that are overdue or stuck (empty array if none)
- No markdown, no explanation, just JSON`;

/**
 * POST /api/ai/standup
 *
 * Generates a standup digest + project health score for the given task list.
 * Called by StandupWidget in the dashboard and (optionally) by a Supabase Edge
 * Function cron that delivers the digest via email/Slack.
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

  const { tasks, projectName, period } = body as Partial<StandupRequest>;

  if (!Array.isArray(tasks) || tasks.length === 0) {
    return NextResponse.json(
      { error: 'tasks array is required and must be non-empty' },
      { status: 400 },
    );
  }
  if (typeof projectName !== 'string' || projectName.trim() === '') {
    return NextResponse.json({ error: 'projectName is required' }, { status: 400 });
  }

  const periodLabel = period === 'weekly' ? 'weekly' : 'daily';
  const today = new Date().toISOString().slice(0, 10);

  const taskLines = tasks.map(
    (t) =>
      `- [${t.priority}][${t.status}] ${t.title}` +
      (t.due_date !== null ? ` (due ${t.due_date})` : '') +
      (t.completed_at !== null ? ` (completed ${t.completed_at.slice(0, 10)})` : ''),
  );

  const userMessage = [
    `Project: ${projectName}`,
    `Report period: ${periodLabel}`,
    `Today: ${today}`,
    `Tasks (${String(tasks.length)} total):`,
    ...taskLines,
  ].join('\n');

  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  const response = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 512,
    system: [{ type: 'text', text: SYSTEM_PROMPT, cache_control: { type: 'ephemeral' } }],
    messages: [{ role: 'user', content: userMessage }],
  });

  const block = response.content[0];
  const raw =
    block?.type === 'text'
      ? block.text.trim()
      : '{"digest":"No data","healthScore":50,"highlights":[],"blockers":[]}';

  let parsed: StandupResponse;
  try {
    parsed = JSON.parse(raw) as StandupResponse;
  } catch {
    parsed = {
      digest: 'Unable to generate standup at this time.',
      healthScore: 50,
      highlights: [],
      blockers: [],
    };
  }

  // Clamp health score
  parsed.healthScore = Math.max(0, Math.min(100, parsed.healthScore));

  return NextResponse.json(parsed);
}
