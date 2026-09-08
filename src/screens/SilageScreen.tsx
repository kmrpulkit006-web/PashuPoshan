import React, { useState, useEffect } from 'react';
import { Locale, SilageBunker, SilagePitLog } from '../lib/types';
import { t, getSilagePitDisplayName, getSilageStatusText, getCompactionRatingText, getCropDisplayName } from '../lib/i18n';
import { getLocalPits, saveLocalPit, addPitLogEntry } from '../lib/storage';
import { Layers, Thermometer, CheckCircle2, AlertTriangle, Plus, X, Sparkles } from 'lucide-react';

interface SilageScreenProps {
  locale: Locale;
}

const CROP_OPTIONS: SilageBunker['cropType'][] = [
  'Maize',
  'Sorghum',
  'Pearl Millet (Bajra)',
  'Oats',
];

const COMPACTION_OPTIONS: SilageBunker['compactionRating'][] = [
  'Optimum (>650 kg/m3)',
  'Moderate',
  'Loose/Air-Pockets',
];

export const SilageScreen: React.FC<SilageScreenProps> = ({ locale }) => {
  const [pits, setPits] = useState<SilageBunker[]>([]);
  const [showAddPitModal, setShowAddPitModal] = useState(false);
  const [showLogModal, setShowLogModal] = useState<string | null>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setShowAddPitModal(false);
        setShowLogModal(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // New Pit Form
  const [newPitName, setNewPitName] = useState('');
  const [newCropType, setNewCropType] = useState<SilageBunker['cropType']>('Maize');
  const [newCompaction, setNewCompaction] = useState<SilageBunker['compactionRating']>('Optimum (>650 kg/m3)');
  const [newTemp, setNewTemp] = useState(32.0);

  // New Log Form
  const [logTemp, setLogTemp] = useState(33.0);
  const [logCompaction, setLogCompaction] = useState<SilageBunker['compactionRating']>('Optimum (>650 kg/m3)');
  const [logNotes, setLogNotes] = useState('');

  useEffect(() => {
    setPits(getLocalPits());
  }, []);

  const handleCreatePit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPitName) return;

    const newPit: SilageBunker = {
      id: `pit_${Date.now()}`,
      pitName: newPitName,
      cropType: newCropType,
      ensilingDate: new Date().toISOString().split('T')[0],
      daysFermented: 1,
      compactionRating: newCompaction,
      coverIntegrity: 'Airtight Sealed',
      coreTemperature: Number(newTemp),
      status: Number(newTemp) > 40 ? 'Aerobic Heating Risk' : 'Fermenting',
      logs: [
        {
          id: `log_${Date.now()}`,
          date: new Date().toLocaleDateString('en-IN'),
          temperatureC: Number(newTemp),
          compactionRating: newCompaction,
          notes: 'Pit initiated and sealed',
        },
      ],
    };

    const updated = saveLocalPit(newPit);
    setPits(updated);
    setShowAddPitModal(false);
    setNewPitName('');
  };

  const handleAddLog = (e: React.FormEvent) => {
    e.preventDefault();
    if (!showLogModal) return;

    const newLog: SilagePitLog = {
      id: `log_${Date.now()}`,
      date: new Date().toLocaleDateString('en-IN'),
      temperatureC: Number(logTemp),
      compactionRating: logCompaction,
      notes: logNotes || 'Routine inspection',
    };

    const updated = addPitLogEntry(showLogModal, newLog);
    setPits(updated);
    setShowLogModal(null);
    setLogNotes('');
  };

  return (
    <div className="p-4 space-y-4 pb-28 print:hidden text-[#1A1A1A] dark:text-white">
      {/* Title */}
      <div className="bg-[#F3EEE1] dark:bg-slate-800 border-2 border-[#DCD3BF] dark:border-slate-700 rounded-3xl p-4 shadow-sm flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center space-x-2 mb-1">
            <div className="w-9 h-9 rounded-2xl bg-[#C2703D]/15 text-[#C2703D] dark:text-amber-400 flex items-center justify-center shrink-0">
              <Layers className="w-5 h-5" />
            </div>
            <h2 className="text-base font-black text-[#1A1A1A] dark:text-white leading-tight">
              {t('silage.title', locale)}
            </h2>
          </div>
          <p className="text-xs text-[#5A5243] dark:text-slate-300 font-semibold leading-relaxed">
            {t('silage.subtitle', locale)}
          </p>
        </div>

        <button
          onClick={() => setShowAddPitModal(true)}
          className="px-4 py-3 bg-[#1F5D3B] hover:bg-[#194a30] text-white font-black text-xs sm:text-sm rounded-2xl shadow-lg active:scale-98 transition-all flex items-center justify-center space-x-2 shrink-0 min-h-[50px] whitespace-nowrap"
          aria-label={t('silage.addPit', locale)}
        >
          <Plus className="w-4 h-4 shrink-0" />
          <span>{t('silage.addPit', locale).replace(/^\+\s*/, '')}</span>
        </button>
      </div>

      {/* Pits List */}
      <div className="space-y-4">
        {pits.map((pit) => {
          // Plain-Language Status Derivation
          const isDanger =
            pit.coreTemperature > 40 ||
            pit.status === 'Aerobic Heating Risk' ||
            pit.status === 'Spoiled Pit' ||
            pit.compactionRating === 'Loose/Air-Pockets';

          const isWarning =
            !isDanger &&
            (pit.coreTemperature >= 37 || pit.compactionRating === 'Moderate');

          const statusLevel = isDanger ? 'danger' : isWarning ? 'warning' : 'safe';

          const statusConfig = {
            danger: {
              badge: t('silage.status.heatingRisk', locale),
              subtext: t('silage.heatingWarning', locale),
              badgeBg: 'bg-[#B3261E] text-white border-red-400',
              containerBg: 'bg-[#FDECEA] dark:bg-rose-950/40 border-[#B3261E]/80 dark:border-rose-500/50',
              textColor: 'text-[#B3261E] dark:text-rose-200',
              icon: <AlertTriangle className="w-5 h-5 text-[#B3261E] dark:text-rose-400 shrink-0" />,
            },
            warning: {
              badge: t('silage.status.heatingRisk', locale),
              subtext: t('silage.subtitle', locale),
              badgeBg: 'bg-[#C2703D] text-white border-amber-400',
              containerBg: 'bg-[#fdf8f4] dark:bg-amber-950/40 border-[#C2703D]/80 dark:border-amber-500/50',
              textColor: 'text-[#C2703D] dark:text-amber-200',
              icon: <AlertTriangle className="w-5 h-5 text-[#C2703D] dark:text-amber-400 shrink-0" />,
            },
            safe: {
              badge: pit.daysFermented >= 45 ? t('silage.status.ready', locale) : t('silage.status.fermenting', locale),
              subtext: `${pit.daysFermented} ${t('silage.daysEnsiled', locale)} • ${pit.coreTemperature}°C ${t('silage.coreTemp', locale)}`,
              badgeBg: 'bg-[#1F5D3B] text-white border-emerald-400',
              containerBg: 'bg-[#edf7f0] dark:bg-emerald-950/40 border-[#1F5D3B]/80 dark:border-emerald-500/50',
              textColor: 'text-[#1F5D3B] dark:text-emerald-200',
              icon: <CheckCircle2 className="w-5 h-5 text-[#1F5D3B] dark:text-emerald-400 shrink-0" />,
            },
          }[statusLevel];

          return (
            <div
              key={pit.id}
              className="bg-white dark:bg-slate-800 rounded-3xl p-4 sm:p-5 border-2 border-[#DCD3BF] dark:border-slate-700 shadow-sm space-y-3.5"
            >
              {/* Pit Header */}
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h3 className="text-base sm:text-lg font-black text-[#1A1A1A] dark:text-white leading-tight">
                    {getSilagePitDisplayName(pit.pitName, locale)}
                  </h3>
                  <div className="flex flex-wrap items-center gap-1.5 mt-1">
                    <span className="text-[11px] font-bold text-[#5A5243] dark:text-slate-300 bg-[#F3EEE1] dark:bg-slate-700/80 px-2.5 py-0.5 rounded-lg border border-[#DCD3BF] dark:border-slate-600">
                      {t('silage.crop', locale)} {getCropDisplayName(pit.cropType, locale)}
                    </span>
                    <span className="text-[11px] text-[#5A5243] dark:text-slate-400 font-medium">
                      {t('silage.ensiled', locale)} {pit.ensilingDate}
                    </span>
                  </div>
                </div>

                <button
                  onClick={() => {
                    setShowLogModal(pit.id);
                    setLogTemp(pit.coreTemperature);
                  }}
                  className="px-3 py-2 bg-[#F3EEE1] hover:bg-[#EAE3D2] dark:bg-slate-700 hover:dark:bg-slate-600 text-[#1A1A1A] dark:text-white text-xs font-black rounded-xl border-2 border-[#DCD3BF] dark:border-slate-600 min-h-[44px] flex items-center space-x-1.5 shrink-0 shadow-xs active:scale-95 transition-all whitespace-nowrap"
                  title="Log new temperature and inspection observation"
                >
                  <Thermometer className="w-4 h-4 text-[#1F5D3B] dark:text-emerald-400 shrink-0" />
                  <span>{t('silage.logReadingBtn', locale)}</span>
                </button>
              </div>

              {/* 1. PLAIN-LANGUAGE STATUS STRIP (THE FIRST THING SHOWN BEFORE TECHNICAL METRICS) */}
              <div
                className={`rounded-2xl p-3 sm:p-3.5 border-2 ${statusConfig.containerBg} flex items-start space-x-3 shadow-xs`}
              >
                {statusConfig.icon}
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2 mb-0.5">
                    <span
                      className={`text-xs font-black uppercase px-2.5 py-0.5 rounded-full border tracking-wide shadow-xs ${statusConfig.badgeBg}`}
                    >
                      {statusConfig.badge}
                    </span>
                    <span className="text-[10px] font-bold opacity-75 capitalize">
                      {getSilageStatusText(pit.status, locale)}
                    </span>
                  </div>
                  <p className="text-xs font-bold leading-snug mt-1 opacity-95">
                    {statusConfig.subtext}
                  </p>
                </div>
              </div>

              {/* 2. SECONDARY TECHNICAL METRICS (SUBORDINATE TO THE PLAIN-LANGUAGE STRIP) */}
              <div className="grid grid-cols-3 gap-2 text-center pt-0.5">
                {/* Days Fermenting */}
                <div className="bg-[#F3EEE1] dark:bg-slate-900/80 rounded-2xl p-2 sm:p-2.5 border border-[#DCD3BF] dark:border-slate-700 overflow-hidden">
                  <div className="text-[10px] font-bold text-[#5A5243] dark:text-slate-400 truncate">
                    {t('silage.daysEnsiled', locale)}
                  </div>
                  <div className="text-base sm:text-lg font-black text-[#1A1A1A] dark:text-white mt-0.5 truncate">
                    {pit.daysFermented} {t('common.days', locale) === 'common.days' ? (locale === 'hi' ? 'दिन' : 'Days') : t('common.days', locale)}
                  </div>
                  <div className="text-[9px] text-[#1F5D3B] dark:text-emerald-400 font-bold mt-0.5 truncate">
                    {pit.daysFermented >= 45 ? t('silage.status.ready', locale) : t('silage.status.fermenting', locale)}
                  </div>
                </div>

                {/* Core Temperature */}
                <div className="bg-[#F3EEE1] dark:bg-slate-900/80 rounded-2xl p-2 sm:p-2.5 border border-[#DCD3BF] dark:border-slate-700 overflow-hidden">
                  <div className="text-[10px] font-bold text-[#5A5243] dark:text-slate-400 truncate">
                    {t('silage.coreTemp', locale)}
                  </div>
                  <div
                    className={`text-base sm:text-lg font-black mt-0.5 truncate ${
                      pit.coreTemperature > 40
                        ? 'text-[#B3261E] dark:text-rose-400'
                        : pit.coreTemperature >= 37
                        ? 'text-[#C2703D] dark:text-amber-400'
                        : 'text-[#1F5D3B] dark:text-emerald-400'
                    }`}
                  >
                    {pit.coreTemperature}°C
                  </div>
                  <div className="text-[9px] text-[#5A5243] dark:text-slate-400 font-bold mt-0.5 truncate">
                    {t('silage.targetTemp', locale)}
                  </div>
                </div>

                {/* Compaction Rating */}
                <div className="bg-[#F3EEE1] dark:bg-slate-900/80 rounded-2xl p-2 sm:p-2.5 border border-[#DCD3BF] dark:border-slate-700 overflow-hidden">
                  <div className="text-[10px] font-bold text-[#5A5243] dark:text-slate-400 truncate">
                    {t('silage.compaction', locale)}
                  </div>
                  <div className="text-xs sm:text-sm font-black text-[#1A1A1A] dark:text-slate-200 truncate mt-1">
                    {getCompactionRatingText(pit.compactionRating, locale)}
                  </div>
                  <div className="text-[9px] text-[#5A5243] dark:text-slate-400 font-bold mt-0.5 truncate">
                    {pit.compactionRating.includes('Optimum') ? (locale === 'hi' ? 'उत्तम कसाव' : 'Optimum') : pit.compactionRating.split(' ')[0]}
                  </div>
                </div>
              </div>

              {/* Actionable Spoilage Notice if Hazardous */}
              {isDanger && (
                <div className="bg-[#FDECEA] dark:bg-rose-950/60 border-2 border-[#B3261E] dark:border-rose-500/50 rounded-2xl p-3 text-xs text-[#B3261E] dark:text-rose-200 flex items-start space-x-2.5">
                  <AlertTriangle className="w-5 h-5 text-[#B3261E] shrink-0 mt-0.5" />
                  <div>
                    <div className="font-black text-xs uppercase tracking-wide">
                      {t('silage.heatingWarning', locale)}
                    </div>
                    <p className="text-[11px] text-[#1A1A1A] dark:text-slate-300 font-semibold mt-0.5">
                      {t('silage.heatingDetail', locale, { temp: pit.coreTemperature })}
                    </p>
                  </div>
                </div>
              )}

              {/* 3. Inspection History Logs (Functionality Kept Intact) */}
              {pit.logs && pit.logs.length > 0 && (
                <div className="pt-3 border-t border-[#DCD3BF] dark:border-slate-700 text-xs space-y-1.5">
                  <div className="font-black text-[#5A5243] dark:text-slate-400 flex items-center justify-between">
                    <span>{t('silage.recentHistory', locale)}:</span>
                    <span className="text-[10px] font-medium">{t('silage.loggedCount', locale, { count: pit.logs.length })}</span>
                  </div>
                  {pit.logs.slice(0, 2).map((lg) => (
                    <div
                      key={lg.id}
                      className="flex items-center justify-between text-[#1A1A1A] dark:text-slate-300 font-medium text-[11px] bg-[#FBF8F1] dark:bg-slate-900/50 p-2 rounded-xl border border-[#DCD3BF]/60 dark:border-slate-700 gap-2"
                    >
                      <span className="truncate">
                        • {lg.date}: <strong>{lg.temperatureC}°C</strong> ({getCompactionRatingText(lg.compactionRating, locale)})
                      </span>
                      <span className="text-[#5A5243] dark:text-slate-400 italic truncate max-w-[140px] text-right">
                        {lg.notes === 'Golden color, pleasant lactic smell'
                          ? (locale === 'hi' ? 'सुनहरा रंग, अच्छी खुशबू' : lg.notes)
                          : lg.notes === 'Air leak observed, surface mold forming'
                          ? (locale === 'hi' ? 'हवा का रिसाव, सतह पर फफूंद' : lg.notes)
                          : lg.notes}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Scientific Silage SOP */}
      <div className="bg-[#F3EEE1] dark:bg-slate-800 border-2 border-[#DCD3BF] dark:border-slate-700 rounded-3xl p-4 space-y-2.5">
        <h3 className="text-xs font-black text-[#1A1A1A] dark:text-white flex items-center space-x-2">
          <Sparkles className="w-4 h-4 text-[#1F5D3B] dark:text-emerald-400" />
          <span>{t('silage.sopTitle', locale)}</span>
        </h3>
        <ul className="text-xs text-[#1A1A1A] dark:text-slate-300 space-y-2 font-medium">
          <li className="flex items-start space-x-2">
            <span className="text-[#1F5D3B] dark:text-emerald-400 font-black">1.</span>
            <span>Harvest maize when grain milk line is at 1/2 to 2/3 stage (32-35% Dry Matter).</span>
          </li>
          <li className="flex items-start space-x-2">
            <span className="text-[#1F5D3B] dark:text-emerald-400 font-black">2.</span>
            <span>Chop fodder into 1.5 cm to 2.0 cm particles for maximum packing density.</span>
          </li>
          <li className="flex items-start space-x-2">
            <span className="text-[#1F5D3B] dark:text-emerald-400 font-black">3.</span>
            <span>Tractor compact in 15cm progressive layers to expel all oxygen.</span>
          </li>
          <li className="flex items-start space-x-2">
            <span className="text-[#1F5D3B] dark:text-emerald-400 font-black">4.</span>
            <span>Seal with 200-micron UV-stabilized LDPE plastic sheet under tire weights.</span>
          </li>
        </ul>
      </div>

      {/* Add Pit Modal */}
      {showAddPitModal && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="create-silage-pit-title"
          className="fixed inset-0 bg-black/75 z-50 flex items-center justify-center p-4 animate-fade-in"
          onClick={() => setShowAddPitModal(false)}
        >
          <div
            className="bg-[#FBF8F1] dark:bg-slate-900 border-2 border-[#DCD3BF] dark:border-slate-700 rounded-3xl p-5 w-full max-w-sm space-y-4 shadow-2xl text-[#1A1A1A] dark:text-white max-h-[85vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-[#DCD3BF] dark:border-slate-800 pb-2.5">
              <h3 id="create-silage-pit-title" className="text-base font-black">
                {t('silage.createPit', locale)}
              </h3>
              <button
                type="button"
                onClick={() => setShowAddPitModal(false)}
                className="text-slate-500 hover:text-slate-900 dark:hover:text-white w-11 h-11 min-h-[44px] min-w-[44px] flex items-center justify-center rounded-2xl hover:bg-black/5 dark:hover:bg-white/10"
                aria-label={t('common.close', locale)}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreatePit} className="space-y-3.5 text-xs">
              <div>
                <label htmlFor="bunker-name-input" className="text-[#5A5243] dark:text-slate-300 font-bold block mb-1">
                  {t('silage.bunkerName', locale)}:
                </label>
                <input
                  id="bunker-name-input"
                  type="text"
                  required
                  placeholder={t('silage.bunkerPlaceholder', locale)}
                  value={newPitName}
                  onChange={(e) => setNewPitName(e.target.value)}
                  className="w-full px-3.5 py-3 bg-white dark:bg-slate-800 border-2 border-[#DCD3BF] dark:border-slate-700 rounded-2xl text-[#1A1A1A] dark:text-white font-bold text-sm focus:outline-none focus:border-[#1F5D3B]"
                />
              </div>

              <div>
                <label htmlFor="crop-type-select" className="text-[#5A5243] dark:text-slate-300 font-bold block mb-1">
                  {t('silage.cropType', locale)}:
                </label>
                <select
                  id="crop-type-select"
                  value={newCropType}
                  onChange={(e) => {
                    const sel = e.target.value;
                    if (CROP_OPTIONS.includes(sel as SilageBunker['cropType'])) {
                      setNewCropType(sel as SilageBunker['cropType']);
                    }
                  }}
                  className="w-full px-3.5 py-3 bg-white dark:bg-slate-800 border-2 border-[#DCD3BF] dark:border-slate-700 rounded-2xl text-[#1A1A1A] dark:text-white font-bold text-sm focus:outline-none focus:border-[#1F5D3B] cursor-pointer"
                >
                  <option value="Maize">Hybrid Maize</option>
                  <option value="Sorghum">Sweet Sorghum</option>
                  <option value="Pearl Millet (Bajra)">Pearl Millet (Bajra)</option>
                  <option value="Oats">Oats</option>
                </select>
              </div>

              <div>
                <label htmlFor="core-temp-input" className="text-[#5A5243] dark:text-slate-300 font-bold block mb-1">
                  {t('silage.initialTemp', locale)}:
                </label>
                <input
                  id="core-temp-input"
                  type="number"
                  step="0.5"
                  value={newTemp}
                  onChange={(e) => setNewTemp(Number(e.target.value))}
                  className="w-full px-3.5 py-3 bg-white dark:bg-slate-800 border-2 border-[#DCD3BF] dark:border-slate-700 rounded-2xl text-[#1A1A1A] dark:text-white font-black text-base focus:outline-none focus:border-[#1F5D3B]"
                />
              </div>

              <div className="flex items-center space-x-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddPitModal(false)}
                  className="w-1/2 py-3.5 bg-white dark:bg-slate-800 text-[#5A5243] dark:text-slate-300 font-black rounded-2xl border-2 border-[#DCD3BF] dark:border-slate-700 min-h-[56px] active:scale-98 transition-all"
                >
                  {t('silage.cancel', locale)}
                </button>
                <button
                  type="submit"
                  className="w-1/2 py-3.5 bg-[#1F5D3B] hover:bg-[#194a30] text-white font-black rounded-2xl shadow-lg min-h-[56px] active:scale-98 transition-all"
                >
                  {t('silage.savePit', locale)}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Log Reading Modal */}
      {showLogModal && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="log-reading-title"
          className="fixed inset-0 bg-black/75 z-50 flex items-center justify-center p-4 animate-fade-in"
          onClick={() => setShowLogModal(null)}
        >
          <div
            className="bg-[#FBF8F1] dark:bg-slate-900 border-2 border-[#DCD3BF] dark:border-slate-700 rounded-3xl p-5 w-full max-w-sm space-y-4 shadow-2xl text-[#1A1A1A] dark:text-white max-h-[85vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-[#DCD3BF] dark:border-slate-800 pb-2.5">
              <h3 id="log-reading-title" className="text-base font-black">
                {t('silage.logTemp', locale)}
              </h3>
              <button
                type="button"
                onClick={() => setShowLogModal(null)}
                className="text-slate-500 hover:text-slate-900 dark:hover:text-white w-11 h-11 min-h-[44px] min-w-[44px] flex items-center justify-center rounded-2xl hover:bg-black/5 dark:hover:bg-white/10"
                aria-label={t('common.close', locale)}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddLog} className="space-y-3.5 text-xs">
              <div>
                <label htmlFor="log-temp-input" className="text-[#5A5243] dark:text-slate-300 font-bold block mb-1">
                  {t('silage.temperature', locale)}:
                </label>
                <input
                  id="log-temp-input"
                  type="number"
                  step="0.5"
                  required
                  value={logTemp}
                  onChange={(e) => setLogTemp(Number(e.target.value))}
                  className="w-full px-3.5 py-3 bg-white dark:bg-slate-800 border-2 border-[#DCD3BF] dark:border-slate-700 rounded-2xl text-[#1A1A1A] dark:text-white font-black text-base focus:outline-none focus:border-[#1F5D3B]"
                />
              </div>

              <div>
                <label htmlFor="log-compaction-select" className="text-[#5A5243] dark:text-slate-300 font-bold block mb-1">
                  {t('silage.tightness', locale)}:
                </label>
                <select
                  id="log-compaction-select"
                  value={logCompaction}
                  onChange={(e) => {
                    const sel = e.target.value;
                    if (COMPACTION_OPTIONS.includes(sel as SilageBunker['compactionRating'])) {
                      setLogCompaction(sel as SilageBunker['compactionRating']);
                    }
                  }}
                  className="w-full px-3.5 py-3 bg-white dark:bg-slate-800 border-2 border-[#DCD3BF] dark:border-slate-700 rounded-2xl text-[#1A1A1A] dark:text-white font-bold text-sm focus:outline-none focus:border-[#1F5D3B] cursor-pointer"
                >
                  <option value="Optimum (>650 kg/m3)">Optimum - Sealed Tight</option>
                  <option value="Moderate">Moderate - Small Leaks Fixed</option>
                  <option value="Loose/Air-Pockets">Loose - Air Pockets / Soft</option>
                </select>
              </div>

              <div>
                <label htmlFor="log-obs-input" className="text-[#5A5243] dark:text-slate-300 font-bold block mb-1">
                  {t('ration.noteInputLabel', locale)}:
                </label>
                <input
                  id="log-obs-input"
                  type="text"
                  placeholder="e.g. Clean lactic aroma, no surface mold"
                  value={logNotes}
                  onChange={(e) => setLogNotes(e.target.value)}
                  className="w-full px-3.5 py-3 bg-white dark:bg-slate-800 border-2 border-[#DCD3BF] dark:border-slate-700 rounded-2xl text-[#1A1A1A] dark:text-white font-bold text-sm focus:outline-none focus:border-[#1F5D3B]"
                />
              </div>

              <div className="flex items-center space-x-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setShowLogModal(null)}
                  className="w-1/2 py-3.5 bg-white dark:bg-slate-800 text-[#5A5243] dark:text-slate-300 font-black rounded-2xl border-2 border-[#DCD3BF] dark:border-slate-700 min-h-[56px] active:scale-98 transition-all"
                >
                  {t('silage.cancel', locale)}
                </button>
                <button
                  type="submit"
                  className="w-1/2 py-3.5 bg-[#1F5D3B] hover:bg-[#194a30] text-white font-black rounded-2xl shadow-lg min-h-[56px] active:scale-98 transition-all"
                >
                  {t('silage.saveReading', locale)}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
