import React from 'react';
import { QualityGauge } from '../QualityGauge';
import { FeedSample, Locale } from '../../lib/types';
import { t } from '../../lib/i18n';

interface NutritionalMetricsGridProps {
  sample: FeedSample;
  locale: Locale;
}

export const NutritionalMetricsGrid: React.FC<NutritionalMetricsGridProps> = ({ sample, locale }) => {
  return (
    <div className="space-y-3">
      {/* Silage Specific Flieg Scorecard */}
      {sample.silageMetrics && (
        <div className="bg-[#F3EEE1] dark:bg-slate-800 border-2 border-[#DCD3BF] dark:border-slate-700 rounded-2xl p-4 space-y-2 text-[#1A1A1A] dark:text-white shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-black flex items-center space-x-1.5">
              <span>🌾 {t('score.fliegScore', locale)}</span>
            </span>
            <span
              className={`text-xs font-black px-2.5 py-1 rounded-full ${
                sample.silageMetrics.fliegGrade === 'Excellent'
                  ? 'bg-[#edf7f0] text-[#1F5D3B] border border-[#b0dec0] dark:bg-emerald-950 dark:text-emerald-300'
                  : 'bg-red-50 text-[#B3261E] border border-red-300 dark:bg-rose-950 dark:text-rose-300'
              }`}
            >
              {sample.silageMetrics.fliegGrade} ({sample.silageMetrics.fliegScore}/100)
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="p-2.5 bg-white/80 dark:bg-slate-900/80 border border-[#DCD3BF] dark:border-slate-700 rounded-xl">
              <div className="text-[11px] font-bold text-[#5A5243] dark:text-slate-400">
                {t('score.silagePh', locale)}:
              </div>
              <div className="text-base font-black text-[#C2703D] dark:text-amber-400">
                {sample.silageMetrics.pH}{' '}
                <span className="text-[10px] font-normal text-[#5A5243] dark:text-slate-400">
                  (Optimum 3.8-4.2)
                </span>
              </div>
            </div>
            <div className="p-2.5 bg-white/80 dark:bg-slate-900/80 border border-[#DCD3BF] dark:border-slate-700 rounded-xl">
              <div className="text-[11px] font-bold text-[#5A5243] dark:text-slate-400">
                Fermentation Type:
              </div>
              <div className="text-xs font-bold text-[#1A1A1A] dark:text-slate-200 truncate mt-0.5">
                {sample.silageMetrics.primaryAcid}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Detailed Nutritional Gauges */}
      <div className="space-y-2.5">
        <div className="flex items-center justify-between px-1">
          <h4 className="text-xs font-black text-[#5A5243] dark:text-slate-300 uppercase tracking-wider">
            Nutritional Benchmarks (Dry Matter Basis)
          </h4>
          <span className="text-[10px] text-[#C2703D] dark:text-amber-400 font-bold">
            *Screening Metric
          </span>
        </div>

        <QualityGauge
          label={t('score.crudeProtein', locale)}
          value={sample.metrics.crudeProtein}
          min={0}
          max={30}
          safeMin={sample.category === 'silage' ? 8.0 : 20.0}
          bisBenchmark={sample.category === 'silage' ? 'Min 8.0%' : 'BIS IS:2052 Min 20.0%'}
        />

        <QualityGauge
          label={t('score.moisture', locale)}
          value={sample.metrics.moisture}
          min={0}
          max={100}
          safeMax={sample.category === 'silage' ? 70.0 : 11.0}
          bisBenchmark={sample.category === 'silage' ? 'Max 68-70%' : 'BIS IS:2052 Max 11.0%'}
        />

        <QualityGauge
          label={t('score.sandSilica', locale)}
          value={sample.metrics.acidInsolubleAsh}
          min={0}
          max={10}
          safeMax={sample.category === 'silage' ? 2.5 : 3.5}
          bisBenchmark="Max 2.5% - 3.5%"
        />

        {sample.silageMetrics && (
          <QualityGauge
            label={t('score.silagePh', locale)}
            value={sample.silageMetrics.pH}
            unit=""
            min={3.0}
            max={7.0}
            isSilagePh={true}
            bisBenchmark="Optimum 3.8 - 4.2"
          />
        )}
      </div>
    </div>
  );
};
