export type Locale =
  | 'hi'
  | 'en'
  | 'bn'
  | 'te'
  | 'mr'
  | 'ta'
  | 'gu'
  | 'kn'
  | 'ml'
  | 'pa'
  | 'or'
  | 'as'
  | 'ur'
  | 'sa'
  | 'kok'
  | 'mai'
  | 'ne'
  | 'ks'
  | 'mni'
  | 'sd'
  | 'doi'
  | 'brx'
  | 'sat';

export interface LanguageMeta {
  code: string;
  nativeName: string;
  englishName: string;
  direction?: 'ltr' | 'rtl';
}

export const SUPPORTED_LANGUAGES: readonly LanguageMeta[] = [
  { code: 'hi', nativeName: 'हिंदी', englishName: 'Hindi', direction: 'ltr' },
  { code: 'en', nativeName: 'English', englishName: 'English', direction: 'ltr' },
  { code: 'bn', nativeName: 'বাংলা', englishName: 'Bengali', direction: 'ltr' },
  { code: 'te', nativeName: 'తెలుగు', englishName: 'Telugu', direction: 'ltr' },
  { code: 'mr', nativeName: 'मराठी', englishName: 'Marathi', direction: 'ltr' },
  { code: 'ta', nativeName: 'தமிழ்', englishName: 'Tamil', direction: 'ltr' },
  { code: 'gu', nativeName: 'ગુજરાતી', englishName: 'Gujarati', direction: 'ltr' },
  { code: 'kn', nativeName: 'ಕನ್ನಡ', englishName: 'Kannada', direction: 'ltr' },
  { code: 'ml', nativeName: 'മലയാളം', englishName: 'Malayalam', direction: 'ltr' },
  { code: 'pa', nativeName: 'ਪੰਜਾਬੀ', englishName: 'Punjabi', direction: 'ltr' },
  { code: 'or', nativeName: 'ଓଡ଼ିଆ', englishName: 'Odia', direction: 'ltr' },
  { code: 'as', nativeName: 'অসমীয়া', englishName: 'Assamese', direction: 'ltr' },
  { code: 'ur', nativeName: 'اردو', englishName: 'Urdu', direction: 'rtl' },
  { code: 'sa', nativeName: 'संस्कृतम्', englishName: 'Sanskrit', direction: 'ltr' },
  { code: 'kok', nativeName: 'कोंकणी', englishName: 'Konkani', direction: 'ltr' },
  { code: 'mai', nativeName: 'मैथिली', englishName: 'Maithili', direction: 'ltr' },
  { code: 'ne', nativeName: 'नेपाली', englishName: 'Nepali', direction: 'ltr' },
  { code: 'ks', nativeName: 'کٲشُر / कश्मीरी', englishName: 'Kashmiri', direction: 'rtl' },
  { code: 'mni', nativeName: 'মৈতৈলোন্', englishName: 'Manipuri', direction: 'ltr' },
  { code: 'sd', nativeName: 'سنڌي / सिंधी', englishName: 'Sindhi', direction: 'rtl' },
  { code: 'doi', nativeName: 'डोगरी', englishName: 'Dogri', direction: 'ltr' },
  { code: 'brx', nativeName: 'बड़ो', englishName: 'Bodo', direction: 'ltr' },
  { code: 'sat', nativeName: 'ᱥᱟᱱᱛᱟᱲᱤ', englishName: 'Santali', direction: 'ltr' },
] as const;

export const SUPPORTED_LOCALES: readonly Locale[] = [
  'hi', 'en', 'bn', 'te', 'mr', 'ta', 'gu', 'kn', 'ml',
  'pa', 'or', 'as', 'ur', 'sa', 'kok', 'mai', 'ne', 'ks',
  'mni', 'sd', 'doi', 'brx', 'sat'
] as const;

export function isSupportedLocale(value: unknown): value is Locale {
  return typeof value === 'string' && (SUPPORTED_LOCALES as readonly string[]).includes(value);
}

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

