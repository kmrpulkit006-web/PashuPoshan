/**
 * Vercel Serverless Function: Initial Visual & Mold Triage Engine
 * Endpoint: POST /api/analyze-visual
 *
 * SAFETY & COMPLIANCE RULES:
 * 1. This endpoint performs visual and mold triage ONLY.
 * 2. It under no circumstances predicts or returns numeric chemical lab values
 *    (such as pH, urea %, crude protein %, total digestible nutrients, or aflatoxin ppb).
 * 3. All outputs are strictly initial farm-gate screening assessments.
 */

import { Redis } from '@upstash/redis';

// Global process declaration for TypeScript build without node types package
declare const process: {
  env: {
    [key: string]: string | undefined;
    GEMINI_API_KEY?: string;
    GOOGLE_API_KEY?: string;
    NVIDIA_API_KEY?: string;
    NVIDIA_VISION_MODEL?: string;
    VISION_PROVIDER?: string;
    KV_REST_API_URL?: string;
    KV_REST_API_TOKEN?: string;
    UPSTASH_REDIS_REST_URL?: string;
    UPSTASH_REDIS_REST_TOKEN?: string;
  };
};

export interface VisualAnalysisResult {
  isFeedSample: boolean;
  feedTypeIdentified?: string;
  rejectionReason?: 'none' | 'not_feed_or_fodder' | 'blurry_unreadable' | 'poor_lighting';
  rejectionMessage?: string;
  moldCoverageEstimate: 'none' | 'trace' | 'moderate' | 'heavy';
  colorDescription: string;
  foreignMatterVisible: boolean;
  foreignMatterDescription: string;
  overallVisualCondition: 'good' | 'fair' | 'poor' | 'invalid';
  providerNotes?: string;
}

export interface VisionProvider {
  analyzeImage(base64Jpeg: string, category?: string): Promise<VisualAnalysisResult>;
}

/**
 * Google Gemini 1.5 Flash Vision Provider Implementation
 */
export class GeminiFlashVisionProvider implements VisionProvider {
  private apiKey: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  private async callGenerateContent(base64Jpeg: string, prompt: string): Promise<any> {
    const payload = {
      contents: [
        {
          role: 'user',
          parts: [
            { text: prompt },
            {
              inlineData: {
                mimeType: 'image/jpeg',
                data: base64Jpeg,
              },
            },
          ],
        },
      ],
      generationConfig: {
        responseMimeType: 'application/json',
        temperature: 0.1,
      },
    };

    // 1. Confirmed operational models (15s timeout per request)
    const candidateEndpoints = [
      'v1beta/models/gemini-2.0-flash',
      'v1/models/gemini-1.5-flash',
    ];

    let lastError = '';

    for (const candidate of candidateEndpoints) {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000);

      try {
        const url = `https://generativelanguage.googleapis.com/${candidate}:generateContent?key=${this.apiKey}`;
        const response = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
          signal: controller.signal,
        });

        if (response.ok) {
          return await response.json();
        }

        const errorText = await response.text();
        let parsedError = errorText;
        try {
          const errorJson = JSON.parse(errorText);
          parsedError = errorJson.error?.message || errorText;
        } catch {}

        lastError = `${candidate} (${response.status}): ${parsedError}`;

