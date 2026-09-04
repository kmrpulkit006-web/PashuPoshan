import React from 'react';
import { FeedSample, Locale } from '../lib/types';
import { t } from '../lib/i18n';
import { QualityGauge } from '../components/QualityGauge';
import { AudioGuidance } from '../components/AudioGuidance';
import { PrintableReport } from '../components/PrintableReport';
import {
  ShieldCheck,
  ShieldAlert,
  AlertOctagon,
  Share2,
  Printer,
  Info,
  CheckCircle,
  Clock,
  Award,
  PhoneCall,
  RotateCcw,
  AlertTriangle
} from 'lucide-react';

interface ScorecardScreenProps {
  sample: FeedSample;
  locale: Locale;
  onNavigateToRation: () => void;
  onRetest: () => void;
}

export const ScorecardScreen: React.FC<ScorecardScreenProps> = ({
  sample,
  locale,
  onNavigateToRation,
  onRetest,
}) => {
  const isTierA = sample.overallGrade.includes('Tier A');
  const isTierC = sample.overallGrade.includes('Tier C');

  const handleShare = async () => {
    const shareText = `*PashuPoshan Field Screening Report (SIH Prototype)*%0ASample: ${sample.name}%0ABatch: ${sample.batchNumber}%0AGrade: ${sample.overallGrade}%0AEstimated Crude Protein: ${sample.metrics.crudeProtein}%%0AUrea Screening: ${sample.adulteration.ureaAdulterationDetected ? 'ADULTERATION SUSPECTED (' + sample.adulteration.ureaPercentage + '%)' : 'Negative'}%0ABIS Reference: ${sample.bisCompliant ? 'Met Reference Threshold' : 'Threshold Breach Detected'}%0ADisclaimer: Prototype heuristic estimate only. Laboratory confirmation required.`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: `Field Screening: ${sample.name}`,
          text: `PashuPoshan Field Screening Report: ${sample.name} - Grade: ${sample.overallGrade}. Note: Prototype heuristic estimate only; laboratory confirmation required.`,
        });
        return;
      } catch (e) {
        // Fallback
      }
    }

    window.open(`https://api.whatsapp.com/send?text=${shareText}`, '_blank');
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <>
      <PrintableReport sample={sample} locale={locale} />

      <div className="p-4 space-y-4 pb-28 print:hidden">
        {/* Prominent Heuristic / Demo Mode Limitation Badge */}
        {sample.isPrototypeHeuristic || !sample.isSimulated ? (
          <div className="bg-amber-950/90 border border-amber-500/50 rounded-xl p-3 flex items-start space-x-2 text-amber-200 shadow-sm" role="alert">
            <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <div className="text-xs font-bold text-amber-300">Prototype Heuristic — No Laboratory Measurement</div>
              <p className="text-[10px] text-amber-200/90 mt-0.5 leading-relaxed">
                Observed values are estimated optical proxies derived from smartphone camera pixels and user-selected test strip reactions. They do not constitute certified analytical chemical testing.
              </p>
            </div>
          </div>
        ) : (
          <div className="bg-slate-900/90 border border-emerald-500/40 rounded-xl p-2.5 flex items-center justify-between text-xs">
            <div className="flex items-center space-x-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-[11px] font-bold text-emerald-300">SIH Evaluator Demo Control (Simulated Dataset)</span>
            </div>
            <span className="text-[9px] text-slate-400 bg-slate-800 px-2 py-0.5 rounded">Known Reference</span>
          </div>
        )}

        {/* Certificate Header Banner */}
        <div className={`rounded-2xl p-4 border shadow-xl relative overflow-hidden ${
          isTierA 
            ? 'bg-gradient-to-br from-emerald-950 via-slate-900 to-emerald-900 border-emerald-500/50' 
            : (isTierC 
                ? 'bg-gradient-to-br from-rose-950 via-slate-900 to-rose-900 border-rose-500/60' 
                : 'bg-gradient-to-br from-amber-950 via-slate-900 to-amber-900 border-amber-500/50')
        }`}>
          <div className="absolute -right-4 -bottom-4 opacity-10 text-white pointer-events-none" aria-hidden="true">
            <Award className="w-36 h-36" />
          </div>

          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center space-x-1.5">
              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-black/40 text-slate-300 border border-white/10">
                {t('score.certNo', locale)} {sample.batchNumber}
              </span>
              <span className="text-[10px] text-slate-300 flex items-center space-x-1">
                <Clock className="w-3 h-3" />
                <span>{sample.timestamp.split(' ')[0]}</span>
              </span>
            </div>

            <div className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase border flex items-center space-x-1 ${
              sample.bisCompliant
                ? 'bg-emerald-500/20 text-emerald-300 border-emerald-400'
                : 'bg-rose-500/20 text-rose-300 border-rose-400 animate-pulse'
            }`}>
              {sample.bisCompliant ? <ShieldCheck className="w-3 h-3 text-emerald-400" /> : <ShieldAlert className="w-3 h-3 text-rose-400" />}
              <span>{sample.bisCompliant ? 'Met Reference Threshold' : 'Threshold Breach'}</span>
            </div>
          </div>

          <h2 className="text-base font-extrabold text-white leading-tight">
            {sample.name}
          </h2>
          <p className="text-xs text-slate-300 mt-0.5">
            {t('score.source', locale)} <span className="font-semibold text-white">{sample.sourceOrBrand}</span>
          </p>

          <div className="mt-3 pt-3 border-t border-white/10 flex items-center justify-between">
            <div>
              <div className="text-[10px] uppercase font-bold text-slate-400">{t('score.classification', locale)}</div>
              <div className={`text-base font-black tracking-tight ${
                isTierA ? 'text-emerald-300' : (isTierC ? 'text-rose-300' : 'text-amber-300')
              }`}>
                {sample.overallGrade}
              </div>
            </div>

            <div className="text-right">
              <div className="text-[10px] uppercase font-bold text-slate-400">Reference Benchmark</div>
              <div className="text-[11px] font-bold text-slate-200">{sample.regulatoryCitation.standardCode}</div>
            </div>
          </div>
        </div>

        <AudioGuidance textToSpeak={sample.actionableSummary || (sample.veterinaryAdvisory + '. ' + sample.correctiveActions.join('. '))} locale={locale} />

        {/* Adulteration & Contamination Warning Alert Box */}
        <div className={`rounded-xl p-3.5 border ${
          sample.adulteration.ureaAdulterationDetected || sample.adulteration.sandSilicaRisk.includes('Critical')
            ? 'bg-rose-950/80 border-rose-500 text-rose-200'
            : 'bg-emerald-950/40 border-emerald-500/30 text-emerald-200'
        }`}>
          <div className="flex items-center space-x-2 font-bold text-xs mb-2">
            {sample.adulteration.ureaAdulterationDetected ? (
              <AlertOctagon className="w-4 h-4 text-rose-400 shrink-0" />
            ) : (
              <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
            )}
            <span>{t('score.adulterationTitle', locale)}</span>
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="bg-black/30 rounded-lg p-2">
              <div className="text-[10px] text-slate-400">{t('score.ureaLevel', locale)}</div>
              <div className={`font-bold ${sample.adulteration.ureaAdulterationDetected ? 'text-rose-400' : 'text-emerald-300'}`}>
                {sample.adulteration.ureaPercentage}% {sample.adulteration.ureaAdulterationDetected ? '(Adulteration Suspected)' : '(Safe)'}
              </div>
            </div>

            <div className="bg-black/30 rounded-lg p-2">
              <div className="text-[10px] text-slate-400">{t('score.sandSilica', locale)}</div>
              <div className="font-bold text-slate-200">
                {sample.metrics.acidInsolubleAsh}% ({sample.adulteration.sandSilicaRisk})
              </div>
            </div>

            <div className="bg-black/30 rounded-lg p-2">
              <div className="text-[10px] text-slate-400">{t('score.aflatoxin', locale)}</div>
              <div className={`font-bold ${sample.adulteration.aflatoxinRisk.includes('Hazardous') ? 'text-rose-400' : 'text-emerald-300'}`}>
                {sample.adulteration.aflatoxinRisk}
              </div>
            </div>

            <div className="bg-black/30 rounded-lg p-2">
              <div className="text-[10px] text-slate-400">{t('score.foreignFillers', locale)}</div>
              <div className="font-bold text-slate-200">
                {sample.adulteration.foreignStarchOrTallow ? 'Suspected' : 'None Detected'}
              </div>
            </div>
          </div>
        </div>

        {/* Silage Specific Flieg Scorecard */}
        {sample.silageMetrics && (
          <div className="bg-slate-800/90 border border-slate-700 rounded-xl p-3.5 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-white flex items-center space-x-1.5">
                <span>🌾 {t('score.fliegScore', locale)}</span>
              </span>
              <span className={`text-xs font-extrabold px-2 py-0.5 rounded ${
                sample.silageMetrics.fliegGrade === 'Excellent' ? 'bg-emerald-900 text-emerald-300' : 'bg-rose-900 text-rose-300'
              }`}>
                {sample.silageMetrics.fliegGrade} ({sample.silageMetrics.fliegScore}/100)
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="p-2 bg-slate-900/80 rounded-lg">
                <div className="text-[10px] text-slate-400">{t('score.silagePh', locale)}:</div>
                <div className="text-sm font-extrabold text-amber-300">
                  {sample.silageMetrics.pH} <span className="text-[10px] font-normal text-slate-400">(Ideal 3.8-4.2)</span>
                </div>
              </div>
              <div className="p-2 bg-slate-900/80 rounded-lg">
                <div className="text-[10px] text-slate-400">Primary Fermentation:</div>
                <div className="text-xs font-bold text-slate-200">{sample.silageMetrics.primaryAcid}</div>
              </div>
            </div>
          </div>
        )}

        {/* Detailed Nutritional Gauges */}
        <div className="space-y-2">
          <div className="flex items-center justify-between px-1">
            <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
              Nutritional Proxy Estimates (DM Basis)
            </h3>
            <span className="text-[9px] text-amber-400 font-semibold">*Optical Approximation</span>
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

        {/* Veterinary Triage Protocol & Emergency Notice */}
        <div className="bg-slate-900 border border-slate-700 rounded-xl p-3.5 space-y-2">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-white flex items-center space-x-1.5">
              <Info className="w-4 h-4 text-emerald-400" />
              <span>{t('score.vetAdvisoryTitle', locale)}</span>
            </h3>
            <a
              href="tel:1962"
              className="flex items-center space-x-1 px-2.5 py-1 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-bold text-[10px] shadow"
            >
              <PhoneCall className="w-3 h-3" />
              <span>1962 Emergency</span>
            </a>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed">
            {sample.veterinaryAdvisory}
          </p>
        </div>

        {/* Actionable Recommendations */}
        <div className="bg-slate-800/90 border border-slate-700 rounded-xl p-3.5">
          <h3 className="text-xs font-bold text-white mb-2 flex items-center space-x-1.5">
            <CheckCircle className="w-4 h-4 text-emerald-400" />
            <span>{t('score.recActions', locale)}</span>
          </h3>
          <ul className="space-y-1.5">
            {sample.correctiveActions.map((action, idx) => (
              <li key={idx} className="text-xs text-slate-300 flex items-start space-x-2">
                <span className="text-emerald-400 font-bold">•</span>
                <span>{action}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Disclaimer Notice */}
        <div className="p-2.5 bg-slate-950/80 border border-slate-800 rounded-xl text-[10px] text-slate-400 leading-tight">
          <strong>{t('score.disclaimerTitle', locale)}:</strong> {sample.disclaimer}
        </div>

        {/* Share, Print & Retest Action Row */}
        <div className="grid grid-cols-3 gap-2 pt-2">
          <button
            onClick={handleShare}
            className="flex items-center justify-center space-x-1 py-3 px-2 bg-emerald-700 hover:bg-emerald-600 text-white font-bold text-xs rounded-xl shadow active:scale-98 transition-all min-h-[46px]"
          >
            <Share2 className="w-3.5 h-3.5" />
            <span className="truncate">Share</span>
          </button>

          <button
            onClick={handlePrint}
            className="flex items-center justify-center space-x-1 py-3 px-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs rounded-xl border border-slate-700 shadow active:scale-98 transition-all min-h-[46px]"
          >
            <Printer className="w-3.5 h-3.5" />
            <span className="truncate">Print / PDF</span>
          </button>

          <button
            onClick={onRetest}
            className="flex items-center justify-center space-x-1 py-3 px-2 bg-slate-800 hover:bg-slate-700 text-amber-300 font-bold text-xs rounded-xl border border-amber-500/30 shadow active:scale-98 transition-all min-h-[46px]"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span className="truncate">Retest</span>
          </button>
        </div>

        {/* Secondary Navigation to Ration Balancer */}
        <button
          onClick={onNavigateToRation}
          className="w-full py-3 px-4 bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 text-white font-extrabold text-xs rounded-xl shadow-lg active:scale-98 transition-all flex items-center justify-center space-x-1.5 min-h-[48px]"
        >
          <span>Incorporate This Tested Feed into Cow Ration (TMR)</span>
        </button>
      </div>
    </>
  );
};