export interface VisualAnalysisResult {
  isFeedSample: boolean;
  feedTypeIdentified?: string;
  rejectionReason?: 'none' | 'not_feed_or_fodder' | 'blurry_unreadable' | 'poor_lighting';
  rejectionMessage?: string;
  moldCoverageEstimate: 'none' | 'trace' | 'moderate' | 'heavy';
  colorDescription: string;
  foreignMatterVisible: boolean;
  foreignMatterDescription: string;
  overallVisualCondition: 'good' | 'fair' | 'poor' | 'invalid';
  providerNotes?: string;
}

export interface NutritionMetrics {
  crudeProtein?: number;          // % on Dry Matter basis (e.g., 18.5%) - LAB ONLY
  moisture?: number;              // % moisture content
  dryMatter?: number;             // % dry matter (100 - moisture)
  crudeFiber?: number;            // % crude fiber - LAB ONLY
  acidInsolubleAsh?: number;      // % Sand/Silica/Dirt (BIS limit max 2.5-3.5%) - LAB ONLY
  neutralDetergentFiber?: number;// % NDF - LAB ONLY
  acidDetergentFiber?: number;   // % ADF - LAB ONLY
  totalDigestibleNutrients?: number; // % TDN (Energy estimate) - LAB ONLY
  requiresLabTest?: boolean;      // True for live camera scans where wet chemistry is required
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
  aflatoxinRisk?: 'Safe (<10 ppb)' | 'Moderate (10-20 ppb)' | 'Hazardous (>20 ppb - FSSAI Breach)' | 'Requires Certified Lab Test';
  sandSilicaRisk?: 'Within BIS Limits' | 'Moderate Sand (<3.5%)' | 'Critical Sand Contamination (>5%)' | 'Requires Certified Lab Test';
  foreignStarchOrTallow: boolean;
  labVerifiedOnly?: boolean;     // Explicit flag: aflatoxin & silica require certified lab assay
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
  testedMethod: 'Live Mobile Sensor Analysis' | 'Rapid Colorimetric Strip' | 'SIH Evaluator Simulation Preset' | 'AI Vision Triage';
  isSimulated: boolean;
  isPrototypeHeuristic?: boolean;
  heuristicDisclaimer?: string;
  isNonFeedSample?: boolean;
  confidenceScore?: number;       // e.g. 88%
  visualAnalysis?: VisualAnalysisResult;
  stripReading?: {
    calibratedPh?: number;
    calibratedUreaPct?: number;
    deltaE00?: number;
    referenceCardDetected?: boolean;
  };
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
  offlineMoldHeuristic?: OfflineMoldHeuristicResult;
  linkedCowId?: string;
}

export interface CowYieldLogEntry {
  id: string;
  cowId: string;
  timestamp: string;
  dailyMilkYieldLiters: number;
  note?: string;
}

export interface OfflineMoldHeuristicResult {
  moldSuspicionLevel: 'none' | 'possible' | 'likely';
  affectedAreaPct: number;
  detectedSignatures: Array<'cottony_white' | 'olive_penicillium' | 'black_speckled'>;
  isPrototypeHeuristic: true;
  heuristicDisclaimer: string;
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
  createdAt?: string;
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
  state?: string;
  contaminant?: string;
  feedType?: string;
  advisory?: string;
  timestamp?: string;
}

export type OfflineSyncPayload =
  | CowProfile
  | FeedSample
  | SilageBunker
  | CommunityFeedAlert
  | CowYieldLogEntry
  | { id: string }
  | { pitId: string; log: SilagePitLog }
  | Record<string, unknown>;

export interface OfflineSyncItem {
  id: string;
  entityType: 'cow' | 'scan' | 'silage_pit' | 'community_alert' | 'yield_log';
  action: 'create' | 'update' | 'delete';
  payload: OfflineSyncPayload;
  timestamp: string;
  synced: boolean;
}
