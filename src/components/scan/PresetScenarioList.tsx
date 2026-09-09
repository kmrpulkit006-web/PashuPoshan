import React, { useState } from 'react';
import { FeedSample, Locale } from '../../lib/types';
import { PRESET_FEED_SCENARIOS, SIH_BENCHMARK_SCENARIOS } from '../../lib/feedAnalysisEngine';
import { t } from '../../lib/i18n';
import { Zap, Award } from 'lucide-react';

interface PresetScenarioListProps {
  onSelectPreset: (scenario: FeedSample) => void;
  locale: Locale;
}

export const PresetScenarioList: React.FC<PresetScenarioListProps> = ({
  onSelectPreset,
  locale,
}) => {
  const [activeTab, setActiveTab] = useState<'sih' | 'field'>('sih');
  const scenarios = activeTab === 'sih' ? SIH_BENCHMARK_SCENARIOS : PRESET_FEED_SCENARIOS;

  return (
    <div className="bg-[#F3EEE1] dark:bg-slate-800 border-2 border-[#DCD3BF] dark:border-slate-700 rounded-3xl p-4 shadow-sm space-y-3 text-[#1A1A1A] dark:text-white">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <div className="w-7 h-7 rounded-xl bg-amber-500/20 text-[#C2703D] dark:text-amber-400 flex items-center justify-center">
            <Zap className="w-4 h-4" />
          </div>
          <h3 className="text-sm font-black">
            {t('scan.evaluatorDemo', locale)}
          </h3>
        </div>
        <span className="text-[10px] text-[#C2703D] dark:text-amber-300 font-black bg-[#fdf8f4] dark:bg-amber-950 px-2.5 py-0.5 rounded-full border border-[#f3d6c4] dark:border-amber-500/40 flex items-center space-x-1">
          <Award className="w-3 h-3 inline" />
          <span>SIH PS-3 Benchmarks</span>
        </span>
      </div>

      {/* Tab Switcher: Official SIH Dummy Dataset vs Field Scenarios */}
      <div className="grid grid-cols-2 gap-1.5 p-1 bg-white/80 dark:bg-slate-900/80 rounded-2xl border border-[#DCD3BF] dark:border-slate-700 text-xs font-black">
        <button
          type="button"
          onClick={() => setActiveTab('sih')}
          className={`py-2 px-2.5 rounded-xl transition-all flex items-center justify-center space-x-1 ${
            activeTab === 'sih'
              ? 'bg-[#1F5D3B] text-white shadow-sm'
              : 'text-slate-600 dark:text-slate-300 hover:text-black dark:hover:text-white'
          }`}
        >
          <span>🎯 Official F001-F005</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('field')}
          className={`py-2 px-2.5 rounded-xl transition-all flex items-center justify-center space-x-1 ${
            activeTab === 'field'
              ? 'bg-[#1F5D3B] text-white shadow-sm'
              : 'text-slate-600 dark:text-slate-300 hover:text-black dark:hover:text-white'
          }`}
        >
          <span>🌾 Field Scenarios</span>
        </button>
      </div>

      <p className="text-xs text-[#5A5243] dark:text-slate-300 font-semibold leading-relaxed">
        {activeTab === 'sih' 
          ? 'Exact 1-to-1 dummy dataset from SIH Problem Statement 3 (Page 2): F001 through F005.'
          : t('scan.evaluatorTip', locale)}
      </p>

      <div className="grid grid-cols-1 gap-2.5">
        {scenarios.map((scenario) => {
          const isTierA = scenario.overallGrade.includes('Tier A');
          const isTierC = scenario.overallGrade.includes('Tier C');
          return (
            <button
              key={scenario.id}
              type="button"
              onClick={() => onSelectPreset(scenario)}
              className={`w-full flex items-center justify-between p-3 rounded-2xl border-2 text-left transition-all active:scale-98 min-h-[56px] ${
                isTierA
                  ? 'bg-white dark:bg-slate-900 hover:bg-[#edf7f0] border-[#b0dec0] dark:border-emerald-600/40 shadow-sm'
                  : isTierC
                  ? 'bg-white dark:bg-slate-900 hover:bg-red-50 border-red-300 dark:border-rose-600/40 shadow-sm'
                  : 'bg-white dark:bg-slate-900 hover:bg-amber-50 border-[#f3d6c4] dark:border-amber-600/40 shadow-sm'
              }`}
            >
              <div className="flex items-center space-x-3">
                <img
                  src={scenario.imageUrl}
                  alt=""
                  className="w-12 h-12 rounded-xl object-cover border border-[#DCD3BF] dark:border-slate-700 shrink-0"
                />
                <div>
                  <div className="text-xs sm:text-sm font-black text-[#1A1A1A] dark:text-white line-clamp-1">
                    {scenario.name}
                  </div>
                  <div className="text-[11px] text-[#5A5243] dark:text-slate-400 font-medium">
                    {scenario.sourceOrBrand}
                  </div>
                </div>
              </div>

              <div className="text-right shrink-0 pl-2">
                <span
                  className={`text-[10px] font-black px-2.5 py-1 rounded-full border ${
                    isTierA
                      ? 'bg-[#edf7f0] text-[#1F5D3B] border-[#b0dec0] dark:bg-emerald-950 dark:text-emerald-300'
                      : isTierC
                      ? 'bg-red-50 text-[#B3261E] border-red-300 dark:bg-rose-950 dark:text-rose-300 animate-pulse'
                      : 'bg-amber-50 text-[#C2703D] border-[#f3d6c4] dark:bg-amber-950 dark:text-amber-300'
                  }`}
                >
                  {isTierA ? t('score.tierAGrade', locale) : isTierC ? t('score.tierCHazard', locale) : t('score.tierBGrade', locale)}
                </span>
                <div className="text-[11px] font-black text-[#1A1A1A] dark:text-slate-300 mt-1">
                  CP {scenario.metrics.crudeProtein}%
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
