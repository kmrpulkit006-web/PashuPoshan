import React from 'react';
import { CheckCircle2, AlertTriangle, AlertOctagon } from 'lucide-react';
import { FeedSample, Locale } from '../../lib/types';
import { t } from '../../lib/i18n';

interface VerdictBandProps {
  sample: FeedSample;
  locale: Locale;
}

export const VerdictBand: React.FC<VerdictBandProps> = ({ sample, locale }) => {
  const isTierA = sample.overallGrade.includes('Tier A');
  const isTierC = sample.overallGrade.includes('Tier C');

  if (sample.isNonFeedSample) {
    return (
      <div className="rounded-3xl p-5 bg-[#B3261E] text-white shadow-2xl border-4 border-amber-400 space-y-2 text-center animate-pulse-slow">
        <div className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center mx-auto shadow-inner">
          <AlertOctagon className="w-11 h-11 text-white" />
        </div>
        <div>
          <span className="text-xs font-black uppercase tracking-wider px-3 py-0.5 rounded-full bg-black/40 text-amber-200">
            {t('score.notCattleFeedTag', locale)}
          </span>
          <h2 className="text-xl sm:text-2xl font-black mt-1 leading-tight text-white uppercase tracking-tight">
            {t('score.notCattleFeedTitle', locale)}
          </h2>
          <p className="text-xs text-rose-100 font-bold mt-1 max-w-sm mx-auto leading-relaxed">
            {sample.visualAnalysis?.rejectionMessage || t('score.notCattleFeedDesc', locale)}
          </p>
        </div>
      </div>
    );
  }

  if (isTierA) {
    return (
      <div className="rounded-3xl p-5 bg-[#1F5D3B] text-white shadow-xl border-2 border-emerald-400/40 space-y-2 text-center">
        <div className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center mx-auto shadow-inner">
          <CheckCircle2 className="w-10 h-10 text-white" />
        </div>
        <div>
          <span className="text-xs font-black uppercase tracking-wider px-3 py-0.5 rounded-full bg-black/25 text-emerald-100">
            🟢 {t('score.verdictSafe', locale)}
          </span>
          <h2 className="text-xl sm:text-2xl font-black mt-1 leading-tight text-white">
            {t('score.verdictSafe', locale)}
          </h2>
          <p className="text-xs text-emerald-100/90 mt-1 font-semibold">
            {sample.name} - {t('score.verdictSubSafe', locale)}
          </p>
        </div>
      </div>
    );
  }

  if (isTierC) {
    return (
      <div className="rounded-3xl p-5 bg-[#B3261E] text-white shadow-2xl border-4 border-rose-300 space-y-2 text-center animate-pulse-slow">
        <div className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center mx-auto shadow-inner">
          <AlertOctagon className="w-11 h-11 text-white" />
        </div>
        <div>
          <span className="text-xs font-black uppercase tracking-wider px-3 py-0.5 rounded-full bg-black/30 text-rose-100">
            🔴 {t('score.verdictDanger', locale)}
          </span>
          <h2 className="text-xl sm:text-2xl font-black mt-1 leading-tight text-white uppercase tracking-tight">
            {t('score.verdictDanger', locale)}
          </h2>
          <p className="text-xs text-rose-100 font-bold mt-1">
            {sample.name} - {t('score.verdictSubDanger', locale)}
          </p>
        </div>
      </div>
    );
  }

  // Tier B
  return (
    <div className="rounded-3xl p-5 bg-[#C2703D] text-white shadow-xl border-2 border-amber-300/50 space-y-2 text-center">
      <div className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center mx-auto shadow-inner">
        <AlertTriangle className="w-10 h-10 text-white" />
      </div>
      <div>
        <span className="text-xs font-black uppercase tracking-wider px-3 py-0.5 rounded-full bg-black/25 text-amber-100">
          🟡 {t('score.verdictFair', locale)}
        </span>
        <h2 className="text-xl sm:text-2xl font-black mt-1 leading-tight text-white">
          {t('score.verdictFair', locale)}
        </h2>
        <p className="text-xs text-amber-100 font-semibold mt-1">
          {sample.name} - {t('score.verdictSubFair', locale)}
        </p>
      </div>
    </div>
  );
};
