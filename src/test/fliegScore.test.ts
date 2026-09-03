import { describe, it, expect } from 'vitest';
import { calculateFliegScore } from '../lib/fliegScore';

describe('Flieg Score Calculation for Silage Fermentation', () => {
  it('should score excellent for optimal maize silage (pH 3.9, DM 33.5%)', () => {
    const result = calculateFliegScore(3.9, 33.5);
    expect(result.score).toBeGreaterThanOrEqual(80);
    expect(result.grade).toBe('Excellent');
    expect(result.lacticAcidPct).toBeGreaterThanOrEqual(6.0);
  });

  it('should score poor / bad for failed clostridial silage (pH 5.4, DM 25.5%)', () => {
    const result = calculateFliegScore(5.4, 25.5);
    expect(result.score).toBeLessThanOrEqual(40);
    expect(['Poor', 'Very Bad']).toContain(result.grade);
    expect(result.butyricAcidRisk).toContain('High');
  });

  it('should clamp out-of-range pH inputs safely', () => {
    const tooLow = calculateFliegScore(1.0, 30);
    const tooHigh = calculateFliegScore(12.0, 30);
    expect(tooLow.score).toBeLessThanOrEqual(100);
    expect(tooHigh.score).toBeGreaterThanOrEqual(0);
  });
});
