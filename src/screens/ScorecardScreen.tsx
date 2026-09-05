import React, { useState } from 'react';
import { FeedSample, Locale } from '../lib/types';
import { t } from '../lib/i18n';
import { AudioGuidance } from '../components/AudioGuidance';
import { PrintableReport } from '../components/PrintableReport';
import { VerdictBand } from '../components/scorecard/VerdictBand';
import { HeuristicDisclaimerBanner } from '../components/scorecard/HeuristicDisclaimerBanner';
import { CertificateBanner } from '../components/scorecard/CertificateBanner';
import { AdulterationAlertBox } from '../components/scorecard/AdulterationAlertBox';
import { NutritionalMetricsGrid } from '../components/scorecard/NutritionalMetricsGrid';
import {
  Share2,
  Printer,
  Info,
  CheckCircle2,
  PhoneCall,
  RotateCcw,
  ChevronDown,
  ChevronUp,
  FlaskConical
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
  const [showTechnicalDetails, setShowTechnicalDetails] = useState(false);
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
        {/* 1. Full-Width Colored Verdict Band (Plain Language First) */}
        <VerdictBand sample={sample} locale={locale} />

        {/* 2. Large, High-Contrast Audio Advisory Button Directly Under Verdict */}
        <AudioGuidance
          textToSpeak={
            sample.actionableSummary ||
            sample.veterinaryAdvisory + '. ' + sample.correctiveActions.join('. ')
          }
          locale={locale}
          isHazardous={isTierC}
        />

        {/* 3. Actionable Field Guidance (Recommendations & Veterinary Notice) */}
        <div className="bg-[#F3EEE1] dark:bg-slate-800 border-2 border-[#DCD3BF] dark:border-slate-700 rounded-2xl p-4 space-y-3 shadow-sm text-[#1A1A1A] dark:text-white">
          <div className="flex items-center justify-between border-b border-[#DCD3BF] dark:border-slate-700 pb-2">
            <h3 className="text-sm font-black flex items-center space-x-2">
              <CheckCircle2 className="w-5 h-5 text-[#1F5D3B] dark:text-emerald-400" />
              <span>{t('score.recActions', locale)}</span>
            </h3>
            {isTierC && (
              <a
                href="tel:1962"
                className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-[#B3261E] hover:bg-red-700 text-white font-black text-xs shadow min-h-[44px]"
              >
                <PhoneCall className="w-4 h-4" />
                <span>Call 1962</span>
              </a>
            )}
          </div>

          <ul className="space-y-2.5">
            {sample.correctiveActions.map((action, idx) => (
              <li key={idx} className="text-xs sm:text-sm text-[#1A1A1A] dark:text-slate-200 flex items-start space-x-2.5 font-semibold leading-relaxed">
                <span className="w-2 h-2 rounded-full bg-[#1F5D3B] dark:bg-emerald-400 mt-1.5 shrink-0" />
                <span>{action}</span>
              </li>
            ))}
          </ul>

          <div className="p-3 bg-white/80 dark:bg-slate-900/80 border border-[#DCD3BF] dark:border-slate-700 rounded-xl text-xs space-y-1">
            <div className="font-black text-[#5A5243] dark:text-slate-300 flex items-center space-x-1">
              <Info className="w-3.5 h-3.5 text-[#1F5D3B] dark:text-emerald-400" />
              <span>{t('score.vetAdvisoryTitle', locale)}:</span>
            </div>
            <p className="text-[#1A1A1A] dark:text-slate-200 leading-relaxed font-medium">
              {sample.veterinaryAdvisory}
            </p>
          </div>
        </div>

        {/* 4. Collapsible Technical Details (Collapsed by Default for Simplicity) */}
        <div className="border-2 border-[#DCD3BF] dark:border-slate-700 rounded-2xl overflow-hidden shadow-sm transition-all bg-[#F3EEE1] dark:bg-slate-800">
          <button
            type="button"
            onClick={() => setShowTechnicalDetails(!showTechnicalDetails)}
            className="w-full py-4 px-4 flex items-center justify-between text-left font-black text-xs sm:text-sm text-[#1A1A1A] dark:text-white bg-[#EAE3D2] dark:bg-slate-700/80 hover:bg-[#ded5c2] transition-colors min-h-[56px]"
            aria-expanded={showTechnicalDetails}
          >
            <div className="flex items-center space-x-2">
              <FlaskConical className="w-4 h-4 text-[#1F5D3B] dark:text-emerald-400" />
              <span>Technical & Lab Details (तकनीकी एवं प्रयोगशाला विवरण)</span>
            </div>
            <div className="flex items-center space-x-1 text-xs text-[#5A5243] dark:text-slate-300">
              <span>{showTechnicalDetails ? 'Hide' : 'View'}</span>
              {showTechnicalDetails ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </div>
          </button>

          {showTechnicalDetails && (
            <div className="p-4 space-y-4 bg-[#FBF8F1] dark:bg-slate-900 border-t border-[#DCD3BF] dark:border-slate-700">
              {/* Heuristic Disclaimer Alert */}
              <HeuristicDisclaimerBanner sample={sample} />

              {/* Certificate & Batch Metadata */}
              <CertificateBanner sample={sample} locale={locale} />

              {/* Adulteration & Contaminant Screening Panel */}
              <AdulterationAlertBox sample={sample} locale={locale} />

              {/* Nutritional Parameter Gauges & Flieg Score */}
              <NutritionalMetricsGrid sample={sample} locale={locale} />

              {/* Legal Disclaimer Notice */}
              <div className="p-3 bg-white dark:bg-slate-800 border border-[#DCD3BF] dark:border-slate-700 rounded-xl text-[11px] text-[#5A5243] dark:text-slate-400 leading-relaxed font-medium">
                <strong>{t('score.disclaimerTitle', locale)}:</strong> {sample.disclaimer}
              </div>
            </div>
          )}
        </div>

        {/* 5. Share, Print & Retest Buttons (Min 56px Touch Target) */}
        <div className="grid grid-cols-3 gap-2.5 pt-1">
          <button
            onClick={handleShare}
            className="flex items-center justify-center space-x-1.5 py-3.5 px-2 bg-[#1F5D3B] hover:bg-[#194a30] text-white font-black text-xs sm:text-sm rounded-2xl shadow-md active:scale-98 transition-all min-h-[56px]"
          >
            <Share2 className="w-4 h-4 shrink-0" />
            <span>Share</span>
          </button>

          <button
            onClick={handlePrint}
            className="flex items-center justify-center space-x-1.5 py-3.5 px-2 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-[#1A1A1A] dark:text-slate-200 font-black text-xs sm:text-sm rounded-2xl border-2 border-[#DCD3BF] dark:border-slate-700 shadow-md active:scale-98 transition-all min-h-[56px]"
          >
            <Printer className="w-4 h-4 shrink-0" />
            <span>Print</span>
          </button>

          <button
            onClick={onRetest}
            className="flex items-center justify-center space-x-1.5 py-3.5 px-2 bg-white dark:bg-slate-800 hover:bg-amber-50 dark:hover:bg-slate-700 text-[#C2703D] dark:text-amber-300 font-black text-xs sm:text-sm rounded-2xl border-2 border-[#C2703D]/60 dark:border-amber-500/40 shadow-md active:scale-98 transition-all min-h-[56px]"
          >
            <RotateCcw className="w-4 h-4 shrink-0" />
            <span>Retest</span>
          </button>
        </div>

        {/* 6. Secondary Navigation to Ration Balancer (Min 56px Touch Target) */}
        <button
          onClick={onNavigateToRation}
          className="w-full py-4 px-4 bg-[#1F5D3B] hover:bg-[#194a30] text-white font-black text-sm sm:text-base rounded-2xl shadow-xl active:scale-98 transition-all flex items-center justify-center space-x-2 min-h-[56px]"
        >
          <span>🌾 Incorporate Feed into Daily Ration (TMR) →</span>
        </button>
      </div>
    </>
  );
};
