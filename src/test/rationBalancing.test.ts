import { describe, it, expect } from 'vitest';
import { calculatePrecisionRation } from '../lib/rationBalancing';
import { CowProfile } from '../lib/types';

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
});
