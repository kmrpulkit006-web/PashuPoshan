import React, { useState } from 'react';
import { CowProfile, Locale } from '../../lib/types';
import { t } from '../../lib/i18n';
import { X, Check } from 'lucide-react';

interface AddCowModalProps {
  showModal: boolean;
  onClose: () => void;
  onSaveCow: (cow: CowProfile) => void;
  locale: Locale;
}

const BREED_OPTIONS: CowProfile['breed'][] = [
  'Gir',
  'Sahiwal',
  'Red Sindhi',
  'HF Crossbred',
  'Jersey Cross',
  'Murrah Buffalo',
];

export const AddCowModal: React.FC<AddCowModalProps> = ({
  showModal,
  onClose,
  onSaveCow,
  locale,
}) => {
  const [newCowName, setNewCowName] = useState('');
  const [newCowBreed, setNewCowBreed] = useState<CowProfile['breed']>('Gir');
  const [newCowWeight, setNewCowWeight] = useState(400);
  const [newCowYield, setNewCowYield] = useState(12);

  if (!showModal) return null;

  const handleSubmit = (e: React.FormEvent) => {
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

    onSaveCow(newCow);
    onClose();
    setNewCowName('');
  };

  return (
    <div className="fixed inset-0 bg-black/75 z-50 flex items-center justify-center p-4">
      <div className="bg-[#FBF8F1] dark:bg-slate-900 border-2 border-[#DCD3BF] dark:border-slate-700 rounded-3xl p-5 w-full max-w-sm space-y-4 shadow-2xl text-[#1A1A1A] dark:text-white max-h-[85vh] overflow-y-auto">
        <div className="flex items-center justify-between border-b border-[#DCD3BF] dark:border-slate-800 pb-2.5">
          <h3 className="text-base font-black">Add New Dairy Cattle</h3>
          <button
            onClick={onClose}
            className="text-slate-500 hover:text-slate-900 dark:hover:text-white p-1 rounded-lg"
            aria-label="Close dialog"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
          <div>
            <label className="text-[#5A5243] dark:text-slate-300 font-bold block mb-1">
              Cattle Name / Identifier (गाय / भैंस का नाम)
            </label>
            <input
              type="text"
              required
              value={newCowName}
              onChange={(e) => setNewCowName(e.target.value)}
              placeholder="e.g. Ganga, Lakshmi, #104"
              className="w-full px-3.5 py-3 bg-white dark:bg-slate-800 border-2 border-[#DCD3BF] dark:border-slate-700 rounded-2xl text-[#1A1A1A] dark:text-white font-bold text-sm focus:outline-none focus:border-[#1F5D3B]"
            />
          </div>

          <div>
            <label className="text-[#5A5243] dark:text-slate-300 font-bold block mb-1">
              Breed / Type (नस्ल)
            </label>
            <select
              value={newCowBreed}
              onChange={(e) => setNewCowBreed(e.target.value as any)}
              className="w-full px-3.5 py-3 bg-white dark:bg-slate-800 border-2 border-[#DCD3BF] dark:border-slate-700 rounded-2xl text-[#1A1A1A] dark:text-white font-bold text-sm focus:outline-none focus:border-[#1F5D3B] cursor-pointer"
            >
              {BREED_OPTIONS.map((b) => (
                <option key={b} value={b}>
                  {b}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[#5A5243] dark:text-slate-300 font-bold block mb-1">
                Weight (kg)
              </label>
              <input
                type="number"
                min="200"
                max="800"
                value={newCowWeight}
                onChange={(e) => setNewCowWeight(Number(e.target.value))}
                className="w-full px-3.5 py-3 bg-white dark:bg-slate-800 border-2 border-[#DCD3BF] dark:border-slate-700 rounded-2xl text-[#1A1A1A] dark:text-white font-black text-base focus:outline-none focus:border-[#1F5D3B]"
              />
            </div>
            <div>
              <label className="text-[#5A5243] dark:text-slate-300 font-bold block mb-1">
                Milk (L/day)
              </label>
              <input
                type="number"
                min="1"
                max="45"
                value={newCowYield}
                onChange={(e) => setNewCowYield(Number(e.target.value))}
                className="w-full px-3.5 py-3 bg-white dark:bg-slate-800 border-2 border-[#DCD3BF] dark:border-slate-700 rounded-2xl text-[#1A1A1A] dark:text-white font-black text-base focus:outline-none focus:border-[#1F5D3B]"
              />
            </div>
          </div>

          <div className="flex items-center space-x-2.5 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="w-1/2 py-3.5 bg-white dark:bg-slate-800 text-[#5A5243] dark:text-slate-300 font-black rounded-2xl border-2 border-[#DCD3BF] dark:border-slate-700 min-h-[52px]"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="w-1/2 py-3.5 bg-[#1F5D3B] hover:bg-[#194a30] text-white font-black rounded-2xl shadow-lg min-h-[52px] flex items-center justify-center space-x-1.5"
            >
              <Check className="w-4 h-4" />
              <span>Save Cattle</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
