export type Locale = 'en' | 'hi' | 'mr' | 'gu' | 'pa';

export type FeedCategory = 
  | 'concentrate'    // Compounded cattle feed pellets, mash, oil cakes (khal)
  | 'silage'         // Fermented maize, sorghum, pearl millet, oats
  | 'green_fodder'   // Berseem, Lucerne, Hybrid Napier, Maize green
  | 'dry_fodder';    // Wheat bhusa, Paddy straw, Kadbi

export type QualityGrade = 
  | 'Tier A: Premium' 
  | 'Tier B: Sub-Standard' 
  | 'Tier C: Hazardous/Reject';

export type FliegGrade = 'Excellent' | 'Good' | 'Medium' | 'Poor' | 'Very Bad';

export interface NutritionMetrics {
  crudeProtein: number;          // % on Dry Matter basis (e.g., 18.5%)
  moisture: number;              // % moisture content
  dryMatter: number;             // % dry matter (100 - moisture)
  crudeFiber: number;            // % crude fiber
  acidInsolubleAsh: number;      // % Sand/Silica/Dirt (BIS limit max 2.5-3.5%)
  neutralDetergentFiber?: number;// % NDF
  acidDetergentFiber?: number;   // % ADF
  totalDigestibleNutrients: number; // % TDN (Energy estimate)
}

export interface SilageMetrics {
  pH: number;                    // Target 3.8 - 4.2
  fliegScore: number;            // 0 - 100
  fliegGrade: FliegGrade;
  primaryAcid: 'Lactic Acid (Well Preserved)' | 'Acetic Acid (Moderate)' | 'Butyric Acid (Spoiled/Rancid)';
  ammoniaNitrogenPct: number;    // NH3-N of total N (<10% good, >15% poor)
  aerobicStabilityHours: number; // Hours before heating up
  moldContaminationPct: number;  // % visual surface mold
  temperatureC: number;          // Pit internal temp (30-38C normal)
}

export interface AdulterationCheck {
  ureaAdulterationDetected: boolean;
  ureaPercentage: number;        // Normally <0.2% natural, spiked feeds have >1.0%
  aflatoxinRisk: 'Safe (<10 ppb)' | 'Moderate (10-20 ppb)' | 'Hazardous (>20 ppb - FSSAI Breach)';
  sandSilicaRisk: 'Within BIS Limits' | 'Moderate Sand (<3.5%)' | 'Critical Sand Contamination (>5%)';
  foreignStarchOrTallow: boolean;
}

export interface RegulatoryCitation {
  standardCode: string;          // e.g. "BIS IS:2052:2009 (Reaffirmed 2020)"
  authority: string;             // e.g. "Bureau of Indian Standards"
  clause: string;                // e.g. "Table 1, Clause 4.2 - Compounded Cattle Feed"
  prescribedLimits: string;      // e.g. "Min 20.0% CP, Max 11.0% Moisture, Max 3.5% AIA"
}

export interface FeedSample {
  id: string;
  name: string;
  category: FeedCategory;
  batchNumber: string;
  sourceOrBrand: string;
  timestamp: string;
  imageUrl: string;
  testedMethod: 'Live Mobile Sensor Analysis' | 'Rapid Colorimetric Strip' | 'SIH Evaluator Simulation Preset';
  isSimulated: boolean;
  isPrototypeHeuristic?: boolean;
  heuristicDisclaimer?: string;
  confidenceScore?: number;       // e.g. 88%
  metrics: NutritionMetrics;
  silageMetrics?: SilageMetrics;
  adulteration: AdulterationCheck;
  overallGrade: QualityGrade;
  bisCompliant: boolean;
  regulatoryCitation: RegulatoryCitation;
  disclaimer: string;
  actionableSummary?: string;
  veterinaryAdvisory: string;
  correctiveActions: string[];
}

export interface CowProfile {
  id: string;
  tagNumber: string;
  name: string;
  breed: 'Gir' | 'Sahiwal' | 'Red Sindhi' | 'HF Crossbred' | 'Jersey Cross' | 'Murrah Buffalo';
  weightKg: number;
  lactationStage: 'Early (0-90 days)' | 'Mid (91-200 days)' | 'Late (>200 days)' | 'Dry Pregnant';
  dailyMilkYieldLiters: number;
  milkFatPct: number;
}

export interface RationSlotItem {
  slot: 'green_fodder' | 'dry_fodder' | 'concentrate' | 'mineral_mix';
  feedName: string;
  feedCategory: FeedCategory;
  freshKg: number;
  dryMatterPct: number;
  crudeProteinPct: number;
  tdnPct: number;
  isCustomOrTested: boolean;
}

export interface RationPlan {
  cowId: string;
  cowName: string;
  dmiTotalRequiredKg: number;
  cpTotalRequiredGrams: number;
  tdnTotalRequiredKg: number;
  slots: RationSlotItem[];
  suppliedTotals: {
    dmiKg: number;
    cpGrams: number;
    tdnKg: number;
  };
  balance: {
    dmiDeficitSurplusKg: number;
    cpDeficitSurplusGrams: number;
    tdnDeficitSurplusKg: number;
    isBalanced: boolean;
  };
  mineralMixtureGrams: number;
  commonSaltGrams: number;
  recommendationAlert: string;
  veterinaryNotice: string;
}

export interface SilagePitLog {
  id: string;
  date: string;
  temperatureC: number;
  compactionRating: 'Optimum (>650 kg/m3)' | 'Moderate' | 'Loose/Air-Pockets';
  pH?: number;
  notes: string;
}

export interface SilageBunker {
  id: string;
  pitName: string;
  cropType: 'Maize' | 'Sorghum' | 'Pearl Millet (Bajra)' | 'Oats';
  ensilingDate: string;
  daysFermented: number;
  compactionRating: 'Optimum (>650 kg/m3)' | 'Moderate' | 'Loose/Air-Pockets';
  coverIntegrity: 'Airtight Sealed' | 'Minor Pinholes' | 'Torn/Leaking';
  coreTemperature: number;
  status: 'Fermenting' | 'Ready to Feed' | 'Aerobic Heating Risk' | 'Spoiled Pit';
  logs: SilagePitLog[];
}

export interface CommunityFeedAlert {
  id: string;
  title: string;
  taluka: string;
  district: string;
  date: string;
  alertType: 'adulterated_batch' | 'aflatoxin_surge' | 'fodder_scarcity' | 'price_spike';
  severity: 'high' | 'medium' | 'info';
  brandOrCrop: string;
  description: string;
  reportedBy: string;
  verifiedByCoop: boolean;
  syncPending?: boolean;
}

export interface OfflineSyncItem {
  id: string;
  entityType: 'cow' | 'scan' | 'silage_pit' | 'community_alert';
  action: 'create' | 'update' | 'delete';
  payload: any;
  timestamp: string;
  synced: boolean;
}
