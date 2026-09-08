import React, { useState } from 'react';
import { FeedSample, Locale } from '../lib/types';
import { t, getActionableAdviceText, getSampleDisplayName } from '../lib/i18n';
import { AudioGuidance } from '../components/AudioGuidance';
import { PrintableReport } from '../components/PrintableReport';
import { VerdictBand } from '../components/scorecard/VerdictBand';
import { HeuristicDisclaimerBanner } from '../components/scorecard/HeuristicDisclaimerBanner';
import { CertificateBanner } from '../components/scorecard/CertificateBanner';
import { AdulterationAlertBox } from '../components/scorecard/AdulterationAlertBox';
import { NutritionalMetricsGrid } from '../components/scorecard/NutritionalMetricsGrid';
import { NearestLabModal } from '../components/NearestLabModal';
import {
  Share2,
  Printer,
  Info,
  CheckCircle2,
  PhoneCall,
  RotateCcw,
  ChevronDown,
  ChevronUp,
  FlaskConical,
  Sparkles,
  RefreshCw,
  MapPin,
  Camera,
  History,
} from 'lucide-react';

interface ScorecardScreenProps {
  sample?: FeedSample | null;
  locale: Locale;
  onNavigateToRation: () => void;
  onRetest: () => void;
  onNavigateToHistory?: () => void;
}

