import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  evaluateFeedTypePredictions,
  matchesKeywords,
  classifyFeedTypeOnDevice,
  resetModelForTesting,
  setModelLoaderForTesting,
  ORGANIC_FEED_KEYWORDS,
  NON_FEED_KEYWORDS,
  type PredictionItem,
} from '../lib/onDeviceVision';

describe('On-Device Feed Sanity Vision Module', () => {
  describe('matchesKeywords (whole-word boundary check)', () => {
    it('matches single words with word boundaries', () => {
      expect(matchesKeywords('ear, spike, capitulum', ORGANIC_FEED_KEYWORDS)).toBe(true);
      expect(matchesKeywords('corn', ORGANIC_FEED_KEYWORDS)).toBe(true);
      expect(matchesKeywords('hay', ORGANIC_FEED_KEYWORDS)).toBe(true);
      expect(matchesKeywords('straw', ORGANIC_FEED_KEYWORDS)).toBe(true);
    });

    it('does not falsely match substring stems (e.g. cab inside cabbage)', () => {
      // 'cab' is in NON_FEED_KEYWORDS, but 'head cabbage' is organic feed matter
      expect(matchesKeywords('head cabbage', ['cab'])).toBe(false);
      expect(matchesKeywords('cabbage', ['cab'])).toBe(false);
      expect(matchesKeywords('cab, hack, taxi', ['cab'])).toBe(true);
    });

    it('does not falsely match car inside cardoon', () => {
      expect(matchesKeywords('cardoon', ['car'])).toBe(false);
      expect(matchesKeywords('sports car', ['car'])).toBe(true);
    });

    it('handles case-insensitivity and multi-word phrases', () => {
      expect(matchesKeywords('LAPTOP, NOTEBOOK COMPUTER', NON_FEED_KEYWORDS)).toBe(true);
      expect(matchesKeywords('cellular telephone', NON_FEED_KEYWORDS)).toBe(true);
    });
  });

  describe('evaluateFeedTypePredictions (thresholding and decision rules)', () => {
    it('passes organic agricultural matter silently without warning', () => {
      const predictions: PredictionItem[] = [
        { className: 'corn', probability: 0.92 },
        { className: 'ear, spike, capitulum', probability: 0.05 },
      ];
      const result = evaluateFeedTypePredictions(predictions, 45);

      expect(result.success).toBe(true);
      expect(result.looksLikeOrganicFeedMatter).toBe(true);
      expect(result.shouldWarnUser).toBe(false);
      expect(result.reason).toBe('organic_feed_match');
      expect(result.confidence).toBe(0.92);
      expect(result.warningMessage).toBeUndefined();
    });

    it('passes hay or straw silently even with modest confidence', () => {
      const predictions: PredictionItem[] = [
        { className: 'hay', probability: 0.35 },
        { className: 'straw', probability: 0.25 },
      ];
      const result = evaluateFeedTypePredictions(predictions, 50);

      expect(result.looksLikeOrganicFeedMatter).toBe(true);
      expect(result.shouldWarnUser).toBe(false);
      expect(result.reason).toBe('organic_feed_match');
    });

    it('triggers warning ONLY when an unmistakable non-feed object has >60% confidence', () => {
      const predictions: PredictionItem[] = [
        { className: 'laptop, laptop computer', probability: 0.84 },
        { className: 'notebook, notebook computer', probability: 0.10 },
      ];
      const result = evaluateFeedTypePredictions(predictions, 40);

      expect(result.success).toBe(true);
      expect(result.looksLikeOrganicFeedMatter).toBe(false);
      expect(result.shouldWarnUser).toBe(true);
      expect(result.reason).toBe('unmistakable_non_feed');
      expect(result.confidence).toBe(0.84);
      expect(result.warningMessage).toContain('laptop');
      expect(result.warningMessage).toContain('84%');
      expect(result.warningMessage).toContain('Non-Feed Object Detected');
    });

    it('proceeds silently when a non-feed object is below or equal to 60% confidence', () => {
      // Ambiguous/low-confidence non-feed: Should NOT show annoying false warning to farmer
      const predictionsAt60: PredictionItem[] = [
        { className: 'laptop, laptop computer', probability: 0.60 },
      ];
      const resultAt60 = evaluateFeedTypePredictions(predictionsAt60, 42);

      expect(resultAt60.looksLikeOrganicFeedMatter).toBe(true);
      expect(resultAt60.shouldWarnUser).toBe(false);
      expect(resultAt60.reason).toBe('ambiguous_or_low_confidence');

      const predictionsAt45: PredictionItem[] = [
        { className: 'cellular telephone, cell phone', probability: 0.45 },
      ];
      const resultAt45 = evaluateFeedTypePredictions(predictionsAt45, 38);

      expect(resultAt45.looksLikeOrganicFeedMatter).toBe(true);
      expect(resultAt45.shouldWarnUser).toBe(false);
      expect(resultAt45.reason).toBe('ambiguous_or_low_confidence');
    });

    it('proceeds silently on generic or unlisted ImageNet classes', () => {
      const predictions: PredictionItem[] = [
        { className: 'bubble', probability: 0.75 },
      ];
      const result = evaluateFeedTypePredictions(predictions, 30);

      expect(result.looksLikeOrganicFeedMatter).toBe(true);
      expect(result.shouldWarnUser).toBe(false);
      expect(result.reason).toBe('ambiguous_or_low_confidence');
    });

    it('handles empty predictions gracefully without throwing', () => {
      const result = evaluateFeedTypePredictions([], 10);

      expect(result.success).toBe(true);
      expect(result.looksLikeOrganicFeedMatter).toBe(true);
      expect(result.shouldWarnUser).toBe(false);
      expect(result.reason).toBe('ambiguous_or_low_confidence');
      expect(result.topClasses).toEqual([]);
    });

    it('strictly contains ZERO mold detection fields in return contract', () => {
      const result: any = evaluateFeedTypePredictions([
        { className: 'corn', probability: 0.9 },
      ]);

      expect(result.moldRiskScore).toBeUndefined();
      expect(result.moldScore).toBeUndefined();
      expect(result.moldRisk).toBeUndefined();
      expect(result.moldDetected).toBeUndefined();
    });
  });

  describe('classifyFeedTypeOnDevice (fail-open error handling & mock inference)', () => {
    beforeEach(() => {
      resetModelForTesting();
    });

    it('fails open gracefully when model loader throws or rejects', async () => {
      setModelLoaderForTesting(async () => {
        throw new Error('WebGL context unavailable or network failure');
      });

      const result = await classifyFeedTypeOnDevice('data:image/png;base64,mock', 500);

      // Never blocks scan: returns shouldWarnUser: false, looksLikeOrganicFeedMatter: true
      expect(result.success).toBe(false);
      expect(result.shouldWarnUser).toBe(false);
      expect(result.looksLikeOrganicFeedMatter).toBe(true);
      expect(result.reason).toBe('model_error_or_timeout');
    });

    it('fails open gracefully when model loading times out', async () => {
      setModelLoaderForTesting(() => new Promise((resolve) => setTimeout(resolve, 1000)));

      // Fast timeout 50ms
      const result = await classifyFeedTypeOnDevice('data:image/png;base64,mock', 50);

      expect(result.success).toBe(false);
      expect(result.shouldWarnUser).toBe(false);
      expect(result.looksLikeOrganicFeedMatter).toBe(true);
      expect(result.reason).toBe('model_error_or_timeout');
    });

    it('successfully evaluates predictions when mock model runs', async () => {
      const mockClassify = vi.fn().mockResolvedValue([
        { className: 'laptop, notebook computer', probability: 0.88 },
      ]);
      setModelLoaderForTesting(async () => ({
        classify: mockClassify,
      }));

      // Pass a dummy canvas/object to bypass Image constructor in Node
      const dummyCanvas = { width: 100, height: 100 } as unknown as HTMLCanvasElement;
      const result = await classifyFeedTypeOnDevice(dummyCanvas, 1000);

      expect(result.success).toBe(true);
      expect(result.shouldWarnUser).toBe(true);
      expect(result.looksLikeOrganicFeedMatter).toBe(false);
      expect(result.reason).toBe('unmistakable_non_feed');
      expect(mockClassify).toHaveBeenCalledWith(dummyCanvas, 5);
    });

    it('successfully passes organic feed predictions when mock model detects corn', async () => {
      const mockClassify = vi.fn().mockResolvedValue([
        { className: 'corn', probability: 0.91 },
      ]);
      setModelLoaderForTesting(async () => ({
        classify: mockClassify,
      }));

      const dummyCanvas = { width: 100, height: 100 } as unknown as HTMLCanvasElement;
      const result = await classifyFeedTypeOnDevice(dummyCanvas, 1000);

      expect(result.success).toBe(true);
      expect(result.shouldWarnUser).toBe(false);
      expect(result.looksLikeOrganicFeedMatter).toBe(true);
      expect(result.reason).toBe('organic_feed_match');
    });
  });
});
