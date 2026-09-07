import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import handler, {
  checkRateLimit,
  getClientIp,
  getRedisClient,
  loadAlerts,
  saveAlert,
  resetRateLimits,
  resetInMemoryAlerts,
  getInMemoryAlerts,
  RATE_LIMIT_MAX,
  DEFAULT_ALERTS,
  AlertPayload,
} from '../../api/alerts';

function createMockReq(options: {
  method?: string;
  body?: any;
  headers?: Record<string, string>;
  ip?: string;
} = {}) {
  return {
    method: options.method || 'GET',
    body: options.body,
    headers: options.headers || (options.ip ? { 'x-forwarded-for': options.ip } : {}),
    socket: { remoteAddress: options.ip || '127.0.0.1' },
  };
}

function createMockRes() {
  const res: any = {
    statusCode: 200,
    headers: {} as Record<string, string>,
    body: null as any,
    setHeader: vi.fn((k: string, v: string) => {
      res.headers[k.toLowerCase()] = v;
      return res;
    }),
    status: vi.fn((code: number) => {
      res.statusCode = code;
      return res;
    }),
    json: vi.fn((data: any) => {
      res.body = data;
      return res;
    }),
    end: vi.fn(() => res),
  };
  return res;
}

describe('Community Alerts API & Redis Resilience (api/alerts.ts)', () => {
  const originalEnv = { ...process.env };
  const originalFetch = globalThis.fetch;

  beforeEach(() => {
    vi.clearAllMocks();
    resetRateLimits();
    resetInMemoryAlerts();

    // Default: unset Redis env vars to test in-memory fallback
    delete process.env.KV_REST_API_URL;
    delete process.env.KV_REST_API_TOKEN;
    delete process.env.UPSTASH_REDIS_REST_URL;
    delete process.env.UPSTASH_REDIS_REST_TOKEN;
  });

  afterEach(() => {
    process.env = { ...originalEnv };
    globalThis.fetch = originalFetch;
  });

  describe('Rate Limiting & Threshold Behavior (checkRateLimit)', () => {
    it('allows requests up to RATE_LIMIT_MAX (20) within the in-memory window', async () => {
      const ip = '192.168.1.100';

      for (let i = 1; i <= RATE_LIMIT_MAX; i++) {
        const allowed = await checkRateLimit(ip);
        expect(allowed).toBe(true);
      }

      // The 21st request must be rejected
      const exceeded = await checkRateLimit(ip);
      expect(exceeded).toBe(false);
    });

    it('isolates rate-limit quotas by client IP address', async () => {
      const ipA = '10.0.0.1';
      const ipB = '10.0.0.2';

      // Exhaust quota for IP A
      for (let i = 1; i <= RATE_LIMIT_MAX; i++) {
        await checkRateLimit(ipA);
      }
      expect(await checkRateLimit(ipA)).toBe(false);

      // IP B should still be allowed full quota
      expect(await checkRateLimit(ipB)).toBe(true);
    });

    it('resets quota when resetRateLimits() is invoked', async () => {
      const ip = '172.16.0.5';
      for (let i = 1; i <= RATE_LIMIT_MAX; i++) {
        await checkRateLimit(ip);
      }
      expect(await checkRateLimit(ip)).toBe(false);

      resetRateLimits();
      expect(await checkRateLimit(ip)).toBe(true);
    });

    it('extracts IP from x-forwarded-for or socket fallback', () => {
      expect(getClientIp({ headers: { 'x-forwarded-for': '203.0.113.195, 70.41.3.18' } })).toBe('203.0.113.195');
      expect(getClientIp({ headers: { 'x-real-ip': '198.51.100.4' } })).toBe('198.51.100.4');
      expect(getClientIp({ socket: { remoteAddress: '127.0.0.1' } })).toBe('127.0.0.1');
    });

    it('uses Upstash Redis rate limiting when env vars are present', async () => {
      process.env.KV_REST_API_URL = 'https://fake-redis.upstash.io';
      process.env.KV_REST_API_TOKEN = 'fake-token';

      let callCount = 0;
      // Mock fetch returning Redis pipeline response for INCR
      globalThis.fetch = vi.fn().mockImplementation(async () => {
        callCount++;
        return new Response(JSON.stringify([{ result: callCount }]), { status: 200 });
      });

      const allowed = await checkRateLimit('8.8.8.8');
      expect(allowed).toBe(true);
      expect(globalThis.fetch).toHaveBeenCalled();
    });

    it('falls back to in-memory rate limiting if Redis network request throws/fails', async () => {
      process.env.KV_REST_API_URL = 'https://fake-redis.upstash.io';
      process.env.KV_REST_API_TOKEN = 'fake-token';

      // Mock network connection failure
      globalThis.fetch = vi.fn().mockRejectedValue(new Error('ECONNREFUSED: Redis unreachable'));

      // Should not throw, should fall back to in-memory check
      const allowed = await checkRateLimit('1.1.1.1');
      expect(allowed).toBe(true);
    });
  });

  describe('Redis Absent & Unreachable Fallback (loadAlerts & saveAlert)', () => {
    it('returns null for getRedisClient when environment variables are unset', () => {
      expect(getRedisClient()).toBeNull();
    });

    it('initializes in-memory storage with DEFAULT_ALERTS when Redis is unset', async () => {
      const alerts = await loadAlerts();
      expect(alerts.length).toBe(DEFAULT_ALERTS.length);
      expect(alerts[0].id).toBe(DEFAULT_ALERTS[0].id);
    });

    it('saves new alerts to in-memory storage when Redis is unset', async () => {
      const sampleAlert: AlertPayload = {
        id: 'mock_local_alert_1',
        title: 'Local Test Alert',
        district: 'Nashik',
        description: 'Suspicious cake sample',
        feedType: 'Mustard Cake',
      };

      const updated = await saveAlert(sampleAlert);
      expect(updated[0].id).toBe('mock_local_alert_1');

      const reloaded = await loadAlerts();
      expect(reloaded[0].id).toBe('mock_local_alert_1');
    });

    it('gracefully falls back to in-memory alerts when Redis read rejects with network error', async () => {
      process.env.KV_REST_API_URL = 'https://broken-redis.upstash.io';
      process.env.KV_REST_API_TOKEN = 'broken-token';

      globalThis.fetch = vi.fn().mockRejectedValue(new Error('Connection reset by peer'));

      const alerts = await loadAlerts();
      expect(Array.isArray(alerts)).toBe(true);
      expect(alerts.length).toBeGreaterThan(0);
      expect(alerts[0].id).toBe(DEFAULT_ALERTS[0].id);
    });

    it('gracefully falls back to in-memory update when Redis write rejects with network error', async () => {
      process.env.KV_REST_API_URL = 'https://broken-redis.upstash.io';
      process.env.KV_REST_API_TOKEN = 'broken-token';

      globalThis.fetch = vi.fn().mockRejectedValue(new Error('Upstash cluster timeout'));

      const newAlert: AlertPayload = {
        id: 'offline_fallback_alert',
        title: 'Network Outage Alert',
        district: 'Sangli',
        description: 'Testing fallback write',
        feedType: 'Silage',
      };

      const updated = await saveAlert(newAlert);
      expect(updated[0].id).toBe('offline_fallback_alert');
      expect(getInMemoryAlerts()[0].id).toBe('offline_fallback_alert');
    });

    it('loads alerts from Redis when Redis is healthy and populated', async () => {
      process.env.KV_REST_API_URL = 'https://healthy-redis.upstash.io';
      process.env.KV_REST_API_TOKEN = 'healthy-token';

      const customRemoteAlerts: AlertPayload[] = [
        {
          id: 'remote_alert_42',
          title: 'Remote Upstash Alert',
          district: 'Solapur',
          description: 'High aflatoxin report from field laboratory',
          feedType: 'Maize Fodder',
        },
      ];

      globalThis.fetch = vi.fn().mockImplementation(async () => {
        return new Response(JSON.stringify([{ result: customRemoteAlerts }]), { status: 200 });
      });

      const alerts = await loadAlerts();
      expect(alerts[0].id).toBe('remote_alert_42');
    });
  });

  describe('HTTP Handler Integration (handler)', () => {
    it('handles OPTIONS preflight with 200 and CORS headers', async () => {
      const req = createMockReq({ method: 'OPTIONS' });
      const res = createMockRes();

      await handler(req, res);

      expect(res.statusCode).toBe(200);
      expect(res.headers['access-control-allow-origin']).toBe('*');
      expect(res.headers['access-control-allow-methods']).toBe('GET,OPTIONS,POST');
    });

    it('handles GET /api/alerts returning alerts list and disclaimer', async () => {
      const req = createMockReq({ method: 'GET' });
      const res = createMockRes();

      await handler(req, res);

      expect(res.statusCode).toBe(200);
      expect(res.body.alerts).toBeDefined();
      expect(Array.isArray(res.body.alerts)).toBe(true);
      expect(res.body.total).toBe(res.body.alerts.length);
      expect(res.body.disclaimer).toContain('Prototype — not a government regulatory source');
    });

    it('handles POST /api/alerts successfully with valid payload', async () => {
      const req = createMockReq({
        method: 'POST',
        ip: '192.0.2.1',
        body: {
          district: 'Baramati',
          brandOrCrop: 'Cooperative Maize Silage',
          description: 'Visible white patches detected on pit edge',
          severity: 'medium',
          alertType: 'aflatoxin_surge',
        },
      });
      const res = createMockRes();

      await handler(req, res);

      expect(res.statusCode).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.alert).toBeDefined();
      expect(res.body.alert.district).toBe('Baramati');
      expect(res.body.alert.brandOrCrop).toBe('Cooperative Maize Silage');
      expect(res.body.alert.severity).toBe('medium');
    });

    it('returns 400 when required fields are missing on POST', async () => {
      // Missing district
      const reqNoDistrict = createMockReq({
        method: 'POST',
        body: { brandOrCrop: 'Feed', description: 'desc' },
      });
      const resNoDistrict = createMockRes();
      await handler(reqNoDistrict, resNoDistrict);
      expect(resNoDistrict.statusCode).toBe(400);
      expect(resNoDistrict.body.error).toContain('district');

      // Missing feedType/brandOrCrop
      const reqNoFeed = createMockReq({
        method: 'POST',
        body: { district: 'Pune', description: 'desc' },
      });
      const resNoFeed = createMockRes();
      await handler(reqNoFeed, resNoFeed);
      expect(resNoFeed.statusCode).toBe(400);
      expect(resNoFeed.body.error).toContain('brandOrCrop');

      // Missing description
      const reqNoDesc = createMockReq({
        method: 'POST',
        body: { district: 'Pune', brandOrCrop: 'Pellets' },
      });
      const resNoDesc = createMockRes();
      await handler(reqNoDesc, resNoDesc);
      expect(resNoDesc.statusCode).toBe(400);
      expect(resNoDesc.body.error).toContain('description');
    });

    it('returns 400 for malformed string JSON bodies', async () => {
      const req = createMockReq({
        method: 'POST',
        body: 'invalid-json{{{',
      });
      const res = createMockRes();

      await handler(req, res);

      expect(res.statusCode).toBe(400);
      expect(res.body.error).toContain('Malformed JSON');
    });

    it('returns 429 Too Many Requests when rate limit is exceeded on POST', async () => {
      const spammerIp = '198.51.100.99';

      // Exhaust 20 allowed requests
      for (let i = 0; i < RATE_LIMIT_MAX; i++) {
        const req = createMockReq({
          method: 'POST',
          ip: spammerIp,
          body: {
            district: 'Pune',
            feedType: 'Cottonseed Cake',
            description: `Batch report ${i}`,
          },
        });
        const res = createMockRes();
        await handler(req, res);
        expect(res.statusCode).toBe(201);
      }

      // 21st request must return 429
      const blockedReq = createMockReq({
        method: 'POST',
        ip: spammerIp,
        body: {
          district: 'Pune',
          feedType: 'Cottonseed Cake',
          description: 'Spam batch report',
        },
      });
      const blockedRes = createMockRes();
      await handler(blockedReq, blockedRes);

      expect(blockedRes.statusCode).toBe(429);
      expect(blockedRes.body.error).toContain('Rate limit exceeded');
    });

    it('returns 405 for unsupported HTTP methods (DELETE, PUT)', async () => {
      const req = createMockReq({ method: 'DELETE' });
      const res = createMockRes();

      await handler(req, res);

      expect(res.statusCode).toBe(405);
      expect(res.body.error).toContain('Method not allowed');
    });
  });
});
