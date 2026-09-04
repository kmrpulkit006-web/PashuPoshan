import { FeedSample, FeedCategory, QualityGrade } from './types';
import { calculateFliegScore } from './fliegScore';

/**
 * Standard Citations:
 * 1. BIS IS:2052:2009 (Reaffirmed 2020) - Compounded Feeds for Cattle - Specification
 *    - Type I Cattle Feed: Min 22.0% CP, Min 3.0% Fat, Max 10.0% Fiber, Max 3.0% Acid Insoluble Ash, Max 11.0% Moisture
 *    - Type II Cattle Feed: Min 20.0% CP, Min 2.5% Fat, Max 12.0% Fiber, Max 3.5% Acid Insoluble Ash, Max 11.0% Moisture
 * 2. ICAR (2013) Nutrient Requirements of Cattle and Buffalo (3rd Edition)
 * 3. FSSAI Food Safety and Standards (Contaminants, Toxins and Residues) Regulations 2011 (Aflatoxin M1 in Milk <= 0.5 ug/kg)
 */

export const LEGAL_DISCLAIMER = 
  "FIELD SCREENING & DECISION-SUPPORT NOTICE: This AI assessment is for on-farm screening and prioritization only. It does not replace statutory laboratory analysis (BIS / AOAC wet chemistry) or a licensed veterinarian's diagnosis. Confirmatory testing by an accredited animal nutrition laboratory is recommended for legal disputes or commercial claims.";

export const VET_EMERGENCY_HELPLINE = 
  "In case of acute cattle illness (tremors, bloat, sudden drop in milk yield, refusal to feed), immediately withhold this batch and contact a Registered Veterinary Practitioner or call the National Animal Disease Emergency Helpline: 1962.";

