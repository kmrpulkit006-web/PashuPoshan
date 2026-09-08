import React, { useState, useEffect } from 'react';
import { FeedSample, FeedCategory, Locale } from '../lib/types';
import { getLocalScans, deleteLocalScan, clearAllLocalScans } from '../lib/storage';
import { t, getBcp47Locale, getSampleDisplayName } from '../lib/i18n';
import { getImageFromIndexedDb } from '../lib/imageStorage';
import { Camera, ArrowRight, Clock, Plus, Trash2, AlertTriangle, X } from 'lucide-react';

interface HistoryScreenProps {
  onSelectSample: (sample: FeedSample) => void;
  onNavigateToScan: () => void;
  locale: Locale;
  theme?: 'light' | 'dark';
}

function formatFriendlyTimestamp(timestampStr: string, locale: Locale): string {
  if (!timestampStr) return 'Recently';

  try {
    const date = new Date(timestampStr);
    if (isNaN(date.getTime())) {
      return timestampStr;
    }

    const now = new Date();
    const isToday =
      date.getDate() === now.getDate() &&
      date.getMonth() === now.getMonth() &&
      date.getFullYear() === now.getFullYear();

    const yesterday = new Date(now);
    yesterday.setDate(now.getDate() - 1);
    const isYesterday =
      date.getDate() === yesterday.getDate() &&
      date.getMonth() === yesterday.getMonth() &&
      date.getFullYear() === yesterday.getFullYear();

    const timeStr = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    if (isToday) {
      return `${t('common.today', locale)}, ${timeStr}`;
    }
    if (isYesterday) {
      return `${t('common.yesterday', locale)}, ${timeStr}`;
    }

    const dateStr = date.toLocaleDateString(getBcp47Locale(locale), {
      day: 'numeric',
      month: 'short',
    });
    return `${dateStr}, ${timeStr}`;
  } catch {
    return timestampStr;
  }
}

function getVerdictBadge(sample: FeedSample, locale: Locale) {
  const grade = sample.overallGrade || '';

  if (grade.includes('Tier A') || grade.toLowerCase().includes('good') || sample.visualAnalysis?.overallVisualCondition === 'good') {
    return {
      dot: '🟢',
      label: t('history.verdictGood', locale),
      tagColor: 'bg-emerald-100 text-emerald-900 dark:bg-emerald-950/80 dark:text-emerald-300 border-emerald-300 dark:border-emerald-700',
    };
  }

  if (grade.includes('Tier B') || sample.visualAnalysis?.overallVisualCondition === 'fair') {
    return {
      dot: '🟡',
      label: t('history.verdictFair', locale),
      tagColor: 'bg-amber-100 text-amber-900 dark:bg-amber-950/80 dark:text-amber-300 border-amber-300 dark:border-amber-700',
    };
  }

  return {
    dot: '🔴',
    label: t('history.verdictDanger', locale),
    tagColor: 'bg-red-100 text-red-900 dark:bg-red-950/80 dark:text-red-300 border-red-300 dark:border-red-700',
  };
}

function getCategoryIcon(cat: FeedCategory) {
  switch (cat) {
    case 'silage':
      return '🌾';
    case 'concentrate':
      return '🥣';
    case 'green_fodder':
      return '🌱';
    case 'dry_fodder':
      return '🌾';
    default:
      return '🌾';
  }
}

