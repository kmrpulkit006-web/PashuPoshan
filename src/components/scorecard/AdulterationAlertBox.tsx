import React from 'react';
import { AlertOctagon, CheckCircle } from 'lucide-react';
import { FeedSample, Locale } from '../../lib/types';
import { t } from '../../lib/i18n';

interface AdulterationAlertBoxProps {
  sample: FeedSample;
  locale: Locale;
}

export const AdulterationAlertBox: React.FC<AdulterationAlertBoxProps> = ({ sample, locale }) => {
  const isHighRisk =
    sample.adulteration.ureaAdulterationDetected ||
    sample.adulteration.sandSilicaRisk.includes('Critical') ||
    sample.adulteration.aflatoxinRisk.includes('Hazardous');

  return (
    <div
      className={`rounded-2xl p-4 border-2 transition-all shadow-sm ${
        isHighRisk
          ? 'bg-[#FDECEA] dark:bg-rose-950/80 border-[#B3261E] dark:border-rose-500 text-[#B3261E] dark:text-rose-200'
          : 'bg-[#edf7f0] dark:bg-emerald-950/40 border-[#1F5D3B] dark:border-emerald-500/40 text-[#1F5D3B] dark:text-emerald-200'
      }`}
    >
      <div className="flex items-center space-x-2 font-black text-sm mb-3">
        {isHighRisk ? (
          <AlertOctagon className="w-5 h-5 text-[#B3261E] dark:text-rose-400 shrink-0" />
        ) : (
          <CheckCircle className="w-5 h-5 text-[#1F5D3B] dark:text-emerald-400 shrink-0" />
        )}
        <span>{t('score.adulterationTitle', locale)}</span>
      </div>

      <div className="grid grid-cols-2 gap-2 text-xs">
        <div className="bg-white/90 dark:bg-black/40 border border-[#DCD3BF] dark:border-slate-700 rounded-xl p-2.5">
          <div className="text-[11px] font-bold text-[#5A5243] dark:text-slate-400">
            {t('score.ureaLevel', locale)}
          </div>
          <div
            className={`font-black text-sm mt-0.5 ${
              sample.adulteration.ureaAdulterationDetected
                ? 'text-[#B3261E] dark:text-rose-400'
                : 'text-[#1F5D3B] dark:text-emerald-300'
            }`}
          >
            {sample.adulteration.ureaPercentage}%{' '}
            <span className="text-[10px] font-bold block">
              {sample.adulteration.ureaAdulterationDetected ? '(Adulteration Spiked)' : '(Zero Added)'}
            </span>
          </div>
        </div>

        <div className="bg-white/90 dark:bg-black/40 border border-[#DCD3BF] dark:border-slate-700 rounded-xl p-2.5">
          <div className="text-[11px] font-bold text-[#5A5243] dark:text-slate-400">
            {t('score.sandSilica', locale)}
          </div>
          <div className="font-black text-sm text-[#1A1A1A] dark:text-slate-200 mt-0.5">
            {sample.metrics.acidInsolubleAsh}%{' '}
            <span className="text-[10px] font-bold block text-[#5A5243] dark:text-slate-400">
              ({sample.adulteration.sandSilicaRisk})
            </span>
          </div>
        </div>

        <div className="bg-white/90 dark:bg-black/40 border border-[#DCD3BF] dark:border-slate-700 rounded-xl p-2.5">
          <div className="text-[11px] font-bold text-[#5A5243] dark:text-slate-400">
            {t('score.aflatoxin', locale)}
          </div>
          <div
            className={`font-black text-sm mt-0.5 ${
              sample.adulteration.aflatoxinRisk.includes('Hazardous')
                ? 'text-[#B3261E] dark:text-rose-400'
                : 'text-[#1F5D3B] dark:text-emerald-300'
            }`}
          >
            {sample.adulteration.aflatoxinRisk}
          </div>
        </div>

        <div className="bg-white/90 dark:bg-black/40 border border-[#DCD3BF] dark:border-slate-700 rounded-xl p-2.5">
          <div className="text-[11px] font-bold text-[#5A5243] dark:text-slate-400">
            {t('score.foreignFillers', locale)}
          </div>
          <div className="font-black text-sm text-[#1A1A1A] dark:text-slate-200 mt-0.5">
            {sample.adulteration.foreignStarchOrTallow ? 'Suspected Filler' : 'None Detected ✓'}
          </div>
        </div>
      </div>
    </div>
  );
};
