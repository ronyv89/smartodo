/**
 * standup-cron — Supabase Edge Function
 *
 * Runs on a schedule (e.g. every weekday at 09:00 UTC) to generate and
 * deliver AI standup digests for each active workspace.
 *
 * Schedule configuration (supabase/config.toml or Dashboard → Edge Functions):
 *   [functions.standup-cron]
 *   schedule = "0 9 * * 1-5"   # 09:00 UTC Mon–Fri
 *
 * Required secrets (set via `supabase secrets set`):
 *   ANTHROPIC_API_KEY   — Anthropic API key
 *   WEB_API_URL         — Base URL of the Next.js app (e.g. https://app.smartodo.io)
 *
 * The function delegates AI work to the existing POST /api/ai/standup route
 * so logic is not duplicated.  Delivery (email, Slack) is a stub — implement
 * via Resend, Postmark, or Slack Webhooks as needed.
 */
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL') ?? '';
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
const WEB_API_URL = Deno.env.get('WEB_API_URL') ?? '';

Deno.serve(async () => {
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  // Fetch all workspaces
  const { data: workspaces, error: wsError } = await supabase.from('workspaces').select('id, name');

  if (wsError !== null) {
    console.error('Failed to fetch workspaces:', wsError.message);
    return new Response(JSON.stringify({ error: wsError.message }), { status: 500 });
  }

  const results: Array<{ workspaceId: string; ok: boolean }> = [];

  for (const workspace of workspaces ?? []) {
    // Fetch tasks for this workspace via projects
    const { data: projects } = await supabase
      .from('projects')
      .select('id, name')
      .eq('workspace_id', workspace.id);

    for (const project of projects ?? []) {
      const { data: tasks } = await supabase
        .from('tasks')
        .select('title, status, priority, due_date, completed_at')
        .eq('project_id', project.id)
        .is('parent_id', null);

      if (tasks === null || tasks.length === 0) continue;

      // Delegate to the Next.js AI route
      const res = await fetch(`${WEB_API_URL}/api/ai/standup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tasks, projectName: project.name, period: 'daily' }),
      });

      if (!res.ok) {
        console.error(`standup generation failed for project ${project.id}`);
        results.push({ workspaceId: workspace.id, ok: false });
        continue;
      }

      const digest = await res.json();
      console.log(
        `[standup-cron] ${workspace.name}/${project.name} → health ${String(digest.healthScore)}`,
      );

      // TODO: deliver digest via email / Slack webhook
      // Example with Resend:
      //   await fetch('https://api.resend.com/emails', { method: 'POST', ... })
      // Example with Slack:
      //   await fetch(slackWebhookUrl, { method: 'POST', body: JSON.stringify({ text: digest.digest }) })

      results.push({ workspaceId: workspace.id, ok: true });
    }
  }

  return new Response(JSON.stringify({ processed: results.length, results }), {
    headers: { 'Content-Type': 'application/json' },
  });
});
