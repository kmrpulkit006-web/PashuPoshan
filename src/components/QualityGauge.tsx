import React from 'react';
import { CheckCircle, AlertTriangle, AlertOctagon } from 'lucide-react';

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
  isSilagePh = false
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

  const pct = Math.min(100, Math.max(0, ((value - min) / (max - min)) * 100));

  const statusConfig = {
    safe: {
      bar: 'bg-emerald-500',
      badge: 'bg-emerald-950 text-emerald-300 border-emerald-500/40',
      text: 'text-emerald-400',
      icon: <CheckCircle className="w-3 h-3 text-emerald-400" />,
      label: 'Optimal',
    },
    warning: {
      bar: 'bg-amber-500',
      badge: 'bg-amber-950 text-amber-300 border-amber-500/40',
      text: 'text-amber-400',
      icon: <AlertTriangle className="w-3 h-3 text-amber-400" />,
      label: 'Sub-Optimal',
    },
    danger: {
      bar: 'bg-rose-500',
      badge: 'bg-rose-950 text-rose-300 border-rose-500/40',
      text: 'text-rose-400',
      icon: <AlertOctagon className="w-3 h-3 text-rose-400" />,
      label: 'Critical Alert',
    },
  };

  const current = statusConfig[status];

  return (
    <div className="bg-slate-800/90 border border-slate-700/80 rounded-xl p-3 shadow-sm" role="region" aria-label={label}>
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-xs font-semibold text-slate-300">{label}</span>
        <div className="flex items-center space-x-1.5">
          <span className={`text-sm font-extrabold ${current.text}`}>
            {value} {unit}
          </span>
          {/* Accessible, color-independent status tag */}
          <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded border uppercase flex items-center space-x-1 ${current.badge}`}>
            {current.icon}
            <span>{current.label}</span>
          </span>
        </div>
      </div>

      {/* Progress Bar with ARIA attributes */}
      <div
        className="w-full bg-slate-700 rounded-full h-2 overflow-hidden relative"
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
        <div className="mt-1 flex items-center justify-between text-[10px] text-slate-400">
          <span>Standard Reference:</span>
          <span className="font-medium text-slate-300">{bisBenchmark}</span>
        </div>
      )}
    </div>
  );
};
