import { render, screen, fireEvent } from '@testing-library/react';
import { WorkspaceSwitcher } from '../components/WorkspaceSwitcher';

const workspaces = [
  { id: 'ws-1', name: 'Alpha', slug: 'alpha' },
  { id: 'ws-2', name: 'Beta', slug: 'beta' },
];

describe('WorkspaceSwitcher', () => {
  it('renders all workspace options', () => {
    render(
      <WorkspaceSwitcher workspaces={workspaces} currentWorkspaceId="ws-1" onChange={jest.fn()} />,
    );
    // combobox is the ARIA role for <select>
    const select = screen.getByRole<HTMLSelectElement>('combobox');
    expect(select.options).toHaveLength(2);
    expect(select.options[0]?.text).toBe('Alpha');
    expect(select.options[1]?.text).toBe('Beta');
  });

  it('shows the current workspace as selected', () => {
    render(
      <WorkspaceSwitcher workspaces={workspaces} currentWorkspaceId="ws-2" onChange={jest.fn()} />,
    );
    expect(screen.getByDisplayValue('Beta')).toBeInTheDocument();
  });

  it('displays the slug of the current workspace', () => {
    render(
      <WorkspaceSwitcher workspaces={workspaces} currentWorkspaceId="ws-1" onChange={jest.fn()} />,
    );
    expect(screen.getByTestId('workspace-slug').textContent).toBe('/alpha');
  });

  it('calls onChange when a different workspace is selected', () => {
    const handleChange = jest.fn();
    render(
      <WorkspaceSwitcher
        workspaces={workspaces}
        currentWorkspaceId="ws-1"
        onChange={handleChange}
      />,
    );
    fireEvent.change(screen.getByRole('combobox'), { target: { value: 'ws-2' } });
    expect(handleChange).toHaveBeenCalledWith('ws-2');
  });

  it('shows a placeholder when there are no workspaces', () => {
    render(<WorkspaceSwitcher workspaces={[]} currentWorkspaceId={null} onChange={jest.fn()} />);
    expect(screen.getByText('No workspaces')).toBeInTheDocument();
  });
});
