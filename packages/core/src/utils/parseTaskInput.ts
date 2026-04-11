import type { TaskPriority } from '../types';

export interface ParsedTaskInput {
  title: string;
  priority: TaskPriority | null;
  due_date: string | null; // ISO date string YYYY-MM-DD
  assignee_mention: string | null; // @username mention
}

// Priority patterns: "p1", "P2", "(p3)", "[p4]"
const PRIORITY_RE = /[\[(]?(p[1-4])[\])]?/i;

// Relative date patterns
const DATE_PATTERNS: { re: RegExp; resolve: (now: Date, match: RegExpExecArray) => Date }[] = [
  {
    re: /\btoday\b/i,
    resolve: (now, _match) => now,
  },
  {
    re: /\btomorrow\b/i,
    resolve: (now, _match) => {
      const d = new Date(now);
      d.setDate(d.getDate() + 1);
      return d;
    },
  },
  {
    re: /\bnext\s+week\b/i,
    resolve: (now, _match) => {
      const d = new Date(now);
      d.setDate(d.getDate() + 7);
      return d;
    },
  },
  {
    re: /\bin\s+(\d+)\s+days?\b/i,
    resolve: (now, match) => {
      const d = new Date(now);
      const days = parseInt(match[1] ?? '0', 10);
      d.setDate(d.getDate() + days);
      return d;
    },
  },
  {
    // Weekday: "on Monday", "next Tuesday", "this Friday"
    re: /\b(?:on\s+|next\s+|this\s+)?(monday|tuesday|wednesday|thursday|friday|saturday|sunday)\b/i,
    resolve: (now, match) => {
      const weekdays = [
        'sunday',
        'monday',
        'tuesday',
        'wednesday',
        'thursday',
        'friday',
        'saturday',
      ];
      const target = weekdays.indexOf((match[1] ?? '').toLowerCase());
      if (target === -1) return now;
      const d = new Date(now);
      const current = d.getDay();
      const diff = (target - current + 7) % 7 || 7; // always go forward
      d.setDate(d.getDate() + diff);
      return d;
    },
  },
];

function toISODate(date: Date): string {
  const y = String(date.getFullYear());
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/**
 * Community Edition task parser — purely regex-based, no LLM calls.
 * Extracts priority, due date (relative), and @assignee from free text.
 *
 * @param input - Raw user input, e.g. "Call dentist tomorrow P1 @alice"
 * @param now   - Reference date for relative date resolution (default: today)
 */
export function parseTaskInput(input: string, now: Date = new Date()): ParsedTaskInput {
  let remaining = input.trim();
  let priority: TaskPriority | null = null;
  let due_date: string | null = null;
  let assignee_mention: string | null = null;

  // Extract priority
  const priorityMatch = PRIORITY_RE.exec(remaining);
  if (priorityMatch !== null) {
    priority = (priorityMatch[1] ?? '').toLowerCase() as TaskPriority;
    remaining = remaining.replace(priorityMatch[0], '').trim();
  }

  // Extract @mention
  const mentionMatch = /@(\w+)/.exec(remaining);
  if (mentionMatch !== null) {
    assignee_mention = mentionMatch[1] ?? null;
    remaining = remaining.replace(mentionMatch[0], '').trim();
  }

  // Extract date
  for (const { re, resolve } of DATE_PATTERNS) {
    const match = re.exec(remaining);
    if (match !== null) {
      due_date = toISODate(resolve(now, match));
      remaining = remaining.replace(match[0], '').trim();
      break;
    }
  }

  // Clean up extra whitespace from the title
  const title = remaining.replace(/\s{2,}/g, ' ').trim();

  return { title: title !== '' ? title : input.trim(), priority, due_date, assignee_mention };
}
