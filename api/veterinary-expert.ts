/**
 * Vercel Serverless Function: AI Veterinary & Cattle Nutrition Consultant
 * Powered by NVIDIA Nemotron-3-Ultra-550B (NVIDIA NIM OpenAI-compatible API)
 * Endpoint: /api/veterinary-expert (POST)
 */

import { Redis } from '@upstash/redis';

// Process environment declarations for TypeScript
declare const process: {
  env: {
    [key: string]: string | undefined;
    NVIDIA_API_KEY?: string;
    NVIDIA_MODEL_ID?: string;
    KV_REST_API_URL?: string;
    KV_REST_API_TOKEN?: string;
    UPSTASH_REDIS_REST_URL?: string;
    UPSTASH_REDIS_REST_TOKEN?: string;
  };
};

export const DEFAULT_NVIDIA_MODEL = 'nvidia/nemotron-3-ultra-550b-a55b';
const NVIDIA_API_URL = 'https://integrate.api.nvidia.com/v1/chat/completions';

export const RATE_LIMIT_MAX = 20; // 20 requests per hour per IP
export const RATE_LIMIT_WINDOW_SECONDS = 3600;
export const inMemoryRateLimit = new Map<string, { count: number; resetTime: number }>();

export function getClientIp(req: any): string {
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
      console.warn('Failed to initialize Redis client for veterinary-expert, using in-memory fallback:', e);
    }
  }
  return null;
}

