import React from 'react';
import { Award, Clock, ShieldCheck, ShieldAlert } from 'lucide-react';
import { FeedSample, Locale } from '../../lib/types';
import { t, getSampleDisplayName, getTierClassificationText } from '../../lib/i18n';

interface CertificateBannerProps {
  sample: FeedSample;
  locale: Locale;
}

export const CertificateBanner: React.FC<CertificateBannerProps> = ({ sample, locale }) => {
  const isTierA = sample.overallGrade.includes('Tier A');
  const isTierC = sample.overallGrade.includes('Tier C');
  const sampleDisplayName = getSampleDisplayName(sample, locale);
  const tierDisplayName = getTierClassificationText(sample.overallGrade, locale);

  return (
    <div className="rounded-2xl p-4 bg-[#F3EEE1] dark:bg-slate-800 border-2 border-[#DCD3BF] dark:border-slate-700 shadow-sm relative overflow-hidden text-[#1A1A1A] dark:text-white">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center space-x-1.5">
          <span className="text-[11px] font-black uppercase tracking-wider px-2 py-0.5 rounded bg-[#EAE3D2] dark:bg-slate-700 text-[#1A1A1A] dark:text-slate-200 border border-[#DCD3BF] dark:border-slate-600">
            {t('score.certNo', locale)} {sample.batchNumber}
          </span>
          <span className="text-[11px] text-[#5A5243] dark:text-slate-400 flex items-center space-x-1 font-semibold">
            <Clock className="w-3.5 h-3.5" />
            <span>{sample.timestamp.split(' ')[0]}</span>
          </span>
        </div>

        <div
          className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase border flex items-center space-x-1 ${
            sample.bisCompliant
              ? 'bg-[#edf7f0] text-[#1F5D3B] border-[#b0dec0] dark:bg-emerald-950 dark:text-emerald-300 dark:border-emerald-600'
              : 'bg-red-50 text-[#B3261E] border-red-300 dark:bg-rose-950 dark:text-rose-300 dark:border-rose-600 animate-pulse'
          }`}
        >
          {sample.bisCompliant ? (
            <ShieldCheck className="w-3.5 h-3.5 text-[#1F5D3B] dark:text-emerald-400" />
          ) : (
            <ShieldAlert className="w-3.5 h-3.5 text-[#B3261E] dark:text-rose-400" />
          )}
          <span>{sample.bisCompliant ? t('score.statusApproved', locale) : t('score.statusRisk', locale)}</span>
        </div>
      </div>

      <h3 className="text-base font-black text-[#1A1A1A] dark:text-white leading-tight">
        {sampleDisplayName}
      </h3>
      <p className="text-xs text-[#5A5243] dark:text-slate-300 mt-0.5 font-medium">
        {t('score.source', locale)}{' '}
        <span className="font-bold text-[#1A1A1A] dark:text-white">{sample.sourceOrBrand}</span>
      </p>

      <div className="mt-3 pt-3 border-t border-[#DCD3BF] dark:border-slate-700 flex items-center justify-between">
        <div>
          <div className="text-[10px] uppercase font-bold text-[#5A5243] dark:text-slate-400">
            {t('score.classification', locale)}
          </div>
          <div
            className={`text-base font-black tracking-tight ${
              isTierA
                ? 'text-[#1F5D3B] dark:text-emerald-400'
                : isTierC
                ? 'text-[#B3261E] dark:text-rose-400'
                : 'text-[#C2703D] dark:text-amber-400'
            }`}
          >
            {tierDisplayName}
          </div>
        </div>

        <div className="text-right">
          <div className="text-[10px] uppercase font-bold text-[#5A5243] dark:text-slate-400">
            {t('gauge.reference', locale)}
          </div>
          <div className="text-xs font-bold text-[#1A1A1A] dark:text-slate-200">
            {sample.regulatoryCitation.standardCode}
          </div>
        </div>
      </div>
    </div>
  );
};