        // If it's a client syntax error (400) or auth forbidden (403), throw immediately
        if (response.status === 400 || response.status === 403) {
          throw new Error(`Gemini Vision API error (${response.status}): ${parsedError}`);
        }
      } catch (err: any) {
        if (err.name === 'AbortError') {
          throw new Error(`Gemini Vision API request to ${candidate} timed out after 15 seconds.`);
        }
        if (err.message && !err.message.includes('404')) {
          throw err;
        }
      } finally {
        clearTimeout(timeoutId);
      }
    }

    // 2. Dynamic discovery fallback: query ListModels on account
    for (const ver of ['v1beta', 'v1']) {
      try {
        const listUrl = `https://generativelanguage.googleapis.com/${ver}/models?key=${this.apiKey}`;
        const listRes = await fetch(listUrl);
        if (listRes.ok) {
          const listData = await listRes.json();
          const availableModels = (listData.models || [])
            .filter((m: any) => m.supportedGenerationMethods?.includes('generateContent'))
            .map((m: any) => m.name.replace(/^models\//, ''));

          for (const model of availableModels) {
            const url = `https://generativelanguage.googleapis.com/${ver}/models/${model}:generateContent?key=${this.apiKey}`;
            const response = await fetch(url, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(payload),
            });

            if (response.ok) {
              return await response.json();
            }
          }
        }
      } catch {}
    }

    throw new Error(`All Gemini vision models failed. Last error: ${lastError}`);
  }

  async analyzeImage(base64Jpeg: string, category: string = 'feed'): Promise<VisualAnalysisResult> {
    const prompt = `You are an expert veterinary agricultural inspector assistant performing on-farm visual triage of cattle feed/fodder (${category}) from smartphone camera photos.

MANDATORY INSPECTION PROTOCOL:
STEP 1: SUBJECT MATTER VERIFICATION (CRITICAL SAFETY FILTER):
Inspect whether the photograph actually shows livestock feed, fodder, silage, straw/bhusa, grains, or feed pellets.
- If the photo is a document, certificate, text, paperwork, human being, face, clothing, indoor room, machine, electronics, pet, screen screenshot, or completely blurred/black/unintelligible:
  * "isFeedSample": false
  * "feedTypeIdentified": "non_feed_or_unrelated"
  * "rejectionReason": "not_feed_or_fodder" (or "blurry_unreadable" if blurred)
  * "rejectionMessage": "The uploaded photo appears to be a document or certificate, not cattle feed, silage, or fodder. Please capture a clear, close-up photo of livestock feed. / अपलोड की गई तस्वीर पशु चारा या साइलेज नहीं है। कृपया स्पष्ट चारे की तस्वीर अपलोड करें।"
  * "moldCoverageEstimate": "none"
  * "colorDescription": "Non-feed subject (document, object, or unrelated scene)."
  * "foreignMatterVisible": false
  * "foreignMatterDescription": ""
  * "overallVisualCondition": "invalid"

- ONLY if the photo genuinely depicts livestock feed, silage, green fodder, dry straw/bhusa, or feed pellets:
  * "isFeedSample": true
  * "feedTypeIdentified": e.g. "silage", "green_fodder", "dry_fodder", "concentrate_pellets"
  * "rejectionReason": "none"
  * "rejectionMessage": ""
  * "moldCoverageEstimate": "none" | "trace" | "moderate" | "heavy"
  * "colorDescription": factual concise visual description (e.g. "uniform golden-amber with normal leaf texture")
  * "foreignMatterVisible": boolean (stones, plastic, wires, dirt clumps)
  * "foreignMatterDescription": description or ""
  * "overallVisualCondition": "good" | "fair" | "poor"

CRITICAL SAFETY:
- DO NOT guess or fabricate chemical lab numbers (such as pH, urea %, protein %, or aflatoxin).
- Under NO circumstances mark a document, certificate, or non-feed image as a valid feed sample!

Return ONLY a JSON object strictly matching this schema:
{
  "isFeedSample": boolean,
  "feedTypeIdentified": string,
  "rejectionReason": "none" | "not_feed_or_fodder" | "blurry_unreadable" | "poor_lighting",
  "rejectionMessage": string,
  "moldCoverageEstimate": "none" | "trace" | "moderate" | "heavy",
  "colorDescription": string,
  "foreignMatterVisible": boolean,
  "foreignMatterDescription": string,
  "overallVisualCondition": "good" | "fair" | "poor" | "invalid"
}`;

    const data = await this.callGenerateContent(base64Jpeg, prompt);
    const rawContent = data.candidates?.[0]?.content?.parts?.[0]?.text;
    return sanitizeVisualAnalysisResponse(rawContent, category);
  }
}

