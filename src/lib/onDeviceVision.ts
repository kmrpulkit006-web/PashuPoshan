/**
 * PashuPoshan AI - On-Device Feed-Type Sanity Pre-Filter
 *
 * Lightweight client-side vision check using MobileNetV1 (alpha=0.25, ~1.8MB weights).
 * Purpose: Sanity-check that captured camera/upload photos contain organic/agricultural
 * matter (hay, straw, corn, forage, crops) rather than unmistakable non-feed objects
 * (laptops, vehicles, pets, screens, household items) before making network calls.
 *
 * NOTE ON MOLD & SPOILAGE:
 * MobileNetV1 is an ImageNet-1k classifier and is NOT a mold detector. ImageNet fungal
 * classes are macro-mushrooms (agaric, bolete), not micro-fungal feed spoilage.
 * Spoilage & mycotoxin risk assessment is handled exclusively by serverless Gemini Vision
 * and optical dark-ratio heuristics. This module only performs feed-type sanity pre-filtering.
 */

export interface PredictionItem {
  className: string;
  probability: number;
}

export type FeedSanityReason =
  | 'organic_feed_match'
  | 'ambiguous_or_low_confidence'
  | 'unmistakable_non_feed'
  | 'model_error_or_timeout';

export interface OnDeviceFeedCheckResult {
  success: boolean;
  looksLikeOrganicFeedMatter: boolean;
  shouldWarnUser: boolean;
  confidence: number;
  topClasses: PredictionItem[];
  latencyMs: number;
  reason: FeedSanityReason;
  warningMessage?: string;
}

/**
 * Keywords representing agricultural, plant, crop, or organic feed matter in ImageNet-1k labels.
 */
export const ORGANIC_FEED_KEYWORDS: string[] = [
  'hay',
  'straw',
  'corn',
  'ear',
  'spike',
  'capitulum',
  'sorghum',
  'grain',
  'wheat',
  'oat',
  'barley',
  'grass',
  'clover',
  'alfalfa',
  'silage',
  'forage',
  'fodder',
  'pasture',
  'haystack',
  'cabbage',
  'acorn',
  'plant',
  'leaf',
  'stalk',
  'seed',
  'legume',
  'flower',
  'vegetable',
  'pod',
  'husk',
  'bran',
  'mash',
  'meal',
  'feed',
  'herb',
  'agriculture',
];

/**
 * Keywords representing unmistakable non-feed everyday items in ImageNet-1k labels.
 */
export const NON_FEED_KEYWORDS: string[] = [
  'laptop',
  'computer',
  'notebook',
  'keyboard',
  'mouse',
  'screen',
  'monitor',
  'cellular telephone',
  'cell phone',
  'cellphone',
  'mobile phone',
  'telephone',
  'modem',
  'ipod',
  'radio',
  'camera',
  'television',
  'remote control',
  'electronics',
  'car',
  'automobile',
  'vehicle',
  'truck',
  'bus',
  'motorcycle',
  'bicycle',
  'cab',
  'taxi',
  'desk',
  'chair',
  'sofa',
  'couch',
  'bed',
  'refrigerator',
  'microwave',
  'toaster',
  'shoe',
  'boot',
  'sock',
  'shirt',
  'jean',
  'wallet',
  'purse',
  'backpack',
  'sunglasses',
  'dog',
  'cat',
  'puppy',
  'kitten',
  'canine',
  'feline',
  'human',
  'person',
  'man',
  'woman',
  'document',
  'book',
  'paper',
  'envelope',
  'certificate',
  'plastic bag',
  'packet',
  'bottle',
  'pen',
  'pencil',
];

/**
 * Check whether a class name matches a keyword list using word boundaries for single words.
 * Prevents false positives like 'cab' matching 'cabbage' or 'car' matching 'cardoon'.
 */
export function matchesKeywords(className: string, keywords: string[]): boolean {
  if (!className) return false;
  const lower = className.toLowerCase();
  return keywords.some((kw) => {
    if (kw.includes(' ') || kw.includes(',')) {
      return lower.includes(kw);
    }
    const regex = new RegExp(`\\b${kw}\\b`, 'i');
    return regex.test(lower);
  });
}

/**
 * Evaluate raw MobileNet predictions against feed sanity rules:
 * - If predictions contain organic/feed matter keywords -> Pass silently.
 * - If top prediction is unmistakably non-feed AND probability > 0.60 -> Warn user.
 * - If low confidence (<= 0.60) or ambiguous -> Pass silently to Gemini.
 */
