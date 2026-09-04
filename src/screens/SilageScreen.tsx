import React, { useState, useEffect } from 'react';
import { Locale, SilageBunker, SilagePitLog } from '../lib/types';
import { t } from '../lib/i18n';
import { getLocalPits, saveLocalPit, addPitLogEntry } from '../lib/storage';
import { Layers, Thermometer, ShieldAlert, CheckCircle2, AlertTriangle, Sparkles, Plus, X, Calendar, Activity } from 'lucide-react';

interface SilageScreenProps {
  locale: Locale;
}

const CROP_OPTIONS: SilageBunker['cropType'][] = [
  'Maize',
  'Sorghum',
  'Pearl Millet (Bajra)',
  'Oats'
];

const COMPACTION_OPTIONS: SilageBunker['compactionRating'][] = [
  'Optimum (>650 kg/m3)',
  'Moderate',
  'Loose/Air-Pockets'
];

export const SilageScreen: React.FC<SilageScreenProps> = ({ locale }) => {
  const [pits, setPits] = useState<SilageBunker[]>([]);
  const [showAddPitModal, setShowAddPitModal] = useState(false);
  const [showLogModal, setShowLogModal] = useState<string | null>(null);

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
          notes: 'Pit initiated and sealed'
        }
      ]
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
      notes: logNotes || 'Routine inspection'
    };

    const updated = addPitLogEntry(showLogModal, newLog);
    setPits(updated);
    setShowLogModal(null);
    setLogNotes('');
  };

  return (
    <div className="p-4 space-y-4 pb-28 print:hidden">
      {/* Title */}
      <div className="bg-slate-800/90 border border-slate-700 rounded-2xl p-3.5 shadow-md flex items-center justify-between">
        <div>
          <div className="flex items-center space-x-2 mb-1">
            <div className="w-7 h-7 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center">
              <Layers className="w-4 h-4" />
            </div>
            <h2 className="text-sm font-bold text-white">
              {t('silage.title', locale)}
            </h2>
          </div>
          <p className="text-[11px] text-slate-300">
            {t('silage.subtitle', locale)}
          </p>
        </div>

        <button
          onClick={() => setShowAddPitModal(true)}
          className="px-2.5 py-1.5 bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs rounded-xl shadow active:scale-98 transition-all flex items-center space-x-1 shrink-0 min-h-[36px]"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>{t('silage.addPit', locale)}</span>
        </button>
      </div>

      {/* Pits List */}
      <div className="space-y-3">
        {pits.map((pit) => {
          const isSafe = pit.status === 'Ready to Feed' || pit.status === 'Fermenting';
          return (
            <div
              key={pit.id}
              className={`rounded-2xl p-4 border shadow-lg ${
                isSafe
                  ? 'bg-slate-800/90 border-emerald-500/40'
                  : 'bg-slate-800/90 border-rose-500/50'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <div>
                  <span className="text-xs font-extrabold text-white">{pit.pitName}</span>
                  <span className="text-[10px] text-slate-400 ml-2">Crop: {pit.cropType}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                      isSafe
                        ? 'bg-emerald-950 text-emerald-300 border-emerald-400'
                        : 'bg-rose-950 text-rose-300 border-rose-400 animate-pulse'
                    }`}
                  >
                    {pit.status}
                  </span>
                  <button
                    onClick={() => { setShowLogModal(pit.id); setLogTemp(pit.coreTemperature); }}
                    className="px-2 py-0.5 bg-slate-700 hover:bg-slate-600 text-slate-200 text-[10px] font-bold rounded-lg border border-slate-600 min-h-[30px]"
                  >
                    + Log
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2 text-center my-3">
                <div className="bg-slate-900/80 rounded-xl p-2 border border-slate-700/60">
                  <div className="text-[9px] text-slate-400">{t('silage.daysEnsiled', locale)}</div>
                  <div className="text-base font-extrabold text-white">{pit.daysFermented}d</div>
                  <div className="text-[8px] text-emerald-400">Anaerobic</div>
                </div>

                <div className="bg-slate-900/80 rounded-xl p-2 border border-slate-700/60">
                  <div className="text-[9px] text-slate-400">{t('silage.coreTemp', locale)}</div>
                  <div className={`text-base font-extrabold ${pit.coreTemperature > 40 ? 'text-rose-400' : 'text-emerald-400'}`}>
                    {pit.coreTemperature}°C
                  </div>
                  <div className="text-[8px] text-slate-400">&lt; 38°C Target</div>
                </div>

                <div className="bg-slate-900/80 rounded-xl p-2 border border-slate-700/60">
                  <div className="text-[9px] text-slate-400">{t('silage.compaction', locale)}</div>
                  <div className="text-xs font-bold text-slate-200 truncate mt-1">
                    {pit.compactionRating.split(' ')[0]}
                  </div>
                  <div className="text-[8px] text-slate-400">Packing</div>
                </div>
              </div>

              {!isSafe && (
                <div className="bg-rose-950/80 border border-rose-500/40 rounded-xl p-2.5 text-xs text-rose-200 flex items-start space-x-2">
                  <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                  <div>
                    <div className="font-bold">{t('silage.heatingWarning', locale)}</div>
                    <p className="text-[10px] text-slate-300">
                      Internal temperature ({pit.coreTemperature}°C) exceeds safe 38°C ceiling. Check for air holes or loose cover to prevent clostridial rotting.
                    </p>
                  </div>
                </div>
              )}

              {/* Log History Accordion */}
              {pit.logs && pit.logs.length > 0 && (
                <div className="mt-2.5 pt-2 border-t border-slate-700/60 text-[10px] space-y-1">
                  <div className="font-semibold text-slate-400">Inspection History:</div>
                  {pit.logs.slice(0, 2).map((lg) => (
                    <div key={lg.id} className="flex items-center justify-between text-slate-300">
                      <span>• {lg.date}: {lg.temperatureC}°C ({lg.compactionRating.split(' ')[0]})</span>
                      <span className="text-slate-400 italic truncate max-w-[120px]">{lg.notes}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Scientific Silage SOP */}
      <div className="bg-slate-800/90 border border-slate-700 rounded-2xl p-4 space-y-2">
        <h3 className="text-xs font-bold text-white flex items-center space-x-1.5">
          <Sparkles className="w-4 h-4 text-emerald-400" />
          <span>{t('silage.sopTitle', locale)}</span>
        </h3>
        <ul className="text-xs text-slate-300 space-y-1.5 pl-1">
          <li className="flex items-start space-x-2">
            <span className="text-emerald-400 font-bold">1.</span>
            <span>Harvest maize when grain milk line is at 1/2 to 2/3 stage (32-35% Dry Matter).</span>
          </li>
          <li className="flex items-start space-x-2">
            <span className="text-emerald-400 font-bold">2.</span>
            <span>Chop fodder into 1.5 cm to 2.0 cm particles for maximum packing density.</span>
          </li>
          <li className="flex items-start space-x-2">
            <span className="text-emerald-400 font-bold">3.</span>
            <span>Tractor compact in 15cm progressive layers to expel all oxygen.</span>
          </li>
          <li className="flex items-start space-x-2">
            <span className="text-emerald-400 font-bold">4.</span>
            <span>Seal with 200-micron UV-stabilized LDPE plastic sheet under tire weights.</span>
          </li>
        </ul>
      </div>

      {/* Add Pit Modal */}
      {showAddPitModal && (
        <div className="fixed inset-0 bg-black/75 z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl p-4 w-full max-w-sm space-y-3 shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-white">Create New Silage Pit</h3>
              <button onClick={() => setShowAddPitModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreatePit} className="space-y-2.5 text-xs">
              <div>
                <label className="text-slate-300 font-semibold block mb-1">Bunker/Pit Name:</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. South Bunker #2"
                  value={newPitName}
                  onChange={(e) => setNewPitName(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="text-slate-300 font-semibold block mb-1">Crop Type:</label>
                <select
                  value={newCropType}
                  onChange={(e) => {
                    const sel = e.target.value;
                    if (CROP_OPTIONS.includes(sel as SilageBunker['cropType'])) {
                      setNewCropType(sel as SilageBunker['cropType']);
                    }
                  }}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-white"
                >
                  <option value="Maize">Hybrid Maize</option>
                  <option value="Sorghum">Sweet Sorghum</option>
                  <option value="Pearl Millet (Bajra)">Pearl Millet (Bajra)</option>
                  <option value="Oats">Oats</option>
                </select>
              </div>

              <div>
                <label className="text-slate-300 font-semibold block mb-1">Initial Core Temp (°C):</label>
                <input
                  type="number"
                  step="0.5"
                  value={newTemp}
                  onChange={(e) => setNewTemp(Number(e.target.value))}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-white"
                />
              </div>

              <div className="flex space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddPitModal(false)}
                  className="flex-1 py-2 bg-slate-800 text-slate-300 font-bold rounded-lg min-h-[44px]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 bg-amber-600 text-white font-bold rounded-lg shadow min-h-[44px]"
                >
                  Create Pit
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Log Reading Modal */}
      {showLogModal && (
        <div className="fixed inset-0 bg-black/75 z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl p-4 w-full max-w-sm space-y-3 shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-white">Log Temperature Reading</h3>
              <button onClick={() => setShowLogModal(null)} className="text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddLog} className="space-y-2.5 text-xs">
              <div>
                <label className="text-slate-300 font-semibold block mb-1">Measured Core Temperature (°C):</label>
                <input
                  type="number"
                  step="0.5"
                  required
                  value={logTemp}
                  onChange={(e) => setLogTemp(Number(e.target.value))}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-white"
                />
              </div>

              <div>
                <label className="text-slate-300 font-semibold block mb-1">Compaction / Plastic Seal:</label>
                <select
                  value={logCompaction}
                  onChange={(e) => {
                    const sel = e.target.value;
                    if (COMPACTION_OPTIONS.includes(sel as SilageBunker['compactionRating'])) {
                      setLogCompaction(sel as SilageBunker['compactionRating']);
                    }
                  }}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-white"
                >
                  <option value="Optimum (>650 kg/m3)">Optimum - Sealed Tight</option>
                  <option value="Moderate">Moderate - Small Leaks Fixed</option>
                  <option value="Loose/Air-Pockets">Loose - Air Pockets / Soft</option>
                </select>
              </div>

              <div>
                <label className="text-slate-300 font-semibold block mb-1">Inspection Observations:</label>
                <input
                  type="text"
                  placeholder="e.g. Clean lactic smell, no mold on face"
                  value={logNotes}
                  onChange={(e) => setLogNotes(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-white"
                />
              </div>

              <div className="flex space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowLogModal(null)}
                  className="flex-1 py-2 bg-slate-800 text-slate-300 font-bold rounded-lg min-h-[44px]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 bg-emerald-600 text-white font-bold rounded-lg shadow min-h-[44px]"
                >
                  Save Log
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