/**
 * NVIDIA NIM Vision-Language Model Provider Implementation
 * Compatible with OpenAI vision format via integrate.api.nvidia.com
 */
export class NvidiaVisionProvider implements VisionProvider {
  private apiKey: string;
  private model: string;

  constructor(apiKey: string, model: string = 'meta/llama-3.2-11b-vision-instruct') {
    this.apiKey = apiKey;
    this.model = model;
  }

  async analyzeImage(base64Jpeg: string, category: string = 'feed'): Promise<VisualAnalysisResult> {
    const prompt = `You are a dairy cattle feed quality and silage evaluation vision system for Indian dairy farming (ICAR-NDRI standards).
Analyze this uploaded feed sample image.

Target category indicated by farmer: "${category}".

Return ONLY valid raw JSON with no markdown formatting, matching this exact schema:
{
  "isFeedSample": true,
  "feedTypeIdentified": "silage" | "green_fodder" | "dry_fodder" | "concentrate_pellets" | "non_feed",
  "rejectionReason": "none" | "not_feed_or_fodder" | "blurry_unreadable" | "poor_lighting",
  "rejectionMessage": "",
  "moldCoverageEstimate": "none" | "trace" | "moderate" | "heavy",
  "colorDescription": "Brief description of sample color",
  "foreignMatterVisible": false,
  "foreignMatterDescription": "",
  "overallVisualCondition": "good" | "fair" | "poor" | "invalid"
}`;

    const imageUrl = base64Jpeg.startsWith('data:')
      ? base64Jpeg
      : `data:image/jpeg;base64,${base64Jpeg}`;

    const response = await fetch('https://integrate.api.nvidia.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        model: this.model,
        messages: [
          {
            role: 'user',
            content: [
              { type: 'text', text: prompt },
              { type: 'image_url', image_url: { url: imageUrl } },
            ],
          },
        ],
        temperature: 0.2,
        max_tokens: 500,
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`NVIDIA Vision API error (${response.status}): ${errText}`);
    }

    const data = await response.json();
    const rawContent = data.choices?.[0]?.message?.content || '';
    const res = sanitizeVisualAnalysisResponse(rawContent, category);
    res.providerNotes = `Analyzed via NVIDIA NIM Vision Pipeline (${this.model})`;
    return res;
  }
}

/**
 * Sanitizes and validates the raw Gemini vision response against the schema.
 * Safely falls back to defaults for missing fields, out-of-range values, or malformed/empty strings.
 */
