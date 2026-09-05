import React from 'react';
import { AlertTriangle, Sparkles } from 'lucide-react';
import { FeedSample } from '../../lib/types';

interface HeuristicDisclaimerBannerProps {
  sample: FeedSample;
}

export const HeuristicDisclaimerBanner: React.FC<HeuristicDisclaimerBannerProps> = ({ sample }) => {
  if (sample.isPrototypeHeuristic || !sample.isSimulated) {
    return (
      <div
        className="bg-[#fdf8f4] dark:bg-amber-950 border-2 border-[#C2703D] dark:border-amber-500/70 rounded-2xl p-3.5 flex items-start space-x-3 text-[#1A1A1A] dark:text-amber-100 shadow-sm"
        role="alert"
      >
        <div className="w-8 h-8 rounded-xl bg-[#f3d6c4] dark:bg-amber-500/20 border border-[#C2703D] dark:border-amber-400/40 flex items-center justify-center shrink-0 mt-0.5">
          <AlertTriangle className="w-5 h-5 text-[#C2703D] dark:text-amber-400" />
        </div>
        <div className="space-y-1">
          <div className="text-xs font-black uppercase tracking-wider text-[#C2703D] dark:text-amber-300">
            On-Farm Rapid Screening Notice
          </div>
          <p className="text-[11px] text-[#5A5243] dark:text-amber-200/90 leading-relaxed font-semibold">
            Values are optical screening estimates from smartphone camera pixels and test strips. They do not substitute official certified laboratory wet-chemistry or veterinary diagnosis.
          </p>
          <div className="text-[10px] text-[#C2703D] dark:text-amber-300/80 font-bold">
            Roadmap: Quantized MobileNetV3 + Portable Bluetooth NIR Spectrometry.
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[#edf7f0] dark:bg-slate-900/90 border border-[#b0dec0] dark:border-emerald-500/40 rounded-xl p-2.5 flex items-center justify-between text-xs">
      <div className="flex items-center space-x-1.5">
        <span className="w-2.5 h-2.5 rounded-full bg-[#1F5D3B] dark:bg-emerald-400 animate-pulse" />
        <span className="text-[11px] font-black text-[#1F5D3B] dark:text-emerald-300">
          SIH Evaluator Demo Control (Known Lab Baseline)
        </span>
      </div>
      <span className="text-[10px] font-bold text-[#5A5243] dark:text-slate-400 bg-white dark:bg-slate-800 px-2 py-0.5 rounded border border-[#DCD3BF] dark:border-slate-700">
        Reference Dataset
      </span>
    </div>
  );
};
