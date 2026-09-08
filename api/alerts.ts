/**
 * Vercel Serverless Function: Crowd-Sourced Regional Feed Adulteration Radar
 * Endpoint: /api/alerts (GET / POST)
 *
 * Prototype — not a government regulatory source.
 * Alerts submitted by farmers & field workers are initial crowd-sourced community reports.
 */

import { Redis } from '@upstash/redis';

// Process environment declarations for TypeScript without node types
declare const process: {
  env: {
    [key: string]: string | undefined;
    KV_REST_API_URL?: string;
    KV_REST_API_TOKEN?: string;
    UPSTASH_REDIS_REST_URL?: string;
    UPSTASH_REDIS_REST_TOKEN?: string;
  };
};

export interface AlertPayload {
  id?: string;
  title?: string;
  taluka?: string;
  district: string;
  state?: string;
  date?: string;
  alertType?: 'adulterated_batch' | 'aflatoxin_surge' | 'fodder_scarcity' | 'price_spike';
  severity?: 'high' | 'medium' | 'info';
  brandOrCrop?: string;
  feedType?: string;
  contaminant?: string;
  description: string;
  advisory?: string;
  reportedBy?: string;
  verifiedByCoop?: boolean;
  timestamp?: string;
}

export const DEFAULT_ALERTS: AlertPayload[] = [
  {
    id: 'alert_1',
    title: 'Adulterated Commercial Pellet Batch Flagged',
    taluka: 'Baramati',
    district: 'Pune',
    state: 'Maharashtra',
    contaminant: 'Urea (4.2%) & Silica Sand (6.8%)',
    feedType: 'Commercial Cattle Feed Pellets',
    date: 'Today, 10:15 AM',
    alertType: 'adulterated_batch',
    severity: 'high',
    brandOrCrop: 'Unbranded Yellow Pellets (Batch #4911)',
    description: '3 dairy farmers in Baramati reported acute ammonia bloat after feeding batch #4911. Colorimetric strip testing revealed 4.2% added urea and 6.8% silica sand. Do not purchase.',
    advisory: 'Do not purchase or feed batch #4911. Return to distributor.',
    reportedBy: 'Baramati Taluka Cooperative Milk Union',
    verifiedByCoop: true,
    timestamp: '2026-09-06T04:45:00.000Z',
  },
  {
    id: 'alert_2',
    title: 'Aflatoxin Surge in Stored Maize Fodder',
    taluka: 'Karvir',
    district: 'Kolhapur',
    state: 'Maharashtra',
    contaminant: 'Aspergillus Mold (Aflatoxin)',
    feedType: 'Maize Stover / Dry Fodder',
    date: 'Yesterday',
    alertType: 'aflatoxin_surge',
    severity: 'high',
    brandOrCrop: 'Post-Monsoon Maize Stover',
    description: 'Heavy moisture has caused widespread Aspergillus mold growth in standing maize stover. Keep harvested fodder off damp ground to prevent Aflatoxin M1 contamination in milk.',
    advisory: 'Elevate storage pallets and discard visibly black or green cobs.',
    reportedBy: 'District Veterinary Polyclinic',
    verifiedByCoop: true,
    timestamp: '2026-09-05T08:30:00.000Z',
  },
  {
    id: 'alert_3',
    title: 'Subsidized Green Fodder Silage Depot Opened',
    taluka: 'Anand',
    district: 'Anand',
    state: 'Gujarat',
    contaminant: 'None (Subsidized Supply)',
    feedType: 'Maize Silage Bales',
    date: '28 Aug 2026',
    alertType: 'fodder_scarcity',
    severity: 'info',
    brandOrCrop: 'Certified Grade-A Maize Silage',
    description: 'NDDB certified silage bales available at ₹4.20/kg for cooperative members to counter seasonal dry fodder deficit.',
    advisory: 'Contact local milk cooperative society for allotment token.',
    reportedBy: 'Gujarat Cooperative Milk Marketing Federation',
    verifiedByCoop: true,
    timestamp: '2026-08-28T10:00:00.000Z',
  },
  {
    id: 'alert_4',
    title: 'High Non-Protein Nitrogen Warning in Mustard Cake',
    taluka: 'Khanna',
    district: 'Ludhiana',
    state: 'Punjab',
    contaminant: 'Industrial Urea (>3.5%)',
    feedType: 'Mustard Oil Cake (Sarson Khal)',
    date: '26 Aug 2026',
    alertType: 'adulterated_batch',
    severity: 'high',
    brandOrCrop: 'Commercial Khal (Loose Bags)',
    description: 'Field reagent strip testing detected >3.5% non-protein nitrogen (synthetic urea) in unbranded solvent-extracted cake.',
    advisory: 'Perform cold-water foaming check and litmus paper strip test before feeding.',
    reportedBy: 'District Dairy Cooperative Society',
    verifiedByCoop: true,
    timestamp: '2026-08-26T14:15:00.000Z',
  },
];

export const MAX_STORED_ALERTS = 50;
export const REDIS_KEY = 'pashuposhan:community_alerts';

export const RATE_LIMIT_MAX = 20; // 20 alert submissions per hour per IP
export const RATE_LIMIT_WINDOW_SECONDS = 3600; // 1 hour
export const inMemoryRateLimit = new Map<string, { count: number; resetTime: number }>();