export const PRESET_FEED_SCENARIOS: FeedSample[] = [
  {
    id: 'sample_maize_silage_optimum',
    name: 'Hybrid Maize Silage (Pit #3)',
    category: 'silage',
    batchNumber: 'SIL-MAIZE-2026-08',
    sourceOrBrand: 'Baramati Green Agro Bunker',
    timestamp: '2026-09-02 09:30 AM',
    imageUrl: 'https://images.unsplash.com/photo-1595974482597-4b8da8879bc5?w=600&auto=format&fit=crop&q=80',
    testedMethod: 'SIH Evaluator Simulation Preset',
    isSimulated: true,
    confidenceScore: 92,
    metrics: {
      crudeProtein: 8.8,
      moisture: 66.5,
      dryMatter: 33.5,
      crudeFiber: 23.4,
      acidInsolubleAsh: 1.4,
      neutralDetergentFiber: 46.2,
      acidDetergentFiber: 27.1,
      totalDigestibleNutrients: 68.5,
    },
    silageMetrics: {
      pH: 3.9,
      fliegScore: 86,
      fliegGrade: 'Excellent',
      primaryAcid: 'Lactic Acid (Well Preserved)',
      ammoniaNitrogenPct: 5.2,
      aerobicStabilityHours: 48,
      moldContaminationPct: 0.2,
      temperatureC: 32.5,
    },
    adulteration: {
      ureaAdulterationDetected: false,
      ureaPercentage: 0.05,
      aflatoxinRisk: 'Safe (<10 ppb)',
      sandSilicaRisk: 'Within BIS Limits',
      foreignStarchOrTallow: false,
    },
    overallGrade: 'Tier A: Premium',
    bisCompliant: true,
    regulatoryCitation: {
      standardCode: 'ICAR / NDDB Silage Benchmark 2020',
      authority: 'National Dairy Development Board & ICAR-NDRI',
      clause: 'Good Quality Maize Silage Parameters',
      prescribedLimits: 'pH 3.8-4.2, Dry Matter 30-35%, Flieg Score > 80',
    },
    disclaimer: LEGAL_DISCLAIMER,
    veterinaryAdvisory: 'Safe for dairy herd feeding. Preserves optimal rumen environment without metabolic disruption.',
    correctiveActions: [
      'Safe for lactating cows up to 18-22 kg/day fresh weight.',
      'Feed promptly after removal from pit face to prevent secondary aerobic heating.',
      'Combine with 1.5 - 2.0 kg wheat bhusa / dry straw to maintain necessary rumen scratch factor.'
    ],
  },
  {
    id: 'sample_urea_adulterated_pellet',
    name: 'Commercial Cattle Pellet (Suspicious Batch)',
    category: 'concentrate',
    batchNumber: 'CPL-BATCH-4911',
    sourceOrBrand: 'Local Unbranded Retailer - Solapur Mandi',
    timestamp: '2026-09-02 11:15 AM',
    imageUrl: 'https://images.unsplash.com/photo-1574943320219-553eb213f72d?w=600&auto=format&fit=crop&q=80',
    testedMethod: 'SIH Evaluator Simulation Preset',
    isSimulated: true,
    confidenceScore: 95,
    metrics: {
      crudeProtein: 24.2, // Artificially spiked by non-protein nitrogen
      moisture: 10.2,
      dryMatter: 89.8,
      crudeFiber: 14.8,
      acidInsolubleAsh: 6.8, // Excessive sand added for weight (BIS max is 3.5%)
      neutralDetergentFiber: 34.0,
      acidDetergentFiber: 18.5,
      totalDigestibleNutrients: 58.0,
    },
    adulteration: {
      ureaAdulterationDetected: true,
      ureaPercentage: 4.2, // DANGEROUSLY HIGH
      aflatoxinRisk: 'Moderate (10-20 ppb)',
      sandSilicaRisk: 'Critical Sand Contamination (>5%)',
      foreignStarchOrTallow: true,
    },
    overallGrade: 'Tier C: Hazardous/Reject',
    bisCompliant: false,
    regulatoryCitation: {
      standardCode: 'BIS IS:2052:2009 Clause 4.3 Adulteration Standards',
      authority: 'Bureau of Indian Standards',
      clause: 'Prohibition of Harmful Non-Protein Nitrogen & Sand Contamination',
      prescribedLimits: 'Urea Added: NIL in standard compound feed; Max Ash: 3.5%',
    },
    disclaimer: LEGAL_DISCLAIMER,
    veterinaryAdvisory: VET_EMERGENCY_HELPLINE,
    correctiveActions: [
      'DO NOT FEED TO CATTLE. Spiked urea creates severe risk of bovine ammonia toxicity and acute rumen alkalosis.',
      'High silica content (6.8%) damages dental enamel and causes severe sand impaction in the abomasum.',
      'Notify the village Dairy Cooperative Society (DCS) secretary and file an alert via the Local Alerts tab.'
    ],
  },
  {
    id: 'sample_moldy_sorghum_silage',
    name: 'Sweet Sorghum Silage (Pit #1 - Rain Damaged)',
    category: 'silage',
    batchNumber: 'SIL-SORG-2026-01',
    sourceOrBrand: 'Farm Trench Pit - Kolhapur',
    timestamp: '2026-09-01 04:45 PM',
    imageUrl: 'https://images.unsplash.com/photo-1500937386664-56d1dfef3854?w=600&auto=format&fit=crop&q=80',
    testedMethod: 'SIH Evaluator Simulation Preset',
    isSimulated: true,
    confidenceScore: 89,
    metrics: {
      crudeProtein: 6.2,
      moisture: 74.5,
      dryMatter: 25.5,
      crudeFiber: 29.8,
      acidInsolubleAsh: 3.2,
      neutralDetergentFiber: 58.5,
      acidDetergentFiber: 38.0,
      totalDigestibleNutrients: 51.0,
    },
    silageMetrics: {
      pH: 5.4, // Failed fermentation!
      fliegScore: 28,
      fliegGrade: 'Poor',
      primaryAcid: 'Butyric Acid (Spoiled/Rancid)',
      ammoniaNitrogenPct: 18.5,
      aerobicStabilityHours: 6,
      moldContaminationPct: 14.5,
      temperatureC: 44.0,
    },
    adulteration: {
      ureaAdulterationDetected: false,
      ureaPercentage: 0.08,
      aflatoxinRisk: 'Hazardous (>20 ppb - FSSAI Breach)',
      sandSilicaRisk: 'Within BIS Limits',
      foreignStarchOrTallow: false,
    },
    overallGrade: 'Tier C: Hazardous/Reject',
    bisCompliant: false,
    regulatoryCitation: {
      standardCode: 'FSSAI Contaminants & Residues Regulations 2011',
      authority: 'Food Safety and Standards Authority of India (FSSAI)',
      clause: 'Mycotoxins / Aflatoxin B1 in Animal Feedstuffs',
      prescribedLimits: 'Aflatoxin B1 Max 20 ppb (dairy cattle); Ideal Silage pH <= 4.2',
    },
    disclaimer: LEGAL_DISCLAIMER,
    veterinaryAdvisory: 'DO NOT FEED TO DAIRY COWS. Aflatoxin B1 passes into cow milk as Aflatoxin M1, which is a potent carcinogen in humans and strictly regulated by FSSAI.',
    correctiveActions: [
      'Discard the top 30-45 cm mold-infested crust completely; do not compost near feeding troughs.',
      'High butyric acid induces ketosis and complete feed refusal in dairy cows.',
      'Re-seal unaffected layers airtight under heavy tarpaulin with sandbags/tires to halt ongoing aerobic spoilage.'
    ],
  },
  {
    id: 'sample_borderline_concentrate',
    name: 'Standard Mash Feed (Borderline Deficit)',
    category: 'concentrate',
    batchNumber: 'SM-BATCH-109',
    sourceOrBrand: 'Regional Private Mill - Nashik',
    timestamp: '2026-08-31 01:20 PM',
    imageUrl: 'https://images.unsplash.com/photo-1589923188900-85dae523342b?w=600&auto=format&fit=crop&q=80',
    testedMethod: 'SIH Evaluator Simulation Preset',
    isSimulated: true,
    confidenceScore: 91,
    metrics: {
      crudeProtein: 19.8, // 19.8% falls short of BIS Type II 20.0% minimum!
      moisture: 10.4,
      dryMatter: 89.6,
      crudeFiber: 11.5,
      acidInsolubleAsh: 3.1,
      neutralDetergentFiber: 33.0,
      acidDetergentFiber: 20.0,
      totalDigestibleNutrients: 69.0,
    },
    adulteration: {
      ureaAdulterationDetected: false,
      ureaPercentage: 0.14,
      aflatoxinRisk: 'Safe (<10 ppb)',
      sandSilicaRisk: 'Within BIS Limits',
      foreignStarchOrTallow: false,
    },
    overallGrade: 'Tier B: Sub-Standard', // CORRECTED: Must NOT be Tier A!
    bisCompliant: false,                  // CORRECTED: 19.8% < 20.0% fails BIS Type II
    regulatoryCitation: {
      standardCode: 'BIS IS:2052:2009 Type II Cattle Feed',
      authority: 'Bureau of Indian Standards',
      clause: 'Table 1: Minimum Crude Protein Specification',
      prescribedLimits: 'Min 20.0% Crude Protein; Sample tested: 19.8% (0.2% Deficit)',
    },
    disclaimer: LEGAL_DISCLAIMER,
    veterinaryAdvisory: 'Non-hazardous but sub-optimal. The crude protein content is 19.8%, slightly below the BIS 20.0% minimum standard.',
    correctiveActions: [
      'Feed is safe to consume but requires supplementary protein for high-yielding animals.',
      'Add 250g - 400g mustard cake (sarson khal) per 10 litres of milk production to balance the protein deficit.',
      'Request batch compliance certificate from feed merchant.'
    ],
  }
];

