import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import type { Task, Project } from '@smartodo/supabase';
import StandupWidget from '../components/StandupWidget';
import type { StandupResponse } from '../app/api/ai/standup/route';

const mockFetch = jest.fn();
global.fetch = mockFetch;

const MOCK_PROJECT: Project = {
  id: 'proj-1',
  name: 'Alpha',
  workspace_id: 'ws-1',
  created_at: '2026-01-01T00:00:00Z',
  description: null,
  color: '#6366f1',
  view_default: 'list',
  sort_order: 0,
  archived: false,
};

const MOCK_TASKS: Task[] = [
  {
    id: 'task-1',
    title: 'Ship feature',
    status: 'done',
    priority: 'p1',
    project_id: 'proj-1',
    parent_id: null,
    assignee_id: null,
    due_date: null,
    completed_at: '2026-04-10T00:00:00Z',
    sort_order: 0,
    created_at: '2026-04-01T00:00:00Z',
    description: null,
    custom_fields: null,
    ai_metadata: null,
  },
  {
    id: 'task-2',
    title: 'Fix critical bug',
    status: 'in_progress',
    priority: 'p1',
    project_id: 'proj-1',
    parent_id: null,
    assignee_id: null,
    due_date: '2026-04-09',
    completed_at: null,
    sort_order: 1,
    created_at: '2026-04-05T00:00:00Z',
    description: null,
    custom_fields: null,
    ai_metadata: null,
  },
];

function makeResponse(data: StandupResponse): Promise<Response> {
  return Promise.resolve({
    json: () => Promise.resolve(data),
    ok: true,
    status: 200,
  } as Response);
}

const HEALTHY_RESPONSE: StandupResponse = {
  digest: 'The team shipped one feature and is working on a critical bug fix.',
  healthScore: 80,
  highlights: ['Shipped feature'],
  blockers: ['Fix critical bug is overdue'],
};

describe('StandupWidget', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders the widget with empty state when no tasks', () => {
    render(<StandupWidget tasks={[]} project={MOCK_PROJECT} />);
    expect(screen.getByTestId('standup-widget')).toBeInTheDocument();
    expect(screen.getByTestId('standup-empty')).toBeInTheDocument();
    expect(screen.getByText(/Add tasks to generate/)).toBeInTheDocument();
  });

  it('renders the widget with prompt to generate when tasks exist', () => {
    render(<StandupWidget tasks={MOCK_TASKS} project={MOCK_PROJECT} />);
    expect(screen.getByTestId('standup-empty')).toBeInTheDocument();
    expect(screen.getByText(/Click Daily or Weekly/)).toBeInTheDocument();
  });

  it('disables buttons when no project', () => {
    render(<StandupWidget tasks={MOCK_TASKS} project={null} />);
    expect(screen.getByTestId('standup-daily-btn')).toBeDisabled();
    expect(screen.getByTestId('standup-weekly-btn')).toBeDisabled();
  });

  it('generates a daily standup and shows result', async () => {
    mockFetch.mockReturnValueOnce(makeResponse(HEALTHY_RESPONSE));
    render(<StandupWidget tasks={MOCK_TASKS} project={MOCK_PROJECT} />);

    fireEvent.click(screen.getByTestId('standup-daily-btn'));

    await waitFor(() => {
      expect(screen.getByTestId('standup-result')).toBeInTheDocument();
    });

    expect(screen.getByTestId('standup-digest')).toHaveTextContent(
      'The team shipped one feature and is working on a critical bug fix.',
    );
    expect(screen.getByTestId('health-score-value')).toHaveTextContent('80');
    expect(screen.getByTestId('standup-highlights')).toBeInTheDocument();
    expect(screen.getByText('Shipped feature')).toBeInTheDocument();
    expect(screen.getByTestId('standup-blockers')).toBeInTheDocument();
    expect(screen.getByText('Fix critical bug is overdue')).toBeInTheDocument();
  });

  it('shows healthy health score badge with green colour class', async () => {
    mockFetch.mockReturnValueOnce(makeResponse({ ...HEALTHY_RESPONSE, healthScore: 85 }));
    render(<StandupWidget tasks={MOCK_TASKS} project={MOCK_PROJECT} />);
    fireEvent.click(screen.getByTestId('standup-daily-btn'));
    await waitFor(() => {
      expect(screen.getByTestId('health-score-badge')).toBeInTheDocument();
    });
    expect(screen.getByTestId('health-score-badge')).toHaveTextContent('Healthy');
  });

  it('shows at-risk health score badge', async () => {
    mockFetch.mockReturnValueOnce(makeResponse({ ...HEALTHY_RESPONSE, healthScore: 55 }));
    render(<StandupWidget tasks={MOCK_TASKS} project={MOCK_PROJECT} />);
    fireEvent.click(screen.getByTestId('standup-daily-btn'));
    await waitFor(() => {
      expect(screen.getByTestId('health-score-badge')).toBeInTheDocument();
    });
    expect(screen.getByTestId('health-score-badge')).toHaveTextContent('At risk');
  });

  it('shows critical health score badge', async () => {
    mockFetch.mockReturnValueOnce(makeResponse({ ...HEALTHY_RESPONSE, healthScore: 20 }));
    render(<StandupWidget tasks={MOCK_TASKS} project={MOCK_PROJECT} />);
    fireEvent.click(screen.getByTestId('standup-daily-btn'));
    await waitFor(() => {
      expect(screen.getByTestId('health-score-badge')).toBeInTheDocument();
    });
    expect(screen.getByTestId('health-score-badge')).toHaveTextContent('Critical');
  });

  it('calls fetch with weekly period when weekly button is clicked', async () => {
    mockFetch.mockReturnValueOnce(makeResponse(HEALTHY_RESPONSE));
    render(<StandupWidget tasks={MOCK_TASKS} project={MOCK_PROJECT} />);
    fireEvent.click(screen.getByTestId('standup-weekly-btn'));
    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledTimes(1);
    });
    const [, options] = mockFetch.mock.calls[0] as [string, RequestInit];
    const body = JSON.parse(options.body as string) as { period: string };
    expect(body.period).toBe('weekly');
  });

  it('hides highlights section when no highlights', async () => {
    mockFetch.mockReturnValueOnce(makeResponse({ ...HEALTHY_RESPONSE, highlights: [] }));
    render(<StandupWidget tasks={MOCK_TASKS} project={MOCK_PROJECT} />);
    fireEvent.click(screen.getByTestId('standup-daily-btn'));
    await waitFor(() => {
      expect(screen.getByTestId('standup-result')).toBeInTheDocument();
    });
    expect(screen.queryByTestId('standup-highlights')).not.toBeInTheDocument();
  });
});