// In-memory fallback for local development or when Redis credentials are not configured
let inMemoryAlerts: AlertPayload[] = [...DEFAULT_ALERTS];

export function getClientIp(req: any): string {
  const xForwardedFor = req.headers?.['x-forwarded-for'] || req.headers?.['x-real-ip'];
  if (typeof xForwardedFor === 'string') {
    return xForwardedFor.split(',')[0].trim();
  }
  return req.socket?.remoteAddress || '127.0.0.1';
}

export function getRedisClient(): Redis | null {
  const url = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;

  if (url && token) {
    try {
      return new Redis({ url, token, retry: { retries: 0 } });
    } catch (e) {
      console.warn('Failed to initialize Redis client, falling back to in-memory storage:', e);
    }
  }
  return null;
}

export async function checkRateLimit(ip: string): Promise<boolean> {
  const redis = getRedisClient();
  if (redis) {
    try {
      const key = `rate_limit:alerts:${ip}`;
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

export function resetRateLimits(): void {
  inMemoryRateLimit.clear();
}

export function resetInMemoryAlerts(): void {
  inMemoryAlerts = [...DEFAULT_ALERTS];
}

export function getInMemoryAlerts(): AlertPayload[] {
  return inMemoryAlerts;
}

export async function loadAlerts(): Promise<AlertPayload[]> {
  const redis = getRedisClient();
  if (redis) {
    try {
      const stored = await redis.get<AlertPayload[]>(REDIS_KEY);
      if (Array.isArray(stored) && stored.length > 0) {
        return stored;
      }
      // Seed Redis with default alerts if empty
      await redis.set(REDIS_KEY, DEFAULT_ALERTS);
      return DEFAULT_ALERTS;
    } catch (err) {
      console.warn('Redis read failed, using in-memory fallback:', err);
    }
  }
  return inMemoryAlerts;
}

export async function saveAlert(newAlert: AlertPayload): Promise<AlertPayload[]> {
  const current = await loadAlerts();
  const updated = [newAlert, ...current.filter(a => a.id !== newAlert.id)].slice(0, MAX_STORED_ALERTS);

  const redis = getRedisClient();
  if (redis) {
    try {
      await redis.set(REDIS_KEY, updated);
    } catch (err) {
      console.warn('Redis write failed, updating in-memory fallback:', err);
    }
  }

  inMemoryAlerts = updated;
  return updated;
}

export default async function handler(req: any, res: any) {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,POST');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method === 'GET') {
    try {
      const alerts = await loadAlerts();
      return res.status(200).json({
        alerts,
        total: alerts.length,
        disclaimer: 'Prototype — not a government regulatory source.',
      });
    } catch (error: any) {
      console.error('GET /api/alerts error:', error);
      return res.status(200).json({
        alerts: inMemoryAlerts,
        total: inMemoryAlerts.length,
        disclaimer: 'Prototype — not a government regulatory source.',
      });
    }
  }

  if (req.method === 'POST') {
    // Rate Limiting (20 submissions per hour per IP)
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
        } catch {
          return res.status(400).json({ error: 'Malformed JSON payload. Something went wrong. Please try again.' });
        }
      }

      if (!body || typeof body !== 'object') {
        return res.status(400).json({ error: 'Something went wrong. Please try again.' });
      }

      const {
        district,
        state,
        contaminant,
        feedType,
        severity,
        advisory,
        reportedBy,
        brandOrCrop,
        description,
        taluka,
        title,
        alertType,
      } = body;

      // Validate required fields
      if (!district || typeof district !== 'string' || !district.trim()) {
        return res.status(400).json({ error: 'Missing required field: "district"' });
      }

      const effectiveFeed = brandOrCrop || feedType;
      if (!effectiveFeed || typeof effectiveFeed !== 'string' || !effectiveFeed.trim()) {
        return res.status(400).json({ error: 'Missing required field: "brandOrCrop" or "feedType"' });
      }

      const effectiveDescription = description || advisory;
      if (!effectiveDescription || typeof effectiveDescription !== 'string' || !effectiveDescription.trim()) {
        return res.status(400).json({ error: 'Missing required field: "description"' });
      }

      const now = new Date();
      const newAlert: AlertPayload = {
        id: body.id || `alert_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        title: title || `Suspected Contamination: ${effectiveFeed}`,
        taluka: taluka || district,
        district: district.trim(),
        state: state || 'India',
        date: 'Just now',
        alertType: alertType || 'adulterated_batch',
        severity: severity === 'info' || severity === 'medium' ? severity : 'high',
        brandOrCrop: effectiveFeed.trim(),
        feedType: feedType || effectiveFeed.trim(),
        contaminant: contaminant || 'Suspected Adulterant',
        description: effectiveDescription.trim(),
        advisory: advisory || 'Isolate batch and arrange certified laboratory analysis.',
        reportedBy: reportedBy || 'Local Dairy Farmer (PashuPoshan Crowd Radar)',
        verifiedByCoop: Boolean(body.verifiedByCoop),
        timestamp: now.toISOString(),
      };

      const updated = await saveAlert(newAlert);

      return res.status(201).json({
        success: true,
        alert: newAlert,
        total: updated.length,
        disclaimer: 'Prototype — not a government regulatory source.',
      });
    } catch (error: any) {
      console.error('POST /api/alerts error:', error);
      return res.status(500).json({ error: 'Something went wrong. Please try again.' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed. Use GET or POST.' });
}
