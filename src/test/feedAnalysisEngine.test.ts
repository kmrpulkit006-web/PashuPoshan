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
  UNIVERSAL_PH_REFERENCE_CHART,
  UREA_COLORIMETRIC_CHART,
} from '../lib/feedAnalysisEngine';

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
});

