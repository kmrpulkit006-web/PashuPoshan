import { CowProfile, RationPlan, FeedSample, RationSlotItem } from './types';

/**
 * ICAR (2013) & NDDB Dairy Nutrition Standards:
 * 1. Dry Matter Intake (DMI):
 *    - Indigenous Cattle (Gir, Sahiwal, Red Sindhi): ~2.5% of Body Weight
 *    - Crossbred Cattle (HF Cross, Jersey Cross): ~3.0% of Body Weight
 *    - Buffaloes (Murrah): ~2.8% of Body Weight
 * 
 * 2. Maintenance Requirements:
 *    - DMI: Included in total DMI
 *    - Crude Protein (CP): Body Weight * 0.8 g/day
 *    - TDN: Body Weight * 0.0075 kg/day
 * 
 * 3. Milk Production Requirements (per Litre):
 *    - Cow (approx 4.0% fat): ~45g CP, ~0.32 kg TDN
 *    - Buffalo (approx 7.0% fat): ~55g CP, ~0.38 kg TDN
 */

export const DEFAULT_FEED_LIBRARY: Record<string, { name: string; dmPct: number; cpPct: number; tdnPct: number }> = {
  // Green Fodders
  maize_green: { name: 'Fresh Green Maize Fodder', dmPct: 22.0, cpPct: 8.5, tdnPct: 62.0 },
  berseem_green: { name: 'Fresh Berseem (Lucerne) Fodder', dmPct: 18.0, cpPct: 18.0, tdnPct: 65.0 },
  napier_hybrid: { name: 'Hybrid Napier Grass', dmPct: 20.0, cpPct: 7.8, tdnPct: 58.0 },
  maize_silage: { name: 'Standard Maize Silage', dmPct: 33.0, cpPct: 8.8, tdnPct: 68.0 },

  // Dry Fodders
  wheat_bhusa: { name: 'Wheat Straw (Bhusa)', dmPct: 90.0, cpPct: 3.5, tdnPct: 42.0 },
  paddy_straw: { name: 'Paddy (Rice) Straw', dmPct: 88.0, cpPct: 3.0, tdnPct: 40.0 },
  sorghum_stover: { name: 'Sorghum Stover (Kadbi)', dmPct: 89.0, cpPct: 4.0, tdnPct: 45.0 },

  // Concentrates
  standard_pellets: { name: 'BIS Type II Cattle Pellets', dmPct: 90.0, cpPct: 20.0, tdnPct: 70.0 },
  cottonseed_cake: { name: 'Decorticated Cottonseed Cake', dmPct: 91.0, cpPct: 22.0, tdnPct: 72.0 },
  mustard_khal: { name: 'Mustard Oil Cake (Sarson Khal)', dmPct: 90.0, cpPct: 34.0, tdnPct: 74.0 },
  maize_grain_cracked: { name: 'Cracked Maize Grain', dmPct: 88.0, cpPct: 9.0, tdnPct: 82.0 },
};

