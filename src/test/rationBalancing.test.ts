import { describe, it, expect } from 'vitest';
import { calculatePrecisionRation, DEFAULT_FEED_LIBRARY } from '../lib/rationBalancing';
import { CowProfile, FeedSample } from '../lib/types';
import {
  getCowDisplayName,
  getCowBreedDisplayName,
  getFeedCategoryDisplayName,
  getSampleDisplayName,
} from '../lib/i18n';

describe('ICAR & NDDB Precision Ration Balancer', () => {
  const girCow: CowProfile = {
    id: 'cow_gir_test',
    tagNumber: 'INAPH-1001',
    name: 'Test Gir',
    breed: 'Gir',
    weightKg: 400,
    lactationStage: 'Early (0-90 days)',
    dailyMilkYieldLiters: 12,
    milkFatPct: 4.5,
  };

  it('calculates 2.5% body weight DMI for indigenous cattle', () => {
    const plan = calculatePrecisionRation(girCow);
    // 400 * 0.025 = 10.0 kg DMI
    expect(plan.dmiTotalRequiredKg).toBe(10.0);
  });

  it('calculates 3.0% body weight DMI for crossbred cattle', () => {
    const hfCow: CowProfile = {
      ...girCow,
      breed: 'HF Crossbred',
      weightKg: 500,
    };
    const plan = calculatePrecisionRation(hfCow);
    // 500 * 0.03 = 15.0 kg DMI
    expect(plan.dmiTotalRequiredKg).toBe(15.0);
  });

  it('correctly sums composite CP supply across green, dry, and concentrate slots', () => {
    const plan = calculatePrecisionRation(girCow);
    expect(plan.suppliedTotals.cpGrams).toBeGreaterThan(0);
    expect(plan.slots).toHaveLength(3);
    expect(plan.slots.map(s => s.slot)).toEqual(['green_fodder', 'dry_fodder', 'concentrate']);
  });

  it('handles active green_fodder sample with default library values without crashing', () => {
    const greenSample = {
      id: 'sample_green_test',
      name: 'Fresh Green Harvest',
      category: 'green_fodder' as const,
      timestamp: new Date().toISOString(),
      grade: 'Grade A' as const,
      verdict: 'Safe',
      metrics: {
        crudeProtein: 14.2,
        moisture: 78,
        aflatoxinB1Ppb: 0,
        ureaPresent: false,
        requiresLabTest: false,
      },
    };
    const plan = calculatePrecisionRation(girCow, { activeSample: greenSample as unknown as FeedSample, greenFreshKg: 15 });
    expect(plan.slots[0].feedName).toBe('Fresh Green Harvest');
    expect(plan.slots[0].crudeProteinPct).toBe(14.2);
    expect(plan.slots[0].dryMatterPct).toBe(DEFAULT_FEED_LIBRARY.berseem_green.dmPct);
  });
});

describe('Cattle & Ration Localization Helpers', () => {
  it('translates default cow names and preserves custom names', () => {
    expect(getCowDisplayName('Lakshmi', 'hi')).toBe('लक्ष्मी');
    expect(getCowDisplayName('Ganga', 'hi')).toBe('गंगा');
    expect(getCowDisplayName('Yamuna', 'hi')).toBe('यमुना');
    expect(getCowDisplayName({ id: 'cow_1', name: 'Lakshmi' }, 'hi')).toBe('लक्ष्मी');
    expect(getCowDisplayName({ id: 'cow_custom', name: 'Nandini' }, 'hi')).toBe('Nandini');
  });

  it('translates cattle breeds correctly in Hindi and falls back gracefully', () => {
    expect(getCowBreedDisplayName('Gir', 'hi')).toBe('गीर गाय');
    expect(getCowBreedDisplayName('HF Crossbred', 'hi')).toBe('एच.एफ. संकर');
    expect(getCowBreedDisplayName('Murrah Buffalo', 'hi')).toBe('मुर्रा भैंस');
    expect(getCowBreedDisplayName('Unknown Breed', 'hi')).toBe('Unknown Breed');
  });

  it('translates feed categories correctly', () => {
    expect(getFeedCategoryDisplayName('silage', 'hi')).toBe('साइलेज');
    expect(getFeedCategoryDisplayName('concentrate', 'hi')).toBe('दाना मिश्रण');
    expect(getFeedCategoryDisplayName('green_fodder', 'hi')).toBe('हरा चारा');
    expect(getFeedCategoryDisplayName('dry_fodder', 'hi')).toBe('सूखा भूसा');
    expect(getFeedCategoryDisplayName('silage', 'en')).toBe('Silage');
  });

  it('translates visual triage feed sample names correctly', () => {
    expect(getSampleDisplayName({ name: 'Silage (Visual Triage)' }, 'hi')).toBe('साइलेज (त्वरित जांच)');
    expect(getSampleDisplayName({ name: 'Green Fodder (Visual Triage)' }, 'hi')).toBe('ताज़ा हरा चारा (त्वरित जांच)');
    expect(getSampleDisplayName({ name: 'Dry Fodder (Visual Triage)' }, 'hi')).toBe('सूखा भूसा / पुआल (त्वरित जांच)');
    expect(getSampleDisplayName({ name: 'Concentrate (Visual Triage)' }, 'hi')).toBe('दाना मिश्रण / पेलेट (त्वरित जांच)');
  });
});
