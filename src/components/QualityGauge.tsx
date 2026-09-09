import React from 'react';
import { CheckCircle2, AlertTriangle, AlertOctagon } from 'lucide-react';
import { Locale } from '../lib/types';
import { t } from '../lib/i18n';

interface QualityGaugeProps {
  label: string;
  value: number;
  unit?: string;
  min: number;
  max: number;
  safeMin?: number;
  safeMax?: number;
  bisBenchmark?: string;
  isSilagePh?: boolean;
  locale?: Locale;
}

export const QualityGauge: React.FC<QualityGaugeProps> = ({
  label,
  value,
  unit = '%',
  min,
  max,
  safeMin,
  safeMax,
  bisBenchmark,
  isSilagePh = false,
  locale = 'hi',
}) => {
  let status: 'safe' | 'warning' | 'danger' = 'safe';

  if (isSilagePh) {
    if (value <= 4.2) status = 'safe';
    else if (value <= 4.8) status = 'warning';
    else status = 'danger';
  } else {
    if (safeMin !== undefined && value < safeMin) status = 'warning';
    if (safeMax !== undefined && value > safeMax) status = 'danger';
  }

  const denominator = max - min;
  const pct = denominator > 0
    ? Math.min(100, Math.max(0, ((value - min) / denominator) * 100))
    : 50;

  const statusConfig = {
    safe: {
      bar: 'bg-[#1F5D3B]',
      badge: 'bg-[#edf7f0] text-[#1F5D3B] border-[#b0dec0] dark:bg-emerald-950 dark:text-emerald-300 dark:border-emerald-600',
      text: 'text-[#1F5D3B] dark:text-emerald-400',
      icon: <CheckCircle2 className="w-3.5 h-3.5 text-[#1F5D3B] dark:text-emerald-400" />,
      label: t('gauge.optimal', locale),
    },
    warning: {
      bar: 'bg-[#C2703D]',
      badge: 'bg-[#fdf8f4] text-[#C2703D] border-[#f3d6c4] dark:bg-amber-950 dark:text-amber-300 dark:border-amber-600',
      text: 'text-[#C2703D] dark:text-amber-400',
      icon: <AlertTriangle className="w-3.5 h-3.5 text-[#C2703D] dark:text-amber-400" />,
      label: t('gauge.subOptimal', locale),
    },
    danger: {
      bar: 'bg-[#B3261E]',
      badge: 'bg-[#FDECEA] text-[#B3261E] border-red-300 dark:bg-rose-950 dark:text-rose-300 dark:border-rose-600',
      text: 'text-[#B3261E] dark:text-rose-400',
      icon: <AlertOctagon className="w-3.5 h-3.5 text-[#B3261E] dark:text-rose-400" />,
      label: t('gauge.critical', locale),
    },
  };

  const current = statusConfig[status];

  return (
    <div
      className="bg-[#F3EEE1] dark:bg-slate-800/90 border border-[#DCD3BF] dark:border-slate-700/80 rounded-2xl p-3.5 shadow-sm text-[#1A1A1A] dark:text-white"
      role="region"
      aria-label={label}
    >
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-black text-[#1A1A1A] dark:text-slate-200">{label}</span>
        <div className="flex items-center space-x-2">
          <span className={`text-xl font-black ${current.text}`}>
            {value} {unit}
          </span>
          {/* Accessible, color-independent status tag */}
          <span
            className={`text-[10px] font-black px-2 py-0.5 rounded-full border uppercase flex items-center space-x-1 ${current.badge}`}
          >
            {current.icon}
            <span>{current.label}</span>
          </span>
        </div>
      </div>

      {/* Progress Bar with ARIA attributes */}
      <div
        className="w-full bg-[#DCD3BF] dark:bg-slate-700 rounded-full h-4 overflow-hidden relative"
        role="progressbar"
        aria-valuenow={value}
        aria-valuemin={min}
        aria-valuemax={max}
        aria-label={`${label}: ${value} ${unit}`}
      >
        <div
          className={`h-full transition-all duration-700 rounded-full ${current.bar}`}
          style={{ width: `${pct}%` }}
        />
      </div>

      {bisBenchmark && (
        <div className="mt-1.5 flex items-center justify-between text-[11px] text-[#5A5243] dark:text-slate-400 font-semibold">
          <span>{t('gauge.reference', locale)}</span>
          <span className="font-bold text-[#1A1A1A] dark:text-slate-300">{bisBenchmark}</span>
        </div>
      )}
    </div>
  );
};
