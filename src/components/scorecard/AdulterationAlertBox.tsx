import React from 'react';
import { AlertOctagon, CheckCircle, FlaskConical, ExternalLink } from 'lucide-react';
import { FeedSample, Locale } from '../../lib/types';
import { t } from '../../lib/i18n';

interface AdulterationAlertBoxProps {
  sample: FeedSample;
  locale: Locale;
}

export const AdulterationAlertBox: React.FC<AdulterationAlertBoxProps> = ({ sample, locale }) => {
  const isHighRisk =
    sample.adulteration.ureaAdulterationDetected ||
    (sample.adulteration.sandSilicaRisk && sample.adulteration.sandSilicaRisk.includes('Critical')) ||
    (sample.adulteration.aflatoxinRisk && sample.adulteration.aflatoxinRisk.includes('Hazardous'));

  const requiresLabAflatoxin =
    sample.adulteration.labVerifiedOnly ||
    sample.adulteration.aflatoxinRisk === 'Requires Certified Lab Test' ||
    !sample.isSimulated;

  const requiresLabSand =
    sample.adulteration.labVerifiedOnly ||
    sample.adulteration.sandSilicaRisk === 'Requires Certified Lab Test' ||
    sample.metrics.acidInsolubleAsh === undefined;

  return (
    <div
      className={`rounded-2xl p-4 border-2 transition-all shadow-sm space-y-3 ${
        isHighRisk
          ? 'bg-[#FDECEA] dark:bg-rose-950/80 border-[#B3261E] dark:border-rose-500 text-[#B3261E] dark:text-rose-200'
          : 'bg-[#edf7f0] dark:bg-emerald-950/40 border-[#1F5D3B] dark:border-emerald-500/40 text-[#1F5D3B] dark:text-emerald-200'
      }`}
    >
      <div className="flex items-center space-x-2 font-black text-sm">
        {isHighRisk ? (
          <AlertOctagon className="w-5 h-5 text-[#B3261E] dark:text-rose-400 shrink-0" />
        ) : (
          <CheckCircle className="w-5 h-5 text-[#1F5D3B] dark:text-emerald-400 shrink-0" />
        )}
        <span>{t('score.adulterationTitle', locale)}</span>
      </div>

      <div className="grid grid-cols-2 gap-2 text-xs">
        {/* Urea Strip Adulteration */}
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
              {sample.adulteration.ureaAdulterationDetected ? '(Adulteration Spiked)' : '(Zero Added ✓)'}
            </span>
          </div>
        </div>

        {/* Foreign Physical Fillers */}
        <div className="bg-white/90 dark:bg-black/40 border border-[#DCD3BF] dark:border-slate-700 rounded-xl p-2.5">
          <div className="text-[11px] font-bold text-[#5A5243] dark:text-slate-400">
            {t('score.foreignFillers', locale)}
          </div>
          <div className="font-black text-xs text-[#1A1A1A] dark:text-slate-200 mt-1">
            {sample.adulteration.foreignStarchOrTallow || sample.visualAnalysis?.foreignMatterVisible ? (
              <span className="text-[#B3261E] dark:text-rose-300 font-bold">
                ⚠️ {sample.visualAnalysis?.foreignMatterDescription || 'Foreign Matter Detected'}
              </span>
            ) : (
              <span className="text-[#1F5D3B] dark:text-emerald-300 font-bold">
                None Visible ✓
              </span>
            )}
          </div>
        </div>

        {/* Sand & Silica Contamination (Lab-Only Assay) */}
        <div className="bg-white/90 dark:bg-black/40 border border-[#DCD3BF] dark:border-slate-700 rounded-xl p-2.5">
          <div className="text-[11px] font-bold text-[#5A5243] dark:text-slate-400">
            {t('score.sandSilica', locale)}
          </div>
          {requiresLabSand ? (
            <div className="mt-1">
              <span className="inline-block px-2 py-0.5 rounded-md bg-amber-100 dark:bg-amber-950/80 border border-amber-300 dark:border-amber-700 text-[10px] font-black text-amber-900 dark:text-amber-200">
                Requires Certified Lab Test
              </span>
              <span className="text-[9px] font-medium text-[#5A5243] dark:text-slate-400 block mt-0.5">
                Max 3.5% AIA (Ashing assay)
              </span>
            </div>
          ) : (
            <div className="font-black text-sm text-[#1A1A1A] dark:text-slate-200 mt-0.5">
              {sample.metrics.acidInsolubleAsh}%{' '}
              <span className="text-[10px] font-bold block text-[#5A5243] dark:text-slate-400">
                ({sample.adulteration.sandSilicaRisk})
              </span>
            </div>
          )}
        </div>

        {/* Aflatoxin / Mycotoxin (Lab-Only ELISA/HPLC Assay) */}
        <div className="bg-white/90 dark:bg-black/40 border border-[#DCD3BF] dark:border-slate-700 rounded-xl p-2.5">
          <div className="text-[11px] font-bold text-[#5A5243] dark:text-slate-400">
            {t('score.aflatoxin', locale)}
          </div>
          {requiresLabAflatoxin ? (
            <div className="mt-1">
              <span className="inline-block px-2 py-0.5 rounded-md bg-amber-100 dark:bg-amber-950/80 border border-amber-300 dark:border-amber-700 text-[10px] font-black text-amber-900 dark:text-amber-200">
                Requires Certified Lab Test
              </span>
              <span className="text-[9px] font-medium text-[#5A5243] dark:text-slate-400 block mt-0.5">
                ELISA / HPLC (FSSAI max 20 ppb)
              </span>
            </div>
          ) : (
            <div
              className={`font-black text-sm mt-0.5 ${
                sample.adulteration.aflatoxinRisk?.includes('Hazardous')
                  ? 'text-[#B3261E] dark:text-rose-400'
                  : 'text-[#1F5D3B] dark:text-emerald-300'
              }`}
            >
              {sample.adulteration.aflatoxinRisk}
            </div>
          )}
        </div>
      </div>

      {/* Honest Lab Testing Notice & Accredited Lab Referral */}
      <div className="p-3 bg-white/90 dark:bg-slate-900 border border-[#DCD3BF] dark:border-slate-700 rounded-xl text-xs space-y-1.5 text-[#1A1A1A] dark:text-white">
        <div className="flex items-center space-x-1.5 font-black text-[#C2703D] dark:text-amber-400 text-[11px]">
          <FlaskConical className="w-4 h-4 shrink-0" />
          <span>Statutory Wet-Chemistry Notice (प्रयोगशाला परीक्षण सूचना):</span>
        </div>
        <p className="text-[11px] text-[#5A5243] dark:text-slate-300 leading-relaxed font-semibold">
          Aflatoxin, crude protein, and fiber require certified wet-chemistry testing (ELISA / NIRS). Not determinable from photo triage.
        </p>
        <div className="pt-1 flex items-center justify-between">
          <span className="text-[10px] font-bold text-[#1F5D3B] dark:text-emerald-400">
            District Dairy Lab / NDDB Network
          </span>
          <a
            href="tel:1962"
            className="inline-flex items-center space-x-1 text-[10px] font-black px-2 py-1 rounded-lg bg-[#1F5D3B] text-white hover:bg-[#194a30] transition-all"
          >
            <span>Call Helpline 1962</span>
            <ExternalLink className="w-3 h-3 ml-0.5" />
          </a>
        </div>
      </div>
    </div>
  );
};
