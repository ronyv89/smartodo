'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createSupabaseBrowserClient } from '@/lib/supabase/client';
import { validatePassword, PASSWORD_REQUIREMENTS } from '@smartodo/core';

const STRENGTH_LABEL: Record<string, string> = {
  weak: 'Weak',
  fair: 'Fair',
  strong: 'Strong',
  'very-strong': 'Very strong',
};

const STRENGTH_COLOR: Record<string, string> = {
  weak: 'bg-red-400',
  fair: 'bg-yellow-400',
  strong: 'bg-blue-400',
  'very-strong': 'bg-green-500',
};

export default function SignupForm() {
  const router = useRouter();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const passwordValidation = validatePassword(password);
  const showRequirements = password.length > 0;

  async function handleSubmit(e: React.SyntheticEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);

    if (!passwordValidation.valid) {
      const labels = passwordValidation.unmetRequirements.map((r) => r.label).join(', ');
      setError(`Password requirements not met: ${labels}.`);
      return;
    }

    setLoading(true);

    const supabase = createSupabaseBrowserClient();
    const { error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: fullName } },
    });

    if (signUpError !== null) {
      setError(signUpError.message);
      setLoading(false);
      return;
    }

    setSuccess(true);
    setLoading(false);
    router.refresh();
  }

  if (success) {
    return (
      <div
        className="card-smartodo rounded-xl bg-white p-8 text-center"
        data-testid="signup-success"
      >
        <div className="mb-4 text-4xl">✉️</div>
        <h2 className="mb-2 text-xl font-bold text-gray-800">Check your email</h2>
        <p className="text-sm text-gray-500">
          We sent a confirmation link to <strong>{email}</strong>. Click it to activate your
          account.
        </p>
        <a
          href="/auth/login"
          className="mt-6 inline-block font-semibold text-blue-600 hover:underline"
        >
          Back to sign in
        </a>
      </div>
    );
  }

  return (
    <div className="card-smartodo rounded-xl bg-white p-8">
      <form onSubmit={(e) => void handleSubmit(e)} data-testid="signup-form" noValidate>
        {error !== null && (
          <div
            data-testid="signup-error"
            className="mb-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700"
            role="alert"
          >
            {error}
          </div>
        )}

        <div className="mb-4">
          <label htmlFor="full-name" className="mb-1 block text-sm font-semibold text-gray-700">
            Full name
          </label>
          <input
            id="full-name"
            type="text"
            autoComplete="name"
            required
            value={fullName}
            onChange={(e) => {
              setFullName(e.target.value);
            }}
            data-testid="signup-full-name"
            className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm text-gray-800 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            placeholder="Jane Smith"
          />
        </div>

        <div className="mb-4">
          <label htmlFor="email" className="mb-1 block text-sm font-semibold text-gray-700">
            Email
          </label>
          <input
            id="email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
            }}
            data-testid="signup-email"
            className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm text-gray-800 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            placeholder="you@example.com"
          />
        </div>

        <div className="mb-6">
          <label htmlFor="password" className="mb-1 block text-sm font-semibold text-gray-700">
            Password
          </label>
          <input
            id="password"
            type="password"
            autoComplete="new-password"
            required
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
            }}
            data-testid="signup-password"
            className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm text-gray-800 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            placeholder="••••••••"
          />

          {showRequirements && (
            <div data-testid="password-requirements" className="mt-3">
              {/* Strength bar */}
              <div className="mb-2 flex items-center gap-2">
                <div className="flex flex-1 gap-1">
                  {[1, 2, 3, 4, 5].map((level) => (
                    <div
                      key={level}
                      className={`h-1.5 flex-1 rounded-full transition-colors ${
                        passwordValidation.score >= level
                          ? (STRENGTH_COLOR[passwordValidation.strength] ?? 'bg-gray-200')
                          : 'bg-gray-200'
                      }`}
                    />
                  ))}
                </div>
                <span
                  data-testid="password-strength"
                  data-strength={passwordValidation.strength}
                  className="min-w-[5rem] text-right text-xs font-medium text-gray-500"
                >
                  {STRENGTH_LABEL[passwordValidation.strength]}
                </span>
              </div>

              {/* Requirements checklist */}
              <ul className="space-y-1">
                {PASSWORD_REQUIREMENTS.map((req) => {
                  const met = req.test(password);
                  return (
                    <li
                      key={req.id}
                      data-testid={`req-${req.id}`}
                      data-met={String(met)}
                      className="flex items-center gap-1.5 text-xs"
                    >
                      <span aria-hidden="true" className={met ? 'text-green-500' : 'text-gray-300'}>
                        {met ? '✓' : '○'}
                      </span>
                      <span className={met ? 'text-green-700' : 'text-gray-500'}>{req.label}</span>
                    </li>
                  );
                })}
              </ul>
            </div>
          )}
        </div>

        <button
          type="submit"
          disabled={loading}
          data-testid="signup-submit"
          className="btn-smartodo-primary w-full rounded-full px-6 py-3 font-semibold text-white disabled:opacity-60"
        >
          {loading ? 'Creating account…' : 'Create Account'}
        </button>

        <p className="mt-4 text-center text-sm text-gray-500">
          Already have an account?{' '}
          <a href="/auth/login" className="font-semibold text-blue-600 hover:underline">
            Sign in
          </a>
        </p>
      </form>
    </div>
  );
}
