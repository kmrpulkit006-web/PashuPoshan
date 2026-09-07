import { describe, it, expect } from 'vitest';
import {
  analyzeCanvasImageData,
  PRESET_FEED_SCENARIOS,
  LEGAL_DISCLAIMER,
  VET_EMERGENCY_HELPLINE,
  rgbToLab,
  ciede2000,
  computeAmbientCorrection,
  applyAmbientCorrection,
  matchPhDeltaE,
  matchUreaDeltaE,
  createFeedSampleFromVisualAnalysis,
  sampleCenterPatchRgb,
  samplePatchRgb,
  sampleStripModePatches,
  isReasonablyWhiteReference,
  KNOWN_REFERENCE_WHITE,
  UNIVERSAL_PH_REFERENCE_CHART,
  UREA_COLORIMETRIC_CHART,
  detectColorClusterMoldHeuristic,
} from '../lib/feedAnalysisEngine';
import { createOfflinePlaceholderSample } from '../lib/storage';

// Helper to construct a synthetic ImageData object for tests
function createSyntheticImageData(
  width: number,
  height: number,
  rgb: { r: number; g: number; b: number } | ((x: number, y: number) => { r: number; g: number; b: number })
): ImageData {
  const data = new Uint8ClampedArray(width * height * 4);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * 4;
      const color = typeof rgb === 'function' ? rgb(x, y) : rgb;
      data[idx] = color.r;
      data[idx + 1] = color.g;
      data[idx + 2] = color.b;
      data[idx + 3] = 255;
    }
  }
  return {
    data,
    width,
    height,
    colorSpace: 'srgb',
  } as ImageData;
}

