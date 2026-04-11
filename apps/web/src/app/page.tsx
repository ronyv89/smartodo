import { BRAND_COLORS } from '@smartodo/core/constants';

export default function HomePage() {
  return (
    <main data-testid="home-page" className="flex min-h-screen flex-col">
      {/* ── Hero section ── */}
      <section
        data-testid="hero-section"
        className="flex flex-col items-center justify-center px-6 py-24 text-center"
        style={{ background: 'linear-gradient(150deg, #1a1a4e 0%, #5e72e4 100%)' }}
      >
        <h1
          data-testid="hero-heading"
          className="mb-4 text-5xl font-bold tracking-tight text-white"
        >
          smarTODO
        </h1>
        <p className="mb-8 max-w-lg text-xl text-blue-100">
          AI-powered, plugin-extensible task management. Open source and self-hostable.
        </p>
        <div className="flex flex-wrap justify-center gap-4">
          <a
            href="/auth/signup"
            data-testid="cta-get-started"
            className="btn-smartodo-primary inline-block rounded-full px-8 py-3 font-semibold text-white"
          >
            Get Started Free
          </a>
          <a
            href="https://github.com/smartodo/smartodo"
            data-testid="cta-github"
            className="inline-block rounded-full border border-white/30 px-8 py-3 font-semibold text-white transition-colors hover:bg-white/10"
          >
            View on GitHub
          </a>
        </div>
      </section>

      {/* ── Features grid ── */}
      <section data-testid="features-section" className="bg-gray-50 px-6 py-20">
        <div className="mx-auto max-w-5xl">
          <h2 className="mb-12 text-center text-3xl font-bold text-gray-800">
            Everything you need to stay on top of your work
          </h2>
          <div className="row g-4" data-testid="features-grid">
            {FEATURES.map((feature) => (
              <div key={feature.id} className="col-md-4">
                <div
                  className="card-smartodo h-full rounded-lg bg-white p-6"
                  data-testid={`feature-card-${feature.id}`}
                >
                  <div
                    className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl text-2xl text-white"
                    style={{ background: BRAND_COLORS.primary }}
                  >
                    {feature.icon}
                  </div>
                  <h3 className="mb-2 text-lg font-semibold text-gray-800">{feature.title}</h3>
                  <p className="text-sm leading-relaxed text-gray-500">{feature.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer data-testid="footer" className="bg-gray-800 px-6 py-8 text-center text-gray-400">
        <p className="text-sm">
          smarTODO — Open Source Task Management ·{' '}
          <a
            href="/auth/login"
            data-testid="footer-login-link"
            className="text-blue-400 hover:underline"
          >
            Sign In
          </a>
        </p>
      </footer>
    </main>
  );
}

const FEATURES = [
  {
    id: 'ai-parsing',
    icon: '🤖',
    title: 'Smart Task Parsing',
    description:
      'Type naturally — "Call dentist tomorrow P1" — and smarTODO extracts date, priority, and assignee automatically.',
  },
  {
    id: 'kanban',
    icon: '📋',
    title: 'List & Kanban Views',
    description:
      'Switch between list and board views. Drag tasks between columns with optimistic UI updates.',
  },
  {
    id: 'plugins',
    icon: '🔌',
    title: 'Plugin Extensible',
    description:
      'Add Sprint Board, Time Tracking, and more. Build your own plugin with the public Plugin SDK.',
  },
  {
    id: 'realtime',
    icon: '⚡',
    title: 'Real-time Collaboration',
    description:
      'Supabase Realtime keeps everyone in sync. See task changes instantly without refreshing.',
  },
  {
    id: 'self-host',
    icon: '🏠',
    title: 'Self-Hostable',
    description: 'Community Edition is 100% self-hostable with Docker + Supabase. Own your data.',
  },
  {
    id: 'pro-ai',
    icon: '✨',
    title: 'Claude AI (Pro)',
    description:
      'Break down complex tasks, run natural language workspace commands, and generate daily standups.',
  },
] as const;
