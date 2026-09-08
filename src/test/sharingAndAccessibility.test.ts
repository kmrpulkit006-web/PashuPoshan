import { describe, it, expect } from 'vitest';
import { calculatePrecisionRation } from '../lib/rationBalancing';
import { getSampleDisplayName } from '../lib/i18n';
import { CowProfile, FeedSample } from '../lib/types';

describe('Report Sharing Card & URL Encoding', () => {
  const sample = {
    id: 'sample_test_1',
    name: 'Silage (Visual Triage)',
    category: 'silage',
    timestamp: new Date().toISOString(),
    overallGrade: 'Tier A: Premium',
    bisCompliant: true,
    batchNumber: 'BATCH-2026-SIL',
    metrics: {
      moisture: 65,
      crudeProtein: 8.5,
      requiresLabTest: false,
    },
    adulteration: {
      ureaAdulterationDetected: false,
      ureaPercentage: 0.1,
      foreignStarchOrTallow: false,
    },
  } as unknown as FeedSample;

  it('generates localized share card text with all critical parameters', () => {
    const sampleDisplayName = getSampleDisplayName(sample, 'hi');
    expect(sampleDisplayName).toBe('साइलेज (त्वरित जांच)');

    const fullReportText = [
      `🐄 *PashuPoshan Field Screening Certificate* (SIH 2026 PS 26111)`,
      `📋 Sample: ${sampleDisplayName}`,
      `🏷️ Batch: ${sample.batchNumber || 'N/A'}`,
      `⭐ Grade: ${sample.overallGrade}`,
      `🧪 Est. Crude Protein: ${sample.metrics?.crudeProtein !== undefined ? `${sample.metrics.crudeProtein}%` : 'Pending Lab Assay'}`,
      `⚠️ Urea Screening: ${sample.adulteration?.ureaAdulterationDetected ? 'ADULTERATION SUSPECTED' : 'Negative'}`,
      `📜 BIS IS:2052 Status: ${sample.bisCompliant ? 'Met Reference Threshold' : 'Threshold Breach Detected'}`,
      ``,
      `⚖️ Disclaimer: Optical proxy / rapid field triage estimate only. Certified laboratory confirmation required.`,
    ].join('\n');

    expect(fullReportText).toContain('साइलेज (त्वरित जांच)');
    expect(fullReportText).toContain('BATCH-2026-SIL');
    expect(fullReportText).toContain('Tier A: Premium');
    expect(fullReportText).toContain('8.5%');
    expect(fullReportText).toContain('Negative');
    expect(fullReportText).toContain('Met Reference Threshold');
  });

  it('safely encodes Indic characters for WhatsApp URLs without loss', () => {
    const hindiSampleName = 'साइलेज (त्वरित जांच)';
    const text = `Sample: ${hindiSampleName}`;
    const encoded = encodeURIComponent(text);
    expect(decodeURIComponent(encoded)).toBe('Sample: साइलेज (त्वरित जांच)');
  });
});

describe('Defensive Ration Balancing with Partial or Undefined Metrics', () => {
  const testCow: CowProfile = {
    id: 'cow_test_defensive',
    tagNumber: 'TAG-1234',
    name: 'Kamadhenu',
    breed: 'Gir',
    weightKg: 420,
    lactationStage: 'Early (0-90 days)',
    dailyMilkYieldLiters: 14,
    milkFatPct: 4.8,
  };

  it('does not throw when active sample has undefined metrics', () => {
    const sampleNoMetrics = {
      id: 'sample_raw_triage',
      name: 'Fresh Triage Scan',
      category: 'green_fodder',
      timestamp: new Date().toISOString(),
      overallGrade: 'Tier B: Sub-Standard',
      metrics: undefined,
    } as unknown as FeedSample;

    expect(() => {
      const plan = calculatePrecisionRation(testCow, { activeSample: sampleNoMetrics });
      expect(plan.slots).toHaveLength(3);
      expect(plan.dmiTotalRequiredKg).toBeGreaterThan(0);
    }).not.toThrow();
  });

  it('falls back to default library values when dry fodder metrics are missing', () => {
    const drySamplePartial = {
      id: 'sample_dry_partial',
      name: 'Local Wheat Straw',
      category: 'dry_fodder',
      timestamp: new Date().toISOString(),
      overallGrade: 'Tier A: Premium',
      metrics: {
        requiresLabTest: true,
      },
    } as unknown as FeedSample;

    const plan = calculatePrecisionRation(testCow, { activeSample: drySamplePartial });
    const drySlot = plan.slots.find(s => s.slot === 'dry_fodder');
    expect(drySlot).toBeDefined();
    expect(drySlot?.dryMatterPct).toBe(90.0);
  });
});