describe('feedAnalysisEngine - analyzeCanvasImageData & Safety Logic', () => {
  describe('Strip Colorimetric Urea Detection Math', () => {
    it('detects urea adulteration when strip color is closer to Magenta than Yellow', () => {
      // Magenta test strip: ~ R=190, G=30, B=130
      const stripColor = { r: 195, g: 35, b: 125 };
      const neutralImage = createSyntheticImageData(60, 60, { r: 200, g: 200, b: 200 });

      const result = analyzeCanvasImageData('concentrate', neutralImage, true, stripColor);

      expect(result.adulteration.ureaAdulterationDetected).toBe(true);
      expect(result.adulteration.ureaPercentage).toBeGreaterThanOrEqual(1.0);
      expect(result.bisCompliant).toBe(false);
      expect(result.overallGrade).toBe('Tier C: Hazardous/Reject');
      expect(result.veterinaryAdvisory).toBe(VET_EMERGENCY_HELPLINE);
    });

    it('confirms negative urea when strip color is closer to Yellow', () => {
      // Yellow test strip: ~ R=240, G=210, B=50
      const stripColor = { r: 235, g: 205, b: 55 };
      const neutralImage = createSyntheticImageData(60, 60, { r: 200, g: 200, b: 200 });

      const result = analyzeCanvasImageData('concentrate', neutralImage, true, stripColor);

      expect(result.adulteration.ureaAdulterationDetected).toBe(false);
      expect(result.adulteration.ureaPercentage).toBe(0.1);
      // Clean triage visual scan without adulteration passes triage compliance
      expect(result.bisCompliant).toBe(true);
      expect(result.overallGrade).toBe('Tier A: Premium');
    });
  });

  describe('Colorimetric pH Strip & Silage Fermentation Heuristics', () => {
    it('detects high pH spoilage on greenish-teal strip reaction', () => {
      // Greenish/teal strip color corresponding to alkaline / high pH
      const tealStripColor = { r: 50, g: 170, b: 150 };
      const neutralImage = createSyntheticImageData(60, 60, { r: 180, g: 180, b: 150 });

      const result = analyzeCanvasImageData('silage', neutralImage, true, tealStripColor);

      expect(result.silageMetrics).toBeDefined();
      expect(result.silageMetrics?.pH).toBeGreaterThanOrEqual(5.0);
      expect(result.bisCompliant).toBe(false);
      expect(result.overallGrade).toBe('Tier C: Hazardous/Reject');
      expect(result.silageMetrics?.primaryAcid).toContain('Butyric');
      // Aflatoxin is never guessed from phone camera — flagged for certified lab test
      expect(result.adulteration.aflatoxinRisk).toBe('Requires Certified Lab Test');
    });

    it('estimates safe acidic pH (~4.0) for standard orange silage strip reaction', () => {
      // Orange Universal Indicator strip reaction (~pH 4.0: R=255, G=127, B=0)
      const orangeStripColor = { r: 245, g: 130, b: 10 };
      const neutralImage = createSyntheticImageData(60, 60, { r: 180, g: 180, b: 150 });

      const result = analyzeCanvasImageData('silage', neutralImage, true, orangeStripColor);

      expect(result.silageMetrics).toBeDefined();
      expect(result.silageMetrics?.pH).toBeLessThanOrEqual(4.5);
      expect(result.silageMetrics?.primaryAcid).toContain('Lactic');
      expect(result.bisCompliant).toBe(true);
      expect(result.overallGrade).toBe('Tier A: Premium');
    });
  });

  describe('Image Pixel Luminance & Mold Clustering Analysis', () => {
    it('detects mold contamination when dark pixels (lum < 60) exceed 12% in silage', () => {
      // Create an image where 30% of the pixels are very dark mold spots (R=10, G=10, B=10)
      const moldyImage = createSyntheticImageData(100, 100, (x, y) => {
        if (y < 30) {
          return { r: 10, g: 10, b: 10 }; // Dark mold pixel (lum < 60)
        }
        return { r: 180, g: 160, b: 100 }; // Normal silage fodder pixel
      });

      const result = analyzeCanvasImageData('silage', moldyImage, false);

      expect(result.silageMetrics).toBeDefined();
      expect(result.silageMetrics?.moldContaminationPct).toBeGreaterThan(12);
      expect(result.bisCompliant).toBe(false);
      expect(result.overallGrade).toBe('Tier C: Hazardous/Reject');
    });

    it('evaluates clean silage when dark pixels are minimal (< 5%)', () => {
      // Clean golden silage image
      const cleanImage = createSyntheticImageData(100, 100, { r: 190, g: 180, b: 90 });

      const result = analyzeCanvasImageData('silage', cleanImage, false);

      expect(result.silageMetrics).toBeDefined();
      expect(result.silageMetrics?.moldContaminationPct).toBeLessThan(5);
      expect(result.bisCompliant).toBe(true);
      expect(result.overallGrade).toBe('Tier A: Premium');
    });
  });

  describe('Honest Lab Boundaries (No Fabricated Chemistry)', () => {
    it('marks wet-chemistry metrics as requiring certified lab test instead of fabricating values', () => {
      const cleanImage = createSyntheticImageData(50, 50, { r: 180, g: 160, b: 120 });
      const result = analyzeCanvasImageData('concentrate', cleanImage, false);

      // Lab-only metrics must NOT be fabricated from phone camera
      expect(result.metrics.crudeProtein).toBeUndefined();
      expect(result.metrics.totalDigestibleNutrients).toBeUndefined();
      expect(result.metrics.acidInsolubleAsh).toBeUndefined();
      expect(result.metrics.requiresLabTest).toBe(true);
      expect(result.adulteration.labVerifiedOnly).toBe(true);
      expect(result.adulteration.aflatoxinRisk).toBe('Requires Certified Lab Test');
      expect(result.adulteration.sandSilicaRisk).toBe('Requires Certified Lab Test');
    });

    it('flags synthetic urea addition as immediate Tier C Hazardous Reject while leaving silica ash to lab', () => {
      const magentaColor = { r: 190, g: 30, b: 130 };
      const image = createSyntheticImageData(50, 50, { r: 150, g: 150, b: 150 });
      const result = analyzeCanvasImageData('concentrate', image, true, magentaColor);

      expect(result.adulteration.ureaAdulterationDetected).toBe(true);
      expect(result.adulteration.sandSilicaRisk).toBe('Requires Certified Lab Test');
      expect(result.metrics.acidInsolubleAsh).toBeUndefined();
      expect(result.bisCompliant).toBe(false);
      expect(result.overallGrade).toBe('Tier C: Hazardous/Reject');
      expect(result.veterinaryAdvisory).toBe(VET_EMERGENCY_HELPLINE);
    });
  });

  describe('Heuristic Metadata & Disclaimers', () => {
    it('tags every live scan with explicit field triage disclaimers and accredited lab advice', () => {
      const dummyImage = createSyntheticImageData(40, 40, { r: 120, g: 120, b: 120 });
      const result = analyzeCanvasImageData('green_fodder', dummyImage, false);

      expect(result.isSimulated).toBe(false);
      expect(result.isPrototypeHeuristic).toBe(true);
      expect(result.heuristicDisclaimer).toContain('Laboratory wet chemistry');
      expect(result.disclaimer).toBe(LEGAL_DISCLAIMER);
      expect(result.veterinaryAdvisory).toContain('accredited laboratory');
    });
  });

  describe('Preset Scenarios Integrity', () => {
    it('contains all 4 valid reference presets with expected grades', () => {
      expect(PRESET_FEED_SCENARIOS.length).toBe(4);

      const maizeOptimum = PRESET_FEED_SCENARIOS.find(s => s.id === 'sample_maize_silage_optimum');
      expect(maizeOptimum).toBeDefined();
      expect(maizeOptimum?.overallGrade).toBe('Tier A: Premium');
      expect(maizeOptimum?.bisCompliant).toBe(true);

      const ureaPellet = PRESET_FEED_SCENARIOS.find(s => s.id === 'sample_urea_adulterated_pellet');
      expect(ureaPellet).toBeDefined();
      expect(ureaPellet?.overallGrade).toBe('Tier C: Hazardous/Reject');
      expect(ureaPellet?.adulteration.ureaAdulterationDetected).toBe(true);

      const moldySorghum = PRESET_FEED_SCENARIOS.find(s => s.id === 'sample_moldy_sorghum_silage');
      expect(moldySorghum).toBeDefined();
      expect(moldySorghum?.overallGrade).toBe('Tier C: Hazardous/Reject');
      expect(moldySorghum?.silageMetrics?.pH).toBe(5.4);

      const borderlineConc = PRESET_FEED_SCENARIOS.find(s => s.id === 'sample_borderline_concentrate');
      expect(borderlineConc).toBeDefined();
      expect(borderlineConc?.overallGrade).toBe('Tier B: Sub-Standard');
      expect(borderlineConc?.metrics.crudeProtein).toBe(19.8);
    });
  });

  describe('Color Science & CIEDE2000 (ΔE00) Color Matching', () => {
    it('returns delta E of 0 for identical RGB colors', () => {
      const c1 = { r: 100, g: 150, b: 200 };
      const lab1 = rgbToLab(c1);
      const lab2 = rgbToLab(c1);
      const deltaE = ciede2000(lab1, lab2);
      expect(deltaE).toBeCloseTo(0, 4);
    });

    it('computes correct ambient gain correction factors relative to neutral gray target (128,128,128)', () => {
      // Measured white reference under warm lighting (R=150, G=128, B=100)
      const measured = { r: 150, g: 128, b: 100 };
      const target = { r: 128, g: 128, b: 128 };
      const factors = computeAmbientCorrection(measured, target);

      expect(factors.kr).toBeCloseTo(128 / 150, 4);
      expect(factors.kg).toBeCloseTo(128 / 128, 4);
      expect(factors.kb).toBeCloseTo(128 / 100, 4);

      const corrected = applyAmbientCorrection({ r: 150, g: 128, b: 100 }, factors);
      expect(corrected.r).toBe(128);
      expect(corrected.g).toBe(128);
      expect(corrected.b).toBe(128);
    });

    it('accurately matches Universal Indicator pH chart points using CIEDE2000', () => {
      // Test matching each point in UNIVERSAL_PH_REFERENCE_CHART
      for (const entry of UNIVERSAL_PH_REFERENCE_CHART) {
        const match = matchPhDeltaE(entry.rgb);
        expect(match.ph).toBe(entry.ph);
        expect(match.deltaE).toBeLessThan(1.0);
      }
    });

    it('accurately matches urea test strip colorimetric points using CIEDE2000', () => {
      for (const entry of UREA_COLORIMETRIC_CHART) {
        const match = matchUreaDeltaE(entry.rgb);
        expect(match.ureaPercentage).toBe(entry.ureaPercentage);
        expect(match.detected).toBe(entry.detected);
        expect(match.deltaE).toBeLessThan(1.0);
      }
    });
  });

  describe('createFeedSampleFromVisualAnalysis factory', () => {
    it('creates FeedSample with honest lab boundaries and visual assessment flags', () => {
      const visualResult = {
        isFeedSample: true,
        moldCoverageEstimate: 'moderate' as const,
        colorDescription: 'Dark brownish with white patchy mold',
        foreignMatterVisible: true,
        foreignMatterDescription: 'Soil particles visible',
        overallVisualCondition: 'poor' as const,
      };
      const sample = createFeedSampleFromVisualAnalysis('silage', visualResult, 'data:image/jpeg;base64,mock');

      expect(sample.category).toBe('silage');
      expect(sample.visualAnalysis?.moldCoverageEstimate).toBe('moderate');
      expect(sample.visualAnalysis?.overallVisualCondition).toBe('poor');
      expect(sample.overallGrade).toBe('Tier C: Hazardous/Reject');
      expect(sample.bisCompliant).toBe(false);

      // Lab test boundaries respected
      expect(sample.metrics.requiresLabTest).toBe(true);
      expect(sample.metrics.crudeProtein).toBeUndefined();
      expect(sample.metrics.totalDigestibleNutrients).toBeUndefined();
      expect(sample.adulteration.aflatoxinRisk).toBe('Requires Certified Lab Test');
      expect(sample.adulteration.sandSilicaRisk).toBe('Requires Certified Lab Test');
      expect(sample.veterinaryAdvisory).toContain('1962');
    });

    it('creates high-grade sample when visual analysis is good', () => {
      const visualResult = {
        isFeedSample: true,
        moldCoverageEstimate: 'none' as const,
        colorDescription: 'Golden olive-green, clean chop',
        foreignMatterVisible: false,
        foreignMatterDescription: 'None detected',
        overallVisualCondition: 'good' as const,
      };
      const sample = createFeedSampleFromVisualAnalysis('silage', visualResult, 'data:image/jpeg;base64,mock');

      expect(sample.overallGrade).toBe('Tier A: Premium');
      expect(sample.bisCompliant).toBe(true);
      expect(sample.silageMetrics?.pH).toBe(4.0);
      expect(sample.silageMetrics?.moldContaminationPct).toBe(0);
      expect(sample.metrics.requiresLabTest).toBe(true);
      expect(sample.isNonFeedSample).toBeUndefined();
    });

    it('rejects certificates, documents, and non-feed images as invalid samples', () => {
      const nonFeedResult = {
        isFeedSample: false,
        feedTypeIdentified: 'non_feed_or_unrelated',
        rejectionReason: 'not_feed_or_fodder' as const,
        rejectionMessage: 'The uploaded photo appears to be a document or certificate, not cattle feed.',
        moldCoverageEstimate: 'none' as const,
        colorDescription: 'Document or certificate.',
        foreignMatterVisible: false,
        foreignMatterDescription: '',
        overallVisualCondition: 'invalid' as const,
      };
      const sample = createFeedSampleFromVisualAnalysis('silage', nonFeedResult, 'data:image/jpeg;base64,mock');

      expect(sample.isNonFeedSample).toBe(true);
      expect(sample.name).toContain('Unrecognized Sample');
      expect(sample.bisCompliant).toBe(false);
      expect(sample.overallGrade).toBe('Tier C: Hazardous/Reject');
      expect(sample.veterinaryAdvisory).toContain('document or certificate');
      expect(sample.correctiveActions[0]).toContain('actual livestock feed');
    });
  });

  describe('sampleCenterPatchRgb & Lighting Guards', () => {
    it('samples average RGB accurately from the center patch of synthetic ImageData', () => {
      // Create a 100x100 image with background green, but center 30x30 is yellow
      const img = createSyntheticImageData(100, 100, (x, y) => {
        if (x >= 35 && x < 65 && y >= 35 && y < 65) {
          return { r: 230, g: 210, b: 40 }; // Center patch yellow
        }
        return { r: 50, g: 150, b: 50 }; // Outer background
      });

      const result = sampleCenterPatchRgb(img, 30, 30);
      expect(result.rgb.r).toBe(230);
      expect(result.rgb.g).toBe(210);
      expect(result.rgb.b).toBe(40);
      expect(result.isLightingValid).toBe(true);
      expect(result.guardWarning).toBeUndefined();
    });

    it('flags underexposed frames with luminance < 25 as too_dark', () => {
      // Perceived luminance Y = 0.299*R + 0.587*G + 0.114*B
      // R=15, G=15, B=15 -> Y = 15 < 25
      const darkImg = createSyntheticImageData(60, 60, { r: 15, g: 15, b: 15 });
      const result = sampleCenterPatchRgb(darkImg, 30, 30);

      expect(result.meanLuminance).toBeLessThan(25);
      expect(result.isLightingValid).toBe(false);
      expect(result.guardWarning).toBe('too_dark');
    });

    it('flags overexposed frames with luminance > 245 as blown_out', () => {
      // R=250, G=250, B=250 -> Y = 250 > 245
      const brightImg = createSyntheticImageData(60, 60, { r: 250, g: 250, b: 250 });
      const result = sampleCenterPatchRgb(brightImg, 30, 30);

      expect(result.meanLuminance).toBeGreaterThan(245);
      expect(result.isLightingValid).toBe(false);
      expect(result.guardWarning).toBe('blown_out');
    });
  });

  describe('Strip Mode Dual-Patch Sampling & Reference Card Detection', () => {
    it('(a) validates synthetic reference patch close to white -> gains ≈ 1.0, referenceCardDetected: true', () => {
      // White reference patch close to 90% photographic white card (R=242, G=245, B=240)
      const nearWhiteRef = { r: 242, g: 245, b: 240 };
      expect(isReasonablyWhiteReference(nearWhiteRef)).toBe(true);

      const gains = computeAmbientCorrection(nearWhiteRef);
      expect(gains.kr).toBeCloseTo(1.0, 1);
      expect(gains.kg).toBeCloseTo(1.0, 1);
      expect(gains.kb).toBeCloseTo(1.0, 1);

      // Analyze with near-white reference card
      const dummyImg = createSyntheticImageData(120, 120, { r: 128, g: 128, b: 128 });
      const stripColor = { r: 235, g: 205, b: 50 };
      const result = analyzeCanvasImageData('silage', dummyImg, true, stripColor, nearWhiteRef);

      expect(result.stripReading?.referenceCardDetected).toBe(true);
    });

    it('(b) rejects synthetic reference patch that is clearly not white/neutral -> referenceCardDetected: false, uncorrected gains used', () => {
      // Strongly colored red patch (R=255, G=20, B=20)
      const stronglyColoredRef = { r: 255, g: 20, b: 20 };
      expect(isReasonablyWhiteReference(stronglyColoredRef)).toBe(false);

      // Very dark patch (R=30, G=30, B=30)
      const darkRef = { r: 30, g: 30, b: 30 };
      expect(isReasonablyWhiteReference(darkRef)).toBe(false);

      const dummyImg = createSyntheticImageData(120, 120, { r: 128, g: 128, b: 128 });
      const stripColor = { r: 235, g: 205, b: 50 };

      // Result with no reference card at all
      const baselineNoRef = analyzeCanvasImageData('silage', dummyImg, true, stripColor, undefined);

      // Result with invalid colored reference card
      const resultColored = analyzeCanvasImageData('silage', dummyImg, true, stripColor, stronglyColoredRef);
      expect(resultColored.stripReading?.referenceCardDetected).toBe(false);
      // Uncorrected gains (1.0, 1.0, 1.0) must produce identical results to no-reference baseline
      expect(resultColored.stripReading?.calibratedPh).toBe(baselineNoRef.stripReading?.calibratedPh);
      expect(resultColored.stripReading?.deltaE00).toBe(baselineNoRef.stripReading?.deltaE00);

      // Result with dark reference card
      const resultDark = analyzeCanvasImageData('silage', dummyImg, true, stripColor, darkRef);
      expect(resultDark.stripReading?.referenceCardDetected).toBe(false);
      expect(resultDark.stripReading?.calibratedPh).toBe(baselineNoRef.stripReading?.calibratedPh);
    });

    it('(c) confirms the two patches sample distinct, non-overlapping regions of the 120x120 canvas', () => {
      // Synthetic 120x120 canvas:
      // Left half (x < 60): Pure white (Reference Card region)
      // Right half (x >= 60): Yellow (Test Strip region)
      const dualCanvas = createSyntheticImageData(120, 120, (x, y) => {
        if (x < 60) {
          return { r: 245, g: 245, b: 245 }; // Left: Reference Card
        }
        return { r: 235, g: 205, b: 50 }; // Right: Test Strip
      });

      const { referenceCardPatch, testStripPatch, referenceBounds, stripBounds } = sampleStripModePatches(dualCanvas, 30, 30);

      // Confirm non-overlapping coordinates
      expect(referenceBounds.startX + referenceBounds.width).toBeLessThanOrEqual(stripBounds.startX);
      // Left patch must be strictly in left half (x in [0, 60))
      expect(referenceBounds.startX).toBeGreaterThanOrEqual(0);
      expect(referenceBounds.startX + referenceBounds.width).toBeLessThanOrEqual(60);
      // Right patch must be strictly in right half (x in [60, 120))
      expect(stripBounds.startX).toBeGreaterThanOrEqual(60);
      expect(stripBounds.startX + stripBounds.width).toBeLessThanOrEqual(120);

      // Verify reference card sampled pure white from left half
      expect(referenceCardPatch.rgb.r).toBe(245);
      expect(referenceCardPatch.rgb.g).toBe(245);
      expect(referenceCardPatch.rgb.b).toBe(245);
      expect(referenceCardPatch.isLightingValid).toBe(true);

      // Verify test strip sampled yellow from right half
      expect(testStripPatch.rgb.r).toBe(235);
      expect(testStripPatch.rgb.g).toBe(205);
      expect(testStripPatch.rgb.b).toBe(50);
      expect(testStripPatch.isLightingValid).toBe(true);
    });

    it('independently detects lighting flaws for reference card vs test strip', () => {
      // Canvas where reference card is underexposed (< 25) but test strip is well lit
      const darkRefCanvas = createSyntheticImageData(120, 120, (x, y) => {
        if (x < 60) return { r: 15, g: 15, b: 15 }; // Left: too dark
        return { r: 200, g: 180, b: 40 }; // Right: valid strip
      });

      const darkRefResult = sampleStripModePatches(darkRefCanvas, 30, 30);
      expect(darkRefResult.referenceCardPatch.isLightingValid).toBe(false);
      expect(darkRefResult.referenceCardPatch.guardWarning).toBe('too_dark');
      expect(darkRefResult.testStripPatch.isLightingValid).toBe(true);

      // Canvas where reference card is valid but test strip is blown out (> 245)
      const brightStripCanvas = createSyntheticImageData(120, 120, (x, y) => {
        if (x < 60) return { r: 240, g: 240, b: 240 }; // Left: valid reference card
        return { r: 250, g: 250, b: 250 }; // Right: blown out strip
      });

      const brightStripResult = sampleStripModePatches(brightStripCanvas, 30, 30);
      expect(brightStripResult.referenceCardPatch.isLightingValid).toBe(true);
      expect(brightStripResult.testStripPatch.isLightingValid).toBe(false);
      expect(brightStripResult.testStripPatch.guardWarning).toBe('blown_out');
    });
  });

  describe('Fix 1: Strip-Mode Mold Decoupling (Regression Guard)', () => {
    it('does not produce mold-related Tier C penalty when strip photo has dark pixels', () => {
      // Create a 60x60 strip photo where 40% of pixels are dark background (< 60 lum)
      const stripImgWithDarkBg = createSyntheticImageData(60, 60, (x, y) => {
        if (y < 24) {
          return { r: 20, g: 20, b: 20 }; // 40% dark background
        }
        return { r: 235, g: 205, b: 55 }; // Clean yellow urea test strip
      });

      // Yellow test strip color (~negative urea)
      const yellowStripColor = { r: 235, g: 205, b: 55 };

      // When isStripMode is true:
      const result = analyzeCanvasImageData('concentrate', stripImgWithDarkBg, true, yellowStripColor);

      // Must NOT fail with Tier C or mold claims on a strip photo!
      expect(result.overallGrade).toBe('Tier A: Premium');
      expect(result.bisCompliant).toBe(true);
      expect(result.correctiveActions.some((act) => act.includes('active fungal mold'))).toBe(false);
      expect(result.silageMetrics?.moldContaminationPct ?? 0).toBe(0);
    });

    it('does not populate moldContaminationPct in silageMetrics for strip mode', () => {
      // Silage strip photo with dark borders
      const silageStripImg = createSyntheticImageData(60, 60, (x, y) => {
        if (x < 15) return { r: 10, g: 10, b: 10 }; // Dark left edge
        return { r: 245, g: 130, b: 10 }; // Optimum orange pH strip
      });
      const orangeStripColor = { r: 245, g: 130, b: 10 };

      const result = analyzeCanvasImageData('silage', silageStripImg, true, orangeStripColor);

      expect(result.silageMetrics).toBeDefined();
      expect(result.silageMetrics?.moldContaminationPct).toBe(0);
      expect(result.correctiveActions.some((act) => act.includes('active fungal mold'))).toBe(false);
    });
  });

  describe('Fix 2: Relative Color-Cluster Mold Heuristic (Offline Vision)', () => {
    it('reports moldSuspicionLevel: "none" for uniform golden-brown silage canvas', () => {
      // Uniform golden-brown silage canvas
      const uniformSilage = createSyntheticImageData(100, 100, { r: 180, g: 150, b: 60 });
      const heuristic = detectColorClusterMoldHeuristic(uniformSilage);

      expect(heuristic.moldSuspicionLevel).toBe('none');
      expect(heuristic.affectedAreaPct).toBe(0);
      expect(heuristic.detectedSignatures).toEqual([]);
      expect(heuristic.isPrototypeHeuristic).toBe(true);
    });

    it('reports moldSuspicionLevel: "none" for uniform pale/cream canvas (anti-false-positive guard for dry straw/bhusa)', () => {
      // Critical false-positive scenario: Naturally pale dry straw / bhusa (R=220, G=210, B=170, Y ~ 208)
      // Must NOT be falsely identified as cottony white mold!
      const uniformStraw = createSyntheticImageData(100, 100, { r: 220, g: 210, b: 170 });
      const heuristic = detectColorClusterMoldHeuristic(uniformStraw);

      expect(heuristic.moldSuspicionLevel).toBe('none');
      expect(heuristic.affectedAreaPct).toBe(0);
      expect(heuristic.detectedSignatures).toEqual([]);
    });

    it('detects localized cottony white mold cluster against darker background as likely', () => {
      // 100x100 canvas: 84% golden silage, 16% localized cottony white patch (40x40 at center)
      const moldySilage = createSyntheticImageData(100, 100, (x, y) => {
        if (x >= 30 && x < 70 && y >= 30 && y < 70) {
          return { r: 235, g: 235, b: 235 }; // Cottony white Aspergillus patch (16% of area)
        }
        return { r: 160, g: 130, b: 50 }; // Golden-brown silage background
      });

      const heuristic = detectColorClusterMoldHeuristic(moldySilage);

      expect(heuristic.moldSuspicionLevel).toBe('likely');
      expect(heuristic.affectedAreaPct).toBeGreaterThanOrEqual(10.0);
      expect(heuristic.detectedSignatures).toContain('cottony_white');
    });

    it('detects localized olive/blue-green penicillium cluster as possible', () => {
      // 100x100 canvas: ~6% olive/penicillium green patch (25x25 at top-left)
      const penicilliumSilage = createSyntheticImageData(100, 100, (x, y) => {
        if (x < 25 && y < 25) {
          return { r: 60, g: 130, b: 70 }; // Olive Penicillium patch (~6.25% of area)
        }
        return { r: 170, g: 140, b: 60 }; // Golden silage background
      });

      const heuristic = detectColorClusterMoldHeuristic(penicilliumSilage);

      expect(heuristic.moldSuspicionLevel).toBe('possible');
      expect(heuristic.affectedAreaPct).toBeGreaterThanOrEqual(3.0);
      expect(heuristic.affectedAreaPct).toBeLessThan(10.0);
      expect(heuristic.detectedSignatures).toContain('olive_penicillium');
    });

    it('caps offline placeholder severity at Tier B and labels sample as unconfirmed', () => {
      // When heuristic detects likely mold, verify createOfflinePlaceholderSample
      // does NOT produce a premature Tier C emergency alarm
      const likelyHeuristic = {
        moldSuspicionLevel: 'likely' as const,
        affectedAreaPct: 14.5,
        detectedSignatures: ['cottony_white' as const],
        isPrototypeHeuristic: true as const,
        heuristicDisclaimer: 'Prototype heuristic test disclaimer',
      };

      const sample = createOfflinePlaceholderSample(
        'silage',
        'data:image/jpeg;base64,mock',
        'offline_123',
        likelyHeuristic
      );

      // Severity cap: Must be Tier B, NEVER Tier C without lab/cloud confirmation
      expect(sample.overallGrade).toBe('Tier B: Sub-Standard');
      expect(sample.overallGrade.includes('Tier C')).toBe(false);

      // Visible Unconfirmed labeling in name and guidance
      expect(sample.name).toContain('Unconfirmed');
      expect(sample.name).toContain('Mold Suspected');
      expect(sample.silageMetrics?.moldContaminationPct).toBe(14.5);
      expect(sample.veterinaryAdvisory).toContain('Unconfirmed');
      expect(sample.correctiveActions[0]).toContain('Unconfirmed Offline Estimate');
      expect(sample.actionableSummary).toContain('Unconfirmed');
      expect(sample.offlineMoldHeuristic).toBe(likelyHeuristic);
    });
  });
});


