import React from 'react';
import { AlertTriangle } from 'lucide-react';
import { FeedSample, Locale } from '../../lib/types';
import { t } from '../../lib/i18n';

interface HeuristicDisclaimerBannerProps {
  sample: FeedSample;
  locale?: Locale;
}

export const HeuristicDisclaimerBanner: React.FC<HeuristicDisclaimerBannerProps> = ({ sample, locale = 'en' }) => {
  if (sample.isPrototypeHeuristic || !sample.isSimulated) {
    return (
      <div
        className="bg-[#fdf8f4] dark:bg-amber-950/50 border-2 border-[#C2703D] dark:border-amber-500/70 rounded-2xl p-4 space-y-2 text-[#1A1A1A] dark:text-amber-100 shadow-sm"
        role="alert"
      >
        <div className="flex items-center space-x-2.5">
          <div className="w-7 h-7 rounded-xl bg-[#f3d6c4] dark:bg-amber-500/20 border border-[#C2703D] dark:border-amber-400/40 flex items-center justify-center shrink-0">
            <AlertTriangle className="w-4 h-4 text-[#C2703D] dark:text-amber-400" />
          </div>
          <div className="text-xs font-black uppercase tracking-wider text-[#C2703D] dark:text-amber-300">
            {t('score.quickFarmCheckNotice', locale)}
          </div>
        </div>

        <p className="text-xs text-[#5A5243] dark:text-amber-200/90 leading-relaxed font-semibold">
          {t('score.quickFarmCheckDesc', locale)}
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 text-[11px]">
          <div className="bg-white/80 dark:bg-slate-900/80 p-2.5 rounded-xl border border-emerald-300 dark:border-emerald-800">
            <span className="font-black text-[#1F5D3B] dark:text-emerald-300 block mb-0.5">
              {t('score.checkedOnPhone', locale)}
            </span>
            <ul className="text-[#5A5243] dark:text-slate-300 space-y-0.5 list-disc pl-3 font-medium">
              <li>{t('score.checkItemMold', locale)}</li>
              <li>{t('score.checkItemDirt', locale)}</li>
              <li>{t('score.checkItemStrip', locale)}</li>
            </ul>
          </div>

          <div className="bg-white/80 dark:bg-slate-900/80 p-2.5 rounded-xl border border-amber-300 dark:border-amber-800">
            <span className="font-black text-[#C2703D] dark:text-amber-300 block mb-0.5">
              {t('score.forOfficialLab', locale)}
            </span>
            <ul className="text-[#5A5243] dark:text-slate-300 space-y-0.5 list-disc pl-3 font-medium">
              <li>{t('score.labItemAflatoxin', locale)}</li>
              <li>{t('score.labItemProtein', locale)}</li>
              <li>{t('score.labItemSand', locale)}</li>
            </ul>
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
          {t('score.sampleFeedDemo', locale)}
        </span>
      </div>
      <span className="text-[10px] font-bold text-[#5A5243] dark:text-slate-400 bg-white dark:bg-slate-800 px-2 py-0.5 rounded border border-[#DCD3BF] dark:border-slate-700">
        {t('score.demoBaseline', locale)}
      </span>
    </div>
  );
};
