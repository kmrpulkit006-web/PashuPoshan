import React from 'react';
import { Locale, RationPlan } from '../../lib/types';
import { t } from '../../lib/i18n';
import { Info, CheckCircle2, AlertCircle } from 'lucide-react';

interface RationNutrientCardsProps {
  rationPlan: RationPlan;
  locale: Locale;
}

export const RationNutrientCards: React.FC<RationNutrientCardsProps> = ({ rationPlan, locale }) => {
  return (
    <div className="bg-[#F3EEE1] dark:bg-slate-800 border-2 border-[#DCD3BF] dark:border-slate-700 rounded-3xl p-4 shadow-sm space-y-3.5 text-[#1A1A1A] dark:text-white">
      <div className="flex items-center justify-between pb-2 border-b border-[#DCD3BF] dark:border-slate-700">
        <span className="text-sm font-black text-[#1A1A1A] dark:text-white">
          {t('ration.recipeTitle', locale)}
        </span>
        <span className="text-[11px] font-black text-[#1F5D3B] dark:text-emerald-300 bg-[#edf7f0] dark:bg-emerald-950 px-2.5 py-1 rounded-full border border-[#b0dec0] dark:border-emerald-500/30">
          DMI: {rationPlan.dmiTotalRequiredKg} kg
        </span>
      </div>

      {/* 4 Essential Ration Slots with Big Numerals */}
      <div className="grid grid-cols-2 gap-3">
        {rationPlan.slots.map((slot) => {
          const isGreen = slot.slot === 'green_fodder';
          const isDry = slot.slot === 'dry_fodder';
          return (
            <div
              key={slot.slot}
              className="bg-white dark:bg-slate-900 border-2 border-[#DCD3BF] dark:border-slate-700 rounded-2xl p-3.5 shadow-sm space-y-1"
            >
              <div className="text-sm font-bold text-[#5A5243] dark:text-slate-400 leading-snug">
                {isGreen
                  ? t('ration.greenFodder', locale)
                  : isDry
                  ? t('ration.dryFodder', locale)
                  : t('ration.concentrate', locale)}
              </div>
              <div
                className={`text-2xl sm:text-3xl font-black ${
                  isGreen
                    ? 'text-[#1F5D3B] dark:text-emerald-400'
                    : isDry
                    ? 'text-[#C2703D] dark:text-amber-400'
                    : 'text-teal-700 dark:text-teal-400'
                }`}
              >
                {slot.freshKg} <span className="text-sm font-bold">kg</span>
              </div>
              <div className="text-[11px] font-black text-[#1A1A1A] dark:text-slate-200 truncate">
                {slot.feedName}
              </div>
              <div className="text-[10px] text-[#5A5243] dark:text-slate-400 font-semibold">
                CP {slot.crudeProteinPct}% • DM {slot.dryMatterPct}%
              </div>
            </div>
          );
        })}

        <div className="bg-white dark:bg-slate-900 border-2 border-[#DCD3BF] dark:border-slate-700 rounded-2xl p-3.5 shadow-sm space-y-1">
          <div className="text-[11px] font-bold text-[#5A5243] dark:text-slate-400">
            {t('ration.mineralMix', locale)}
          </div>
          <div className="text-2xl sm:text-3xl font-black text-purple-800 dark:text-purple-300">
            {rationPlan.mineralMixtureGrams} <span className="text-xs font-bold">g</span>
          </div>
          <div className="text-[11px] font-black text-[#1A1A1A] dark:text-slate-200">
            + {rationPlan.commonSaltGrams}g {t('ration.salt', locale)}
          </div>
          <div className="text-[10px] text-[#5A5243] dark:text-slate-400 font-semibold">
            Chelated Minerals
          </div>
        </div>
      </div>

      {/* Composite Supplied Nutrition Balance Box */}
      <div className="bg-white/95 dark:bg-slate-900/90 border border-[#DCD3BF] dark:border-slate-700 rounded-2xl p-3.5 space-y-2 text-xs">
        <div className="flex items-center justify-between text-xs font-black">
          <span>Supplied vs Required Nutrition:</span>
          <span
            className={`flex items-center space-x-1 ${
              rationPlan.balance.isBalanced
                ? 'text-[#1F5D3B] dark:text-emerald-400'
                : 'text-[#C2703D] dark:text-amber-400'
            }`}
          >
            {rationPlan.balance.isBalanced ? (
              <>
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>{t('ration.balanceOk', locale)}</span>
              </>
            ) : (
              <>
                <AlertCircle className="w-3.5 h-3.5" />
                <span>{t('ration.balanceNeed', locale)}</span>
              </>
            )}
          </span>
        </div>
        <div className="grid grid-cols-3 gap-2 text-[11px] text-[#5A5243] dark:text-slate-400 pt-1.5 border-t border-[#DCD3BF] dark:border-slate-700 font-medium">
          <div>
            <span>DMI:</span> <strong className="text-[#1A1A1A] dark:text-white font-black">{rationPlan.suppliedTotals.dmiKg} kg</strong>
          </div>
          <div>
            <span>Protein:</span>{' '}
            <strong className="text-[#1A1A1A] dark:text-white font-black">{rationPlan.suppliedTotals.cpGrams}g</strong>
          </div>
          <div>
            <span>Energy:</span>{' '}
            <strong className="text-[#1A1A1A] dark:text-white font-black">{rationPlan.suppliedTotals.tdnKg} kg TDN</strong>
          </div>
        </div>
      </div>

      {/* Actionable Balance Guidance */}
      <div className="bg-white/90 dark:bg-slate-900/80 border border-[#b0dec0] dark:border-emerald-500/30 rounded-2xl p-3.5 flex items-start space-x-3 text-xs">
        <Info className="w-5 h-5 text-[#1F5D3B] dark:text-emerald-400 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <div className="font-black text-[#1A1A1A] dark:text-white text-xs">
            {t('ration.balanceNoteTitle', locale)}
          </div>
          <p className="text-[#1A1A1A] dark:text-slate-200 text-xs leading-relaxed font-semibold">
            {rationPlan.recommendationAlert}
          </p>
          <p className="text-[11px] text-[#5A5243] dark:text-slate-400 italic">
            {t('ration.vetNotice', locale)}
          </p>
        </div>
      </div>
    </div>
  );
};