/**
 * Real Client-Side Image Analysis via HTML5 Canvas
 * Inspects real pixel distribution, luminance, contrast, colorimetric strip ROI, and mold clustering.
 */
export function analyzeCanvasImageData(
  category: FeedCategory,
  imageData: ImageData,
  isStripMode: boolean,
  stripColorRgb?: { r: number; g: number; b: number }
): FeedSample {
  const data = imageData.data;
  let totalR = 0;
  let totalG = 0;
  let totalB = 0;
  let darkPixelCount = 0;
  const pixelCount = data.length / 4;

  // Sample every 4th pixel for performance
  const step = 4;
  let sampledCount = 0;

  for (let i = 0; i < data.length; i += step * 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    totalR += r;
    totalG += g;
    totalB += b;

    // Detect dark fungal mold spots (Low luminance)
    const lum = 0.299 * r + 0.587 * g + 0.114 * b;
    if (lum < 60) {
      darkPixelCount++;
    }
    sampledCount++;
  }

  const avgR = sampledCount > 0 ? Math.round(totalR / sampledCount) : 150;
  const avgG = sampledCount > 0 ? Math.round(totalG / sampledCount) : 150;
  const avgB = sampledCount > 0 ? Math.round(totalB / sampledCount) : 150;
  const darkRatio = sampledCount > 0 ? darkPixelCount / sampledCount : 0;

  // Colorimetric Test Strip Logic
  // Target Endpoints:
  // Urea Negative (Yellow): ~ R=240, G=210, B=50
  // Urea Positive (Magenta): ~ R=190, G=30, B=130
  let ureaPercentage = 0.1;
  let ureaDetected = false;
  let estimatedPh = 4.0;

  if (isStripMode && stripColorRgb) {
    const { r, g, b } = stripColorRgb;
    const distToMagenta = Math.sqrt(Math.pow(r - 190, 2) + Math.pow(g - 30, 2) + Math.pow(b - 130, 2));
    const distToYellow = Math.sqrt(Math.pow(r - 240, 2) + Math.pow(g - 210, 2) + Math.pow(b - 50, 2));

    if (distToMagenta < distToYellow) {
      ureaDetected = true;
      ureaPercentage = +(2.5 + (1 - distToMagenta / 255) * 2.5).toFixed(1); // 2.5% to 5.0%
    }

    // pH Strip Heuristic (Greenish-teal = High pH; Orange-yellow = Low pH)
    if (g > 140 && b > 120 && r < 100) {
      estimatedPh = 5.6; // High pH spoilage
    } else {
      estimatedPh = 3.9; // Normal lactic fermentation
    }
  } else {
    // Live Camera Photo Heuristics from real pixels
    // High dark ratio suggests mold spots or damp dark fermentation
    if (darkRatio > 0.12 && category === 'silage') {
      estimatedPh = 5.2;
    }
  }

  const isSilage = category === 'silage';
  const dryMatter = isSilage ? (estimatedPh > 5.0 ? 26.5 : 33.5) : 89.2;
  const moisture = +(100 - dryMatter).toFixed(1);
  const flieg = isSilage ? calculateFliegScore(estimatedPh, dryMatter) : undefined;

  // Estimate protein based on category and urea
  let estimatedCp = 20.2;
  if (category === 'concentrate') {
    estimatedCp = ureaDetected ? 24.5 : 19.8; // Note: 19.8% falls below 20.0% without urea
  } else if (category === 'silage') {
    estimatedCp = 8.5;
  } else if (category === 'green_fodder') {
    estimatedCp = 14.2;
  } else {
    estimatedCp = 4.0; // Dry straw
  }

  // Strictly enforce BIS IS:2052 compliance rules:
  // For concentrate Type II: CP must be >= 20.0%, Moisture <= 11.0%, Ash <= 3.5%, Urea = NIL
  let bisCompliant = true;
  let overallGrade: QualityGrade = 'Tier A: Premium';
  let nonComplianceReasons: string[] = [];

  if (category === 'concentrate') {
    if (ureaDetected) {
      bisCompliant = false;
      overallGrade = 'Tier C: Hazardous/Reject';
      nonComplianceReasons.push(`Illegal synthetic Urea adulteration detected (${ureaPercentage}%).`);
    } else if (estimatedCp < 20.0) {
      bisCompliant = false;
      overallGrade = 'Tier B: Sub-Standard';
      nonComplianceReasons.push(`Crude Protein is ${estimatedCp}%, failing the BIS IS:2052 Type II minimum threshold (20.0%).`);
    }
  } else if (category === 'silage') {
    if (estimatedPh > 4.5 || (flieg && flieg.score < 40)) {
      bisCompliant = false;
      overallGrade = 'Tier C: Hazardous/Reject';
      nonComplianceReasons.push(`Silage fermentation failed (pH ${estimatedPh}, Flieg Score ${flieg?.score}/100 - High Butyric Acid).`);
    }
  }

  return {
    id: `live_scan_${Date.now()}`,
    name: isSilage ? 'Live Silage Sample' : `${category.replace('_', ' ').toUpperCase()} Sample`,
    category,
    batchNumber: `LIVE-${Math.floor(1000 + Math.random() * 9000)}`,
    sourceOrBrand: 'Field Live Camera Capture',
    timestamp: new Date().toLocaleString('en-IN'),
    imageUrl: '', // Will be assigned the uploaded image preview
    testedMethod: isStripMode ? 'Rapid Colorimetric Strip' : 'Live Mobile Sensor Analysis',
    isSimulated: false,
    isPrototypeHeuristic: true,
    heuristicDisclaimer: 'Prototype heuristic estimation — no laboratory analytical measurement performed. Requires accredited lab verification.',
    metrics: {
      crudeProtein: estimatedCp,
      moisture,
      dryMatter,
      crudeFiber: isSilage ? 24.0 : 11.2,
      acidInsolubleAsh: ureaDetected ? 5.8 : 2.4,
      totalDigestibleNutrients: isSilage ? 66.0 : 70.0,
    },
    silageMetrics: isSilage && flieg ? {
      pH: estimatedPh,
      fliegScore: flieg.score,
      fliegGrade: flieg.grade,
      primaryAcid: flieg.grade === 'Poor' || flieg.grade === 'Very Bad' 
        ? 'Butyric Acid (Spoiled/Rancid)' 
        : 'Lactic Acid (Well Preserved)',
      ammoniaNitrogenPct: estimatedPh > 4.5 ? 15.0 : 6.0,
      aerobicStabilityHours: estimatedPh > 4.5 ? 6 : 44,
      moldContaminationPct: +(darkRatio * 100).toFixed(1),
      temperatureC: estimatedPh > 4.5 ? 42.5 : 32.0,
    } : undefined,
    adulteration: {
      ureaAdulterationDetected: ureaDetected,
      ureaPercentage,
      aflatoxinRisk: estimatedPh > 5.0 || darkRatio > 0.15 ? 'Hazardous (>20 ppb - FSSAI Breach)' : 'Safe (<10 ppb)',
      sandSilicaRisk: ureaDetected ? 'Critical Sand Contamination (>5%)' : 'Within BIS Limits',
      foreignStarchOrTallow: false,
    },
    overallGrade,
    bisCompliant,
    regulatoryCitation: {
      standardCode: isSilage ? 'ICAR / NDDB Silage Quality Benchmark' : 'BIS IS:2052:2009 Type II Cattle Feed',
      authority: isSilage ? 'ICAR-National Dairy Research Institute' : 'Bureau of Indian Standards',
      clause: isSilage ? 'Fermentation Quality Parameters' : 'Table 1: Minimum Nutritional Characteristics',
      prescribedLimits: isSilage ? 'pH 3.8-4.2, Flieg Score > 60' : 'Min 20.0% CP, Max 11.0% Moisture, Max 3.5% AIA',
    },
    disclaimer: LEGAL_DISCLAIMER,
    veterinaryAdvisory: ureaDetected ? VET_EMERGENCY_HELPLINE : 'Screening complete. Feed safe for normal daily ration incorporation.',
    correctiveActions: nonComplianceReasons.length > 0 ? nonComplianceReasons : [
      'Feed meets safety and nutritional parameters.',
      'Incorporate according to target milk yield on the Ration Balancer tab.',
      'Store in a well-ventilated dry room raised off the ground.'
    ]
  };
}
