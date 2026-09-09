import { describe, it, expect } from 'vitest';
import {
  AS7265X_WAVELENGTHS,
  KEY_ABSORPTION_BANDS,
  applySnvPreprocessing,
  HARDWARE_SCAN_PRESETS,
  generateAcquiredChannels,
  run1DCnnChemometricInference,
  createFeedSampleFromNirTelemetry,
} from '../lib/chemometricsEngine';

describe('chemometricsEngine - IoT Multi-Spectral Processing & 1D-CNN Regression', () => {
  it('defines all 18 discrete optical wavelengths for AMS AS7265x Triad spanning 410nm to 940nm', () => {
    expect(AS7265X_WAVELENGTHS.length).toBe(18);
    expect(AS7265X_WAVELENGTHS[0]).toBe(410);
    expect(AS7265X_WAVELENGTHS[17]).toBe(940);
    expect(KEY_ABSORPTION_BANDS[940].label).toBe('O-H Water Absorption');
    expect(KEY_ABSORPTION_BANDS[900].label).toBe('N-H Peptide Harmonic');
    expect(KEY_ABSORPTION_BANDS[860].label).toBe('C-H Aliphatic');
  });

  describe('Standard Normal Variate (SNV) Transformation', () => {
    it('normalizes arbitrary reflectance vectors to zero mean and unit variance', () => {
      const raw = [0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 0.8, 0.7, 0.6, 0.5, 0.4, 0.3, 0.2, 0.1, 0.2];
      const snv = applySnvPreprocessing(raw);

      expect(snv.length).toBe(18);

      const mean = snv.reduce((acc, v) => acc + v, 0) / snv.length;
      expect(Math.abs(mean)).toBeLessThan(0.0001);

      const variance = snv.reduce((acc, v) => acc + Math.pow(v - mean, 2), 0) / (snv.length - 1);
      expect(Math.abs(variance - 1.0)).toBeLessThan(0.0001);
    });

    it('handles empty arrays gracefully', () => {
      expect(applySnvPreprocessing([])).toEqual([]);
    });
  });

  describe('Hardware Scan Acquisition & 1D-CNN Chemometric Inference', () => {
    it('accurately predicts high crude protein and optimal moisture for BIS Type II pellets', () => {
      const pelletPreset = HARDWARE_SCAN_PRESETS.find(p => p.id === 'nir_preset_pellet_bis2')!;
      expect(pelletPreset).toBeDefined();

      const channels = generateAcquiredChannels(pelletPreset);
      expect(channels.length).toBe(18);
      expect(channels.every(c => c.reflectance > 0 && c.reflectance < 1)).toBe(true);

      const inference = run1DCnnChemometricInference(channels, 'concentrate');
      expect(inference.protein).toBeGreaterThanOrEqual(20.0); // Meets BIS Type II Min 20%
      expect(inference.moisture).toBeLessThanOrEqual(12.0);
      expect(inference.ureaPct).toBeLessThan(0.5); // No urea adulteration

      const sample = createFeedSampleFromNirTelemetry(pelletPreset, channels, inference);
      expect(sample.overallGrade).toBe('Tier A: Premium');
      expect(sample.bisCompliant).toBe(true);
      expect(sample.testedMethod).toBe('Live Mobile Sensor Analysis');
      expect(sample.nirTelemetry).toBeDefined();
      expect(sample.nirTelemetry?.channels.length).toBe(18);
      expect(sample.nirTelemetry?.chemometricModel.name).toContain('1D-CNN');
    });

    it('detects synthetic non-protein nitrogen anomaly on urea-spiked mash', () => {
      const ureaPreset = HARDWARE_SCAN_PRESETS.find(p => p.id === 'nir_preset_urea_spiked_mash')!;
      expect(ureaPreset).toBeDefined();

      const channels = generateAcquiredChannels(ureaPreset);
      const inference = run1DCnnChemometricInference(channels, 'concentrate');

      expect(inference.ureaPct).toBeGreaterThanOrEqual(1.0); // High urea anomaly flagged!

      const sample = createFeedSampleFromNirTelemetry(ureaPreset, channels, inference);
      expect(sample.overallGrade).toBe('Tier C: Hazardous/Reject');
      expect(sample.bisCompliant).toBe(false);
      expect(sample.adulteration.ureaAdulterationDetected).toBe(true);
    });

    it('evaluates silage moisture and fermentation quality', () => {
      const silagePreset = HARDWARE_SCAN_PRESETS.find(p => p.id === 'nir_preset_maize_silage')!;
      expect(silagePreset).toBeDefined();

      const channels = generateAcquiredChannels(silagePreset);
      const inference = run1DCnnChemometricInference(channels, 'silage');

      expect(inference.moisture).toBeGreaterThan(60.0);
      expect(inference.protein).toBeGreaterThan(7.0);

      const sample = createFeedSampleFromNirTelemetry(silagePreset, channels, inference);
      expect(sample.category).toBe('silage');
      expect(sample.silageMetrics?.pH).toBe(3.9);
      expect(sample.silageMetrics?.fliegScore).toBeGreaterThan(80);
    });
  });
});