export function sanitizeVisualAnalysisResponse(
  rawContent: string | null | undefined,
  category: string = 'feed'
): VisualAnalysisResult {
  if (!rawContent || typeof rawContent !== 'string' || !rawContent.trim()) {
    return {
      isFeedSample: false,
      feedTypeIdentified: 'unknown',
      rejectionReason: 'blurry_unreadable',
      rejectionMessage: 'Empty or invalid response from visual analysis model.',
      moldCoverageEstimate: 'none',
      colorDescription: 'Unanalyzable response.',
      foreignMatterVisible: false,
      foreignMatterDescription: '',
      overallVisualCondition: 'invalid',
      providerNotes: 'Fallback due to empty or missing vision response.',
    };
  }

  let parsed: any;
  try {
    const cleanJson = rawContent.replace(/```(?:json)?/gi, '').replace(/```/g, '').trim();
    parsed = JSON.parse(cleanJson);
  } catch {
    return {
      isFeedSample: false,
      feedTypeIdentified: 'unknown',
      rejectionReason: 'blurry_unreadable',
      rejectionMessage: 'The vision model returned an unparseable response format.',
      moldCoverageEstimate: 'none',
      colorDescription: 'Unparseable response.',
      foreignMatterVisible: false,
      foreignMatterDescription: '',
      overallVisualCondition: 'invalid',
      providerNotes: 'Fallback due to malformed JSON response.',
    };
  }

  if (!parsed || typeof parsed !== 'object') {
    return {
      isFeedSample: false,
      feedTypeIdentified: 'unknown',
      rejectionReason: 'blurry_unreadable',
      rejectionMessage: 'Malformed response object from visual analysis.',
      moldCoverageEstimate: 'none',
      colorDescription: 'Unanalyzable response.',
      foreignMatterVisible: false,
      foreignMatterDescription: '',
      overallVisualCondition: 'invalid',
      providerNotes: 'Fallback due to non-object parsed response.',
    };
  }

  const validMolds = ['none', 'trace', 'moderate', 'heavy'] as const;
  const validConditions = ['good', 'fair', 'poor', 'invalid'] as const;
  const validReasons = ['none', 'not_feed_or_fodder', 'blurry_unreadable', 'poor_lighting'] as const;

  const isFeedSample = Boolean(parsed.isFeedSample);
  const rejectionReason = validReasons.includes(parsed.rejectionReason)
    ? parsed.rejectionReason
    : isFeedSample ? 'none' : 'not_feed_or_fodder';

  const overallVisualCondition = validConditions.includes(parsed.overallVisualCondition)
    ? parsed.overallVisualCondition
    : isFeedSample ? 'good' : 'invalid';

  const moldCoverageEstimate = validMolds.includes(parsed.moldCoverageEstimate)
    ? parsed.moldCoverageEstimate
    : 'none'; // Clamps or falls back on unexpected value (e.g. "massive")

  return {
    isFeedSample,
    feedTypeIdentified: typeof parsed.feedTypeIdentified === 'string' && parsed.feedTypeIdentified
      ? parsed.feedTypeIdentified
      : (isFeedSample ? category : 'non_feed'),
    rejectionReason,
    rejectionMessage: typeof parsed.rejectionMessage === 'string' && parsed.rejectionMessage
      ? parsed.rejectionMessage
      : (isFeedSample ? '' : 'The uploaded photo does not appear to be cattle feed, silage, or fodder. Please capture a clear photo of livestock feed.'),
    moldCoverageEstimate,
    colorDescription: typeof parsed.colorDescription === 'string' && parsed.colorDescription
      ? parsed.colorDescription
      : (isFeedSample ? 'Standard feed coloration.' : 'Non-feed subject.'),
    foreignMatterVisible: Boolean(parsed.foreignMatterVisible),
    foreignMatterDescription: typeof parsed.foreignMatterDescription === 'string'
      ? parsed.foreignMatterDescription
      : '',
    overallVisualCondition,
    providerNotes: 'Analyzed via Google Gemini Vision Triage Pipeline',
  };
}

/**
 * Provider factory enabling future swappability (e.g. Anthropic Claude, OpenAI GPT-4V)
 */
export function getVisionProvider(apiKey?: string, providerName?: string): VisionProvider {
  const chosenProvider = (providerName || process.env.VISION_PROVIDER || '').toLowerCase();

  if (chosenProvider === 'nvidia' || (!process.env.GEMINI_API_KEY && !process.env.GOOGLE_API_KEY && (apiKey || process.env.NVIDIA_API_KEY))) {
    const key = apiKey || process.env.NVIDIA_API_KEY;
    if (!key) {
      throw new Error('NVIDIA_API_KEY is not configured in the server environment.');
    }
    const model = process.env.NVIDIA_VISION_MODEL || 'meta/llama-3.2-11b-vision-instruct';
    return new NvidiaVisionProvider(key, model);
  }

  const resolvedKey = apiKey || process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
  if (!resolvedKey) {
    throw new Error('GEMINI_API_KEY (or NVIDIA_API_KEY) is not configured in the server environment.');
  }
  return new GeminiFlashVisionProvider(resolvedKey);
}

const RATE_LIMIT_MAX = 20;
const RATE_LIMIT_WINDOW_SECONDS = 3600; // 1 hour
const inMemoryRateLimit = new Map<string, { count: number; resetTime: number }>();

function getClientIp(req: any): string {
  const xForwardedFor = req.headers?.['x-forwarded-for'] || req.headers?.['x-real-ip'];
  if (typeof xForwardedFor === 'string') {
    return xForwardedFor.split(',')[0].trim();
  }
  return req.socket?.remoteAddress || '127.0.0.1';
}

