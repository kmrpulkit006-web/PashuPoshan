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

// Global process declaration for TypeScript build without node types package
declare const process: {
  env: {
    [key: string]: string | undefined;
    GEMINI_API_KEY?: string;
    GOOGLE_API_KEY?: string;
    VISION_PROVIDER?: string;
  };
};

export interface VisualAnalysisResult {
  moldCoverageEstimate: 'none' | 'trace' | 'moderate' | 'heavy';
  colorDescription: string;
  foreignMatterVisible: boolean;
  foreignMatterDescription: string;
  overallVisualCondition: 'good' | 'fair' | 'poor';
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

  async analyzeImage(base64Jpeg: string, category: string = 'feed'): Promise<VisualAnalysisResult> {
    const prompt = `You are a veterinary feed inspector assistant performing an on-farm visual triage of livestock feed/fodder (${category}) from a smartphone camera photo.

CRITICAL PROTOCOL & MANDATORY SAFETY RULES:
1. THIS IS AN INITIAL VISUAL SCREENING TRIAGE ONLY, NOT A CERTIFIED LABORATORY REPORT.
2. DO NOT estimate, predict, or include any chemical, nutritional, or laboratory numbers (such as pH, urea percentage, crude protein %, crude fiber %, ash %, or aflatoxin ppb). Those require certified laboratory wet chemistry.
3. Observe and evaluate ONLY physical visual characteristics visible in the photograph:
   - moldCoverageEstimate: "none" | "trace" | "moderate" | "heavy"
     * "none": clean appearance, no fungal mycelia or discolored mold patches.
     * "trace": isolated speckles (<5% surface).
     * "moderate": visible patchy clumps (5% to 20% surface).
     * "heavy": widespread gray/green/black fungal mats (>20% surface).
   - colorDescription: concise factual visual description (e.g. "uniform golden-amber with normal leaf texture" or "damp blackened discoloration with white mycelial growth").
   - foreignMatterVisible: boolean (true if non-feed items like stones, sand clumps, plastic, twine, metal wires, or dead insects are visible).
   - foreignMatterDescription: concise description of foreign matter, or "" if none visible.
   - overallVisualCondition: "good" | "fair" | "poor"
     * "good": fresh, normal color, no mold, no foreign matter.
     * "fair": slight weathering or trace discoloration, but mostly sound.
     * "poor": significant mold, rancid blackened spoilage, or heavy foreign matter.

Return ONLY a JSON object strictly matching this schema:
{
  "moldCoverageEstimate": "none" | "trace" | "moderate" | "heavy",
  "colorDescription": "string",
  "foreignMatterVisible": boolean,
  "foreignMatterDescription": "string",
  "overallVisualCondition": "good" | "fair" | "poor"
}`;

    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${this.apiKey}`;

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

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorText = await response.text();
      let parsedError = errorText;
      try {
        const errorJson = JSON.parse(errorText);
        parsedError = errorJson.error?.message || errorText;
      } catch (e) {}
      throw new Error(`Gemini Vision API error (${response.status}): ${parsedError}`);
    }

    const data = await response.json();
    const rawContent = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!rawContent) {
      throw new Error('Empty response received from Gemini Vision model.');
    }

    let parsed: any;
    try {
      parsed = JSON.parse(rawContent);
    } catch (err) {
      throw new Error(`Failed to parse vision model response as JSON: ${rawContent}`);
    }

    // Sanitize and validate fields strictly against the specified schema
    const validMolds = ['none', 'trace', 'moderate', 'heavy'] as const;
    const validConditions = ['good', 'fair', 'poor'] as const;

    const moldCoverageEstimate = validMolds.includes(parsed.moldCoverageEstimate)
      ? parsed.moldCoverageEstimate
      : 'none';

    const overallVisualCondition = validConditions.includes(parsed.overallVisualCondition)
      ? parsed.overallVisualCondition
      : moldCoverageEstimate === 'heavy'
      ? 'poor'
      : 'good';

    return {
      moldCoverageEstimate,
      colorDescription: typeof parsed.colorDescription === 'string' ? parsed.colorDescription : 'Color consistent with standard feed sample.',
      foreignMatterVisible: Boolean(parsed.foreignMatterVisible),
      foreignMatterDescription: typeof parsed.foreignMatterDescription === 'string' ? parsed.foreignMatterDescription : '',
      overallVisualCondition,
      providerNotes: 'Analyzed via Google Gemini 1.5 Flash Vision Triage Pipeline',
    };
  }
}

/**
 * Provider factory enabling future swappability (e.g. Anthropic Claude, OpenAI GPT-4V)
 */
export function getVisionProvider(apiKey?: string): VisionProvider {
  const resolvedKey = apiKey || process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
  if (!resolvedKey) {
    throw new Error('GEMINI_API_KEY is not configured in the server environment.');
  }
  return new GeminiFlashVisionProvider(resolvedKey);
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

    // Check API Key
    const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
    if (!apiKey) {
      return res.status(503).json({
        error: 'Vision AI service is unconfigured on the server (GEMINI_API_KEY is missing). Fallback to offline queuing is advised.',
        code: 'API_KEY_UNCONFIGURED',
      });
    }

    const provider = getVisionProvider(apiKey);
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