export function evaluateFeedTypePredictions(
  topClasses: PredictionItem[],
  latencyMs: number = 0
): OnDeviceFeedCheckResult {
  if (!topClasses || topClasses.length === 0) {
    return {
      success: true,
      looksLikeOrganicFeedMatter: true,
      shouldWarnUser: false,
      confidence: 0,
      topClasses: [],
      latencyMs,
      reason: 'ambiguous_or_low_confidence',
    };
  }

  const top = topClasses[0];
  const topConfidence = top.probability;

  // 1. Check if top prediction or any high prediction matches organic/agricultural keywords
  const isOrganicMatch = topClasses.slice(0, 3).some(
    (item) => item.probability >= 0.15 && matchesKeywords(item.className, ORGANIC_FEED_KEYWORDS)
  );

  if (isOrganicMatch) {
    return {
      success: true,
      looksLikeOrganicFeedMatter: true,
      shouldWarnUser: false,
      confidence: topConfidence,
      topClasses,
      latencyMs,
      reason: 'organic_feed_match',
    };
  }

  // 2. Unmistakable non-feed object with > 60% confidence threshold
  const isTopNonFeed = matchesKeywords(top.className, NON_FEED_KEYWORDS);
  if (isTopNonFeed && topConfidence > 0.60) {
    const primaryLabel = top.className.split(',')[0].trim();
    const percent = Math.round(topConfidence * 100);
    return {
      success: true,
      looksLikeOrganicFeedMatter: false,
      shouldWarnUser: true,
      confidence: topConfidence,
      topClasses,
      latencyMs,
      reason: 'unmistakable_non_feed',
      warningMessage: `Non-Feed Object Detected (चारा नहीं लग रहा है): The camera detected "${primaryLabel}" (${percent}% confidence). Please ensure you are photographing cattle feed, fodder, or silage.\n\nProceed anyway with AI analysis?`,
    };
  }

  // 3. Ambiguous, low-confidence (<= 60%), or unlisted class
  // Proceed silently to Gemini without blocking the user
  return {
    success: true,
    looksLikeOrganicFeedMatter: true,
    shouldWarnUser: false,
    confidence: topConfidence,
    topClasses,
    latencyMs,
    reason: 'ambiguous_or_low_confidence',
  };
}

// Singleton cache for the MobileNet model promise
let mobilenetModelPromise: Promise<any> | null = null;
let modelLoaderOverride: (() => Promise<any>) | null = null;

/**
 * Reset singleton model promise and test overrides.
 */
export function resetModelForTesting(): void {
  mobilenetModelPromise = null;
  modelLoaderOverride = null;
}

/**
 * Override model loader (for unit testing without network/WebGL dependencies).
 */
export function setModelLoaderForTesting(loader: (() => Promise<any>) | null): void {
  modelLoaderOverride = loader;
}

/**
 * Lazy-load MobileNetV1 model (alpha: 0.25).
 * Dynamically imports tfjs and mobilenet so initial bundle load remains instant.
 */
export async function loadMobileNetModel(): Promise<any> {
  if (modelLoaderOverride) {
    return modelLoaderOverride();
  }

  if (!mobilenetModelPromise) {
    mobilenetModelPromise = (async () => {
      const [tf, mobilenet] = await Promise.all([
        import('@tensorflow/tfjs'),
        import('@tensorflow-models/mobilenet'),
      ]);

      await tf.ready();
      return mobilenet.load({
        version: 1,
        alpha: 0.25,
      });
    })();
  }
  return mobilenetModelPromise;
}

/**
 * Helper to load an HTMLImageElement from a URL or base64 data URI.
 */
function loadImageElement(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    if (typeof Image === 'undefined') {
      reject(new Error('Image constructor unavailable in this environment'));
      return;
    }
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('Failed to load image for on-device inference'));
    img.src = src;
  });
}

/**
 * Run client-side feed-type sanity check on an image source (data URI, HTMLImageElement, or HTMLCanvasElement).
 * Guaranteed fail-open: If inference fails, times out, or throws, returns shouldWarnUser: false
 * so normal scan flow is never blocked.
 */
export async function classifyFeedTypeOnDevice(
  imageSource: string | HTMLImageElement | HTMLCanvasElement,
  timeoutMs: number = 4000
): Promise<OnDeviceFeedCheckResult> {
  const startTime = typeof performance !== 'undefined' ? performance.now() : Date.now();

  try {
    const model = await Promise.race([
      loadMobileNetModel(),
      new Promise<null>((_, reject) =>
        setTimeout(() => reject(new Error('Model loading timed out')), timeoutMs)
      ),
    ]);

    if (!model) {
      throw new Error('MobileNet model could not be loaded');
    }

    let element: HTMLImageElement | HTMLCanvasElement;
    if (typeof imageSource === 'string') {
      element = await loadImageElement(imageSource);
    } else {
      element = imageSource;
    }

    const rawPredictions = await model.classify(element, 5);
    const predictions: PredictionItem[] = (rawPredictions || []).map((p: any) => ({
      className: p.className || '',
      probability: typeof p.probability === 'number' ? p.probability : 0,
    }));

    const endTime = typeof performance !== 'undefined' ? performance.now() : Date.now();
    const latencyMs = Math.round(endTime - startTime);

    return evaluateFeedTypePredictions(predictions, latencyMs);
  } catch (error) {
    const endTime = typeof performance !== 'undefined' ? performance.now() : Date.now();
    const latencyMs = Math.round(endTime - startTime);
    console.warn('On-device MobileNet feed check bypassed or encountered error:', error);

    return {
      success: false,
      looksLikeOrganicFeedMatter: true,
      shouldWarnUser: false,
      confidence: 0,
      topClasses: [],
      latencyMs,
      reason: 'model_error_or_timeout',
    };
  }
}
