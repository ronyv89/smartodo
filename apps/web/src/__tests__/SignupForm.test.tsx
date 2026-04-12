import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import SignupForm from '../app/auth/signup/SignupForm';

// ── mocks ──────────────────────────────────────────────────────────────────────

jest.mock('next/navigation', () => ({
  useRouter: () => ({ refresh: jest.fn() }),
}));

const mockSignUp = jest.fn();
jest.mock('@/lib/supabase/client', () => ({
  createSupabaseBrowserClient: () => ({
    auth: { signUp: mockSignUp },
  }),
}));

// ── helpers ────────────────────────────────────────────────────────────────────

const VALID_PASSWORD = 'Secure@Pass1';

function fillForm({
  fullName = 'Jane Smith',
  email = 'jane@example.com',
  password = VALID_PASSWORD,
}: {
  fullName?: string;
  email?: string;
  password?: string;
} = {}) {
  fireEvent.change(screen.getByTestId('signup-full-name'), {
    target: { value: fullName },
  });
  fireEvent.change(screen.getByTestId('signup-email'), {
    target: { value: email },
  });
  fireEvent.change(screen.getByTestId('signup-password'), {
    target: { value: password },
  });
}

// ── tests ──────────────────────────────────────────────────────────────────────

beforeEach(() => {
  jest.clearAllMocks();
});

describe('SignupForm rendering', () => {
  it('renders all form fields and submit button', () => {
    render(<SignupForm />);
    expect(screen.getByTestId('signup-form')).toBeInTheDocument();
    expect(screen.getByTestId('signup-full-name')).toBeInTheDocument();
    expect(screen.getByTestId('signup-email')).toBeInTheDocument();
    expect(screen.getByTestId('signup-password')).toBeInTheDocument();
    expect(screen.getByTestId('signup-submit')).toBeInTheDocument();
  });

  it('does not show the error banner initially', () => {
    render(<SignupForm />);
    expect(screen.queryByTestId('signup-error')).not.toBeInTheDocument();
  });

  it('does not show password requirements before typing', () => {
    render(<SignupForm />);
    expect(screen.queryByTestId('password-requirements')).not.toBeInTheDocument();
  });
});

describe('Password requirements UI', () => {
  it('shows requirements panel once user starts typing in the password field', () => {
    render(<SignupForm />);
    fireEvent.change(screen.getByTestId('signup-password'), { target: { value: 'a' } });
    expect(screen.getByTestId('password-requirements')).toBeInTheDocument();
  });

  it('marks length requirement as unmet for short passwords', () => {
    render(<SignupForm />);
    fireEvent.change(screen.getByTestId('signup-password'), { target: { value: 'Ab1!' } });
    expect(screen.getByTestId('req-length')).toHaveAttribute('data-met', 'false');
  });

  it('marks length requirement as met once password reaches 8 characters', () => {
    render(<SignupForm />);
    fireEvent.change(screen.getByTestId('signup-password'), {
      target: { value: 'abcdefgh' },
    });
    expect(screen.getByTestId('req-length')).toHaveAttribute('data-met', 'true');
  });

  it('marks all requirements as met for a fully valid password', () => {
    render(<SignupForm />);
    fireEvent.change(screen.getByTestId('signup-password'), {
      target: { value: VALID_PASSWORD },
    });
    for (const id of ['length', 'uppercase', 'lowercase', 'number', 'special']) {
      expect(screen.getByTestId(`req-${id}`)).toHaveAttribute('data-met', 'true');
    }
  });

  it('shows "weak" strength for a password meeting only 1 requirement', () => {
    render(<SignupForm />);
    fireEvent.change(screen.getByTestId('signup-password'), { target: { value: 'a' } });
    expect(screen.getByTestId('password-strength')).toHaveAttribute('data-strength', 'weak');
  });

  it('shows "fair" strength for a password meeting 2 requirements', () => {
    render(<SignupForm />);
    // lowercase + length (8 chars, all lowercase)
    fireEvent.change(screen.getByTestId('signup-password'), {
      target: { value: 'abcdefgh' },
    });
    expect(screen.getByTestId('password-strength')).toHaveAttribute('data-strength', 'fair');
  });

  it('shows "very-strong" strength for a fully valid password', () => {
    render(<SignupForm />);
    fireEvent.change(screen.getByTestId('signup-password'), {
      target: { value: VALID_PASSWORD },
    });
    expect(screen.getByTestId('password-strength')).toHaveAttribute('data-strength', 'very-strong');
  });
});

