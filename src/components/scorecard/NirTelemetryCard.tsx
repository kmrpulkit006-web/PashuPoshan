import React, { useState } from 'react';
import { Radio, Cpu, Activity, ChevronDown, ChevronUp, CheckCircle, ShieldCheck } from 'lucide-react';
import { NirSpectralTelemetry, Locale } from '../../lib/types';
import { KEY_ABSORPTION_BANDS } from '../../lib/chemometricsEngine';

interface NirTelemetryCardProps {
  telemetry: NirSpectralTelemetry;
  locale?: Locale;
}

export const NirTelemetryCard: React.FC<NirTelemetryCardProps> = ({ telemetry }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [viewMode, setViewMode] = useState<'absorbance' | 'reflectance'>('absorbance');

  const maxAbsorbance = Math.max(...telemetry.channels.map(c => c.absorbance), 1.0);

  return (
    <div className="bg-gradient-to-br from-[#0c2617] via-[#103822] to-[#0c2617] border-2 border-emerald-500/50 rounded-2xl p-4 text-white shadow-md space-y-3">
      {/* Top Device Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2.5">
          <div className="w-8 h-8 rounded-xl bg-emerald-500/20 border border-emerald-400/40 flex items-center justify-center text-emerald-400">
            <Radio className="w-4 h-4 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-xs font-black text-white">
                IoT Multi-Spectral Hardware Telemetry
              </span>
              <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/40">
                {telemetry.connectionType}
              </span>
            </div>
            <p className="text-[10px] text-emerald-300/80 font-mono">
              Device: {telemetry.deviceId} • Batt: {telemetry.batteryPct}%
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setIsExpanded(!isExpanded)}
          className="p-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-emerald-300 text-xs font-bold flex items-center space-x-1"
          aria-label={isExpanded ? 'Collapse spectrum' : 'Expand spectrum'}
        >
          <span>{isExpanded ? 'Hide Spectrum' : 'View Spectrum'}</span>
          {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
        </button>
      </div>

      {/* Model & Proof Metadata */}
      <div className="p-2.5 rounded-xl bg-black/40 border border-emerald-500/30 grid grid-cols-2 gap-2 text-[10px]">
        <div>
          <span className="text-slate-400 block font-medium">Chemometrics Architecture:</span>
          <strong className="text-emerald-300 font-bold flex items-center space-x-1">
            <Cpu className="w-3 h-3 inline" />
            <span>{telemetry.chemometricModel.name}</span>
          </strong>
          <span className="text-[9px] text-slate-400 block">
            Latency: {telemetry.chemometricModel.latencyMs}ms • 100% Offline
          </span>
        </div>

        <div>
          <span className="text-slate-400 block font-medium">Open Science Training Ground Truth:</span>
          <strong className="text-emerald-300 font-bold">Zenodo & Kaggle Agro-NIR</strong>
          <span className="text-[9px] text-slate-400 block">
            15,240 Wet-Chemistry Calibrated Spectra
          </span>
        </div>
      </div>

      {/* Expandable 18-Channel Spectral Waveform */}
      {isExpanded && (
        <div className="space-y-2 pt-1 border-t border-emerald-500/30">
          <div className="flex items-center justify-between text-[11px]">
            <span className="font-black text-slate-200 flex items-center space-x-1">
              <Activity className="w-3.5 h-3.5 text-emerald-400" />
              <span>18-Channel Molecular Reflectance Spectrum (410nm - 940nm)</span>
            </span>

            <div className="flex items-center bg-black/40 p-0.5 rounded-lg border border-slate-700 text-[9px]">
              <button
                type="button"
                onClick={() => setViewMode('absorbance')}
                className={`px-2 py-0.5 rounded font-bold transition-all ${
                  viewMode === 'absorbance' ? 'bg-emerald-600 text-white' : 'text-slate-400'
                }`}
              >
                Absorbance
              </button>
              <button
                type="button"
                onClick={() => setViewMode('reflectance')}
                className={`px-2 py-0.5 rounded font-bold transition-all ${
                  viewMode === 'reflectance' ? 'bg-emerald-600 text-white' : 'text-slate-400'
                }`}
              >
                Reflectance
              </button>
            </div>
          </div>

          {/* SVG/Div Chart */}
          <div className="h-28 flex items-end justify-between gap-1 bg-black/60 p-2.5 rounded-xl border border-slate-800">
            {telemetry.channels.map((ch, idx) => {
              const val = viewMode === 'absorbance' ? ch.absorbance : ch.reflectance;
              const maxVal = viewMode === 'absorbance' ? maxAbsorbance : 1.0;
              const heightPct = Math.min(100, Math.max(8, (val / maxVal) * 100));
              const isPeak = KEY_ABSORPTION_BANDS[ch.wavelengthNm];

              let barColor = 'bg-emerald-500';
              if (ch.wavelengthNm <= 460) barColor = 'bg-indigo-500';
              else if (ch.wavelengthNm <= 535) barColor = 'bg-cyan-500';
              else if (ch.wavelengthNm <= 645) barColor = 'bg-amber-500';
              else if (ch.wavelengthNm <= 705) barColor = 'bg-rose-500';

              return (
                <div key={ch.wavelengthNm} className="flex-1 flex flex-col items-center justify-end h-full group relative">
                  {isPeak && (
                    <span className="text-[7px] font-bold text-amber-300 leading-none mb-0.5">
                      ★
                    </span>
                  )}
                  <div
                    style={{ height: `${heightPct}%` }}
                    className={`w-full rounded-t-sm ${barColor} ${isPeak ? 'ring-1 ring-amber-300/80' : ''}`}
                    title={`${ch.wavelengthNm}nm: ${val.toFixed(3)} ${isPeak?.label ? `(${isPeak.label})` : ''}`}
                  />
                  <span className="text-[7px] text-slate-500 font-mono mt-0.5 select-none">
                    {idx % 3 === 0 ? ch.wavelengthNm : ''}
                  </span>
                </div>
              );
            })}
          </div>

          <div className="flex items-center justify-between text-[9px] text-slate-300 pt-1">
            <span>★ 860nm (C-H Fiber)</span>
            <span>★ 900nm (N-H Protein)</span>
            <span>★ 940nm (O-H Moisture)</span>
          </div>
        </div>
      )}
    </div>
  );
};
