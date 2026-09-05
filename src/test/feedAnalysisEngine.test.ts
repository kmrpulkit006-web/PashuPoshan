import { describe, it, expect } from 'vitest';
import {
  analyzeCanvasImageData,
  PRESET_FEED_SCENARIOS,
  LEGAL_DISCLAIMER,
  VET_EMERGENCY_HELPLINE
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
      expect(result.adulteration.ureaPercentage).toBeGreaterThanOrEqual(2.5);
      expect(result.adulteration.ureaPercentage).toBeLessThanOrEqual(5.0);
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
      // Without urea, concentrate CP defaults to 19.8% (<20.0%), so it should be Tier B
      expect(result.bisCompliant).toBe(false);
      expect(result.overallGrade).toBe('Tier B: Sub-Standard');
      expect(result.correctiveActions[0]).toContain('failing the BIS IS:2052 Type II minimum threshold');
    });
  });

  describe('Colorimetric pH Strip & Silage Fermentation Heuristics', () => {
    it('detects high pH spoilage on greenish-teal strip reaction (g > 140, b > 120, r < 100)', () => {
      const tealStripColor = { r: 50, g: 170, b: 150 };
      const neutralImage = createSyntheticImageData(60, 60, { r: 180, g: 180, b: 150 });

      const result = analyzeCanvasImageData('silage', neutralImage, true, tealStripColor);

      expect(result.silageMetrics).toBeDefined();
      expect(result.silageMetrics?.pH).toBe(5.6);
      expect(result.bisCompliant).toBe(false);
      expect(result.overallGrade).toBe('Tier C: Hazardous/Reject');
      expect(result.silageMetrics?.primaryAcid).toContain('Butyric');
      expect(result.adulteration.aflatoxinRisk).toContain('Hazardous');
    });

    it('estimates safe pH 3.9 for normal orange-yellow silage strip reaction', () => {
      const normalStripColor = { r: 220, g: 180, b: 40 };
      const neutralImage = createSyntheticImageData(60, 60, { r: 180, g: 180, b: 150 });

      const result = analyzeCanvasImageData('silage', neutralImage, true, normalStripColor);

      expect(result.silageMetrics).toBeDefined();
      expect(result.silageMetrics?.pH).toBe(3.9);
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
      // High dark ratio triggers estimatedPh = 5.2
      expect(result.silageMetrics?.pH).toBe(5.2);
      expect(result.silageMetrics?.moldContaminationPct).toBeGreaterThan(12);
      expect(result.bisCompliant).toBe(false);
      expect(result.overallGrade).toBe('Tier C: Hazardous/Reject');
    });

    it('evaluates clean silage when dark pixels are minimal (< 5%)', () => {
      // Clean golden silage image
      const cleanImage = createSyntheticImageData(100, 100, { r: 190, g: 180, b: 90 });

      const result = analyzeCanvasImageData('silage', cleanImage, false);

      expect(result.silageMetrics).toBeDefined();
      expect(result.silageMetrics?.pH).toBe(4.0);
      expect(result.silageMetrics?.moldContaminationPct).toBeLessThan(5);
      expect(result.bisCompliant).toBe(true);
      expect(result.overallGrade).toBe('Tier A: Premium');
    });
  });

  describe('BIS Compliance Standards & Grading Branching', () => {
    it('flags concentrate with CP < 20.0% as Tier B: Sub-Standard', () => {
      const cleanImage = createSyntheticImageData(50, 50, { r: 180, g: 160, b: 120 });
      const result = analyzeCanvasImageData('concentrate', cleanImage, false);

      // Concentrate without urea estimation sets CP to 19.8%
      expect(result.metrics.crudeProtein).toBe(19.8);
      expect(result.bisCompliant).toBe(false);
      expect(result.overallGrade).toBe('Tier B: Sub-Standard');
      expect(result.correctiveActions[0]).toMatch(/BIS IS:2052 Type II minimum threshold/);
    });

    it('flags synthetic urea addition as immediate Tier C Hazardous Reject with Sand Alert', () => {
      const magentaColor = { r: 190, g: 30, b: 130 };
      const image = createSyntheticImageData(50, 50, { r: 150, g: 150, b: 150 });
      const result = analyzeCanvasImageData('concentrate', image, true, magentaColor);

      expect(result.adulteration.ureaAdulterationDetected).toBe(true);
      expect(result.adulteration.sandSilicaRisk).toContain('Critical Sand');
      expect(result.metrics.acidInsolubleAsh).toBe(5.8); // Elevated ash
      expect(result.bisCompliant).toBe(false);
      expect(result.overallGrade).toBe('Tier C: Hazardous/Reject');
    });
  });

  describe('Heuristic Metadata & Disclaimers', () => {
    it('tags every live scan with explicit prototype heuristic flags and legal disclaimers', () => {
      const dummyImage = createSyntheticImageData(40, 40, { r: 120, g: 120, b: 120 });
      const result = analyzeCanvasImageData('green_fodder', dummyImage, false);

      expect(result.isSimulated).toBe(false);
      expect(result.isPrototypeHeuristic).toBe(true);
      expect(result.heuristicDisclaimer).toContain('Prototype heuristic estimation');
      expect(result.disclaimer).toBe(LEGAL_DISCLAIMER);
      expect(result.confidenceScore).toBeUndefined();
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
});
