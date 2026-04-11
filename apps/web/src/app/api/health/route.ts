import { NextResponse } from 'next/server';

/**
 * GET /api/health
 *
 * Lightweight health check used by Docker HEALTHCHECK, load balancers,
 * and uptime monitors.  Returns 200 when the Next.js process is healthy.
 *
 * Note: this does NOT probe the database — a separate readiness check
 * (e.g. /api/health/ready) can do that if needed.
 */
export function GET(): NextResponse {
  return NextResponse.json(
    {
      status: 'ok',
      version: process.env.NEXT_PUBLIC_APP_VERSION ?? 'dev',
      timestamp: new Date().toISOString(),
    },
    { status: 200 },
  );
}