export async function checkRateLimit(ip: string): Promise<boolean> {
  const redis = getRedisClient();
  if (redis) {
    try {
      const key = `rate_limit:vet_expert:${ip}`;
      const count = await redis.incr(key);
      if (count === 1) {
        await redis.expire(key, RATE_LIMIT_WINDOW_SECONDS);
      }
      return count <= RATE_LIMIT_MAX;
    } catch (err) {
      console.warn('Redis rate limit check error in vet-expert, falling back to in-memory:', err);
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

export function resetRateLimits(): void {
  inMemoryRateLimit.clear();
}

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface VeterinaryExpertRequest {
  mode: 'chat' | 'scorecard_clinical_review' | 'ration_optimization';
  query?: string;
  messages?: ChatMessage[];
  scorecardData?: {
    feedName: string;
    category: string;
    overallGrade: string;
    fliegScore?: number;
    silagePh?: number;
    moldCoverageEstimate?: string;
    estimatedCP?: number;
    ureaSpiked?: boolean;
    nonComplianceReasons?: string[];
  };
  rationData?: {
    breedName: string;
    bodyWeightKg: number;
    dailyMilkLiters: number;
    fatPercentage: number;
    lactationStage: string;
    dryMatterTargetKg: number;
    crudeProteinTargetG: number;
    greenFodderKg: number;
    dryBhusaKg: number;
    concentrateKg: number;
    mineralMixtureG: number;
  };
}

const SYSTEM_PROMPT_VET = `You are the chief AI Veterinary Scientist and Dairy Cattle Nutritionist for PashuPoshan AI (पशु-पोषण AI), an initiative supporting Indian dairy farmers and cooperatives (ICAR, NDRI Karnal, NDDB).
Your expertise spans:
1. Ruminant digestive physiology (subacute ruminal acidosis - SARA, rumen bloat, urea toxicity, aflatoxicosis).
2. Bureau of Indian Standards (BIS IS:2052:2009 for Cattle Feed) and FSSAI Aflatoxin M1 regulations.
3. Total Mixed Ration (TMR) balancing for indigenous and crossbred breeds (Gir, Sahiwal, Red Sindhi, HF Cross, Murrah Buffalo, Mehsana).
4. Silage fermentation quality (Flieg score, lactic vs butyric acid fermentation, aerobic stability).

Guidelines:
- Provide authoritative, practical, and compassionate guidance tailored for Indian smallholder farmers.
- Use clear bullet points and actionable steps.
- Always highlight emergency first-aid (e.g. for suspected urea toxicity or severe acidosis) and recommend immediate consultation with local veterinary dispensary or National Helpline 1962 when high-risk conditions are detected.
- Maintain an encouraging and respectful tone. Include terms in Hindi/English where helpful (e.g., bhusa, khal, chana churi, achar/silage).`;

export function buildPromptForRequest(payload: VeterinaryExpertRequest): ChatMessage[] {
  const messages: ChatMessage[] = [{ role: 'system', content: SYSTEM_PROMPT_VET }];

  if (payload.mode === 'scorecard_clinical_review' && payload.scorecardData) {
    const s = payload.scorecardData;
    const reviewPrompt = `Perform a deep clinical veterinary pathology review on the following tested cattle feed sample:
- Feed Type: ${s.feedName} (${s.category})
- Tested Overall Grade: ${s.overallGrade}
- Silage pH: ${s.silagePh ?? 'N/A'}
- Flieg Fermentation Score: ${s.fliegScore ?? 'N/A'}/100
- Fungal Mold Coverage: ${s.moldCoverageEstimate ?? 'None detected'}
- Estimated Crude Protein: ${s.estimatedCP ? `${s.estimatedCP}%` : 'N/A'}
- Urea Adulteration Detected: ${s.ureaSpiked ? 'YES (CRITICAL HAZARD)' : 'No'}
- Non-Compliance Flags: ${s.nonComplianceReasons?.join('; ') || 'None'}

Please provide:
1. **Clinical Risk Assessment**: Digestive and metabolic impact on rumen pH, liver function, and lactation.
2. **Milk Safety & Aflatoxin M1 Risk**: Potential risk of toxin transfer into the human milk supply.
3. **Actionable Farm Management Directives**: Immediate physical steps (isolation, dilution, aeration, or discard) and compensatory dietary adjustments.
4. **Veterinary Intervention Level**: Normal monitoring, prompt dietary adjustment, or urgent veterinary attention (1962).`;
    messages.push({ role: 'user', content: reviewPrompt });
    return messages;
  }

  if (payload.mode === 'ration_optimization' && payload.rationData) {
    const r = payload.rationData;
    const rationPrompt = `Evaluate and optimize the following Total Mixed Ration (TMR) formulated under ICAR-NDRI standards:
- Animal: ${r.breedName} (Body Weight: ${r.bodyWeightKg} kg, Lactation: ${r.lactationStage})
- Production: ${r.dailyMilkLiters} Liters/day (Milk Fat: ${r.fatPercentage}%)
- Current Daily Ration:
  * Green Fodder: ${r.greenFodderKg} kg
  * Dry Bhusa / Straw: ${r.dryBhusaKg} kg
  * Compound Concentrate: ${r.concentrateKg} kg
  * Mineral Mixture: ${r.mineralMixtureG} g
- Nutritional Targets: Dry Matter ~${r.dryMatterTargetKg} kg/day, Crude Protein ~${r.crudeProteinTargetG} g/day

Please provide:
1. **Nutritional Balance Evaluation**: Adequacy of effective fiber (NDF), bypass protein, and energy density for this milk yield.
2. **Cost-Optimization Recommendations**: Economical local substitutes (e.g. mustard cake/sarson khal, cotton seed cake, maize grain) to lower feeding cost without compromising yield.
3. **Metabolic Health & Rumination Directives**: Tips to prevent acidosis and sustain peak lactation.`;
    messages.push({ role: 'user', content: rationPrompt });
    return messages;
  }

  // General Chat Mode
  if (payload.messages && payload.messages.length > 0) {
    return [messages[0], ...payload.messages];
  }

  messages.push({
    role: 'user',
    content: payload.query || 'Please provide general veterinary best practices for cattle feed safety and silage management in India.',
  });
  return messages;
}

export function generateOfflineVeterinaryFallback(payload: VeterinaryExpertRequest): string {
  if (payload.mode === 'scorecard_clinical_review') {
    const s = payload.scorecardData;
    const isCritical = s?.ureaSpiked || s?.overallGrade.includes('Tier C');
    return `### Clinical Veterinary Review (ICAR-NDRI Guidelines Offline Summary)
**Sample**: ${s?.feedName || 'Feed Sample'} | **Grade**: ${s?.overallGrade || 'Under Review'}

1. **Rumen & Metabolic Assessment**:
   ${isCritical ? '⚠️ **High Risk**: Elevated non-protein nitrogen or mold detected. Risk of acute ammonia toxicity or rumen dysbiosis. Stop feeding this batch immediately.' : '✅ **Acceptable Profile**: Feed characteristics align with maintenance requirements. Maintain fresh drinking water access.'}

2. **Actionable Farm Directives**:
   - Store in a well-ventilated, elevated area away from moisture.
   - For silage, feed within 2 hours of bunker pit opening to prevent secondary aerobic fermentation.
   - Keep sodium bicarbonate (sweet soda, 50-80g/cow/day) handy if mild acidosis symptoms appear.

3. **Helpline Notice**:
   - In case of acute bloat, shivering, or rapid breathing, contact your nearest Veterinary Dispensary or call the National Animal Disease Helpline at **1962** immediately.`;
  }

  if (payload.mode === 'ration_optimization') {
    const r = payload.rationData;
    return `### ICAR-NDRI Precision Ration Advisory (Offline Standard Guidelines)
**Target**: ${r?.breedName || 'Dairy Cow'} (${r?.dailyMilkLiters || 10} L/day)

1. **Dry Matter Partitioning**:
   - Maintain a 2:1 ratio between roughage and concentrate on a dry matter basis.
   - Ensure green fodder (${r?.greenFodderKg || 15} kg) is chopped to 2-3 cm length to optimize rumen cud-chewing.

2. **Mineral Supplementation**:
   - Provide chelated mineral mixture (${r?.mineralMixtureG || 50}g daily) along with 30g common salt to maintain electrolyte balance and prevent silent estrus.

3. **Cost-Effective Adjustments**:
   - Mix legume fodder (berseem, lucerne, cowpea) with cereal fodder (maize, sorghum) to reduce concentrate dependency by 15-20%.`;
  }

  return `### PashuPoshan AI Veterinary Guidance (Standard Guidelines)
Thank you for your query regarding cattle nutrition and feed health.
- Ensure all compound feed complies with BIS IS:2052 standards (minimum 20% crude protein for high-yield dairy).
- Inspect silage pits regularly for foul butyric odors (rancid butter smell) or dark discoloration.
- For emergency veterinary assistance in your district, dial 1962.`;
}

export default async function handler(req: any, res: any) {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed. Use POST.' });
  }

  // Rate Limiting (20 requests/hour per IP)
  const clientIp = getClientIp(req);
  const isAllowed = await checkRateLimit(clientIp);
  if (!isAllowed) {
    return res.status(429).json({
      error: 'Rate limit exceeded. Please try again later.',
    });
  }

  try {
    let body: VeterinaryExpertRequest = req.body;
    if (typeof body === 'string') {
      try {
        body = JSON.parse(body);
      } catch {
        return res.status(400).json({ error: 'Malformed JSON payload.' });
      }
    }

    if (!body || typeof body !== 'object') {
      return res.status(400).json({ error: 'Request body must be a valid JSON object.' });
    }

    const apiKey = process.env.NVIDIA_API_KEY;
    const model = process.env.NVIDIA_MODEL_ID || DEFAULT_NVIDIA_MODEL;

    // Fallback if NVIDIA API key is not yet configured in environment
    if (!apiKey) {
      console.warn('NVIDIA_API_KEY is not configured on the server; using deterministic ICAR fallback.');
      const fallbackResponse = generateOfflineVeterinaryFallback(body);
      return res.status(200).json({
        advice: fallbackResponse,
        model: 'icar-ndri-offline-fallback',
        isFallback: true,
        disclaimer: 'Advisory derived from ICAR-NDRI standards (NVIDIA API key not set in server environment).',
      });
    }

    const messages = buildPromptForRequest(body);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 20000); // 20s timeout

    try {
      const upstreamResponse = await fetch(NVIDIA_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model,
          messages,
          temperature: 0.3,
          max_tokens: 1200,
          top_p: 0.9,
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!upstreamResponse.ok) {
        const errText = await upstreamResponse.text();
        console.warn(`NVIDIA NIM API responded with ${upstreamResponse.status}: ${errText}`);
        const fallbackResponse = generateOfflineVeterinaryFallback(body);
        return res.status(200).json({
          advice: fallbackResponse,
          model: 'icar-ndri-resilient-fallback',
          isFallback: true,
          upstreamError: `NVIDIA API error (${upstreamResponse.status})`,
          disclaimer: 'Advisory generated via ICAR-NDRI fallback following upstream connection timeout.',
        });
      }

      const completionData = await upstreamResponse.json();
      const answer = completionData.choices?.[0]?.message?.content;

      if (!answer) {
        throw new Error('NVIDIA API returned an empty completion.');
      }

      return res.status(200).json({
        advice: answer,
        model,
        isFallback: false,
        usage: completionData.usage,
        disclaimer: 'Grounded in ICAR-NDRI scientific veterinary nutrition benchmarks powered by NVIDIA Nemotron-3-Ultra.',
      });
    } catch (networkError: any) {
      clearTimeout(timeoutId);
      console.warn('NVIDIA API connection error, engaging ICAR-NDRI fallback:', networkError);
      const fallbackResponse = generateOfflineVeterinaryFallback(body);
      return res.status(200).json({
        advice: fallbackResponse,
        model: 'icar-ndri-resilient-fallback',
        isFallback: true,
        disclaimer: 'Advisory generated via ICAR-NDRI fallback following network unavailability.',
      });
    }
  } catch (error: any) {
    console.error('Veterinary Expert Handler Exception:', error);
    return res.status(500).json({
      error: error.message || 'Internal server error in veterinary advisory handler.',
    });
  }
}
