import { rateLimit } from '../lib/rate-limit';

function makeRequest(ip = '127.0.0.1'): Request {
  return {
    headers: {
      get: (name: string) => (name === 'x-forwarded-for' ? ip : null),
    },
  } as unknown as Request;
}

function makeRequestMultipleIp(forwardedFor: string): Request {
  return {
    headers: {
      get: (name: string) => (name === 'x-forwarded-for' ? forwardedFor : null),
    },
  } as unknown as Request;
}

function makeRequestNoIp(): Request {
  return {
    headers: {
      get: (_name: string) => null,
    },
  } as unknown as Request;
}

describe('rateLimit', () => {
  it('allows requests under the limit', () => {
    const limiter = rateLimit({ windowMs: 60_000, max: 5 });
    const req = makeRequest();

    for (let i = 0; i < 5; i++) {
      const result = limiter(req);
      expect(result.ok).toBe(true);
    }
  });

  it('blocks the request that exceeds the max', () => {
    const limiter = rateLimit({ windowMs: 60_000, max: 3 });
    const req = makeRequest();

    limiter(req);
    limiter(req);
    limiter(req);

    const result = limiter(req);
    expect(result.ok).toBe(false);
    expect(result.remaining).toBe(0);
    expect(result.retryAfterMs).toBeGreaterThan(0);
  });

  it('tracks remaining count correctly', () => {
    const limiter = rateLimit({ windowMs: 60_000, max: 5 });
    const req = makeRequest();

    const r1 = limiter(req);
    expect(r1.remaining).toBe(4);
    const r2 = limiter(req);
    expect(r2.remaining).toBe(3);
  });

  it('tracks different IPs independently', () => {
    const limiter = rateLimit({ windowMs: 60_000, max: 2 });

    limiter(makeRequest('1.2.3.4'));
    limiter(makeRequest('1.2.3.4'));
    const blocked = limiter(makeRequest('1.2.3.4'));
    expect(blocked.ok).toBe(false);

    // Different IP should still be allowed
    const other = limiter(makeRequest('5.6.7.8'));
    expect(other.ok).toBe(true);
  });

  it('uses first IP from x-forwarded-for comma list', () => {
    const limiter = rateLimit({ windowMs: 60_000, max: 2 });
    const req = makeRequestMultipleIp('10.0.0.1, 192.168.1.1');
    limiter(req);
    limiter(req);
    const result3 = limiter(req);
    expect(result3.ok).toBe(false);
  });

  it('falls back to "unknown" when no IP header', () => {
    const limiter = rateLimit({ windowMs: 60_000, max: 1 });
    const req = makeRequestNoIp();
    const r1 = limiter(req);
    expect(r1.ok).toBe(true);
    const r2 = limiter(req);
    expect(r2.ok).toBe(false);
  });
});
