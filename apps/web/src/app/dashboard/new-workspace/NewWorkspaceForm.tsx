'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createSupabaseBrowserClient } from '@/lib/supabase/client';
import { createWorkspace } from '@smartodo/supabase';

interface NewWorkspaceFormProps {
  userId: string;
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

export default function NewWorkspaceForm({ userId }: NewWorkspaceFormProps) {
  const router = useRouter();
  const [name, setName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const slug = slugify(name);

  async function handleSubmit(e: React.SyntheticEvent<HTMLFormElement>) {
    e.preventDefault();
    if (name.trim() === '') return;

    setLoading(true);
    setError(null);

    // Use SSR client to pass the user session cookie
    const supabase = createSupabaseBrowserClient();
    const { data: authData } = await supabase.auth.getUser();
    const ownerId = authData.user?.id ?? userId;

    const { data, error: createError } = await createWorkspace({
      name: name.trim(),
      slug,
      owner_id: ownerId,
    });

    if (createError !== null) {
      setError(createError.message);
      setLoading(false);
      return;
    }

    if (data !== null) {
      router.push('/dashboard');
      router.refresh();
    }
  }

  return (
    <div className="card-smartodo rounded-xl bg-white p-8">
      <form onSubmit={(e) => void handleSubmit(e)} data-testid="new-workspace-form" noValidate>
        {error !== null && (
          <div
            data-testid="new-workspace-error"
            className="mb-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700"
            role="alert"
          >
            {error}
          </div>
        )}

        <div className="mb-4">
          <label
            htmlFor="workspace-name"
            className="mb-1 block text-sm font-semibold text-gray-700"
          >
            Workspace name
          </label>
          <input
            id="workspace-name"
            type="text"
            required
            value={name}
            onChange={(e) => {
              setName(e.target.value);
            }}
            data-testid="workspace-name-input"
            className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm text-gray-800 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            placeholder="Acme Inc"
          />
          {slug !== '' && (
            <p className="mt-1 text-xs text-gray-400">
              URL slug: <span className="font-mono">{slug}</span>
            </p>
          )}
        </div>

        <button
          type="submit"
          disabled={loading || name.trim() === ''}
          data-testid="create-workspace-submit"
          className="btn-smartodo-primary w-full rounded-full px-6 py-3 font-semibold text-white disabled:opacity-60"
        >
          {loading ? 'Creating…' : 'Create Workspace'}
        </button>
      </form>
    </div>
  );
}
