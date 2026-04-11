// Mock next/server so the route handler can be tested without the Next.js runtime
jest.mock('next/server', () => ({
  NextResponse: {
    json: (body: unknown, init?: { status?: number }) =>
      ({
        status: init?.status ?? 200,
        json: () => Promise.resolve(body),
      }) as Response,
  },
}));

import { GET } from '../app/api/health/route';

describe('GET /api/health', () => {
  it('returns 200 with status ok', async () => {
    const response = GET();
    expect(response.status).toBe(200);
    const json = (await response.json()) as { status: string; timestamp: string; version: string };
    expect(json.status).toBe('ok');
    expect(typeof json.timestamp).toBe('string');
    expect(typeof json.version).toBe('string');
  });

  it('returns a valid ISO timestamp', async () => {
    const response = GET();
    const json = (await response.json()) as { timestamp: string };
    expect(new Date(json.timestamp).toISOString()).toBe(json.timestamp);
  });

  it('uses NEXT_PUBLIC_APP_VERSION env var when set', async () => {
    process.env.NEXT_PUBLIC_APP_VERSION = '1.2.3';
    const response = GET();
    const json = (await response.json()) as { version: string };
    expect(json.version).toBe('1.2.3');
    delete process.env.NEXT_PUBLIC_APP_VERSION;
  });
});
