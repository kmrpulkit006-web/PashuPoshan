import React, { useState, useEffect, useMemo } from 'react';
import {
  History,
  ChevronDown,
  ChevronUp,
  Plus,
  TrendingUp,
  TrendingDown,
  Minus,
  AlertTriangle,
  FlaskConical,
  Milk,
  Calendar,
  Clock,
  Sparkles,
  X,
  Check,
} from 'lucide-react';
import { CowProfile, FeedSample, CowYieldLogEntry, Locale } from '../../lib/types';
import { getLocalYieldLogs, saveYieldLogEntry, getSamplesForCow } from '../../lib/storage';
import { t, getBcp47Locale, getCowDisplayName, getCowBreedDisplayName } from '../../lib/i18n';

interface CowHistoryTimelineProps {
  cow: CowProfile;
  locale: Locale;
  activeSample?: FeedSample;
  onYieldLogged?: (newYield: number) => void;
}

type TimelineItem =
  | {
      type: 'scan';
      id: string;
      timestamp: string;
      sample: FeedSample;
    }
  | {
      type: 'yield';
      id: string;
      timestamp: string;
      log: CowYieldLogEntry;
    };

export const CowHistoryTimeline: React.FC<CowHistoryTimelineProps> = ({
  cow,
  locale,
  activeSample,
  onYieldLogged,
}) => {
  const [isOpen, setIsOpen] = useState(true);
  const [yieldLogs, setYieldLogs] = useState<CowYieldLogEntry[]>([]);
  const [feedScans, setFeedScans] = useState<FeedSample[]>([]);
  const [showLogForm, setShowLogForm] = useState(false);
  const [inputYield, setInputYield] = useState<string>(String(cow.dailyMilkYieldLiters || 12));
  const [inputNote, setInputNote] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Load history data whenever selected cow changes
  useEffect(() => {
    if (!cow || !cow.id) return;
    const logs = getLocalYieldLogs(cow.id);
    const scans = getSamplesForCow(cow.id);
    setYieldLogs(logs);
    setFeedScans(scans);
    setInputYield(String(cow.dailyMilkYieldLiters || 12));
    setInputNote('');
    setShowLogForm(false);
  }, [cow?.id, cow?.dailyMilkYieldLiters]);

  const handleSaveYield = (e: React.FormEvent) => {
    e.preventDefault();
    const yieldNum = parseFloat(inputYield);
    if (isNaN(yieldNum) || yieldNum <= 0) return;

    setIsSubmitting(true);
    try {
      const newEntry: CowYieldLogEntry = {
        id: `yield_${Date.now()}`,
        cowId: cow.id,
        timestamp: new Date().toISOString(),
        dailyMilkYieldLiters: yieldNum,
        note: inputNote.trim() || undefined,
      };

      const updatedLogs = saveYieldLogEntry(newEntry);
      setYieldLogs(updatedLogs);
      setShowLogForm(false);
      setInputNote('');
      if (onYieldLogged) {
        onYieldLogged(yieldNum);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // Interleave and sort reverse-chronologically with soft-limit of 20
  const timelineItems: TimelineItem[] = useMemo(() => {
    const items: TimelineItem[] = [];

    // Safely handle feed scans (backward-compatible if linkedCowId is missing)
    for (const scan of feedScans) {
      if (!scan) continue;
      items.push({
        type: 'scan',
        id: scan.id,
        timestamp: scan.timestamp || new Date().toISOString(),
        sample: scan,
      });
    }

    // Safely handle yield logs
    for (const log of yieldLogs) {
      if (!log) continue;
      items.push({
        type: 'yield',
        id: log.id,
        timestamp: log.timestamp || new Date().toISOString(),
        log,
      });
    }

    // Sort descending (most recent first)
    items.sort((a, b) => {
      const timeA = new Date(a.timestamp).getTime();
      const timeB = new Date(b.timestamp).getTime();
      return timeB - timeA;
    });

    // Soft limit: cap at 20 most recent entries to prevent performance degradation
    return items.slice(0, 20);
  }, [feedScans, yieldLogs]);

  // Compute 14-day trend if 2+ yield logs exist
  const trendData = useMemo(() => {
    if (yieldLogs.length < 2) return null;

    // Filter to last 14 days (or all if fewer) and sort chronologically (oldest to newest)
    const fourteenDaysAgo = Date.now() - 14 * 24 * 60 * 60 * 1000;
    const recentLogs = yieldLogs
      .filter((l) => new Date(l.timestamp).getTime() >= fourteenDaysAgo)
      .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

    const logsToUse = recentLogs.length >= 2 ? recentLogs : yieldLogs.slice(0, 14).reverse();
    if (logsToUse.length < 2) return null;

    const values = logsToUse.map((l) => l.dailyMilkYieldLiters);
    const minVal = Math.min(...values);
    const maxVal = Math.max(...values);
    const firstVal = values[0];
    const lastVal = values[values.length - 1];
    const diff = lastVal - firstVal;

    // Build SVG polyline points (width 200, height 40)
    const width = 200;
    const height = 40;
    const pad = 6;
    const range = maxVal === minVal ? 1 : maxVal - minVal;

    const points = values.map((val, i) => {
      const x = pad + (i / (values.length - 1)) * (width - 2 * pad);
      const y = height - pad - ((val - minVal) / range) * (height - 2 * pad);
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    });

    return {
      pointsStr: points.join(' '),
      minVal,
      maxVal,
      lastVal,
      diff,
      count: values.length,
    };
  }, [yieldLogs]);

  const formatDate = (isoOrStr: string) => {
    try {
      const d = new Date(isoOrStr);
      if (isNaN(d.getTime())) return isoOrStr;
      return d.toLocaleDateString(getBcp47Locale(locale), {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return isoOrStr;
    }
  };

  return (
    <div
      className="bg-[#F3EEE1] dark:bg-slate-800 border-2 border-[#DCD3BF] dark:border-slate-700 rounded-3xl p-4 space-y-3 shadow-sm text-[#1A1A1A] dark:text-white"
      role="region"
      aria-label={`${cow.name} History and Yield Timeline`}
    >
      {/* Header with Collapsible Toggle */}
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center space-x-2 text-left focus:outline-none focus:ring-2 focus:ring-[#1F5D3B] rounded-xl p-1 -m-1"
          aria-expanded={isOpen}
          aria-controls={`timeline-${cow.id}`}
        >
          <div className="w-8 h-8 rounded-xl bg-[#1F5D3B]/15 text-[#1F5D3B] dark:text-emerald-400 flex items-center justify-center shrink-0">
            <History className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-xs sm:text-sm font-black text-[#1A1A1A] dark:text-white leading-tight flex items-center space-x-1.5">
              <span>{t('ration.historyTitle', locale)}</span>
              <span className="text-[10px] text-slate-500 font-semibold">({timelineItems.length})</span>
            </h3>
            <p className="text-[10px] text-[#5A5243] dark:text-slate-400 font-semibold">
              {getCowDisplayName(cow, locale)} • {getCowBreedDisplayName(cow.breed, locale)}
            </p>
          </div>
        </button>

        <div className="flex items-center space-x-2">
          {!showLogForm && (
            <button
              type="button"
              onClick={() => {
                setIsOpen(true);
                setShowLogForm(true);
              }}
              className="px-3 py-1.5 bg-[#1F5D3B] hover:bg-[#184a2f] active:scale-95 text-white font-black text-[11px] rounded-xl shadow-sm flex items-center space-x-1 min-h-[38px] transition-all"
              aria-label={t('ration.logYieldBtn', locale)}
            >
              <Plus className="w-3.5 h-3.5" />
              <span>{t('ration.logYieldBtn', locale).replace(/^\+\s*/, '')}</span>
            </button>
          )}
          <button
            type="button"
            onClick={() => setIsOpen(!isOpen)}
            className="p-1.5 rounded-xl text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
            aria-label={isOpen ? t('ration.collapseHistory', locale) : t('ration.viewHistory', locale)}
          >
            {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Collapsible Content */}
      {isOpen && (
        <div id={`timeline-${cow.id}`} className="space-y-3 pt-1 border-t border-[#DCD3BF]/60 dark:border-slate-700">
          {/* Inline Log Yield Form */}
          {showLogForm && (
            <form
              onSubmit={handleSaveYield}
              className="p-3.5 bg-white dark:bg-slate-900 border-2 border-[#1F5D3B] dark:border-emerald-500/80 rounded-2xl space-y-3 shadow-md animate-in fade-in duration-150"
            >
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-1.5">
                <div className="flex items-center space-x-1.5">
                  <Milk className="w-4 h-4 text-[#1F5D3B] dark:text-emerald-400" />
                  <span className="font-extrabold text-xs text-[#1F5D3B] dark:text-emerald-300">
                    {t('ration.logYieldTitle', locale)}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setShowLogForm(false)}
                  className="p-1 text-slate-400 hover:text-slate-600 rounded"
                  aria-label={t('ration.cancelBtn', locale)}
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-[10px] font-bold text-[#5A5243] dark:text-slate-300 mb-1">
                    {t('ration.yieldInputLabel', locale)} *
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    min="1"
                    max="60"
                    required
                    value={inputYield}
                    onChange={(e) => setInputYield(e.target.value)}
                    className="w-full px-3 py-2 bg-[#F3EEE1] dark:bg-slate-800 border border-[#DCD3BF] dark:border-slate-700 rounded-xl text-xs font-black text-[#1A1A1A] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#1F5D3B] min-h-[44px]"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-[#5A5243] dark:text-slate-300 mb-1">
                    {t('ration.noteInputLabel', locale)}
                  </label>
                  <input
                    type="text"
                    value={inputNote}
                    onChange={(e) => setInputNote(e.target.value)}
                    placeholder="e.g. Switched to Silage Pit #2"
                    className="w-full px-3 py-2 bg-[#F3EEE1] dark:bg-slate-800 border border-[#DCD3BF] dark:border-slate-700 rounded-xl text-xs text-[#1A1A1A] dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#1F5D3B] min-h-[44px]"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end space-x-2 pt-1">
                <button
                  type="button"
                  onClick={() => setShowLogForm(false)}
                  className="px-3 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 min-h-[44px]"
                >
                  {t('ration.cancelBtn', locale)}
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 bg-[#1F5D3B] hover:bg-[#184a2f] text-white rounded-xl text-xs font-black shadow flex items-center space-x-1.5 min-h-[44px] transition-all active:scale-95 disabled:opacity-50"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>{t('ration.saveYieldBtn', locale)}</span>
                </button>
              </div>
            </form>
          )}

          {/* 14-Day Sparkline Trend Indicator (Plain SVG, Zero npm dependencies) */}
          {trendData && (
            <div className="p-3 bg-white dark:bg-slate-900 border border-[#DCD3BF] dark:border-slate-700 rounded-2xl space-y-1.5 shadow-sm">
              <div className="flex items-center justify-between text-xs font-bold">
                <div className="flex items-center space-x-1.5 text-[#5A5243] dark:text-slate-300">
                  <Sparkles className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                  <span>{t('ration.trend14Days', locale)}</span>
                </div>
                <div className="flex items-center space-x-1">
                  {trendData.diff > 0 ? (
                    <span className="inline-flex items-center space-x-0.5 text-[10px] font-black px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300">
                      <TrendingUp className="w-3 h-3" />
                      <span>+{trendData.diff.toFixed(1)} L</span>
                    </span>
                  ) : trendData.diff < 0 ? (
                    <span className="inline-flex items-center space-x-0.5 text-[10px] font-black px-2 py-0.5 rounded-full bg-rose-100 dark:bg-rose-950 text-rose-800 dark:text-rose-300">
                      <TrendingDown className="w-3 h-3" />
                      <span>{trendData.diff.toFixed(1)} L</span>
                    </span>
                  ) : (
                    <span className="inline-flex items-center space-x-0.5 text-[10px] font-black px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                      <Minus className="w-3 h-3" />
                      <span>Steady</span>
                    </span>
                  )}
                  <span className="text-[11px] font-black text-[#1A1A1A] dark:text-white">
                    {trendData.lastVal.toFixed(1)} L/day
                  </span>
                </div>
              </div>

              {/* Responsive Plain SVG Sparkline */}
              <div className="w-full flex items-center space-x-2 pt-1" aria-hidden="true">
                <span className="text-[9px] font-bold text-slate-400">{trendData.minVal.toFixed(1)}L</span>
                <svg
                  viewBox="0 0 200 40"
                  className="w-full h-9 overflow-visible stroke-[#1F5D3B] dark:stroke-emerald-400 fill-none"
                >
                  {/* Subtle Baseline Grid */}
                  <line x1="0" y1="36" x2="200" y2="36" stroke="currentColor" strokeOpacity="0.1" strokeDasharray="3,3" />
                  {/* Polyline Curve */}
                  <polyline
                    points={trendData.pointsStr}
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  {/* Latest Value Dot */}
                  {trendData.pointsStr && (
                    <circle
                      cx={trendData.pointsStr.split(' ').pop()?.split(',')[0]}
                      cy={trendData.pointsStr.split(' ').pop()?.split(',')[1]}
                      r="3.5"
                      className="fill-[#1F5D3B] dark:fill-emerald-300 stroke-white dark:stroke-slate-900 stroke-2"
                    />
                  )}
                </svg>
                <span className="text-[9px] font-bold text-slate-400">{trendData.maxVal.toFixed(1)}L</span>
              </div>
            </div>
          )}

          {/* Interleaved Timeline Items */}
          {timelineItems.length === 0 ? (
            <div className="py-6 px-4 text-center bg-white/70 dark:bg-slate-900/60 rounded-2xl border border-dashed border-[#DCD3BF] dark:border-slate-700 space-y-2">
              <Calendar className="w-6 h-6 text-slate-400 mx-auto" />
              <p className="text-xs text-[#5A5243] dark:text-slate-400 font-semibold leading-relaxed">
                {t('ration.noHistory', locale)}
              </p>
            </div>
          ) : (
            <div className="relative pl-3 space-y-2.5 before:absolute before:left-3.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-[#DCD3BF] dark:before:bg-slate-700">
              {timelineItems.map((item) => {
                if (item.type === 'scan') {
                  const s = item.sample;
                  const isHazardous = s.overallGrade?.includes('Tier C');
                  const isSubStandard = s.overallGrade?.includes('Tier B');
                  const isProblematic = isHazardous || isSubStandard;

                  return (
                    <div
                      key={`scan_${item.id}`}
                      className={`relative pl-4 p-3 rounded-2xl border transition-all ${
                        isHazardous
                          ? 'border-l-4 border-rose-600 bg-rose-50/80 dark:bg-rose-950/40 border-[#DCD3BF] dark:border-rose-900/50'
                          : isSubStandard
                          ? 'border-l-4 border-amber-500 bg-amber-50/80 dark:bg-amber-950/40 border-[#DCD3BF] dark:border-amber-900/50'
                          : 'border-l-4 border-[#1F5D3B] bg-white dark:bg-slate-900 border-[#DCD3BF] dark:border-slate-700'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-1 flex-wrap">
                        <div className="flex items-center space-x-1.5">
                          <FlaskConical
                            className={`w-3.5 h-3.5 shrink-0 ${
                              isHazardous
                                ? 'text-rose-600 dark:text-rose-400'
                                : isSubStandard
                                ? 'text-amber-600 dark:text-amber-400'
                                : 'text-[#1F5D3B] dark:text-emerald-400'
                            }`}
                          />
                          <span className="font-extrabold text-xs text-[#1A1A1A] dark:text-white">
                            {s.name}
                          </span>
                        </div>
                        <span
                          className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full ${
                            isHazardous
                              ? 'bg-rose-200 dark:bg-rose-900 text-rose-900 dark:text-rose-200'
                              : isSubStandard
                              ? 'bg-amber-200 dark:bg-amber-900 text-amber-900 dark:text-amber-200'
                              : 'bg-emerald-100 dark:bg-emerald-950 text-[#1F5D3B] dark:text-emerald-300'
                          }`}
                        >
                          {s.overallGrade}
                        </span>
                      </div>

                      <div className="flex items-center justify-between text-[10px] text-[#5A5243] dark:text-slate-400 mt-1">
                        <span className="capitalize">{s.category.replace('_', ' ')} • CP {s.metrics?.crudeProtein ?? 'N/A'}%</span>
                        <span className="flex items-center space-x-1">
                          <Clock className="w-2.5 h-2.5" />
                          <span>{formatDate(item.timestamp)}</span>
                        </span>
                      </div>

                      {/* Visual Callout for Sub-standard or Hazardous Feed */}
                      {isProblematic && (
                        <div className="mt-1.5 pt-1 border-t border-amber-200/60 dark:border-rose-900/40 flex items-start space-x-1 text-[10px] text-amber-900 dark:text-amber-200 font-bold">
                          <AlertTriangle className="w-3 h-3 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                          <span>{t('ration.subStandardWarning', locale)}</span>
                        </div>
                      )}
                    </div>
                  );
                }

                // Yield Log Item
                const log = item.log;
                return (
                  <div
                    key={`yield_${item.id}`}
                    className="relative pl-4 p-3 rounded-2xl border border-l-4 border-teal-600 bg-white dark:bg-slate-900 border-[#DCD3BF] dark:border-slate-700 space-y-1"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-1.5">
                        <Milk className="w-3.5 h-3.5 text-teal-700 dark:text-teal-400 shrink-0" />
                        <span className="font-extrabold text-xs text-[#1A1A1A] dark:text-white">
                          {log.dailyMilkYieldLiters.toFixed(1)} Litres/day
                        </span>
                      </div>
                      <span className="text-[10px] text-[#5A5243] dark:text-slate-400 flex items-center space-x-1">
                        <Clock className="w-2.5 h-2.5" />
                        <span>{formatDate(item.timestamp)}</span>
                      </span>
                    </div>

                    {log.note && (
                      <p className="text-[11px] text-[#5A5243] dark:text-slate-300 italic font-medium">
                        "{log.note}"
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
