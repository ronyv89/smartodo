'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createSupabaseBrowserClient } from '@/lib/supabase/client';

export default function SignupForm() {
  const router = useRouter();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  async function handleSubmit(e: React.SyntheticEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);

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
            Password <span className="font-normal text-gray-400">(min 8 characters)</span>
          </label>
          <input
            id="password"
            type="password"
            autoComplete="new-password"
            required
            minLength={8}
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
            }}
            data-testid="signup-password"
            className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm text-gray-800 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            placeholder="••••••••"
          />
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
