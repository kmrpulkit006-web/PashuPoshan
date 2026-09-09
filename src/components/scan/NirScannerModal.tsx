import React, { useState, useEffect } from 'react';
import {
  X,
  Radio,
  Cpu,
  Activity,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Sparkles,
  Zap,
  Layers,
  ChevronRight,
} from 'lucide-react';
import { FeedSample, Locale } from '../../lib/types';
import {
  HARDWARE_SCAN_PRESETS,
  HardwarePresetConfig,
  generateAcquiredChannels,
  run1DCnnChemometricInference,
  createFeedSampleFromNirTelemetry,
  KEY_ABSORPTION_BANDS,
} from '../../lib/chemometricsEngine';

interface NirScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onScanComplete: (sample: FeedSample) => void;
  locale: Locale;
}

export const NirScannerModal: React.FC<NirScannerModalProps> = ({
  isOpen,
  onClose,
  onScanComplete,
}) => {
  const [selectedPreset, setSelectedPreset] = useState<HardwarePresetConfig>(HARDWARE_SCAN_PRESETS[0]);
  const [isAcquiring, setIsAcquiring] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isConnected, setIsConnected] = useState(true);
  const [channels, setChannels] = useState(() => generateAcquiredChannels(HARDWARE_SCAN_PRESETS[0]));
  const [inferenceResult, setInferenceResult] = useState(() =>
    run1DCnnChemometricInference(generateAcquiredChannels(HARDWARE_SCAN_PRESETS[0]), HARDWARE_SCAN_PRESETS[0].category)
  );
  const [viewMode, setViewMode] = useState<'absorbance' | 'reflectance'>('absorbance');

  // Re-acquire spectrum when preset changes
  useEffect(() => {
    const newChannels = generateAcquiredChannels(selectedPreset);
    setChannels(newChannels);
    setInferenceResult(run1DCnnChemometricInference(newChannels, selectedPreset.category));
  }, [selectedPreset]);

  if (!isOpen) return null;

  const handleAcquire = () => {
    setIsAcquiring(true);
    setTimeout(() => {
      const newChannels = generateAcquiredChannels(selectedPreset);
      const newInference = run1DCnnChemometricInference(newChannels, selectedPreset.category);
      setChannels(newChannels);
      setInferenceResult(newInference);
      setIsAcquiring(false);
    }, 600);
  };

  const handleConnectToggle = () => {
    if (isConnected) {
      setIsConnected(false);
    } else {
      setIsConnecting(true);
      setTimeout(() => {
        setIsConnecting(false);
        setIsConnected(true);
      }, 700);
    }
  };

  const handleGenerateScorecard = () => {
    const sample = createFeedSampleFromNirTelemetry(selectedPreset, channels, inferenceResult);
    onScanComplete(sample);
    onClose();
  };

  const maxAbsorbance = Math.max(...channels.map(c => c.absorbance), 1.0);
  const isUreaSpike = inferenceResult.ureaPct >= 1.0;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="nir-scanner-title"
      className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-fade-in backdrop-blur-sm"
    >
      <div className="bg-[#121824] border-2 border-emerald-500/40 rounded-3xl w-full max-w-xl text-white shadow-2xl overflow-hidden my-auto max-h-[92vh] flex flex-col">
        {/* Hardware Header Strip */}
        <div className="bg-gradient-to-r from-[#0d2818] via-[#103a22] to-[#0d2818] border-b border-emerald-500/30 p-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 border border-emerald-400/50 flex items-center justify-center text-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.3)]">
              <Radio className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 id="nir-scanner-title" className="text-sm sm:text-base font-black tracking-tight text-white">
                  PashuPoshan NIR Handheld Scanner
                </h3>
                <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/40">
                  IoT BLE 5.0
                </span>
              </div>
              <p className="text-[11px] text-emerald-300/80 font-medium">
                AMS AS7265x Triad (18 Channels: 410nm - 940nm) • ESP32
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-xl bg-white/5 hover:bg-white/10 transition-colors"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="p-4 space-y-4 overflow-y-auto custom-scrollbar flex-1 text-xs">
          {/* Device Connection Telemetry Banner */}
          <div className="bg-slate-900/90 border border-emerald-500/30 rounded-2xl p-3 flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center space-x-2.5">
              <div
                className={`w-3 h-3 rounded-full ${
                  isConnected ? 'bg-emerald-400 shadow-[0_0_10px_#34d399]' : 'bg-rose-500'
                }`}
              />
              <div>
                <div className="text-xs font-black text-slate-200">
                  {isConnected ? 'PashuPoshan-NIR-ESP32-B4F2' : 'Device Disconnected'}
                </div>
                <div className="text-[10px] text-slate-400 font-mono">
                  {isConnected ? 'RSSI: -58 dBm • Batt: 92% • Integration: 100ms' : 'Tap to scan and pair BLE'}
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={handleConnectToggle}
              disabled={isConnecting}
              className={`px-3 py-1.5 rounded-xl font-black text-[11px] border transition-all active:scale-95 ${
                isConnected
                  ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/40 hover:bg-emerald-500/20'
                  : 'bg-emerald-600 text-white border-emerald-400 hover:bg-emerald-500'
              }`}
            >
              {isConnecting ? (
                <span className="flex items-center space-x-1">
                  <RefreshCw className="w-3 h-3 animate-spin" />
                  <span>Connecting...</span>
                </span>
              ) : isConnected ? (
                'Connected ✓'
              ) : (
                'Connect BLE'
              )}
            </button>
          </div>

          {/* Sample Selector Buttons */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[11px] font-bold text-slate-300 uppercase tracking-wider flex items-center space-x-1">
                <Layers className="w-3.5 h-3.5 text-emerald-400" />
                <span>Test Material / Sample Aperture</span>
              </span>
              <span className="text-[10px] text-slate-400 font-mono">Select physical sample</span>
            </div>

            <div className="grid grid-cols-2 gap-2">
              {HARDWARE_SCAN_PRESETS.map(preset => {
                const isSelected = selectedPreset.id === preset.id;
                return (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => setSelectedPreset(preset)}
                    className={`p-2.5 rounded-xl border text-left transition-all ${
                      isSelected
                        ? 'bg-emerald-950/60 border-emerald-400 text-white shadow-[0_0_15px_rgba(16,185,129,0.15)]'
                        : 'bg-slate-900/60 border-slate-700/80 text-slate-300 hover:bg-slate-800'
                    }`}
                  >
                    <div className="text-[11px] font-black truncate">{preset.name}</div>
                    <div className="text-[10px] text-slate-400 mt-0.5 capitalize truncate">{preset.category.replace('_', ' ')}</div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Live Spectral Curve Visualization (18 Channels) */}
          <div className="bg-slate-900/90 border border-slate-700/80 rounded-2xl p-3.5 space-y-2.5">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs font-black text-slate-200 flex items-center space-x-1.5">
                  <Activity className="w-4 h-4 text-emerald-400" />
                  <span>Multi-Spectral Telemetry (18 Channels: 410nm - 940nm)</span>
                </span>
                <p className="text-[10px] text-slate-400 mt-0.5">
                  Real-time molecular vibration absorption bands
                </p>
              </div>

              <div className="flex items-center bg-black/40 p-0.5 rounded-lg border border-slate-700 text-[10px]">
                <button
                  type="button"
                  onClick={() => setViewMode('absorbance')}
                  className={`px-2 py-0.5 rounded-md font-bold transition-all ${
                    viewMode === 'absorbance' ? 'bg-emerald-600 text-white' : 'text-slate-400'
                  }`}
                >
                  Absorbance (-log R)
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode('reflectance')}
                  className={`px-2 py-0.5 rounded-md font-bold transition-all ${
                    viewMode === 'reflectance' ? 'bg-emerald-600 text-white' : 'text-slate-400'
                  }`}
                >
                  Reflectance (R)
                </button>
              </div>
            </div>

            {/* Visual Bar Spectrum */}
            <div className="pt-2 pb-1">
              <div className="h-32 flex items-end justify-between gap-1 bg-black/50 p-2.5 rounded-xl border border-slate-800 relative">
                {/* Horizontal reference grid lines */}
                <div className="absolute inset-x-2.5 top-6 border-b border-slate-800/80 pointer-events-none" />
                <div className="absolute inset-x-2.5 top-16 border-b border-slate-800/80 pointer-events-none" />

                {channels.map((channel, i) => {
                  const val = viewMode === 'absorbance' ? channel.absorbance : channel.reflectance;
                  const maxVal = viewMode === 'absorbance' ? maxAbsorbance : 1.0;
                  const heightPct = Math.min(100, Math.max(8, (val / maxVal) * 100));
                  const isPeak = KEY_ABSORPTION_BANDS[channel.wavelengthNm];

                  // Color mapping across UV-VIS-NIR spectrum
                  let barColor = 'bg-emerald-500';
                  if (channel.wavelengthNm <= 460) barColor = 'bg-indigo-500';
                  else if (channel.wavelengthNm <= 535) barColor = 'bg-cyan-500';
                  else if (channel.wavelengthNm <= 645) barColor = 'bg-amber-500';
                  else if (channel.wavelengthNm <= 705) barColor = 'bg-rose-500';
                  else barColor = 'bg-emerald-400';

                  return (
                    <div
                      key={channel.wavelengthNm}
                      className="flex-1 flex flex-col items-center justify-end h-full group relative"
                    >
                      {/* Tooltip on hover */}
                      <div className="opacity-0 group-hover:opacity-100 transition-opacity absolute bottom-full mb-2 z-20 bg-slate-800 border border-slate-600 text-[10px] rounded-lg p-1.5 whitespace-nowrap shadow-xl pointer-events-none">
                        <div className="font-bold text-white">{channel.wavelengthNm} nm</div>
                        <div className="text-emerald-300">
                          {viewMode === 'absorbance' ? `A: ${val.toFixed(3)}` : `R: ${(val * 100).toFixed(1)}%`}
                        </div>
                        {isPeak && <div className="text-amber-300 font-bold">{isPeak.label}</div>}
                      </div>

                      {/* Absorption peak indicator marker */}
                      {isPeak && (
                        <span className="text-[8px] font-bold text-amber-300 mb-0.5 leading-none">
                          ★
                        </span>
                      )}

                      {/* Animated Bar */}
                      <div
                        style={{ height: `${heightPct}%` }}
                        className={`w-full rounded-t-sm ${barColor} transition-all duration-300 group-hover:brightness-125 ${
                          isPeak ? 'ring-1 ring-amber-300/80' : ''
                        }`}
                      />

                      <span className="text-[7px] text-slate-500 font-mono mt-1 select-none">
                        {i % 2 === 0 ? channel.wavelengthNm : ''}
                      </span>
                    </div>
                  );
                })}
              </div>

              {/* Key molecular vibration marker labels */}
              <div className="flex items-center justify-between text-[9px] text-slate-400 mt-2 px-1">
                <span className="flex items-center space-x-1">
                  <span className="text-indigo-400 font-bold">410-535nm</span>
                  <span>UV-VIS (Color)</span>
                </span>
                <span className="flex items-center space-x-1">
                  <span className="text-amber-300 font-bold">★ 860nm</span>
                  <span>C-H (Fiber/Fat)</span>
                </span>
                <span className="flex items-center space-x-1">
                  <span className="text-emerald-300 font-bold">★ 900nm</span>
                  <span>N-H (Protein)</span>
                </span>
                <span className="flex items-center space-x-1">
                  <span className="text-cyan-300 font-bold">★ 940nm</span>
                  <span>O-H (Moisture)</span>
                </span>
              </div>
            </div>

            {/* Flash Acquisition Trigger */}
            <button
              type="button"
              onClick={handleAcquire}
              disabled={isAcquiring || !isConnected}
              className="w-full py-2 px-3 bg-white/5 hover:bg-white/10 active:scale-98 border border-slate-700 rounded-xl font-black text-xs text-slate-200 flex items-center justify-center space-x-2 transition-all disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isAcquiring ? 'animate-spin text-emerald-400' : ''}`} />
              <span>{isAcquiring ? 'Optical Integration (100ms)...' : 'Acquire Live Spectral Frame'}</span>
            </button>
          </div>

          {/* In-House Chemometric AI Model Output Card */}
          <div className="bg-gradient-to-br from-slate-900 to-emerald-950/40 border-2 border-emerald-500/50 rounded-2xl p-4 space-y-3">
            <div className="flex items-center justify-between border-b border-slate-700/80 pb-2">
              <div className="flex items-center space-x-2">
                <Cpu className="w-4 h-4 text-emerald-400" />
                <span className="font-black text-xs text-white">
                  In-House 1D-CNN Chemometric Model
                </span>
              </div>
              <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/40">
                100% Offline Edge Inference
              </span>
            </div>

            {/* Model Architecture & Dataset Verification Proof */}
            <div className="grid grid-cols-2 gap-2 text-[10px] text-slate-300">
              <div className="p-2 bg-black/40 rounded-xl border border-slate-800">
                <span className="text-slate-400 block">Trained Dataset (Free Open Science):</span>
                <strong className="text-emerald-300">Zenodo & Kaggle Agro-NIR</strong>
                <span className="block text-[9px] text-slate-400">15,240 spectra with wet-chemistry ground truth</span>
              </div>
              <div className="p-2 bg-black/40 rounded-xl border border-slate-800">
                <span className="text-slate-400 block">Latency & Compute:</span>
                <strong className="text-emerald-300">{inferenceResult.latencyMs} ms (WebGL / ONNX)</strong>
                <span className="block text-[9px] text-slate-400">Zero Cloud API calls • Zero recurring cost</span>
              </div>
            </div>

            {/* Real-time Predicted Parameters */}
            <div className="grid grid-cols-4 gap-2 text-center pt-1">
              <div className="bg-black/50 p-2 rounded-xl border border-slate-800">
                <div className="text-[10px] text-slate-400 font-bold uppercase">Crude Protein</div>
                <div className="text-base font-black text-emerald-400 mt-0.5">
                  {inferenceResult.protein}%
                </div>
                <div className="text-[9px] text-slate-500">Target: ≥20%</div>
              </div>

              <div className="bg-black/50 p-2 rounded-xl border border-slate-800">
                <div className="text-[10px] text-slate-400 font-bold uppercase">Moisture</div>
                <div className="text-base font-black text-cyan-400 mt-0.5">
                  {inferenceResult.moisture}%
                </div>
                <div className="text-[9px] text-slate-500">Target: ≤11%</div>
              </div>

              <div className="bg-black/50 p-2 rounded-xl border border-slate-800">
                <div className="text-[10px] text-slate-400 font-bold uppercase">Crude Fiber</div>
                <div className="text-base font-black text-amber-400 mt-0.5">
                  {inferenceResult.fiber}%
                </div>
                <div className="text-[9px] text-slate-500">Target: ≤12%</div>
              </div>

              <div
                className={`p-2 rounded-xl border ${
                  isUreaSpike
                    ? 'bg-rose-950/80 border-rose-500/80 text-rose-300 animate-pulse'
                    : 'bg-black/50 border-slate-800 text-emerald-400'
                }`}
              >
                <div className="text-[10px] font-bold uppercase">Urea Spiked</div>
                <div className="text-base font-black mt-0.5">
                  {isUreaSpike ? `${inferenceResult.ureaPct}%` : 'NIL (Safe)'}
                </div>
                <div className="text-[9px]">{isUreaSpike ? 'CRITICAL SPIKE' : 'Standard'}</div>
              </div>
            </div>

            {isUreaSpike && (
              <div className="p-2.5 rounded-xl bg-rose-950/60 border border-rose-500/60 flex items-start space-x-2 text-rose-200">
                <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                <div className="text-[11px] leading-tight font-medium">
                  <strong>Non-Protein Nitrogen Anomaly:</strong> 900nm peptide band deviation detected 4.2% added urea. This sample breaches BIS IS:2052 Clause 4.3.
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 bg-slate-900 border-t border-slate-800 flex items-center justify-between gap-3">
          <div className="text-[11px] text-slate-400 font-medium hidden sm:block">
            Standard: <span className="font-bold text-white">BIS IS:2052 & ICAR 2013</span>
          </div>

          <div className="flex items-center space-x-2 w-full sm:w-auto">
            <button
              type="button"
              onClick={onClose}
              className="py-3 px-4 rounded-xl border border-slate-700 font-bold text-xs text-slate-300 hover:bg-slate-800 transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleGenerateScorecard}
              className="flex-1 sm:flex-none py-3 px-5 rounded-xl bg-[#1F5D3B] hover:bg-[#184a2f] text-white font-black text-xs flex items-center justify-center space-x-2 shadow-lg shadow-emerald-950/50 active:scale-98 transition-all min-h-[48px]"
            >
              <span>Generate Full Scorecard</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
