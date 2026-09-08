import React, { useState, useEffect } from 'react';
import { FeedSample, FeedCategory, Locale } from '../lib/types';
import { getLocalScans } from '../lib/storage';
import { t } from '../lib/i18n';
import { Camera, ArrowRight, Clock, Plus } from 'lucide-react';

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

    const dateStr = date.toLocaleDateString(locale === 'hi' ? 'hi-IN' : 'en-IN', {
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

  useEffect(() => {
    const loaded = getLocalScans();
    setScans(loaded);
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

            return (
              <div
                key={sample.id}
                onClick={() => onSelectSample(sample)}
                className="bg-white dark:bg-slate-800 border-2 border-[#DCD3BF] dark:border-slate-700 hover:border-[#1F5D3B] dark:hover:border-emerald-500 rounded-2xl p-4 shadow-sm transition-all cursor-pointer active:scale-[0.99] space-y-3"
                role="button"
                tabIndex={0}
                aria-label={`View result for ${sample.name}`}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    onSelectSample(sample);
                  }
                }}
              >
                {/* Top Row: 📷 Feed Test & Category */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center space-x-2 min-w-0">
                    <span className="text-lg shrink-0">📷</span>
                    <h3 className="font-black text-sm sm:text-base text-[#1A1A1A] dark:text-white truncate">
                      {sample.name || t('nav.scan', locale)}
                    </h3>
                  </div>

                  <span className="text-[10px] font-black uppercase px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 shrink-0">
                    {categoryIcon} {getLocalizedCategoryName(sample.category)}
                  </span>
                </div>

                {/* Middle Row: Friendly Timestamp */}
                <div className="flex items-center space-x-1.5 text-xs text-[#5A5243] dark:text-slate-400">
                  <Clock className="w-3.5 h-3.5 text-slate-400" />
                  <span className="font-semibold">{friendlyTime}</span>
                </div>

                {/* Bottom Row: Verdict Badge & View Result Action */}
                <div className="flex items-center justify-between pt-1 border-t border-slate-100 dark:border-slate-700/60">
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
    </div>
  );
};
