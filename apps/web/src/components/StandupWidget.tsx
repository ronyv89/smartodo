'use client';

import { useState } from 'react';
import type { Task, Project } from '@smartodo/supabase';
import type { StandupResponse } from '@/app/api/ai/standup/route';

interface StandupWidgetProps {
  tasks: Task[];
  project: Project | null;
}

type Period = 'daily' | 'weekly';

function HealthScoreBadge({ score }: { score: number }) {
  let colorClass: string;
  let label: string;
  if (score >= 70) {
    colorClass = 'bg-green-100 text-green-800';
    label = 'Healthy';
  } else if (score >= 40) {
    colorClass = 'bg-yellow-100 text-yellow-800';
    label = 'At risk';
  } else {
    colorClass = 'bg-red-100 text-red-800';
    label = 'Critical';
  }

  return (
    <span
      data-testid="health-score-badge"
      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${colorClass}`}
    >
      <span data-testid="health-score-value" className="text-sm font-bold">
        {String(score)}
      </span>
      {label}
    </span>
  );
}

export default function StandupWidget({ tasks, project }: StandupWidgetProps) {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<StandupResponse | null>(null);
  const [activePeriod, setActivePeriod] = useState<Period>('daily');

  async function generate(period: Period) {
    if (project === null || tasks.length === 0) return;
    setActivePeriod(period);
    setLoading(true);
    setResult(null);

    const taskSummaries = tasks.map((t) => ({
      title: t.title,
      status: t.status,
      priority: t.priority,
      due_date: t.due_date ?? null,
      completed_at: t.completed_at ?? null,
    }));

    try {
      const res = await fetch('/api/ai/standup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tasks: taskSummaries,
          projectName: project.name,
          period,
        }),
      });
      const json = (await res.json()) as StandupResponse;
      setResult(json);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      data-testid="standup-widget"
      className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm"
    >
      {/* Header */}
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-800">AI Standup</h3>
        <div className="flex gap-2">
          <button
            onClick={() => void generate('daily')}
            disabled={loading || project === null || tasks.length === 0}
            data-testid="standup-daily-btn"
            className={[
              'rounded-lg px-3 py-1 text-xs font-medium transition',
              activePeriod === 'daily' && result !== null
                ? 'bg-indigo-600 text-white'
                : 'border border-gray-200 text-gray-500 hover:border-gray-300',
              'disabled:opacity-50',
            ].join(' ')}
          >
            {loading && activePeriod === 'daily' ? 'Generating…' : 'Daily'}
          </button>
          <button
            onClick={() => void generate('weekly')}
            disabled={loading || project === null || tasks.length === 0}
            data-testid="standup-weekly-btn"
            className={[
              'rounded-lg px-3 py-1 text-xs font-medium transition',
              activePeriod === 'weekly' && result !== null
                ? 'bg-indigo-600 text-white'
                : 'border border-gray-200 text-gray-500 hover:border-gray-300',
              'disabled:opacity-50',
            ].join(' ')}
          >
            {loading && activePeriod === 'weekly' ? 'Generating…' : 'Weekly'}
          </button>
        </div>
      </div>

      {/* Empty state */}
      {result === null && !loading && (
        <p data-testid="standup-empty" className="text-sm text-gray-400">
          {tasks.length === 0
            ? 'Add tasks to generate a standup digest.'
            : 'Click Daily or Weekly to generate your AI standup.'}
        </p>
      )}

      {/* Loading */}
      {loading && (
        <div data-testid="standup-loading" className="flex items-center gap-2">
          <span className="h-2 w-2 animate-pulse rounded-full bg-indigo-400" />
          <span className="text-sm text-gray-400">Analysing project health…</span>
        </div>
      )}

      {/* Result */}
      {result !== null && !loading && (
        <div data-testid="standup-result" className="space-y-4">
          {/* Health score */}
          <div className="flex items-center gap-3">
            <span className="text-xs font-semibold uppercase tracking-wide text-gray-500">
              Health
            </span>
            <HealthScoreBadge score={result.healthScore} />
          </div>

          {/* Digest */}
          <p data-testid="standup-digest" className="text-sm leading-relaxed text-gray-700">
            {result.digest}
          </p>

          {/* Highlights */}
          {result.highlights.length > 0 && (
            <div data-testid="standup-highlights">
              <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-green-600">
                Highlights
              </p>
              <ul className="space-y-1">
                {result.highlights.map((h, i) => (
                  <li key={String(i)} className="flex items-start gap-2 text-xs text-gray-600">
                    <span className="mt-0.5 shrink-0 text-green-500">✓</span>
                    {h}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Blockers */}
          {result.blockers.length > 0 && (
            <div data-testid="standup-blockers">
              <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-red-600">
                Blockers
              </p>
              <ul className="space-y-1">
                {result.blockers.map((b, i) => (
                  <li key={String(i)} className="flex items-start gap-2 text-xs text-gray-600">
                    <span className="mt-0.5 shrink-0 text-red-400">!</span>
                    {b}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