export const HistoryScreen: React.FC<HistoryScreenProps> = ({
  onSelectSample,
  onNavigateToScan,
  locale,
  theme = 'light',
}) => {
  const [scans, setScans] = useState<FeedSample[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<'all' | FeedCategory>('all');
  const [resolvedImages, setResolvedImages] = useState<Record<string, string>>({});
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
  } | null>(null);

  useEffect(() => {
    const loaded = getLocalScans();
    setScans(loaded);

    // Resolve images stored in IndexedDB asynchronously for samples that don't have direct data URLs
    loaded.forEach(async (sample) => {
      if (sample.imageUrl) {
        setResolvedImages((prev) => ({ ...prev, [sample.id]: sample.imageUrl }));
      } else {
        try {
          const dbImage = await getImageFromIndexedDb(sample.id);
          if (dbImage) {
            setResolvedImages((prev) => ({ ...prev, [sample.id]: dbImage }));
          }
        } catch {
          // ignore error
        }
      }
    });
  }, []);

  const filteredScans = scans.filter((s) => {
    if (selectedCategory === 'all') return true;
    return s.category === selectedCategory;
  });

  const getLocalizedCategoryName = (cat: FeedCategory): string => {
    switch (cat) {
      case 'silage':
        return t('history.silage', locale);
      case 'concentrate':
        return t('history.concentrate', locale);
      case 'green_fodder':
        return t('history.greenFodder', locale);
      case 'dry_fodder':
        return t('history.dryFodder', locale);
      default:
        return cat;
    }
  };

  const handleDeleteItem = (sample: FeedSample, e: React.MouseEvent) => {
    e.stopPropagation();
    const displayName = getSampleDisplayName(sample, locale);
    setConfirmModal({
      isOpen: true,
      title: t('history.deleteConfirmTitle', locale),
      message: t('history.deleteConfirmMsg', locale, { name: displayName }),
      onConfirm: () => {
        const updated = deleteLocalScan(sample.id);
        setScans(updated);
        setConfirmModal(null);
      },
    });
  };

  const handleClearAll = () => {
    setConfirmModal({
      isOpen: true,
      title: t('history.clearConfirmTitle', locale),
      message: t('history.clearConfirmMsg', locale),
      onConfirm: () => {
        const updated = clearAllLocalScans();
        setScans(updated);
        setConfirmModal(null);
      },
    });
  };

  return (
    <div className="p-3 sm:p-4 space-y-4 max-w-lg mx-auto pb-8">
      {/* Header Banner */}
      <div className="bg-[#1F5D3B] text-white p-4 rounded-3xl shadow-sm space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="w-10 h-10 rounded-2xl bg-white/20 flex items-center justify-center text-xl shrink-0">
              📋
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black tracking-tight">
                {t('history.title', locale)}
              </h2>
              <p className="text-xs text-emerald-100/90 font-medium">
                {scans.length} {t('history.title', locale)}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            {scans.length > 0 && (
              <button
                type="button"
                onClick={handleClearAll}
                className="flex items-center space-x-1 bg-white/15 hover:bg-white/25 text-white font-bold text-xs px-2.5 py-2 rounded-xl transition-all min-h-[44px]"
                aria-label={t('history.clearAll', locale)}
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>{t('history.clearAll', locale)}</span>
              </button>
            )}
            <button
              onClick={onNavigateToScan}
              className="flex items-center space-x-1.5 bg-white text-[#1F5D3B] font-black text-xs px-3.5 py-2.5 rounded-xl shadow hover:bg-emerald-50 active:scale-95 transition-all min-h-[44px]"
              aria-label={t('history.newTest', locale)}
            >
              <Plus className="w-4 h-4" />
              <span>{t('history.newTest', locale)}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Category Filter Chips */}
      <div
        className="flex items-center space-x-2 overflow-x-auto no-scrollbar py-1"
        role="tablist"
        aria-label="Filter test history by feed category"
      >
        <button
          role="tab"
          aria-selected={selectedCategory === 'all'}
          onClick={() => setSelectedCategory('all')}
          className={`px-3.5 py-2.5 min-h-[44px] rounded-xl text-xs font-bold whitespace-nowrap transition-all border ${
            selectedCategory === 'all'
              ? 'bg-[#1F5D3B] text-white border-[#1F5D3B]'
              : 'bg-white dark:bg-slate-800 text-[#5A5243] dark:text-slate-300 border-[#DCD3BF] dark:border-slate-700'
          }`}
        >
          {t('history.all', locale)} ({scans.length})
        </button>
        <button
          role="tab"
          aria-selected={selectedCategory === 'silage'}
          onClick={() => setSelectedCategory('silage')}
          className={`px-3.5 py-2.5 min-h-[44px] rounded-xl text-xs font-bold whitespace-nowrap transition-all border ${
            selectedCategory === 'silage'
              ? 'bg-[#1F5D3B] text-white border-[#1F5D3B]'
              : 'bg-white dark:bg-slate-800 text-[#5A5243] dark:text-slate-300 border-[#DCD3BF] dark:border-slate-700'
          }`}
        >
          🌾 {t('history.silage', locale)}
        </button>
        <button
          role="tab"
          aria-selected={selectedCategory === 'concentrate'}
          onClick={() => setSelectedCategory('concentrate')}
          className={`px-3.5 py-2.5 min-h-[44px] rounded-xl text-xs font-bold whitespace-nowrap transition-all border ${
            selectedCategory === 'concentrate'
              ? 'bg-[#1F5D3B] text-white border-[#1F5D3B]'
              : 'bg-white dark:bg-slate-800 text-[#5A5243] dark:text-slate-300 border-[#DCD3BF] dark:border-slate-700'
          }`}
        >
          🥣 {t('history.concentrate', locale)}
        </button>
        <button
          role="tab"
          aria-selected={selectedCategory === 'green_fodder'}
          onClick={() => setSelectedCategory('green_fodder')}
          className={`px-3.5 py-2.5 min-h-[44px] rounded-xl text-xs font-bold whitespace-nowrap transition-all border ${
            selectedCategory === 'green_fodder'
              ? 'bg-[#1F5D3B] text-white border-[#1F5D3B]'
              : 'bg-white dark:bg-slate-800 text-[#5A5243] dark:text-slate-300 border-[#DCD3BF] dark:border-slate-700'
          }`}
        >
          🌱 {t('history.greenFodder', locale)}
        </button>
        <button
          role="tab"
          aria-selected={selectedCategory === 'dry_fodder'}
          onClick={() => setSelectedCategory('dry_fodder')}
          className={`px-3.5 py-2.5 min-h-[44px] rounded-xl text-xs font-bold whitespace-nowrap transition-all border ${
            selectedCategory === 'dry_fodder'
              ? 'bg-[#1F5D3B] text-white border-[#1F5D3B]'
              : 'bg-white dark:bg-slate-800 text-[#5A5243] dark:text-slate-300 border-[#DCD3BF] dark:border-slate-700'
          }`}
        >
          🌾 {t('history.dryFodder', locale)}
        </button>
      </div>

      {/* Tests List (Simple Rows / Cards - Avoid Complicated Tables) */}
      <div className="space-y-3">
        {filteredScans.length === 0 ? (
          <div className="bg-white dark:bg-slate-800 border-2 border-dashed border-[#DCD3BF] dark:border-slate-700 rounded-3xl p-8 text-center space-y-4 shadow-sm">
            <div className="w-14 h-14 mx-auto rounded-full bg-emerald-100 dark:bg-emerald-950 flex items-center justify-center text-3xl">
              📷
            </div>
            <div className="space-y-1">
              <h3 className="text-base font-black text-[#1A1A1A] dark:text-white">
                {t('history.empty', locale)}
              </h3>
              <p className="text-xs text-[#5A5243] dark:text-slate-400 max-w-xs mx-auto">
                {t('history.emptySub', locale)}
              </p>
            </div>
            <button
              onClick={onNavigateToScan}
              className="px-5 py-3 min-h-[44px] bg-[#1F5D3B] hover:bg-[#184a2f] text-white rounded-2xl font-black text-xs sm:text-sm shadow-md transition-all active:scale-95 inline-flex items-center space-x-2"
            >
              <Camera className="w-4 h-4" />
              <span>{t('history.startFirst', locale)}</span>
            </button>
          </div>
        ) : (
          filteredScans.map((sample) => {
            const verdict = getVerdictBadge(sample, locale);
            const friendlyTime = formatFriendlyTimestamp(sample.timestamp, locale);
            const categoryIcon = getCategoryIcon(sample.category);
            const sampleImage = resolvedImages[sample.id] || sample.imageUrl;
            const displayName = getSampleDisplayName(sample, locale);

            return (
              <div
                key={sample.id}
                onClick={() => onSelectSample(sample)}
                className="bg-white dark:bg-slate-800 border-2 border-[#DCD3BF] dark:border-slate-700 hover:border-[#1F5D3B] dark:hover:border-emerald-500 rounded-2xl p-3.5 sm:p-4 shadow-sm transition-all cursor-pointer active:scale-[0.99] space-y-3 relative group"
                role="button"
                tabIndex={0}
                aria-label={`View result for ${displayName}`}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    onSelectSample(sample);
                  }
                }}
              >
                {/* Top Row: Sample Image Thumbnail + Feed Test Name + Delete Action */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center space-x-3 min-w-0 flex-1">
                    {/* Image Thumbnail */}
                    <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-xl bg-slate-100 dark:bg-slate-700 border border-[#DCD3BF] dark:border-slate-600 overflow-hidden shrink-0 flex items-center justify-center shadow-xs">
                      {sampleImage ? (
                        <img
                          src={sampleImage}
                          alt={displayName}
                          className="w-full h-full object-cover"
                          loading="lazy"
                        />
                      ) : (
                        <div className="text-center p-1">
                          <span className="text-xl block">📷</span>
                          <span className="text-[8px] font-bold text-slate-400 block leading-none mt-0.5">
                            {t('history.noImage', locale)}
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center space-x-1.5 mb-1">
                        <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 shrink-0">
                          {categoryIcon} {getLocalizedCategoryName(sample.category)}
                        </span>
                      </div>
                      <h3 className="font-black text-sm sm:text-base text-[#1A1A1A] dark:text-white truncate">
                        {displayName}
                      </h3>
                      {/* Middle Row: Friendly Timestamp */}
                      <div className="flex items-center space-x-1 text-xs text-[#5A5243] dark:text-slate-400 mt-1">
                        <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span className="font-semibold">{friendlyTime}</span>
                      </div>
                    </div>
                  </div>

                  {/* Individual Delete Button */}
                  <button
                    type="button"
                    onClick={(e) => handleDeleteItem(sample, e)}
                    className="w-11 h-11 min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/50 transition-colors shrink-0 -mr-1 -mt-1"
                    title={t('history.deleteTest', locale)}
                    aria-label={`${t('history.deleteTest', locale)} - ${displayName}`}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                {/* Bottom Row: Verdict Badge & View Result Action */}
                <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-700/60">
                  {/* Traffic Light Verdict: 🟢 GOOD / 🟡 FAIR / 🔴 DANGER */}
                  <div
                    className={`inline-flex items-center space-x-1.5 px-3 py-1 rounded-xl border font-black text-xs tracking-wide shadow-sm ${verdict.tagColor}`}
                  >
                    <span>{verdict.dot}</span>
                    <span>{verdict.label}</span>
                  </div>

                  {/* View Result Link */}
                  <div className="flex items-center space-x-1 text-xs font-black text-[#1F5D3B] dark:text-emerald-400 hover:underline">
                    <span>{t('history.viewResult', locale)}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Confirmation Modal for Delete / Clear Operations */}
      {confirmModal && confirmModal.isOpen && (
        <div
          className="fixed inset-0 bg-black/75 z-50 flex items-center justify-center p-4 animate-in fade-in duration-200"
          role="dialog"
          aria-modal="true"
        >
          <div className="bg-[#FBF8F1] dark:bg-slate-900 border-2 border-[#DCD3BF] dark:border-slate-700 rounded-3xl p-5 w-full max-w-sm space-y-4 shadow-2xl text-[#1A1A1A] dark:text-white">
            <div className="flex items-center justify-between border-b border-[#DCD3BF] dark:border-slate-800 pb-2.5">
              <h3 className="text-sm font-black flex items-center space-x-2">
                <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0" />
                <span>{confirmModal.title}</span>
              </h3>
              <button
                onClick={() => setConfirmModal(null)}
                className="w-11 h-11 min-h-[44px] min-w-[44px] rounded-full text-slate-500 hover:text-slate-900 dark:hover:text-white flex items-center justify-center transition-colors"
                aria-label={t('common.close', locale)}
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <p className="text-xs text-slate-700 dark:text-slate-200 whitespace-pre-line leading-relaxed">
              {confirmModal.message}
            </p>
            <div className="flex space-x-2 pt-1">
              <button
                type="button"
                onClick={() => setConfirmModal(null)}
                className="flex-1 py-3 border-2 border-[#DCD3BF] dark:border-slate-700 rounded-2xl font-bold text-xs min-h-[48px] text-[#1A1A1A] dark:text-white"
              >
                {t('common.cancel', locale)}
              </button>
              <button
                type="button"
                onClick={confirmModal.onConfirm}
                className="flex-1 py-3 text-white font-black text-xs rounded-2xl shadow-lg min-h-[48px] bg-rose-600 hover:bg-rose-700 transition-all"
              >
                {t('common.confirm', locale)}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

