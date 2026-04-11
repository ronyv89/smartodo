import { redirect } from 'next/navigation';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { listWorkspaces } from '@smartodo/supabase';
import DashboardShell from '@/components/DashboardShell';

export default async function DashboardPage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user === null) {
    redirect('/auth/login');
  }

  const { data: workspaces } = await listWorkspaces();

  // Redirect to workspace setup if the user has no workspaces
  if (workspaces === null || workspaces.length === 0) {
    redirect('/dashboard/new-workspace');
  }

  const workspace = workspaces[0];
  if (workspace === undefined) {
    redirect('/dashboard/new-workspace');
  }

  return (
    <DashboardShell userId={user.id} workspaces={workspaces} currentWorkspaceId={workspace.id} />
  );
}
