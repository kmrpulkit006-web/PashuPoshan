import React from 'react';
import { Locale } from '../../lib/types';
import { t } from '../../lib/i18n';

interface StripColorSelectorProps {
  stripColor: 'yellow' | 'magenta' | 'green';
  setStripColor: (color: 'yellow' | 'magenta' | 'green') => void;
  locale: Locale;
}

export const StripColorSelector: React.FC<StripColorSelectorProps> = ({
  stripColor,
  setStripColor,
  locale,
}) => {
  return (
    <div className="bg-[#F3EEE1] dark:bg-slate-800 border-2 border-[#DCD3BF] dark:border-slate-700 rounded-3xl p-4 space-y-2.5 text-[#1A1A1A] dark:text-white shadow-sm">
      <div className="flex items-center justify-between">
        <span className="text-xs font-black">
          {locale === 'hi' ? 'जांच पट्टी का प्रकार चुनें' : 'Select Reagent / Strip Type'}
        </span>
        <span className="text-[11px] text-[#5A5243] dark:text-slate-400 font-bold">
          {locale === 'hi' ? 'रंग सीधे तस्वीर से पढ़ा जाएगा' : 'Color sampled from photo'}
        </span>
      </div>
      <div className="grid grid-cols-3 gap-2.5">
        <button
          type="button"
          onClick={() => setStripColor('yellow')}
          className={`p-2.5 rounded-2xl border-2 text-center transition-all min-h-[56px] flex flex-col items-center justify-center ${
            stripColor === 'yellow'
              ? 'bg-amber-100 dark:bg-amber-950 border-[#C2703D] dark:border-amber-400 text-[#1A1A1A] dark:text-amber-100 shadow-md font-black'
              : 'bg-white dark:bg-slate-900 border-[#DCD3BF] dark:border-slate-700 text-[#5A5243] dark:text-slate-300'
          }`}
        >
          <div className="w-full h-3 rounded-full bg-amber-400 mb-1.5 shadow-inner" />
          <div className="text-[11px] font-bold leading-tight">
            {locale === 'hi' ? 'यूरिया पट्टी' : 'Urea Strip'}
          </div>
          <div className="text-[9px] text-[#5A5243] dark:text-slate-400">
            {locale === 'hi' ? '0-5% पैमाना' : '0-5% Scale'}
          </div>
        </button>

        <button
          type="button"
          onClick={() => setStripColor('magenta')}
          className={`p-2.5 rounded-2xl border-2 text-center transition-all min-h-[56px] flex flex-col items-center justify-center ${
            stripColor === 'magenta'
              ? 'bg-rose-100 dark:bg-rose-950 border-[#B3261E] dark:border-rose-400 text-[#B3261E] dark:text-rose-100 shadow-md font-black'
              : 'bg-white dark:bg-slate-900 border-[#DCD3BF] dark:border-slate-700 text-[#5A5243] dark:text-slate-300'
          }`}
        >
          <div className="w-full h-3 rounded-full bg-pink-600 mb-1.5 shadow-inner" />
          <div className="text-[11px] font-bold leading-tight">
            {locale === 'hi' ? 'मिलावट पट्टी' : 'Adulteration'}
          </div>
          <div className="text-[9px] text-[#5A5243] dark:text-slate-400">
            {locale === 'hi' ? 'तीव्र रीएजेंट' : 'Spike Reagent'}
          </div>
        </button>

        <button
          type="button"
          onClick={() => setStripColor('green')}
          className={`p-2.5 rounded-2xl border-2 text-center transition-all min-h-[56px] flex flex-col items-center justify-center ${
            stripColor === 'green'
              ? 'bg-teal-100 dark:bg-teal-950 border-teal-600 dark:border-teal-400 text-teal-900 dark:text-teal-100 shadow-md font-black'
              : 'bg-white dark:bg-slate-900 border-[#DCD3BF] dark:border-slate-700 text-[#5A5243] dark:text-slate-300'
          }`}
        >
          <div className="w-full h-3 rounded-full bg-teal-500 mb-1.5 shadow-inner" />
          <div className="text-[11px] font-bold leading-tight">
            {locale === 'hi' ? 'pH पट्टी' : 'pH Indicator'}
          </div>
          <div className="text-[9px] text-[#5A5243] dark:text-slate-400">
            {locale === 'hi' ? 'साइलेज किण्वन' : 'Fermentation'}
          </div>
        </button>
      </div>
    </div>
  );
};
