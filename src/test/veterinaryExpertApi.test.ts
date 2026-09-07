import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import handler, {
  buildPromptForRequest,
  generateOfflineVeterinaryFallback,
  checkRateLimit,
  resetRateLimits,
  getClientIp,
  RATE_LIMIT_MAX,
  DEFAULT_NVIDIA_MODEL,
  VeterinaryExpertRequest,
} from '../../api/veterinary-expert';

function createMockReq(options: {
  method?: string;
  body?: any;
  headers?: Record<string, string>;
  ip?: string;
} = {}) {
  return {
    method: options.method || 'POST',
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

describe('AI Veterinary & Nutrition Expert API (api/veterinary-expert.ts)', () => {
  const originalEnv = { ...process.env };
  const originalFetch = globalThis.fetch;

  beforeEach(() => {
    vi.clearAllMocks();
    resetRateLimits();
    delete process.env.NVIDIA_API_KEY;
    delete process.env.NVIDIA_MODEL_ID;
    delete process.env.KV_REST_API_URL;
    delete process.env.KV_REST_API_TOKEN;
  });

  afterEach(() => {
    process.env = { ...originalEnv };
    globalThis.fetch = originalFetch;
  });

  describe('Prompt Builder & Fallback Generation', () => {
    it('builds clinical pathology prompt for scorecard review mode', () => {
      const payload: VeterinaryExpertRequest = {
        mode: 'scorecard_clinical_review',
        scorecardData: {
          feedName: 'Maize Silage Bales',
          category: 'silage',
          overallGrade: 'Tier B: Sub-Standard',
          silagePh: 4.8,
          fliegScore: 68,
          moldCoverageEstimate: 'trace',
          estimatedCP: 8.5,
          ureaSpiked: false,
          nonComplianceReasons: ['High moisture content'],
        },
      };

      const messages = buildPromptForRequest(payload);
      expect(messages.length).toBe(2);
      expect(messages[0].role).toBe('system');
      expect(messages[0].content).toContain('PashuPoshan AI');
      expect(messages[1].role).toBe('user');
      expect(messages[1].content).toContain('Maize Silage Bales');
      expect(messages[1].content).toContain('Flieg Fermentation Score: 68/100');
      expect(messages[1].content).toContain('Silage pH: 4.8');
    });

    it('builds TMR optimization prompt for ration balancing mode', () => {
      const payload: VeterinaryExpertRequest = {
        mode: 'ration_optimization',
        rationData: {
          breedName: 'Gir Cow',
          bodyWeightKg: 420,
          dailyMilkLiters: 12,
          fatPercentage: 4.5,
          lactationStage: 'Mid Lactation',
          dryMatterTargetKg: 12.5,
          crudeProteinTargetG: 1400,
          greenFodderKg: 18,
          dryBhusaKg: 4.5,
          concentrateKg: 4.0,
          mineralMixtureG: 50,
        },
      };

      const messages = buildPromptForRequest(payload);
      expect(messages.length).toBe(2);
      expect(messages[1].content).toContain('Gir Cow');
      expect(messages[1].content).toContain('12 Liters/day');
      expect(messages[1].content).toContain('Green Fodder: 18 kg');
    });

    it('generates rich offline deterministic ICAR advisory for critical and safe samples', () => {
      const criticalFallback = generateOfflineVeterinaryFallback({
        mode: 'scorecard_clinical_review',
        scorecardData: {
          feedName: 'Spiked Pellets',
          category: 'concentrate',
          overallGrade: 'Tier C: Hazardous/Reject',
          ureaSpiked: true,
        },
      });
      expect(criticalFallback).toContain('High Risk');
      expect(criticalFallback).toContain('1962');

      const safeFallback = generateOfflineVeterinaryFallback({
        mode: 'scorecard_clinical_review',
        scorecardData: {
          feedName: 'Certified Maize Silage',
          category: 'silage',
          overallGrade: 'Tier A: Premium',
          ureaSpiked: false,
        },
      });
      expect(safeFallback).toContain('Acceptable Profile');
    });

    it('extracts scorecard data and builds prompt from sample object directly', () => {
      const payload: any = {
        mode: 'scorecard_clinical_review',
        sample: {
          name: 'Fermented Napier Silage',
          category: 'silage',
          overallGrade: 'Tier C: Hazardous/Reject',
          metrics: { crudeProtein: 7.2 },
          silageMetrics: { pH: 5.4, fliegScore: 42 },
          adulteration: { ureaAdulterationDetected: true },
          visualAnalysis: { moldCoverageEstimate: 'moderate' },
        },
      };

      const messages = buildPromptForRequest(payload);
      expect(messages.length).toBe(2);
      expect(messages[1].content).toContain('Fermented Napier Silage');
      expect(messages[1].content).toContain('Silage pH: 5.4');
      expect(messages[1].content).toContain('YES (CRITICAL HAZARD)');
    });

    it('extracts ration data from rationPlan and cowProfile directly', () => {
      const payload: any = {
        mode: 'ration_optimization',
        rationPlan: {
          targetDryMatterKg: 13.0,
          targetCrudeProteinG: 1500,
          greenFodderKg: 20,
          dryFodderKg: 5,
          concentrateKg: 4.5,
          mineralMixtureG: 60,
        },
        cowProfile: {
          breed: 'Sahiwal',
          weight: 480,
          dailyYield: 14,
        },
      };

      const messages = buildPromptForRequest(payload);
      expect(messages.length).toBe(2);
      expect(messages[1].content).toContain('Sahiwal');
      expect(messages[1].content).toContain('14 Liters/day');
      expect(messages[1].content).toContain('Green Fodder: 20 kg');
    });
  });

  describe('Rate Limiting (checkRateLimit)', () => {
    it('allows up to RATE_LIMIT_MAX (20) calls per IP before rejecting', async () => {
      const ip = '192.0.2.77';
      for (let i = 0; i < RATE_LIMIT_MAX; i++) {
        expect(await checkRateLimit(ip)).toBe(true);
      }
      expect(await checkRateLimit(ip)).toBe(false);
    });

    it('resets rate limits on command', async () => {
      const ip = '192.0.2.88';
      for (let i = 0; i < RATE_LIMIT_MAX; i++) {
        await checkRateLimit(ip);
      }
      expect(await checkRateLimit(ip)).toBe(false);
      resetRateLimits();
      expect(await checkRateLimit(ip)).toBe(true);
    });

    it('correctly extracts IP from request', () => {
      expect(getClientIp({ headers: { 'x-forwarded-for': '1.2.3.4, 5.6.7.8' } })).toBe('1.2.3.4');
      expect(getClientIp({ socket: { remoteAddress: '9.9.9.9' } })).toBe('9.9.9.9');
    });
  });

  describe('Handler Execution & Fallbacks', () => {
    it('handles OPTIONS preflight with 200 and CORS headers', async () => {
      const req = createMockReq({ method: 'OPTIONS' });
      const res = createMockRes();
      await handler(req, res);
      expect(res.statusCode).toBe(200);
      expect(res.headers['access-control-allow-origin']).toBe('*');
    });

    it('returns 405 for non-POST methods', async () => {
      const req = createMockReq({ method: 'GET' });
      const res = createMockRes();
      await handler(req, res);
      expect(res.statusCode).toBe(405);
    });

    it('returns deterministic ICAR fallback when NVIDIA_API_KEY is not set', async () => {
      const req = createMockReq({
        method: 'POST',
        body: {
          mode: 'chat',
          query: 'How to feed silage to HF cow in hot weather?',
        },
      });
      const res = createMockRes();

      await handler(req, res);

      expect(res.statusCode).toBe(200);
      expect(res.body.isFallback).toBe(true);
      expect(res.body.model).toBe('icar-ndri-offline-fallback');
      expect(res.body.advice).toContain('PashuPoshan AI');
    });

    it('invokes NVIDIA NIM API when NVIDIA_API_KEY is configured and returns completion', async () => {
      process.env.NVIDIA_API_KEY = 'test-nvapi-key';

      const mockCompletion = {
        choices: [
          {
            message: {
              content: 'Based on ICAR-NDRI standards, for a Gir cow giving 12L milk, maintain a minimum 32% NDF from roughage to stabilize rumen fermentation.',
            },
          },
        ],
        usage: { prompt_tokens: 120, completion_tokens: 45, total_tokens: 165 },
      };

      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => mockCompletion,
      });

      const req = createMockReq({
        method: 'POST',
        body: {
          mode: 'chat',
          query: 'Ration advice for Gir cow',
        },
      });
      const res = createMockRes();

      await handler(req, res);

      expect(res.statusCode).toBe(200);
      expect(res.body.isFallback).toBe(false);
      expect(res.body.model).toBe(DEFAULT_NVIDIA_MODEL);
      expect(res.body.advice).toContain('Based on ICAR-NDRI standards');
      expect(globalThis.fetch).toHaveBeenCalled();
    });

    it('gracefully falls back to ICAR advisory if NVIDIA API returns non-200 or network error', async () => {
      process.env.NVIDIA_API_KEY = 'test-nvapi-key';

      // Mock network connection failure
      globalThis.fetch = vi.fn().mockRejectedValue(new Error('Connection timed out'));

      const req = createMockReq({
        method: 'POST',
        body: {
          mode: 'scorecard_clinical_review',
          scorecardData: {
            feedName: 'Maize Silage',
            category: 'silage',
            overallGrade: 'Tier B',
          },
        },
      });
      const res = createMockRes();

      await handler(req, res);

      expect(res.statusCode).toBe(200);
      expect(res.body.isFallback).toBe(true);
      expect(res.body.advice).toContain('Clinical Veterinary Review');
    });

    it('enforces 429 when IP rate limit is exceeded', async () => {
      const spammerIp = '10.99.88.77';

      for (let i = 0; i < RATE_LIMIT_MAX; i++) {
        const req = createMockReq({
          method: 'POST',
          ip: spammerIp,
          body: { mode: 'chat', query: 'Ping' },
        });
        const res = createMockRes();
        await handler(req, res);
        expect(res.statusCode).toBe(200);
      }

      // 21st call
      const blockedReq = createMockReq({
        method: 'POST',
        ip: spammerIp,
        body: { mode: 'chat', query: 'Spam' },
      });
      const blockedRes = createMockRes();
      await handler(blockedReq, blockedRes);

      expect(blockedRes.statusCode).toBe(429);
      expect(blockedRes.body.error).toContain('Rate limit exceeded');
    });
  });
});