export function calculatePrecisionRation(
  cow: CowProfile,
  slotOverrides?: {
    greenFreshKg?: number;
    dryFreshKg?: number;
    concFreshKg?: number;
    activeSample?: FeedSample;
  }
): RationPlan {
  // 1. Calculate Required Intake
  const dmiFactor = cow.breed.includes('Cross') ? 0.03 : (cow.breed.includes('Buffalo') ? 0.028 : 0.025);
  const dmiTotalRequiredKg = +(cow.weightKg * dmiFactor).toFixed(2);

  const cpMaintenance = cow.weightKg * 0.8;
  const cpPerLiter = cow.breed.includes('Buffalo') ? 55 : 45;
  const cpTotalRequiredGrams = Math.round(cpMaintenance + (cow.dailyMilkYieldLiters * cpPerLiter));

  const tdnMaintenance = cow.weightKg * 0.0075;
  const tdnPerLiter = cow.breed.includes('Buffalo') ? 0.38 : 0.32;
  const tdnTotalRequiredKg = +(tdnMaintenance + (cow.dailyMilkYieldLiters * tdnPerLiter)).toFixed(2);

  // 2. Default standard feeding proportions (DM basis: 40% green, 30% dry, 30% conc)
  const defaultGreenFreshKg = +( (dmiTotalRequiredKg * 0.40) / 0.22 ).toFixed(1);
  const defaultDryFreshKg = +( (dmiTotalRequiredKg * 0.30) / 0.90 ).toFixed(1);
  const defaultConcFreshKg = +( (dmiTotalRequiredKg * 0.30) / 0.90 ).toFixed(1);

  const greenFreshKg = slotOverrides?.greenFreshKg ?? defaultGreenFreshKg;
  const dryFreshKg = slotOverrides?.dryFreshKg ?? defaultDryFreshKg;
  const concFreshKg = slotOverrides?.concFreshKg ?? defaultConcFreshKg;

  // 3. Build Slots
  const active = slotOverrides?.activeSample;

  // Green Slot
  let greenItem: RationSlotItem = {
    slot: 'green_fodder',
    feedName: DEFAULT_FEED_LIBRARY.maize_silage.name,
    feedCategory: 'silage',
    freshKg: greenFreshKg,
    dryMatterPct: DEFAULT_FEED_LIBRARY.maize_silage.dmPct,
    crudeProteinPct: DEFAULT_FEED_LIBRARY.maize_silage.cpPct,
    tdnPct: DEFAULT_FEED_LIBRARY.maize_silage.tdnPct,
    isCustomOrTested: false,
  };

  // If active sample is silage or green fodder, use its real tested metrics (or standard library fallback if pending lab)!
  if (active && (active.category === 'silage' || active.category === 'green_fodder')) {
    const defaultGreen = active.category === 'silage' ? DEFAULT_FEED_LIBRARY.maize_silage : DEFAULT_FEED_LIBRARY.berseem_green;
    greenItem = {
      slot: 'green_fodder',
      feedName: active.name,
      feedCategory: active.category,
      freshKg: greenFreshKg,
      dryMatterPct: active.metrics.dryMatter ?? defaultGreen.dmPct,
      crudeProteinPct: active.metrics.crudeProtein ?? defaultGreen.cpPct,
      tdnPct: active.metrics.totalDigestibleNutrients ?? defaultGreen.tdnPct,
      isCustomOrTested: !active.metrics.requiresLabTest,
    };
  }

  // Dry Slot
  let dryItem: RationSlotItem = {
    slot: 'dry_fodder',
    feedName: DEFAULT_FEED_LIBRARY.wheat_bhusa.name,
    feedCategory: 'dry_fodder',
    freshKg: dryFreshKg,
    dryMatterPct: DEFAULT_FEED_LIBRARY.wheat_bhusa.dmPct,
    crudeProteinPct: DEFAULT_FEED_LIBRARY.wheat_bhusa.cpPct,
    tdnPct: DEFAULT_FEED_LIBRARY.wheat_bhusa.tdnPct,
    isCustomOrTested: false,
  };
  if (active && active.category === 'dry_fodder') {
    dryItem = {
      slot: 'dry_fodder',
      feedName: active.name,
      feedCategory: 'dry_fodder',
      freshKg: dryFreshKg,
      dryMatterPct: active.metrics.dryMatter ?? DEFAULT_FEED_LIBRARY.wheat_bhusa.dmPct,
      crudeProteinPct: active.metrics.crudeProtein ?? DEFAULT_FEED_LIBRARY.wheat_bhusa.cpPct,
      tdnPct: active.metrics.totalDigestibleNutrients ?? DEFAULT_FEED_LIBRARY.wheat_bhusa.tdnPct,
      isCustomOrTested: !active.metrics.requiresLabTest,
    };
  }

  // Concentrate Slot
  let concItem: RationSlotItem = {
    slot: 'concentrate',
    feedName: DEFAULT_FEED_LIBRARY.standard_pellets.name,
    feedCategory: 'concentrate',
    freshKg: concFreshKg,
    dryMatterPct: DEFAULT_FEED_LIBRARY.standard_pellets.dmPct,
    crudeProteinPct: DEFAULT_FEED_LIBRARY.standard_pellets.cpPct,
    tdnPct: DEFAULT_FEED_LIBRARY.standard_pellets.tdnPct,
    isCustomOrTested: false,
  };
  if (active && active.category === 'concentrate') {
    concItem = {
      slot: 'concentrate',
      feedName: active.name,
      feedCategory: 'concentrate',
      freshKg: concFreshKg,
      dryMatterPct: active.metrics.dryMatter ?? DEFAULT_FEED_LIBRARY.standard_pellets.dmPct,
      crudeProteinPct: active.metrics.crudeProtein ?? DEFAULT_FEED_LIBRARY.standard_pellets.cpPct,
      tdnPct: active.metrics.totalDigestibleNutrients ?? DEFAULT_FEED_LIBRARY.standard_pellets.tdnPct,
      isCustomOrTested: !active.metrics.requiresLabTest,
    };
  }

  // 4. Calculate Composite Supplied Nutrition
  const greenDmKg = greenItem.freshKg * (greenItem.dryMatterPct / 100);
  const greenCpGrams = greenDmKg * (greenItem.crudeProteinPct / 100) * 1000;
  const greenTdnKg = greenDmKg * (greenItem.tdnPct / 100);

  const dryDmKg = dryItem.freshKg * (dryItem.dryMatterPct / 100);
  const dryCpGrams = dryDmKg * (dryItem.crudeProteinPct / 100) * 1000;
  const dryTdnKg = dryDmKg * (dryItem.tdnPct / 100);

  const concDmKg = concItem.freshKg * (concItem.dryMatterPct / 100);
  const concCpGrams = concDmKg * (concItem.crudeProteinPct / 100) * 1000;
  const concTdnKg = concDmKg * (concItem.tdnPct / 100);

  const totalDmiSuppliedKg = +(greenDmKg + dryDmKg + concDmKg).toFixed(2);
  const totalCpSuppliedGrams = Math.round(greenCpGrams + dryCpGrams + concCpGrams);
  const totalTdnSuppliedKg = +(greenTdnKg + dryTdnKg + concTdnKg).toFixed(2);

  // 5. Balance Calculations
  const dmiDeficitSurplusKg = +(totalDmiSuppliedKg - dmiTotalRequiredKg).toFixed(2);
  const cpDeficitSurplusGrams = totalCpSuppliedGrams - cpTotalRequiredGrams;
  const tdnDeficitSurplusKg = +(totalTdnSuppliedKg - tdnTotalRequiredKg).toFixed(2);

  const isBalanced = Math.abs(cpDeficitSurplusGrams) <= 150 && Math.abs(tdnDeficitSurplusKg) <= 0.8;

  let recommendationAlert = 'Ration meets standard ICAR nutritional balance for targeted milk production.';

  if (cpDeficitSurplusGrams < -150) {
    const extraCakeGrams = Math.round(Math.abs(cpDeficitSurplusGrams) / 0.32); // Mustard cake ~32% CP
    recommendationAlert = `Daily Crude Protein deficit of ${Math.abs(cpDeficitSurplusGrams)}g detected. Consider supplementing with ${extraCakeGrams}g mustard oil cake (sarson khal) or bypass protein.`;
  } else if (cpDeficitSurplusGrams > 250) {
    recommendationAlert = `Protein surplus of ${cpDeficitSurplusGrams}g detected. You may optimize costly concentrate portions by 300g-500g without impacting milk yield.`;
  }

  const mineralMixtureGrams = cow.dailyMilkYieldLiters > 12 ? 80 : 50;
  const commonSaltGrams = 35;

  return {
    cowId: cow.id,
    cowName: cow.name,
    dmiTotalRequiredKg,
    cpTotalRequiredGrams,
    tdnTotalRequiredKg,
    slots: [greenItem, dryItem, concItem],
    suppliedTotals: {
      dmiKg: totalDmiSuppliedKg,
      cpGrams: totalCpSuppliedGrams,
      tdnKg: totalTdnSuppliedKg,
    },
    balance: {
      dmiDeficitSurplusKg,
      cpDeficitSurplusGrams,
      tdnDeficitSurplusKg,
      isBalanced,
    },
    mineralMixtureGrams,
    commonSaltGrams,
    recommendationAlert,
    veterinaryNotice: 'Ration formulations should be transitioned gradually over 5-7 days to allow rumen microbial adaptation.',
  };
}
