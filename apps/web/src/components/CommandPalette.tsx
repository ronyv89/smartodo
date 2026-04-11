'use client';

import { useEffect, useRef, useState } from 'react';
import type { Task } from '@smartodo/supabase';
import type { CommandResponse, FilterSpec, UpdateSpec } from '@/app/api/ai/command/route';

interface CommandPaletteProps {
  tasks: Task[];
  onApplyFilter: (filters: FilterSpec, description: string) => void;
  onBatchUpdate: (filters: FilterSpec, update: UpdateSpec) => void;
  onClose: () => void;
}

export default function CommandPalette({
  tasks,
  onApplyFilter,
  onBatchUpdate,
  onClose,
}: CommandPaletteProps) {
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<CommandResponse | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // Close on Escape
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [onClose]);

  async function handleSubmit(e: React.SyntheticEvent<HTMLFormElement>) {
    e.preventDefault();
    if (input.trim() === '') return;
    setLoading(true);
    setResult(null);

    const taskSummaries = tasks.map((t) => ({
      id: t.id,
      title: t.title,
      status: t.status,
      priority: t.priority,
      due_date: t.due_date ?? null,
    }));

    try {
      const res = await fetch('/api/ai/command', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ input: input.trim(), tasks: taskSummaries }),
      });
      const json = (await res.json()) as CommandResponse;
      setResult(json);
    } finally {
      setLoading(false);
    }
  }

  function handleApplyFilter() {
    if (result?.kind !== 'filter') return;
    onApplyFilter(result.filters, result.description);
    onClose();
  }

  function handleConfirmBatchUpdate() {
    if (result?.kind !== 'batch_update') return;
    onBatchUpdate(result.filters, result.update);
    onClose();
  }

  return (
    /* Backdrop */
    <div
      data-testid="command-palette-backdrop"
      className="fixed inset-0 z-50 flex items-start justify-center bg-black/40 pt-[15vh]"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        data-testid="command-palette"
        className="w-full max-w-lg rounded-xl bg-white shadow-2xl ring-1 ring-gray-200"
      >
        {/* Search input */}
        <form onSubmit={(e) => void handleSubmit(e)} className="flex items-center gap-3 px-4 py-3">
          <span className="text-sm text-gray-400">⌘</span>
          <input
            ref={inputRef}
            value={input}
            onChange={(e) => {
              setInput(e.target.value);
            }}
            placeholder="Ask anything about your workspace…"
            data-testid="command-input"
            className="flex-1 bg-transparent text-sm text-gray-800 outline-none placeholder:text-gray-400"
          />
          <button
            type="submit"
            disabled={loading || input.trim() === ''}
            data-testid="command-submit"
            className="rounded-lg bg-indigo-600 px-3 py-1 text-xs font-semibold text-white hover:bg-indigo-700 disabled:opacity-50"
          >
            {loading ? '…' : 'Run'}
          </button>
        </form>

        {/* Result area */}
        {result !== null && (
          <div data-testid="command-result" className="border-t border-gray-100 px-4 pb-4 pt-3">
            {result.kind === 'filter' && (
              <div data-testid="command-result-filter">
                <p className="mb-3 text-sm text-gray-700">{result.description}</p>
                <FilterSummary filters={result.filters} />
                <button
                  onClick={handleApplyFilter}
                  data-testid="command-apply-filter"
                  className="mt-3 rounded-lg bg-blue-600 px-4 py-1.5 text-xs font-semibold text-white hover:bg-blue-700"
                >
                  Apply filter
                </button>
              </div>
            )}

            {result.kind === 'batch_update' && (
              <div data-testid="command-result-batch-update">
                <p className="mb-1 text-sm font-medium text-gray-800">Confirm action</p>
                <p className="mb-3 text-sm text-gray-600">{result.description}</p>
                <FilterSummary filters={result.filters} />
                <UpdateSummary update={result.update} />
                <div className="mt-3 flex gap-2">
                  <button
                    onClick={handleConfirmBatchUpdate}
                    data-testid="command-confirm-update"
                    className="rounded-lg bg-amber-600 px-4 py-1.5 text-xs font-semibold text-white hover:bg-amber-700"
                  >
                    Confirm
                  </button>
                  <button
                    onClick={() => {
                      setResult(null);
                    }}
                    data-testid="command-cancel-update"
                    className="rounded-lg border border-gray-200 px-4 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {result.kind === 'summary' && (
              <p data-testid="command-result-summary" className="text-sm text-gray-700">
                {result.text}
              </p>
            )}

            {result.kind === 'unknown' && (
              <p data-testid="command-result-unknown" className="text-sm text-gray-500">
                {result.message}
              </p>
            )}
          </div>
        )}

        <div className="border-t border-gray-100 px-4 py-2">
          <p className="text-xs text-gray-400">
            Try: &ldquo;Show P1 tasks&rdquo; · &ldquo;Mark overdue tasks as cancelled&rdquo; ·
            &ldquo;What did we accomplish this week?&rdquo;
          </p>
        </div>
      </div>
    </div>
  );
}

function FilterSummary({ filters }: { filters: FilterSpec }) {
  const chips: string[] = [];
  if (typeof filters.status === 'string') chips.push(`status: ${filters.status}`);
  if (typeof filters.priority === 'string') chips.push(`priority: ${filters.priority}`);
  if (typeof filters.titleContains === 'string')
    chips.push(`title contains: "${filters.titleContains}"`);
  if (typeof filters.dueBefore === 'string') chips.push(`due before: ${filters.dueBefore}`);
  if (typeof filters.dueAfter === 'string') chips.push(`due after: ${filters.dueAfter}`);
  if (chips.length === 0) return null;
  return (
    <div className="flex flex-wrap gap-1" data-testid="filter-chips">
      {chips.map((chip) => (
        <span
          key={chip}
          className="rounded-full bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-700"
        >
          {chip}
        </span>
      ))}
    </div>
  );
}

function UpdateSummary({ update }: { update: UpdateSpec }) {
  const chips: string[] = [];
  if (typeof update.status === 'string') chips.push(`set status → ${update.status}`);
  if (typeof update.priority === 'string') chips.push(`set priority → ${update.priority}`);
  if (chips.length === 0) return null;
  return (
    <div className="mt-1 flex flex-wrap gap-1" data-testid="update-chips">
      {chips.map((chip) => (
        <span
          key={chip}
          className="rounded-full bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-700"
        >
          {chip}
        </span>
      ))}
    </div>
  );
}
