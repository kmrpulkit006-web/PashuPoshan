import React, { useState, useEffect } from 'react';
import { FeedSample, Locale } from '../lib/types';
import {
  t,
  getSampleDisplayName,
  getCowDisplayName,
  getCowBreedDisplayName,
  getFeedCategoryDisplayName,
} from '../lib/i18n';
import { useRationManager } from '../hooks/useRationManager';
import { AddCowModal } from '../components/ration/AddCowModal';
import { RationNutrientCards } from '../components/ration/RationNutrientCards';
import { CowHistoryTimeline } from '../components/ration/CowHistoryTimeline';
import { saveLocalScan } from '../lib/storage';
import { Scale, Plus, Trash2, Minus, Sparkles, RefreshCw, Bot, X, AlertCircle } from 'lucide-react';

interface RationScreenProps {
  activeSample?: FeedSample;
  locale: Locale;
}

export const RationScreen: React.FC<RationScreenProps> = ({ activeSample, locale }) => {
  const [showAddModal, setShowAddModal] = useState(false);
  const [isOptimizingRation, setIsOptimizingRation] = useState(false);
  const [rationAdvice, setRationAdvice] = useState<string | null>(null);
  const [rationAdviceError, setRationAdviceError] = useState<string | null>(null);
  const [currentSample, setCurrentSample] = useState<FeedSample | undefined>(activeSample);

  useEffect(() => {
    setCurrentSample(activeSample);
  }, [activeSample]);

  const {
    cows,
    selectedCowId,
    dailyYield,
    setDailyYield,
    cowWeight,
    setCowWeight,
    rationPlan,
    rationNotice,
    setRationNotice,
    handleSelectCow,
    handleSaveCow,
    handleDeleteCow,
  } = useRationManager({ activeSample: currentSample, locale });

  useEffect(() => {
    if (!rationNotice) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (rationNotice.onCancel) {
          rationNotice.onCancel();
        } else {
          setRationNotice(null);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [rationNotice, setRationNotice]);

  const activeCow = cows.find((c) => c.id === selectedCowId) || cows[0];

  const handleLinkSampleToCow = () => {
    if (!currentSample || currentSample.linkedCowId || !selectedCowId) return;
    const updated = { ...currentSample, linkedCowId: selectedCowId };
    saveLocalScan(updated);
    setCurrentSample(updated);
  };

  const handleOptimizeRation = async () => {
    setIsOptimizingRation(true);
    setRationAdviceError(null);
    try {
      const activeCow = cows.find((c) => c.id === selectedCowId);
      const res = await fetch('/api/veterinary-expert', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mode: 'ration_optimization',
          rationPlan,
          cowProfile: {
            name: activeCow?.name || 'Selected Cow',
            breed: activeCow?.breed || 'Crossbred Dairy Cow',
            weight: cowWeight,
            dailyYield,
          },
          locale,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to optimize ration');
      }
      setRationAdvice(data.review || data.reply || data.advice);
    } catch (err: any) {
      setRationAdviceError(err.message || 'Could not complete ration optimization consultation.');
    } finally {
      setIsOptimizingRation(false);
    }
  };

  const adjustYield = (delta: number) => {
    setDailyYield((prev) => Math.min(45, Math.max(2, prev + delta)));
  };

  const adjustWeight = (delta: number) => {
    setCowWeight((prev) => Math.min(750, Math.max(200, prev + delta)));
  };

  return (
    <div className="p-4 space-y-4 pb-28 print:hidden text-[#1A1A1A] dark:text-white">
      {/* Header */}
      <div className="bg-[#F3EEE1] dark:bg-slate-800 border-2 border-[#DCD3BF] dark:border-slate-700 rounded-3xl p-4 shadow-sm">
        <div className="flex items-center justify-between mb-1.5">
          <div className="flex items-center space-x-2">
            <div className="w-9 h-9 rounded-2xl bg-[#1F5D3B]/15 text-[#1F5D3B] dark:text-emerald-400 flex items-center justify-center">
              <Scale className="w-5 h-5" />
            </div>
            <h2 className="text-base font-black text-[#1A1A1A] dark:text-white leading-tight">
              {t('ration.title', locale)}
            </h2>
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            className="px-3.5 py-2.5 bg-[#1F5D3B] hover:bg-[#194a30] text-white font-black text-xs rounded-xl shadow-md active:scale-98 transition-all flex items-center space-x-1.5 min-h-[44px]"
            aria-label={t('ration.addCow', locale)}
          >
            <Plus className="w-4 h-4" />
            <span>{t('ration.addCow', locale).replace(/^\+\s*/, '')}</span>
          </button>
        </div>
        <p className="text-xs text-[#5A5243] dark:text-slate-300 font-semibold leading-relaxed">
          {t('ration.subtitle', locale)}
        </p>

        {/* Tested Feed Allocation Banner */}
        {currentSample && (
          <div className="mt-3 bg-[#edf7f0] dark:bg-emerald-950/60 border border-[#b0dec0] dark:border-emerald-500/40 rounded-2xl p-2.5 flex items-center justify-between text-xs flex-wrap gap-2">
            <div className="flex items-center space-x-2">
              <span className="text-[10px] font-black text-[#1F5D3B] dark:text-emerald-300 bg-white/90 dark:bg-black/40 px-2 py-0.5 rounded-lg border border-[#b0dec0] dark:border-emerald-500/30">
                {t('ration.feedSlot', locale, { category: getFeedCategoryDisplayName(currentSample.category, locale) })}
              </span>
              <span className="font-bold text-[#1A1A1A] dark:text-white text-xs truncate max-w-[170px]">
                {getSampleDisplayName(currentSample, locale)}
                {currentSample.metrics?.crudeProtein ? ` (${t('score.crudeProteinShort', locale) || 'CP'} ${currentSample.metrics.crudeProtein}%)` : ''}
              </span>
            </div>
            <div className="flex items-center space-x-1.5">
              {!currentSample.linkedCowId ? (
                <button
                  type="button"
                  onClick={handleLinkSampleToCow}
                  className="text-[10px] text-white bg-[#1F5D3B] hover:bg-[#184a2f] font-black px-2.5 py-1.5 rounded-lg transition-all active:scale-95 min-h-[36px] flex items-center space-x-1"
                  title={`Link this tested feed sample to ${getCowDisplayName(activeCow, locale) || 'selected cow'}`}
                >
                  <Plus className="w-3 h-3" />
                  <span>{t('ration.linkToCow', locale, { cow: getCowDisplayName(activeCow, locale) || 'Cow' }).replace(/^\+\s*/, '')}</span>
                </button>
              ) : currentSample.linkedCowId === selectedCowId ? (
                <span className="text-[10px] text-[#1F5D3B] dark:text-emerald-300 font-black">
                  {t('ration.linkedToCow', locale, { cow: getCowDisplayName(activeCow, locale) || '' })} ✓
                </span>
              ) : (
                <span className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold">
                  {t('ration.linkedToCow', locale, { cow: getCowDisplayName(cows.find((c) => c.id === currentSample.linkedCowId), locale) || 'Other Cattle' })}
                </span>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Herd Cattle Selector with Large Accessible Buttons */}
      <div className="bg-[#F3EEE1] dark:bg-slate-800 border-2 border-[#DCD3BF] dark:border-slate-700 rounded-3xl p-4 space-y-3 shadow-sm">
        <label className="text-xs font-black text-[#5A5243] dark:text-slate-300 uppercase tracking-wide block">
          {t('ration.selectCow', locale)}
        </label>
        <div className="grid grid-cols-3 gap-2.5" role="group" aria-label="Herd Cattle Selection">
          {cows.map((cow) => (
            <div
              key={cow.id}
              role="button"
              tabIndex={0}
              onClick={() => handleSelectCow(cow)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  handleSelectCow(cow);
                }
              }}
              className={`relative p-3 rounded-2xl border-2 text-center transition-all cursor-pointer min-h-[76px] flex flex-col justify-center ${
                selectedCowId === cow.id
                  ? 'bg-[#edf7f0] dark:bg-emerald-950 border-[#1F5D3B] dark:border-emerald-400 text-[#1F5D3B] dark:text-white shadow-md'
                  : 'bg-white dark:bg-slate-900 border-[#DCD3BF] dark:border-slate-700 text-[#5A5243] dark:text-slate-300 hover:border-[#1F5D3B]'
              }`}
            >
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleDeleteCow(cow.id, e);
                }}
                className="absolute top-0.5 right-0.5 text-slate-400 hover:text-[#B3261E] dark:hover:text-red-400 w-11 h-11 min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl"
                title="Remove cattle"
                aria-label={`Remove ${getCowDisplayName(cow, locale)}`}
              >
                <Trash2 className="w-4 h-4" />
              </button>
              <div className="text-xl mb-0.5" aria-hidden="true">🐄</div>
              <div className="text-xs font-black truncate">{getCowDisplayName(cow, locale)}</div>
              <div className="text-[10px] text-[#5A5243] dark:text-slate-400 truncate font-semibold">
                {getCowBreedDisplayName(cow.breed, locale)}
              </div>
            </div>
          ))}
        </div>

        {/* Large Steppers for Milk Yield and Body Weight (Replacing Sliders) */}
        <div className="space-y-4 pt-3 border-t border-[#DCD3BF] dark:border-slate-700">
          {/* Stepper 1: Daily Milk Yield */}
          <div className="bg-white dark:bg-slate-900/90 border border-[#DCD3BF] dark:border-slate-700 rounded-2xl p-3.5 space-y-2">
            <div className="flex items-center justify-between text-xs font-bold text-[#5A5243] dark:text-slate-300">
              <span>{t('ration.dailyYield', locale)}</span>
              <span className="text-[11px] text-[#1F5D3B] dark:text-emerald-400 font-black">
                {t('ration.litresPerDay', locale)}
              </span>
            </div>

            <div className="flex items-center justify-between space-x-3">
              <button
                type="button"
                onClick={() => adjustYield(-1)}
                className="w-16 h-14 bg-[#F3EEE1] dark:bg-slate-800 hover:bg-[#EAE3D2] active:scale-95 text-[#1A1A1A] dark:text-white font-black text-xl rounded-2xl border-2 border-[#DCD3BF] dark:border-slate-600 flex items-center justify-center shadow-sm min-h-[56px] transition-all"
                aria-label="Decrease milk yield by 1 liter"
              >
                <Minus className="w-6 h-6 stroke-[3]" />
              </button>

              <div className="flex-1 text-center py-1">
                <div className="text-3xl sm:text-4xl font-black text-[#1F5D3B] dark:text-emerald-400 leading-none">
                  {dailyYield}
                </div>
                <div className="text-xs font-bold text-[#5A5243] dark:text-slate-400 mt-1 uppercase tracking-wider">
                  {t('ration.litresPerDay', locale)}
                </div>
              </div>

              <button
                type="button"
                onClick={() => adjustYield(1)}
                className="w-16 h-14 bg-[#1F5D3B] hover:bg-[#194a30] active:scale-95 text-white font-black text-xl rounded-2xl shadow-md flex items-center justify-center min-h-[56px] transition-all"
                aria-label="Increase milk yield by 1 liter"
              >
                <Plus className="w-6 h-6 stroke-[3]" />
              </button>
            </div>
          </div>

          {/* Stepper 2: Animal Body Weight */}
          <div className="bg-white dark:bg-slate-900/90 border border-[#DCD3BF] dark:border-slate-700 rounded-2xl p-3.5 space-y-2">
            <div className="flex items-center justify-between text-xs font-bold text-[#5A5243] dark:text-slate-300">
              <span>{t('ration.cowWeight', locale)}</span>
              <span className="text-[11px] text-[#C2703D] dark:text-amber-400 font-black">
                {t('ration.kilograms', locale)}
              </span>
            </div>

            <div className="flex items-center justify-between space-x-3">
              <button
                type="button"
                onClick={() => adjustWeight(-10)}
                className="w-16 h-14 bg-[#F3EEE1] dark:bg-slate-800 hover:bg-[#EAE3D2] active:scale-95 text-[#1A1A1A] dark:text-white font-black text-xl rounded-2xl border-2 border-[#DCD3BF] dark:border-slate-600 flex items-center justify-center shadow-sm min-h-[56px] transition-all"
                aria-label="Decrease body weight by 10 kilograms"
              >
                <Minus className="w-6 h-6 stroke-[3]" />
              </button>

              <div className="flex-1 text-center py-1">
                <div className="text-3xl sm:text-4xl font-black text-[#1A1A1A] dark:text-white leading-none">
                  {cowWeight}
                </div>
                <div className="text-xs font-bold text-[#5A5243] dark:text-slate-400 mt-1 uppercase tracking-wider">
                  {t('ration.kilograms', locale)}
                </div>
              </div>

              <button
                type="button"
                onClick={() => adjustWeight(10)}
                className="w-16 h-14 bg-[#C2703D] hover:bg-[#a8572e] active:scale-95 text-white font-black text-xl rounded-2xl shadow-md flex items-center justify-center min-h-[56px] transition-all"
                aria-label="Increase body weight by 10 kilograms"
              >
                <Plus className="w-6 h-6 stroke-[3]" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Per-Cow Health & Yield History Timeline */}
      {activeCow && (
        <CowHistoryTimeline
          cow={activeCow}
          locale={locale}
          activeSample={currentSample}
          onYieldLogged={(newYield) => setDailyYield(newYield)}
        />
      )}

      {/* Calculated Total Mixed Ration (TMR) Breakdown Cards */}
      <RationNutrientCards rationPlan={rationPlan} locale={locale} />

      {/* Cattle Diet Advisory Card */}
      <div className="bg-[#F3EEE1] dark:bg-slate-800 border-2 border-[#DCD3BF] dark:border-slate-700 rounded-3xl p-4 space-y-3 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-xl bg-emerald-600/15 text-[#1F5D3B] dark:text-emerald-400 flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-[#1F5D3B] dark:text-emerald-300" />
            </div>
            <div>
              <h3 className="text-xs sm:text-sm font-black text-[#1A1A1A] dark:text-white leading-none">
                {t('ration.doctorAdvisoryTitle', locale)}
              </h3>
              <p className="text-[10px] text-[#5A5243] dark:text-slate-400 font-semibold mt-0.5">
                Based on ICAR-NDRI Cattle Nutrition Guidelines
              </p>
            </div>
          </div>
          <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-[#1F5D3B] dark:text-emerald-300 border border-emerald-300/60 dark:border-emerald-700">
            ICAR Standard
          </span>
        </div>

        {!rationAdvice ? (
          <button
            type="button"
            onClick={handleOptimizeRation}
            disabled={isOptimizingRation}
            className="w-full py-3.5 px-4 bg-gradient-to-r from-[#1F5D3B] to-teal-800 hover:from-[#184a2f] hover:to-teal-900 text-white rounded-2xl font-black text-xs sm:text-sm flex items-center justify-center space-x-2 shadow-md transition-all active:scale-98 disabled:opacity-60 min-h-[50px]"
          >
            {isOptimizingRation ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin text-emerald-200" />
                <span>{t('ration.checkingDiet', locale)}</span>
              </>
            ) : (
              <>
                <Bot className="w-4 h-4 text-emerald-300" />
                <span>🩺 {t('ration.getDoctorAdviceBtn', locale)}</span>
              </>
            )}
          </button>
        ) : (
          <div className="p-3.5 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-700 rounded-2xl space-y-2 text-xs">
            <div className="flex items-center justify-between border-b border-emerald-200 dark:border-emerald-800 pb-1.5">
              <span className="font-extrabold text-[#1F5D3B] dark:text-emerald-300">
                {t('ration.dietAdviceHeading', locale)}
              </span>
              <button
                type="button"
                onClick={() => setRationAdvice(null)}
                className="text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 text-[10px] font-bold underline"
              >
                {t('common.close', locale)}
              </button>
            </div>
            <div className="text-slate-800 dark:text-slate-200 whitespace-pre-line leading-relaxed font-medium">
              {rationAdvice}
            </div>
            <div className="pt-1 flex items-center justify-between text-[10px] text-slate-500 dark:text-slate-400">
              <span>{t('ration.digestionSafe', locale)}</span>
              <button
                type="button"
                onClick={handleOptimizeRation}
                disabled={isOptimizingRation}
                className="text-[#1F5D3B] dark:text-emerald-400 font-extrabold flex items-center space-x-1"
              >
                <RefreshCw className={`w-3 h-3 ${isOptimizingRation ? 'animate-spin' : ''}`} />
                <span>{t('ration.checkAgain', locale)}</span>
              </button>
            </div>
          </div>
        )}

        {rationAdviceError && (
          <p className="text-[11px] text-red-600 dark:text-red-400 font-semibold">
            {rationAdviceError}
          </p>
        )}
      </div>

      {/* Add Cattle Modal */}
      <AddCowModal
        showModal={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSaveCow={handleSaveCow}
        locale={locale}
      />

      {/* In-App Notice / Confirmation Modal */}
      {rationNotice && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="ration-notice-title"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in"
          onClick={() => {
            if (rationNotice.onCancel) rationNotice.onCancel();
            else setRationNotice(null);
          }}
        >
          <div
            className="w-full max-w-sm rounded-3xl border-2 shadow-2xl p-6 space-y-4 bg-field-surface dark:bg-slate-900 border-field-border dark:border-slate-700 animate-scale-up"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center space-x-2.5">
                <div className="w-10 h-10 rounded-2xl flex items-center justify-center bg-amber-500/15 text-amber-600 dark:text-amber-400">
                  <AlertCircle className="w-5 h-5" />
                </div>
                <h3
                  id="ration-notice-title"
                  className="text-base font-extrabold text-field-text dark:text-slate-100"
                >
                  {rationNotice.title}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => {
                  if (rationNotice.onCancel) rationNotice.onCancel();
                  else setRationNotice(null);
                }}
                className="w-11 h-11 min-h-[44px] min-w-[44px] flex items-center justify-center rounded-2xl hover:bg-black/5 dark:hover:bg-white/10 text-field-muted dark:text-slate-400"
                aria-label="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-sm font-medium leading-relaxed text-field-text/80 dark:text-slate-300">
              {rationNotice.message}
            </p>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              {rationNotice.isConfirm ? (
                <>
                  <button
                    type="button"
                    onClick={() => {
                      if (rationNotice.onCancel) rationNotice.onCancel();
                      else setRationNotice(null);
                    }}
                    className="flex-1 min-h-[44px] px-4 py-2.5 rounded-2xl border-2 font-bold text-sm bg-white dark:bg-slate-800 border-field-border dark:border-slate-700 text-field-text dark:text-slate-200"
                  >
                    {t('ration.cancelBtn', locale) || 'Cancel'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (rationNotice.onConfirm) rationNotice.onConfirm();
                    }}
                    className="flex-1 min-h-[44px] px-4 py-2.5 rounded-2xl font-bold text-sm bg-[#B3261E] text-white hover:bg-red-700"
                  >
                    {t('history.delete', locale) || 'Remove'}
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  onClick={() => setRationNotice(null)}
                  className="w-full min-h-[44px] px-4 py-2.5 rounded-2xl font-bold text-sm bg-[#1F5D3B] dark:bg-emerald-600 text-white"
                >
                  {t('common.close', locale) || 'Understood'}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
