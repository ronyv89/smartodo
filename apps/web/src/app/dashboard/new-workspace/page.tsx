import { redirect } from 'next/navigation';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import NewWorkspaceForm from './NewWorkspaceForm';

export default async function NewWorkspacePage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user === null) {
    redirect('/auth/login');
  }

  return (
    <main
      data-testid="new-workspace-page"
      className="flex min-h-screen items-center justify-center bg-gray-50 px-4"
    >
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-bold text-gray-800">Create your first workspace</h1>
          <p className="mt-2 text-gray-500">A workspace holds your projects and tasks.</p>
        </div>
        <NewWorkspaceForm userId={user.id} />
      </div>
    </main>
  );
}