describe('Client-side password validation on submit', () => {
  it('shows an error and does NOT call Supabase when password is too short', async () => {
    render(<SignupForm />);
    fillForm({ password: 'Weak1!' });
    fireEvent.submit(screen.getByTestId('signup-form'));

    await waitFor(() => {
      expect(screen.getByTestId('signup-error')).toBeInTheDocument();
    });
    expect(mockSignUp).not.toHaveBeenCalled();
  });

  it('shows an error and does NOT call Supabase when password has no uppercase', async () => {
    render(<SignupForm />);
    fillForm({ password: 'nouppercase1!' });
    fireEvent.submit(screen.getByTestId('signup-form'));

    await waitFor(() => {
      expect(screen.getByTestId('signup-error')).toBeInTheDocument();
    });
    expect(mockSignUp).not.toHaveBeenCalled();
  });

  it('shows an error and does NOT call Supabase when password has no special character', async () => {
    render(<SignupForm />);
    fillForm({ password: 'NoSpecial123' });
    fireEvent.submit(screen.getByTestId('signup-form'));

    await waitFor(() => {
      expect(screen.getByTestId('signup-error')).toBeInTheDocument();
    });
    expect(mockSignUp).not.toHaveBeenCalled();
  });

  it('error message lists the unmet requirements', async () => {
    render(<SignupForm />);
    // Only lowercase + length met — missing uppercase, number, special
    fillForm({ password: 'abcdefgh' });
    fireEvent.submit(screen.getByTestId('signup-form'));

    await waitFor(() => {
      const errorEl = screen.getByTestId('signup-error');
      expect(errorEl.textContent).toMatch(/uppercase/i);
    });
  });
});

describe('Successful signup flow', () => {
  it('calls supabase.auth.signUp with the correct payload', async () => {
    mockSignUp.mockResolvedValueOnce({ error: null });
    render(<SignupForm />);
    fillForm();
    fireEvent.submit(screen.getByTestId('signup-form'));

    await waitFor(() => {
      expect(mockSignUp).toHaveBeenCalledWith({
        email: 'jane@example.com',
        password: VALID_PASSWORD,
        options: { data: { full_name: 'Jane Smith' } },
      });
    });
  });

  it('shows the success state after a successful signup', async () => {
    mockSignUp.mockResolvedValueOnce({ error: null });
    render(<SignupForm />);
    fillForm();
    fireEvent.submit(screen.getByTestId('signup-form'));

    await waitFor(() => {
      expect(screen.getByTestId('signup-success')).toBeInTheDocument();
    });
  });

  it('hides the form after success', async () => {
    mockSignUp.mockResolvedValueOnce({ error: null });
    render(<SignupForm />);
    fillForm();
    fireEvent.submit(screen.getByTestId('signup-form'));

    await waitFor(() => {
      expect(screen.queryByTestId('signup-form')).not.toBeInTheDocument();
    });
  });
});

describe('Supabase error handling', () => {
  it('displays the error message returned by Supabase', async () => {
    mockSignUp.mockResolvedValueOnce({ error: { message: 'Email already in use' } });
    render(<SignupForm />);
    fillForm();
    fireEvent.submit(screen.getByTestId('signup-form'));

    await waitFor(() => {
      expect(screen.getByTestId('signup-error')).toHaveTextContent('Email already in use');
    });
  });

  it('does not show the success state when Supabase returns an error', async () => {
    mockSignUp.mockResolvedValueOnce({ error: { message: 'Something went wrong' } });
    render(<SignupForm />);
    fillForm();
    fireEvent.submit(screen.getByTestId('signup-form'));

    await waitFor(() => {
      expect(screen.getByTestId('signup-error')).toBeInTheDocument();
    });
    expect(screen.queryByTestId('signup-success')).not.toBeInTheDocument();
  });
});
