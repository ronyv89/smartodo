import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import type { Task } from '@smartodo/supabase';
import CommandPalette from '../components/CommandPalette';
import type { CommandResponse } from '../app/api/ai/command/route';

// Mock global fetch
const mockFetch = jest.fn();
global.fetch = mockFetch;

const MOCK_TASKS: Task[] = [
  {
    id: 'task-1',
    title: 'Fix login bug',
    status: 'todo',
    priority: 'p1',
    project_id: 'proj-1',
    parent_id: null,
    assignee_id: null,
    due_date: null,
    completed_at: null,
    sort_order: 0,
    created_at: '2026-01-01T00:00:00Z',
    description: null,
    custom_fields: null,
    ai_metadata: null,
  },
  {
    id: 'task-2',
    title: 'Write docs',
    status: 'done',
    priority: 'p3',
    project_id: 'proj-1',
    parent_id: null,
    assignee_id: null,
    due_date: null,
    completed_at: '2026-01-05T00:00:00Z',
    sort_order: 1,
    created_at: '2026-01-02T00:00:00Z',
    description: null,
    custom_fields: null,
    ai_metadata: null,
  },
];

function makeResponse(response: CommandResponse): Promise<Response> {
  return Promise.resolve({
    json: () => Promise.resolve(response),
    ok: true,
    status: 200,
  } as Response);
}

describe('CommandPalette', () => {
  const onApplyFilter = jest.fn();
  const onBatchUpdate = jest.fn();
  const onClose = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders the input and hint text', () => {
    render(
      <CommandPalette
        tasks={MOCK_TASKS}
        onApplyFilter={onApplyFilter}
        onBatchUpdate={onBatchUpdate}
        onClose={onClose}
      />,
    );
    expect(screen.getByTestId('command-input')).toBeInTheDocument();
    expect(screen.getByText(/Show P1 tasks/)).toBeInTheDocument();
  });

  it('closes when Escape is pressed', () => {
    render(
      <CommandPalette
        tasks={MOCK_TASKS}
        onApplyFilter={onApplyFilter}
        onBatchUpdate={onBatchUpdate}
        onClose={onClose}
      />,
    );
    fireEvent.keyDown(window, { key: 'Escape' });
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('closes when backdrop is clicked', () => {
    render(
      <CommandPalette
        tasks={MOCK_TASKS}
        onApplyFilter={onApplyFilter}
        onBatchUpdate={onBatchUpdate}
        onClose={onClose}
      />,
    );
    const backdrop = screen.getByTestId('command-palette-backdrop');
    fireEvent.click(backdrop);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('shows filter result and calls onApplyFilter on apply', async () => {
    const filterResponse: CommandResponse = {
      kind: 'filter',
      filters: { priority: 'p1' },
      description: 'Showing P1 tasks',
    };
    mockFetch.mockReturnValueOnce(makeResponse(filterResponse));

    render(
      <CommandPalette
        tasks={MOCK_TASKS}
        onApplyFilter={onApplyFilter}
        onBatchUpdate={onBatchUpdate}
        onClose={onClose}
      />,
    );

    fireEvent.change(screen.getByTestId('command-input'), {
      target: { value: 'Show P1 tasks' },
    });
    fireEvent.click(screen.getByTestId('command-submit'));

    await waitFor(() => {
      expect(screen.getByTestId('command-result-filter')).toBeInTheDocument();
    });
    expect(screen.getByText('Showing P1 tasks')).toBeInTheDocument();
    expect(screen.getByTestId('filter-chips')).toBeInTheDocument();

    fireEvent.click(screen.getByTestId('command-apply-filter'));
    expect(onApplyFilter).toHaveBeenCalledWith({ priority: 'p1' }, 'Showing P1 tasks');
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('shows batch_update confirmation and calls onBatchUpdate on confirm', async () => {
    const batchResponse: CommandResponse = {
      kind: 'batch_update',
      filters: { status: 'done' },
      update: { status: 'cancelled' },
      description: 'Mark all done tasks as cancelled',
    };
    mockFetch.mockReturnValueOnce(makeResponse(batchResponse));

    render(
      <CommandPalette
        tasks={MOCK_TASKS}
        onApplyFilter={onApplyFilter}
        onBatchUpdate={onBatchUpdate}
        onClose={onClose}
      />,
    );

    fireEvent.change(screen.getByTestId('command-input'), {
      target: { value: 'Mark done tasks as cancelled' },
    });
    fireEvent.click(screen.getByTestId('command-submit'));

    await waitFor(() => {
      expect(screen.getByTestId('command-result-batch-update')).toBeInTheDocument();
    });
    expect(screen.getByText('Mark all done tasks as cancelled')).toBeInTheDocument();

    fireEvent.click(screen.getByTestId('command-confirm-update'));
    expect(onBatchUpdate).toHaveBeenCalledWith({ status: 'done' }, { status: 'cancelled' });
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('can cancel a batch update', async () => {
    const batchResponse: CommandResponse = {
      kind: 'batch_update',
      filters: { status: 'todo' },
      update: { priority: 'p1' },
      description: 'Raise all todo tasks to P1',
    };
    mockFetch.mockReturnValueOnce(makeResponse(batchResponse));

    render(
      <CommandPalette
        tasks={MOCK_TASKS}
        onApplyFilter={onApplyFilter}
        onBatchUpdate={onBatchUpdate}
        onClose={onClose}
      />,
    );

    fireEvent.change(screen.getByTestId('command-input'), {
      target: { value: 'Raise all todo tasks to P1' },
    });
    fireEvent.click(screen.getByTestId('command-submit'));

    await waitFor(() => {
      expect(screen.getByTestId('command-result-batch-update')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTestId('command-cancel-update'));
    expect(onBatchUpdate).not.toHaveBeenCalled();
    expect(screen.queryByTestId('command-result-batch-update')).not.toBeInTheDocument();
  });

  it('shows summary result', async () => {
    const summaryResponse: CommandResponse = {
      kind: 'summary',
      text: 'The team completed 1 task this week: Write docs.',
    };
    mockFetch.mockReturnValueOnce(makeResponse(summaryResponse));

    render(
      <CommandPalette
        tasks={MOCK_TASKS}
        onApplyFilter={onApplyFilter}
        onBatchUpdate={onBatchUpdate}
        onClose={onClose}
      />,
    );

    fireEvent.change(screen.getByTestId('command-input'), {
      target: { value: 'What did we accomplish this week?' },
    });
    fireEvent.click(screen.getByTestId('command-submit'));

    await waitFor(() => {
      expect(screen.getByTestId('command-result-summary')).toBeInTheDocument();
    });
    expect(
      screen.getByText('The team completed 1 task this week: Write docs.'),
    ).toBeInTheDocument();
  });

  it('shows unknown result message', async () => {
    const unknownResponse: CommandResponse = {
      kind: 'unknown',
      message: "Sorry, I didn't understand that.",
    };
    mockFetch.mockReturnValueOnce(makeResponse(unknownResponse));

    render(
      <CommandPalette
        tasks={MOCK_TASKS}
        onApplyFilter={onApplyFilter}
        onBatchUpdate={onBatchUpdate}
        onClose={onClose}
      />,
    );

    fireEvent.change(screen.getByTestId('command-input'), {
      target: { value: 'do something weird' },
    });
    fireEvent.click(screen.getByTestId('command-submit'));

    await waitFor(() => {
      expect(screen.getByTestId('command-result-unknown')).toBeInTheDocument();
    });
    expect(screen.getByText("Sorry, I didn't understand that.")).toBeInTheDocument();
  });
});
