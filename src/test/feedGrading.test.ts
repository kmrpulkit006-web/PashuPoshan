import { describe, it, expect } from 'vitest';
import { PRESET_FEED_SCENARIOS, analyzeCanvasImageData } from '../lib/feedAnalysisEngine';

describe('BIS IS:2052 Cattle Feed Compliance & Grading', () => {
  it('strictly classifies 19.8% CP concentrate as Tier B Sub-Standard (failing 20.0% min)', () => {
    const borderlineSample = PRESET_FEED_SCENARIOS.find(s => s.id === 'sample_borderline_concentrate')!;
    expect(borderlineSample).toBeDefined();
    expect(borderlineSample.metrics.crudeProtein).toBe(19.8);
    // Crucial correctness test: 19.8% must NOT pass BIS Type II or be Tier A
    expect(borderlineSample.bisCompliant).toBe(false);
    expect(borderlineSample.overallGrade).toBe('Tier B: Sub-Standard');
  });

  it('classifies synthetic urea spiked feed as Tier C Hazardous with BIS violation', () => {
    const ureaSample = PRESET_FEED_SCENARIOS.find(s => s.id === 'sample_urea_adulterated_pellet')!;
    expect(ureaSample).toBeDefined();
    expect(ureaSample.adulteration.ureaAdulterationDetected).toBe(true);
    expect(ureaSample.adulteration.ureaPercentage).toBeGreaterThan(1.0);
    expect(ureaSample.bisCompliant).toBe(false);
    expect(ureaSample.overallGrade).toBe('Tier C: Hazardous/Reject');
  });

  it('correctly passes Grade A Maize Silage', () => {
    const maizeSilage = PRESET_FEED_SCENARIOS.find(s => s.id === 'sample_maize_silage_optimum')!;
    expect(maizeSilage.overallGrade).toBe('Tier A: Premium');
    expect(maizeSilage.bisCompliant).toBe(true);
    expect(maizeSilage.silageMetrics?.fliegGrade).toBe('Excellent');
  });
});
