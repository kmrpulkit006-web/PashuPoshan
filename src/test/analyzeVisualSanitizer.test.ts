import { describe, it, expect } from 'vitest';
import { sanitizeVisualAnalysisResponse } from '../../api/analyze-visual';

describe('Vision AI Response Sanitizer (sanitizeVisualAnalysisResponse)', () => {
  describe('1. Valid JSON with missing optional fields', () => {
    it('populates safe defaults when optional fields are omitted from response', () => {
      const minimalJson = JSON.stringify({
        isFeedSample: true,
      });

      const result = sanitizeVisualAnalysisResponse(minimalJson, 'silage');

      expect(result.isFeedSample).toBe(true);
      expect(result.feedTypeIdentified).toBe('silage');
      expect(result.moldCoverageEstimate).toBe('none');
      expect(result.colorDescription).toBe('Standard feed coloration.');
      expect(result.foreignMatterVisible).toBe(false);
      expect(result.foreignMatterDescription).toBe('');
      expect(result.overallVisualCondition).toBe('good');
      expect(result.rejectionReason).toBe('none');
    });

    it('parses JSON wrapped inside markdown code blocks ```json ... ```', () => {
      const fencedJson = '```json\n{\n  "isFeedSample": true,\n  "moldCoverageEstimate": "trace",\n  "colorDescription": "Greenish-yellow"\n}\n```';

      const result = sanitizeVisualAnalysisResponse(fencedJson, 'green_fodder');

      expect(result.isFeedSample).toBe(true);
      expect(result.moldCoverageEstimate).toBe('trace');
      expect(result.colorDescription).toBe('Greenish-yellow');
    });
  });

  describe('2. Out-of-range or unexpected enum values', () => {
    it('clamps or falls back to "none" when moldCoverageEstimate is unexpected (e.g. "massive")', () => {
      const unexpectedJson = JSON.stringify({
        isFeedSample: true,
        moldCoverageEstimate: 'massive', // Out-of-range value
        overallVisualCondition: 'superb', // Out-of-range condition
      });

      const result = sanitizeVisualAnalysisResponse(unexpectedJson, 'silage');

      expect(result.isFeedSample).toBe(true);
      expect(result.moldCoverageEstimate).toBe('none');
      expect(result.overallVisualCondition).toBe('good');
    });

    it('falls back to "not_feed_or_fodder" when non-feed sample has invalid rejectionReason', () => {
      const invalidReasonJson = JSON.stringify({
        isFeedSample: false,
        rejectionReason: 'some_unknown_reason',
      });

      const result = sanitizeVisualAnalysisResponse(invalidReasonJson, 'concentrate');

      expect(result.isFeedSample).toBe(false);
      expect(result.rejectionReason).toBe('not_feed_or_fodder');
      expect(result.overallVisualCondition).toBe('invalid');
    });
  });

  describe('3. Non-JSON string, malformed string, or empty string', () => {
    it('safely handles empty string or whitespace without throwing', () => {
      const resultEmpty = sanitizeVisualAnalysisResponse('');
      expect(resultEmpty.isFeedSample).toBe(false);
      expect(resultEmpty.overallVisualCondition).toBe('invalid');
      expect(resultEmpty.rejectionReason).toBe('blurry_unreadable');

      const resultWhitespace = sanitizeVisualAnalysisResponse('    \n\t  ');
      expect(resultWhitespace.isFeedSample).toBe(false);
      expect(resultWhitespace.overallVisualCondition).toBe('invalid');
    });

    it('safely handles null and undefined without throwing', () => {
      const resultNull = sanitizeVisualAnalysisResponse(null as any);
      expect(resultNull.isFeedSample).toBe(false);
      expect(resultNull.overallVisualCondition).toBe('invalid');

      const resultUndefined = sanitizeVisualAnalysisResponse(undefined as any);
      expect(resultUndefined.isFeedSample).toBe(false);
      expect(resultUndefined.overallVisualCondition).toBe('invalid');
    });

    it('safely handles non-JSON raw prose string without throwing', () => {
      const prose = 'Sorry, I am an AI and I could not clearly identify this picture because it is too dark.';
      const result = sanitizeVisualAnalysisResponse(prose);

      expect(result.isFeedSample).toBe(false);
      expect(result.overallVisualCondition).toBe('invalid');
      expect(result.rejectionReason).toBe('blurry_unreadable');
      expect(result.providerNotes).toContain('malformed');
    });
  });
});
