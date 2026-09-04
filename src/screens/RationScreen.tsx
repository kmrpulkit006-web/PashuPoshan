import React, { useState, useEffect } from 'react';
import { CowProfile, FeedSample, Locale } from '../lib/types';
import { t } from '../lib/i18n';
import { calculatePrecisionRation } from '../lib/rationBalancing';
import { getLocalCows, saveLocalCow, deleteLocalCow } from '../lib/storage';
import { Scale, Info, Plus, Trash2, Check, X, ShieldAlert, Sparkles } from 'lucide-react';

interface RationScreenProps {
  activeSample?: FeedSample;
  locale: Locale;
}

const BREED_OPTIONS: CowProfile['breed'][] = [
  'Gir',
  'Sahiwal',
  'Red Sindhi',
  'HF Crossbred',
  'Jersey Cross',
  'Murrah Buffalo'
];

export const RationScreen: React.FC<RationScreenProps> = ({ activeSample, locale }) => {
  const [cows, setCows] = useState<CowProfile[]>([]);
  const [selectedCowId, setSelectedCowId] = useState<string>('');
  const [dailyYield, setDailyYield] = useState<number>(12);
  const [cowWeight, setCowWeight] = useState<number>(380);

  // Custom ingredient fresh weights
  const [greenFreshKg, setGreenFreshKg] = useState<number | undefined>(undefined);
  const [dryFreshKg, setDryFreshKg] = useState<number | undefined>(undefined);
  const [concFreshKg, setConcFreshKg] = useState<number | undefined>(undefined);

  // Modal to add new cattle
  const [showAddModal, setShowAddModal] = useState(false);
  const [newCowName, setNewCowName] = useState('');
  const [newCowBreed, setNewCowBreed] = useState<CowProfile['breed']>('Gir');
  const [newCowWeight, setNewCowWeight] = useState(400);
  const [newCowYield, setNewCowYield] = useState(12);

  useEffect(() => {
    const loaded = getLocalCows();
    setCows(loaded);
    if (loaded.length > 0) {
      setSelectedCowId(loaded[0].id);
      setDailyYield(loaded[0].dailyMilkYieldLiters);
      setCowWeight(loaded[0].weightKg);
    }
  }, []);

  const activeCow = cows.find(c => c.id === selectedCowId) || cows[0];

  const currentCowProfile: CowProfile = activeCow ? {
    ...activeCow,
    weightKg: cowWeight,
    dailyMilkYieldLiters: dailyYield,
  } : {
    id: 'default_cow',
    tagNumber: 'INAPH-0000',
    name: 'Sample Cow',
    breed: 'Gir',
    weightKg: cowWeight,
    lactationStage: 'Early (0-90 days)',
    dailyMilkYieldLiters: dailyYield,
    milkFatPct: 4.5,
  };

  const rationPlan = calculatePrecisionRation(currentCowProfile, {
    greenFreshKg,
    dryFreshKg,
    concFreshKg,
    activeSample,
  });

  const handleCreateCow = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCowName) return;

    const newCow: CowProfile = {
      id: `cow_${Date.now()}`,
      tagNumber: `INAPH-${Math.floor(100000000 + Math.random() * 900000000)}`,
      name: newCowName,
      breed: newCowBreed,
      weightKg: Number(newCowWeight),
      lactationStage: 'Early (0-90 days)',
      dailyMilkYieldLiters: Number(newCowYield),
      milkFatPct: newCowBreed.includes('Buffalo') ? 7.0 : 4.0,
    };

    const updated = saveLocalCow(newCow);
    setCows(updated);
    setSelectedCowId(newCow.id);
    setDailyYield(newCow.dailyMilkYieldLiters);
    setCowWeight(newCow.weightKg);
    setShowAddModal(false);
    setNewCowName('');
  };

  const handleDeleteCow = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (cows.length <= 1) {
      alert('You must have at least one cattle profile in your herd.');
      return;
    }
    const updated = deleteLocalCow(id);
    setCows(updated);
    if (selectedCowId === id) {
      setSelectedCowId(updated[0].id);
      setDailyYield(updated[0].dailyMilkYieldLiters);
      setCowWeight(updated[0].weightKg);
    }
  };

  return (
    <div className="p-4 space-y-4 pb-28 print:hidden">
      {/* Header */}
      <div className="bg-slate-800/90 border border-slate-700 rounded-2xl p-3.5 shadow-md">
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center space-x-2">
            <div className="w-7 h-7 rounded-lg bg-teal-500/20 text-teal-400 flex items-center justify-center">
              <Scale className="w-4 h-4" />
            </div>
            <h2 className="text-sm font-bold text-white">
              {t('ration.title', locale)}
            </h2>
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[11px] rounded-lg shadow active:scale-98 transition-all flex items-center space-x-1 min-h-[36px]"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>{t('ration.addCow', locale)}</span>
          </button>
        </div>
        <p className="text-[11px] text-slate-300">
          {t('ration.subtitle', locale)}
        </p>

        {/* Tested Feed Allocation Banner */}
        {activeSample && (
          <div className="mt-2.5 bg-slate-900/90 border border-emerald-500/40 rounded-xl p-2 flex items-center justify-between text-xs">
            <div className="flex items-center space-x-2">
              <span className="text-[10px] uppercase font-bold text-emerald-400 bg-emerald-950 px-1.5 py-0.5 rounded border border-emerald-500/30">
                {activeSample.category.replace('_', ' ')} Slot
              </span>
              <span className="font-bold text-white text-[11px] truncate max-w-[170px]">
                {activeSample.name} (CP {activeSample.metrics.crudeProtein}%)
              </span>
            </div>
            <span className="text-[9px] text-emerald-300 font-semibold">Active in TMR ✓</span>
          </div>
        )}
      </div>

      {/* Herd Cattle Selector with Accessible Buttons */}
      <div className="bg-slate-800/90 border border-slate-700 rounded-2xl p-3.5 space-y-3">
        <label className="text-xs font-bold text-slate-300 block">
          {t('ration.selectCow', locale)}
        </label>
        <div className="grid grid-cols-3 gap-2" role="group" aria-label="Herd Cattle Selection">
          {cows.map((cow) => (
            <button
              key={cow.id}
              type="button"
              onClick={() => {
                setSelectedCowId(cow.id);
                setDailyYield(cow.dailyMilkYieldLiters);
                setCowWeight(cow.weightKg);
              }}
              aria-pressed={selectedCowId === cow.id}
              className={`relative p-2 rounded-xl border text-center transition-all focus:outline-none focus:ring-2 focus:ring-emerald-400 min-h-[64px] ${
                selectedCowId === cow.id
                  ? 'bg-emerald-950 border-emerald-400 text-white shadow-inner'
                  : 'bg-slate-900 border-slate-700 text-slate-400 hover:text-white'
              }`}
            >
              <button
                type="button"
                onClick={(e) => handleDeleteCow(cow.id, e)}
                className="absolute top-1 right-1 text-slate-500 hover:text-rose-400 p-0.5"
                title="Remove cattle"
                aria-label={`Remove ${cow.name}`}
              >
                <Trash2 className="w-3 h-3" />
              </button>
              <div className="text-base mb-0.5" aria-hidden="true">🐄</div>
              <div className="text-[11px] font-bold truncate">{cow.name.split(' ')[0]}</div>
              <div className="text-[9px] text-slate-400 truncate">{cow.breed}</div>
            </button>
          ))}
        </div>

        {/* Sliders for Milk Yield and Body Weight */}
        <div className="space-y-2.5 pt-2 border-t border-slate-700">
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-300">{t('ration.dailyYield', locale)}</span>
            <span className="font-extrabold text-emerald-400 text-sm">{dailyYield} Litres/day</span>
          </div>
          <input
            type="range"
            min="4"
            max="35"
            value={dailyYield}
            onChange={(e) => setDailyYield(Number(e.target.value))}
            className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-emerald-500"
            aria-label="Daily Milk Yield"
          />

          <div className="flex items-center justify-between text-xs pt-1">
            <span className="text-slate-300">{t('ration.cowWeight', locale)}</span>
            <span className="font-bold text-slate-200">{cowWeight} kg</span>
          </div>
          <input
            type="range"
            min="250"
            max="650"
            step="10"
            value={cowWeight}
            onChange={(e) => setCowWeight(Number(e.target.value))}
            className="w-full h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-teal-500"
            aria-label="Animal Body Weight"
          />
        </div>
      </div>

      {/* Calculated Total Mixed Ration (TMR) Breakdown */}
      <div className="bg-gradient-to-br from-slate-900 to-emerald-950/60 border border-emerald-500/40 rounded-2xl p-4 shadow-xl space-y-3">
        <div className="flex items-center justify-between pb-2 border-b border-slate-700">
          <span className="text-xs font-extrabold text-white">{t('ration.recipeTitle', locale)}</span>
          <span className="text-[10px] font-semibold text-emerald-300 bg-emerald-950 px-2 py-0.5 rounded-full border border-emerald-500/30">
            DMI Required: {rationPlan.dmiTotalRequiredKg} kg
          </span>
        </div>

        {/* 4 Essential Ration Slots */}
        <div className="grid grid-cols-2 gap-2.5">
          {rationPlan.slots.map((slot) => {
            const isGreen = slot.slot === 'green_fodder';
            const isDry = slot.slot === 'dry_fodder';
            return (
              <div key={slot.slot} className="bg-slate-800/90 border border-slate-700 rounded-xl p-3">
                <div className="text-[10px] text-slate-400 truncate">
                  {isGreen ? t('ration.greenFodder', locale) : (isDry ? t('ration.dryFodder', locale) : t('ration.concentrate', locale))}
                </div>
                <div className={`text-lg font-black ${isGreen ? 'text-emerald-400' : (isDry ? 'text-amber-400' : 'text-teal-400')}`}>
                  {slot.freshKg} kg
                </div>
                <div className="text-[9px] text-slate-300 truncate mt-0.5">{slot.feedName}</div>
                <div className="text-[8px] text-slate-400 mt-0.5">CP {slot.crudeProteinPct}% • DM {slot.dryMatterPct}%</div>
              </div>
            );
          })}

          <div className="bg-slate-800/90 border border-slate-700 rounded-xl p-3">
            <div className="text-[10px] text-slate-400">{t('ration.mineralMix', locale)}</div>
            <div className="text-lg font-black text-purple-400">{rationPlan.mineralMixtureGrams} g</div>
            <div className="text-[9px] text-slate-300">+ {rationPlan.commonSaltGrams}g {t('ration.salt', locale)}</div>
            <div className="text-[8px] text-slate-400 mt-0.5">Chelated Macro & Micro Minerals</div>
          </div>
        </div>

        {/* Composite Supplied Nutrition Balance Box */}
        <div className="bg-slate-950/90 border border-slate-800 rounded-xl p-3 space-y-1.5 text-xs">
          <div className="flex items-center justify-between text-[11px] font-bold text-slate-200">
            <span>Supplied vs Required Balance:</span>
            <span className={rationPlan.balance.isBalanced ? 'text-emerald-400' : 'text-amber-400'}>
              {rationPlan.balance.isBalanced ? '✓ Optimal Balance' : 'Adjustment Suggested'}
            </span>
          </div>
          <div className="grid grid-cols-3 gap-2 text-[10px] text-slate-400 pt-1 border-t border-slate-800">
            <div>
              <span>DMI:</span> <strong className="text-white">{rationPlan.suppliedTotals.dmiKg} kg</strong>
            </div>
            <div>
              <span>Protein:</span> <strong className="text-white">{rationPlan.suppliedTotals.cpGrams}g</strong> ({rationPlan.balance.cpDeficitSurplusGrams > 0 ? `+${rationPlan.balance.cpDeficitSurplusGrams}g` : `${rationPlan.balance.cpDeficitSurplusGrams}g`})
            </div>
            <div>
              <span>Energy:</span> <strong className="text-white">{rationPlan.suppliedTotals.tdnKg} kg TDN</strong>
            </div>
          </div>
        </div>

        {/* Actionable Balance Guidance */}
        <div className="bg-slate-950/80 border border-emerald-500/30 rounded-xl p-3 flex items-start space-x-2 text-xs">
          <Info className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
          <div>
            <div className="font-bold text-white">{t('ration.balanceNoteTitle', locale)}</div>
            <p className="text-slate-300 text-[11px] mt-0.5 leading-relaxed">
              {rationPlan.recommendationAlert}
            </p>
            <p className="text-[10px] text-slate-400 mt-1 italic">
              {t('ration.vetNotice', locale)}
            </p>
          </div>
        </div>
      </div>

      {/* Add Cattle Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/75 z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl p-4 w-full max-w-sm space-y-3 shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-white">Add New Cattle to Herd</h3>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateCow} className="space-y-2.5 text-xs">
              <div>
                <label className="text-slate-300 font-semibold block mb-1">Cattle Name:</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Kaveri"
                  value={newCowName}
                  onChange={(e) => setNewCowName(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="text-slate-300 font-semibold block mb-1">Breed:</label>
                <select
                  value={newCowBreed}
                  onChange={(e) => {
                    const selected = e.target.value;
                    if (BREED_OPTIONS.includes(selected as CowProfile['breed'])) {
                      setNewCowBreed(selected as CowProfile['breed']);
                    }
                  }}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-white focus:outline-none focus:border-emerald-500"
                >
                  <option value="Gir">Gir (Indigenous Cow)</option>
                  <option value="Sahiwal">Sahiwal (Indigenous Cow)</option>
                  <option value="Red Sindhi">Red Sindhi (Indigenous Cow)</option>
                  <option value="HF Crossbred">HF Crossbred Cow</option>
                  <option value="Jersey Cross">Jersey Crossbred Cow</option>
                  <option value="Murrah Buffalo">Murrah Buffalo</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-slate-300 font-semibold block mb-1">Weight (kg):</label>
                  <input
                    type="number"
                    min="200"
                    max="750"
                    value={newCowWeight}
                    onChange={(e) => setNewCowWeight(Number(e.target.value))}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-white"
                  />
                </div>
                <div>
                  <label className="text-slate-300 font-semibold block mb-1">Daily Yield (L):</label>
                  <input
                    type="number"
                    min="2"
                    max="45"
                    value={newCowYield}
                    onChange={(e) => setNewCowYield(Number(e.target.value))}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-white"
                  />
                </div>
              </div>

              <div className="flex space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 py-2 bg-slate-800 text-slate-300 font-bold rounded-lg min-h-[44px]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 bg-emerald-600 text-white font-bold rounded-lg shadow min-h-[44px]"
                >
                  Save Animal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