function getRedisClient(): Redis | null {
  const url = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;
  if (url && token) {
    try {
      return new Redis({ url, token, retry: { retries: 0 } });
    } catch (e) {
      console.warn('Redis rate limiter initialization failed, using in-memory map:', e);
    }
  }
  return null;
}

export async function checkRateLimit(ip: string): Promise<boolean> {
  const redis = getRedisClient();
  if (redis) {
    try {
      const key = `rate_limit:${ip}`;
      const count = await redis.incr(key);
      if (count === 1) {
        await redis.expire(key, RATE_LIMIT_WINDOW_SECONDS);
      }
      return count <= RATE_LIMIT_MAX;
    } catch (err) {
      console.warn('Redis rate limit check error, falling back to in-memory:', err);
    }
  }

  const now = Date.now();
  const entry = inMemoryRateLimit.get(ip);
  if (!entry || now > entry.resetTime) {
    inMemoryRateLimit.set(ip, { count: 1, resetTime: now + RATE_LIMIT_WINDOW_SECONDS * 1000 });
    return true;
  }

  entry.count += 1;
  return entry.count <= RATE_LIMIT_MAX;
}

/**
 * Main Vercel serverless request handler
 */
export default async function handler(req: any, res: any) {
  // CORS & Security Headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({
      error: 'Method Not Allowed. Use POST with imageBase64 payload.',
      code: 'METHOD_NOT_ALLOWED',
    });
  }

  // Rate Limiting (20 requests per hour per IP)
  const clientIp = getClientIp(req);
  const isAllowed = await checkRateLimit(clientIp);
  if (!isAllowed) {
    return res.status(429).json({
      error: 'Rate limit exceeded. Please try again later.',
    });
  }

  try {
    let body = req.body;
    if (typeof body === 'string') {
      try {
        body = JSON.parse(body);
      } catch (err) {
        return res.status(400).json({
          error: 'Malformed JSON in request body.',
          code: 'MALFORMED_JSON',
        });
      }
    }

    const { imageBase64, category } = body || {};

    if (!imageBase64 || typeof imageBase64 !== 'string') {
      return res.status(400).json({
        error: 'Missing or invalid "imageBase64" in request body.',
        code: 'MISSING_IMAGE',
      });
    }

    // Strip data URI scheme prefix if supplied (e.g. "data:image/jpeg;base64,...")
    const cleanBase64 = imageBase64.replace(/^data:image\/[a-zA-Z0-9+.-]+;base64,/, '').trim();

    if (cleanBase64.length < 50) {
      return res.status(400).json({
        error: 'Image payload is too small or truncated.',
        code: 'TRUNCATED_IMAGE',
      });
    }

    // Check API Key for Gemini or NVIDIA
    const hasGeminiKey = Boolean(process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY);
    const hasNvidiaKey = Boolean(process.env.NVIDIA_API_KEY);
    const isNvidiaPreferred = process.env.VISION_PROVIDER?.toLowerCase() === 'nvidia';

    if (!hasGeminiKey && !hasNvidiaKey) {
      return res.status(503).json({
        error: 'Vision AI service is unconfigured on the server (neither GEMINI_API_KEY nor NVIDIA_API_KEY is present). Fallback to offline queuing is advised.',
        code: 'API_KEY_UNCONFIGURED',
      });
    }

    const provider = getVisionProvider(
      isNvidiaPreferred || (!hasGeminiKey && hasNvidiaKey) ? process.env.NVIDIA_API_KEY : undefined,
      isNvidiaPreferred ? 'nvidia' : undefined
    );
    const result = await provider.analyzeImage(cleanBase64, category);

    return res.status(200).json(result);
  } catch (error: any) {
    console.error('API /api/analyze-visual failure:', error);
    return res.status(500).json({
      error: error.message || 'Internal server error during visual analysis.',
      code: 'ANALYSIS_FAILED',
    });
  }
}