export const ScorecardScreen: React.FC<ScorecardScreenProps> = ({
  sample,
  locale,
  onNavigateToRation,
  onRetest,
  onNavigateToHistory,
}) => {
  const [showTechnicalDetails, setShowTechnicalDetails] = useState(false);
  const [showLabModal, setShowLabModal] = useState(false);
  const [isRequestingClinicalReview, setIsRequestingClinicalReview] = useState(false);
  const [clinicalReview, setClinicalReview] = useState<string | null>(null);
  const [clinicalReviewError, setClinicalReviewError] = useState<string | null>(null);

  if (!sample) {
    return (
      <div className="p-6 flex flex-col items-center justify-center min-h-[65vh] text-center space-y-4">
        <div className="w-16 h-16 rounded-3xl bg-emerald-100 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-700 flex items-center justify-center text-3xl shadow-sm">
          📋
        </div>
        <div className="space-y-1.5 max-w-xs">
          <h3 className="text-base sm:text-lg font-black text-[#1A1A1A] dark:text-white">
            {t('score.noSampleTitle', locale)}
          </h3>
          <p className="text-xs text-[#5A5243] dark:text-slate-300 leading-relaxed font-medium">
            {t('score.noSampleMsg', locale)}
          </p>
        </div>
        <div className="pt-2 w-full max-w-xs space-y-2.5">
          <button
            type="button"
            onClick={onRetest}
            className="w-full py-3.5 px-4 bg-[#1F5D3B] hover:bg-[#184a2f] text-white font-black text-sm rounded-2xl shadow-lg flex items-center justify-center space-x-2 transition-all active:scale-98 min-h-[52px]"
          >
            <Camera className="w-5 h-5" />
            <span>{t('score.scanNewFeed', locale)}</span>
          </button>
          {onNavigateToHistory && (
            <button
              type="button"
              onClick={onNavigateToHistory}
              className="w-full py-3 px-4 bg-white dark:bg-slate-800 hover:bg-emerald-50 dark:hover:bg-slate-700 text-[#1F5D3B] dark:text-emerald-300 border-2 border-[#DCD3BF] dark:border-slate-700 font-bold text-xs rounded-2xl shadow-sm flex items-center justify-center space-x-2 min-h-[48px] transition-all"
            >
              <History className="w-4 h-4" />
              <span>{t('nav.history', locale)}</span>
            </button>
          )}
        </div>
      </div>
    );
  }

  const isTierC = sample.overallGrade?.includes('Tier C') ?? false;

  const handleClinicalReview = async () => {
    setIsRequestingClinicalReview(true);
    setClinicalReviewError(null);
    try {
      const res = await fetch('/api/veterinary-expert', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mode: 'scorecard_clinical_review',
          sample,
          locale,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to fetch clinical review');
      }
      setClinicalReview(data.review || data.reply || data.advice);
    } catch (err: any) {
      setClinicalReviewError(err.message || 'Could not complete clinical consultation.');
    } finally {
      setIsRequestingClinicalReview(false);
    }
  };

  const handleShare = async () => {
    const sampleDisplayName = getSampleDisplayName(sample, locale);
    const ureaResult = sample.adulteration?.ureaAdulterationDetected
      ? `ADULTERATION SUSPECTED (${sample.adulteration.ureaPercentage || ''}%)`
      : 'Negative';
    const bisStatus = sample.bisCompliant ? 'Met Reference Threshold' : 'Threshold Breach Detected';

    const fullReportText = [
      `🐄 *PashuPoshan Field Screening Certificate* (SIH 2026 PS 26111)`,
      `📋 Sample: ${sampleDisplayName}`,
      `🏷️ Batch: ${sample.batchNumber || 'N/A'}`,
      `⭐ Grade: ${sample.overallGrade}`,
      `🧪 Est. Crude Protein: ${sample.metrics?.crudeProtein !== undefined ? `${sample.metrics.crudeProtein}%` : 'Pending Lab Assay'}`,
      `⚠️ Urea Screening: ${ureaResult}`,
      `📜 BIS IS:2052 Status: ${bisStatus}`,
      ``,
      `⚖️ Disclaimer: Optical proxy / rapid field triage estimate only. Certified laboratory confirmation required.`,
    ].join('\n');

    if (navigator.share) {
      try {
        await navigator.share({
          title: `PashuPoshan Report: ${sampleDisplayName}`,
          text: fullReportText,
        });
        return;
      } catch (err: any) {
        if (err?.name === 'AbortError') {
          return;
        }
      }
    }

    const whatsappUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(fullReportText)}`;
    window.open(whatsappUrl, '_blank');
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

        {/* Action button if image was rejected as non-feed */}
        {sample.isNonFeedSample && (
          <button
            type="button"
            onClick={onRetest}
            className="w-full py-4 px-5 rounded-2xl bg-[#1F5D3B] hover:bg-[#184a2f] text-white font-black text-base flex items-center justify-center space-x-2 shadow-lg min-h-[56px] transition-all transform active:scale-98"
          >
            <RotateCcw className="w-5 h-5 text-white" />
            <span>{t('score.feedPhotoRetake', locale)}</span>
          </button>
        )}

        {/* 2. Large, High-Contrast Audio Advisory Button Directly Under Verdict */}
        <AudioGuidance
          textToSpeak={
            sample.actionableSummary ||
            ((sample.veterinaryAdvisory ? sample.veterinaryAdvisory + '. ' : '') +
              (sample.correctiveActions || []).join('. '))
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
                <span>{t('score.call1962', locale)}</span>
              </a>
            )}
          </div>

          <ul className="space-y-2.5">
            {(sample.correctiveActions || []).map((action, idx) => (
              <li key={idx} className="text-xs sm:text-sm text-[#1A1A1A] dark:text-slate-200 flex items-start space-x-2.5 font-semibold leading-relaxed">
                <span className="w-2 h-2 rounded-full bg-[#1F5D3B] dark:bg-emerald-400 mt-1.5 shrink-0" />
                <span>{getActionableAdviceText(action, locale)}</span>
              </li>
            ))}
          </ul>

          <div className="p-3 bg-white/80 dark:bg-slate-900/80 border border-[#DCD3BF] dark:border-slate-700 rounded-xl text-xs space-y-2">
            <div className="font-black text-[#5A5243] dark:text-slate-300 flex items-center justify-between">
              <div className="flex items-center space-x-1">
                <Info className="w-3.5 h-3.5 text-[#1F5D3B] dark:text-emerald-400" />
                <span>{t('score.vetAdvisoryTitle', locale)}:</span>
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-[#1F5D3B] dark:text-emerald-300">
                ICAR-NDRI Guidelines
              </span>
            </div>
            <p className="text-[#1A1A1A] dark:text-slate-200 leading-relaxed font-medium">
              {getActionableAdviceText(sample.veterinaryAdvisory, locale)}
            </p>

            {/* Deep Clinical Veterinary Review */}
            <div className="pt-1.5 border-t border-[#DCD3BF]/60 dark:border-slate-700/60">
              {!clinicalReview ? (
                <button
                  type="button"
                  onClick={handleClinicalReview}
                  disabled={isRequestingClinicalReview}
                  className="w-full py-2.5 px-3 bg-gradient-to-r from-[#1F5D3B] to-teal-800 hover:from-[#184a2f] hover:to-teal-900 text-white rounded-xl font-bold text-xs flex items-center justify-center space-x-2 shadow transition-all active:scale-98 disabled:opacity-60 min-h-[44px]"
                >
                  {isRequestingClinicalReview ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin text-emerald-200" />
                      <span>{t('score.consultDoctor', locale)}</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                      <span>{t('score.getDoctorAdvice', locale)}</span>
                    </>
                  )}
                </button>
              ) : (
                <div className="p-3 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-700 rounded-xl space-y-2 text-xs">
                  <div className="flex items-center justify-between border-b border-emerald-200 dark:border-emerald-800/60 pb-1.5">
                    <div className="flex items-center space-x-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                      <span className="font-extrabold text-[#1F5D3B] dark:text-emerald-300">
                        {t('score.doctorAdvice', locale)}
                      </span>
                    </div>
                    <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded bg-emerald-200 dark:bg-emerald-900 text-emerald-900 dark:text-emerald-200">
                      ICAR-NDRI
                    </span>
                  </div>
                  <div className="text-slate-800 dark:text-slate-200 whitespace-pre-line leading-relaxed font-medium">
                    {clinicalReview}
                  </div>
                  <div className="flex items-center justify-between pt-1 text-[10px] text-slate-500 dark:text-slate-400">
                    <span>{t('score.ndriStandard', locale)}</span>
                    <button
                      type="button"
                      onClick={() => setClinicalReview(null)}
                      className="text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 font-bold underline"
                    >
                      {t('common.close', locale)}
                    </button>
                  </div>
                </div>
              )}
              {clinicalReviewError && (
                <p className="text-[11px] text-red-600 dark:text-red-400 mt-1 font-semibold">
                  {clinicalReviewError}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* 4. Collapsible Technical Details */}
        <div className="border-2 border-[#DCD3BF] dark:border-slate-700 rounded-2xl overflow-hidden shadow-sm transition-all bg-[#F3EEE1] dark:bg-slate-800">
          <button
            type="button"
            onClick={() => setShowTechnicalDetails(!showTechnicalDetails)}
            className="w-full py-4 px-4 flex items-center justify-between text-left font-black text-xs sm:text-sm text-[#1A1A1A] dark:text-white bg-[#EAE3D2] dark:bg-slate-700/80 hover:bg-[#ded5c2] transition-colors min-h-[56px]"
            aria-expanded={showTechnicalDetails}
          >
            <div className="flex items-center space-x-2">
              <FlaskConical className="w-4 h-4 text-[#1F5D3B] dark:text-emerald-400" />
              <span>{t('score.techDetails', locale)}</span>
            </div>
            <div className="flex items-center space-x-1 text-xs text-[#5A5243] dark:text-slate-300">
              <span>{showTechnicalDetails ? t('score.hide', locale) : t('score.view', locale)}</span>
              {showTechnicalDetails ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </div>
          </button>

          {showTechnicalDetails && (
            <div className="p-4 space-y-4 bg-[#FBF8F1] dark:bg-slate-900 border-t border-[#DCD3BF] dark:border-slate-700">
              {/* Heuristic Disclaimer Alert */}
              <HeuristicDisclaimerBanner sample={sample} locale={locale} />

              {/* Certificate & Batch Metadata */}
              <CertificateBanner sample={sample} locale={locale} />

              {/* Adulteration & Contaminant Screening Panel */}
              <AdulterationAlertBox
                sample={sample}
                locale={locale}
                onOpenLabModal={() => setShowLabModal(true)}
              />

              {/* Nutritional Parameter Gauges & Flieg Score */}
              <NutritionalMetricsGrid
                sample={sample}
                locale={locale}
                onOpenLabModal={() => setShowLabModal(true)}
              />

              {/* Legal Disclaimer Notice */}
              <div className="p-3 bg-white dark:bg-slate-800 border border-[#DCD3BF] dark:border-slate-700 rounded-xl text-[11px] text-[#5A5243] dark:text-slate-400 leading-relaxed font-medium">
                <strong>{t('score.disclaimerTitle', locale)}:</strong> {sample.disclaimer}
              </div>
            </div>
          )}
        </div>

        {/* 5. Accredited Lab Testing & Verification Referral */}
        <div className="bg-[#edf7f0] dark:bg-emerald-950/40 border-2 border-[#1F5D3B]/40 dark:border-emerald-500/30 rounded-2xl p-4 space-y-2.5 shadow-sm text-[#1A1A1A] dark:text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <FlaskConical className="w-5 h-5 text-[#1F5D3B] dark:text-emerald-400" />
              <span className="text-xs font-black text-[#1F5D3B] dark:text-emerald-300 uppercase tracking-wide">
                {t('lab.title', locale)}
              </span>
            </div>
            <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-[#1F5D3B] text-white">
              BIS / NDDB / DAHD
            </span>
          </div>
          <p className="text-xs text-[#5A5243] dark:text-slate-300 leading-relaxed font-semibold">
            {t('score.labReferralSub', locale)}
          </p>
          <div className="pt-1 flex items-center justify-between flex-wrap gap-2">
            <span className="text-xs font-bold text-[#1A1A1A] dark:text-slate-200">
              {t('lab.helplineTitle', locale)}
            </span>
            <div className="flex items-center space-x-2">
              <button
                type="button"
                onClick={() => setShowLabModal(true)}
                className="px-3.5 py-2 bg-white dark:bg-slate-800 border-2 border-[#1F5D3B] dark:border-emerald-500 text-[#1F5D3B] dark:text-emerald-300 hover:bg-emerald-50 dark:hover:bg-emerald-950 font-black text-xs rounded-xl shadow-sm min-h-[44px] flex items-center space-x-1.5 active:scale-98 transition-all"
              >
                <MapPin className="w-3.5 h-3.5" />
                <span>{t('score.findLab', locale)}</span>
              </button>
              <a
                href="tel:1962"
                className="px-3.5 py-2 bg-[#1F5D3B] hover:bg-[#194a30] text-white font-black text-xs rounded-xl shadow min-h-[44px] flex items-center space-x-1.5 active:scale-98 transition-all"
              >
                <PhoneCall className="w-3.5 h-3.5" />
                <span>{t('score.call1962', locale)}</span>
              </a>
            </div>
          </div>
        </div>

        {/* 6. Share, Print & Retest Buttons (Min 56px Touch Target) */}
        <div className="grid grid-cols-3 gap-2.5 pt-1">
          <button
            onClick={handleShare}
            className="flex items-center justify-center space-x-1.5 py-3.5 px-2 bg-[#1F5D3B] hover:bg-[#194a30] text-white font-black text-xs sm:text-sm rounded-2xl shadow-md active:scale-98 transition-all min-h-[56px]"
          >
            <Share2 className="w-4 h-4 shrink-0" />
            <span>{t('common.share', locale)}</span>
          </button>

          <button
            onClick={handlePrint}
            className="flex items-center justify-center space-x-1.5 py-3.5 px-2 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-[#1A1A1A] dark:text-slate-200 font-black text-xs sm:text-sm rounded-2xl border-2 border-[#DCD3BF] dark:border-slate-700 shadow-md active:scale-98 transition-all min-h-[56px]"
          >
            <Printer className="w-4 h-4 shrink-0" />
            <span>{t('common.print', locale)}</span>
          </button>

          <button
            onClick={onRetest}
            className="flex items-center justify-center space-x-1.5 py-3.5 px-2 bg-white dark:bg-slate-800 hover:bg-amber-50 dark:hover:bg-slate-700 text-[#C2703D] dark:text-amber-300 font-black text-xs sm:text-sm rounded-2xl border-2 border-[#C2703D]/60 dark:border-amber-500/40 shadow-md active:scale-98 transition-all min-h-[56px]"
          >
            <RotateCcw className="w-4 h-4 shrink-0" />
            <span>{t('common.retest', locale)}</span>
          </button>
        </div>

        {/* 6. Secondary Navigation to Ration Balancer (Min 56px Touch Target) */}
        <button
          onClick={onNavigateToRation}
          className="w-full py-4 px-4 bg-[#1F5D3B] hover:bg-[#194a30] text-white font-black text-sm sm:text-base rounded-2xl shadow-xl active:scale-98 transition-all flex items-center justify-center space-x-2 min-h-[56px]"
        >
          <span>{t('ration.addToDiet', locale)}</span>
        </button>
      </div>

      {/* Accredited Feed Testing Laboratories Directory Modal */}
      <NearestLabModal
        isOpen={showLabModal}
        onClose={() => setShowLabModal(false)}
        locale={locale}
      />
    </>
  );
};
